/**
 * Sample-based foley / interface sound engine (Web Audio API).
 *
 * - Every recording is local (src/audio/samples, CC0, see SFX_SOURCES.md).
 *   Files are fetched as soon as the page loads but only decoded once the
 *   AudioContext exists, which iOS Safari allows only inside a user gesture
 *   (`unlock()` is wired to the first pointerdown / keydown).
 * - Mix: three buses (ui / foley / ambience) → a short synthetic room reverb
 *   send → gentle glue compressor → limiter. Levels are kept well under a
 *   teacher's voice in a classroom.
 * - Repeated sounds rotate through variants with small random pitch / level
 *   changes so footsteps and clicks never sound machine-gunned.
 * - Every voice is tracked; replay / navigation fades them out (no overlaps).
 */
import { SFX_MANIFEST, type SfxName } from './sfxManifest';

type BusName = 'ui' | 'foley' | 'amb';

export interface PlayOpts {
  /** linear gain (1 = sample at its normalised level, ≈ −3 dBFS peak) */
  gain?: number;
  rate?: number;
  /** −1 … 1 */
  pan?: number;
  /** seconds from now */
  delay?: number;
  /** reverb send (0 … 1) */
  send?: number;
  bus?: BusName;
  /** random variation amount (0 = exact) */
  vary?: number;
  /** low-pass cutoff in Hz (softens / distances a sound) */
  lowpass?: number;
  /** start offset into the sample (s) */
  offset?: number;
  /** play only this long (s), with a short fade */
  duration?: number;
  /** pick a specific variant (0-based) */
  variant?: number;
}

export interface LoopVoice {
  /** ramp gain / rate / pan to new values */
  set(p: { gain?: number; rate?: number; pan?: number }, ramp?: number): void;
  stop(fade?: number): void;
}

interface Live {
  name: string;
  bus: BusName;
  started: number;
  stop(fade?: number): void;
}

const urls = import.meta.glob('./samples/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const urlFor = (file: string) => urls[`./samples/${file}.mp3`];

const BUS_LEVEL: Record<BusName, number> = { ui: 0.55, foley: 0.9, amb: 0.5 };
const MASTER = 0.62;
const MAX_VOICES = 32;
const MAX_PER_NAME = 5;

const UI_FIRST: SfxName[] = ['btn', 'tick', 'page', 'whoosh_air', 'whoosh_quick', 'whoosh_short', 'title_boom', 'shimmer'];

const rand = (a: number, b: number) => a + Math.random() * (b - a);

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buses = {} as Record<BusName, GainNode>;
  private reverb: GainNode | null = null;
  private raw = new Map<string, Promise<ArrayBuffer | null>>();
  private buffers = new Map<string, AudioBuffer>();
  private decoding: Promise<void> | null = null;
  private lastVariant = new Map<string, number>();
  private live = new Set<Live>();

  /** Start downloading every sample (no AudioContext needed). */
  preload() {
    if (typeof fetch === 'undefined' || this.raw.size) return;
    for (const entry of Object.values(SFX_MANIFEST)) {
      for (const f of entry.files) {
        const u = urlFor(f);
        if (!u) continue;
        this.raw.set(
          f,
          fetch(u)
            .then((r) => (r.ok ? r.arrayBuffer() : null))
            .catch(() => null),
        );
      }
    }
  }

  /** Must be called from a user-gesture handler (first tap / key). */
  unlock() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC({ latencyHint: 'interactive' });
      this.ctx = ctx;
      // iOS: a silent one-sample buffer played inside the gesture fully unlocks output
      const silent = ctx.createBuffer(1, 1, ctx.sampleRate);
      const s = ctx.createBufferSource();
      s.buffer = silent;
      s.connect(ctx.destination);
      s.start(0);
      this.buildGraph(ctx);
      this.preload();
      this.decoding = this.decodeAll(ctx);
    }
    if (this.ctx.state !== 'running') void this.ctx.resume();
  }

  private buildGraph(ctx: AudioContext) {
    const glue = ctx.createDynamicsCompressor();
    glue.threshold.value = -20;
    glue.knee.value = 12;
    glue.ratio.value = 2.5;
    glue.attack.value = 0.01;
    glue.release.value = 0.25;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -4;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.1;
    this.master = ctx.createGain();
    this.master.gain.value = MASTER;
    this.master.connect(glue).connect(limiter).connect(ctx.destination);

    // small, soft room: decorrelated stereo noise with an exponential tail
    const conv = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 0.9);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      let seed = 9871 + c * 7919;
      for (let i = 0; i < len; i++) {
        seed = (seed * 16807) % 2147483647;
        const t = i / ctx.sampleRate;
        d[i] = ((seed / 2147483647) * 2 - 1) * Math.exp(-t * 6.5) * (t < 0.006 ? t / 0.006 : 1);
      }
    }
    conv.buffer = ir;
    const verbTone = ctx.createBiquadFilter();
    verbTone.type = 'lowpass';
    verbTone.frequency.value = 5200;
    this.reverb = ctx.createGain();
    this.reverb.gain.value = 0.32;
    this.reverb.connect(conv).connect(verbTone).connect(this.master);

    (Object.keys(BUS_LEVEL) as BusName[]).forEach((b) => {
      const g = ctx.createGain();
      g.gain.value = BUS_LEVEL[b];
      g.connect(this.master!);
      this.buses[b] = g;
    });
  }

  private async decodeAll(ctx: AudioContext) {
    // interface sounds first, so the very first presses already have feedback
    const ui = new Set<string>(UI_FIRST.flatMap((n) => SFX_MANIFEST[n].files as readonly string[]));
    const entries = Array.from(this.raw.entries()).sort((a, b) => Number(ui.has(b[0])) - Number(ui.has(a[0])));
    await Promise.all(entries.filter(([f]) => ui.has(f)).map(([f, p]) => this.decodeOne(ctx, f, p)));
    await Promise.all(entries.filter(([f]) => !ui.has(f)).map(([f, p]) => this.decodeOne(ctx, f, p)));
  }

  private async decodeOne(ctx: AudioContext, file: string, p: Promise<ArrayBuffer | null>) {
    const data = await p;
    if (!data) return;
    try {
      const buf = await new Promise<AudioBuffer>((res, rej) => {
        // callback form: works on every Safari version
        const r = ctx.decodeAudioData(data.slice(0), res, rej);
        if (r && typeof (r as Promise<AudioBuffer>).then === 'function') (r as Promise<AudioBuffer>).then(res, rej);
      });
      this.buffers.set(file, buf);
    } catch {
      /* undecodable file: that sound is simply skipped */
    }
  }

  /** Resolves once all samples are decoded, or after `maxWait` ms, whichever comes first. */
  whenReady(maxWait = 600): Promise<void> {
    if (!this.decoding) return Promise.resolve();
    return Promise.race([this.decoding, new Promise<void>((r) => setTimeout(r, maxWait))]);
  }

  get loaded() {
    return this.buffers.size;
  }

  private running(): AudioContext | null {
    const c = this.ctx;
    return c && c.state === 'running' && this.master ? c : null;
  }

  private pick(name: SfxName, variant?: number): AudioBuffer | null {
    const files = SFX_MANIFEST[name].files as readonly string[];
    let i = variant ?? 0;
    if (variant === undefined && files.length > 1) {
      const last = this.lastVariant.get(name) ?? -1;
      i = Math.floor(Math.random() * (files.length - 1));
      if (i >= last) i += 1; // never the same take twice in a row
      this.lastVariant.set(name, i);
    }
    return this.buffers.get(files[i % files.length]) ?? null;
  }

  private chain(ctx: AudioContext, o: PlayOpts) {
    const g = ctx.createGain();
    let head: AudioNode = g;
    if (o.lowpass) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lowpass;
      f.Q.value = 0.5;
      f.connect(g);
      head = f;
    }
    let pan: StereoPannerNode | null = null;
    let out: AudioNode = g;
    if (ctx.createStereoPanner) {
      pan = ctx.createStereoPanner();
      pan.pan.value = Math.max(-1, Math.min(1, o.pan ?? 0));
      g.connect(pan);
      out = pan;
    }
    out.connect(this.buses[o.bus ?? 'foley']);
    const send = o.send ?? 0.12;
    if (send > 0 && this.reverb) {
      const sg = ctx.createGain();
      sg.gain.value = send;
      out.connect(sg).connect(this.reverb);
    }
    return { input: head, gain: g, pan };
  }

  private register(v: Live) {
    // voice stealing: per sound, then globally (oldest first)
    const same = Array.from(this.live).filter((l) => l.name === v.name);
    if (same.length >= MAX_PER_NAME) same[0].stop(0.04);
    if (this.live.size >= MAX_VOICES) Array.from(this.live)[0].stop(0.04);
    this.live.add(v);
  }

  /** One-shot. */
  play(name: SfxName, o: PlayOpts = {}) {
    const ctx = this.running();
    if (!ctx) return;
    const buf = this.pick(name, o.variant);
    if (!buf) return;
    const vary = o.vary ?? 1;
    const t = ctx.currentTime + (o.delay ?? 0) + 0.005;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = (o.rate ?? 1) * (1 + rand(-0.035, 0.035) * vary);
    const { input, gain } = this.chain(ctx, { ...o, pan: (o.pan ?? 0) + rand(-0.06, 0.06) * vary });
    const level = (o.gain ?? 1) * Math.pow(10, (rand(-1.5, 1.5) * vary) / 20);
    gain.gain.setValueAtTime(level, t);
    src.connect(input);
    const offset = o.offset ?? 0;
    if (o.duration) {
      gain.gain.setValueAtTime(level, t + o.duration);
      gain.gain.linearRampToValueAtTime(0.0001, t + o.duration + 0.06);
      src.start(t, offset, o.duration + 0.08);
    } else src.start(t, offset);
    const v: Live = {
      name,
      bus: o.bus ?? 'foley',
      started: t,
      stop: (fade = 0.12) => {
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0.0001, now + fade);
        try {
          src.stop(now + fade + 0.02);
        } catch {
          /* not started yet */
        }
        this.live.delete(v);
      },
    };
    src.onended = () => this.live.delete(v);
    this.register(v);
  }

  /** Seamless loop with fade in; control it through the returned voice. */
  loop(name: SfxName, o: PlayOpts & { fadeIn?: number } = {}): LoopVoice {
    const noop: LoopVoice = { set: () => {}, stop: () => {} };
    const ctx = this.running();
    if (!ctx) return noop;
    const buf = this.pick(name, 0);
    if (!buf) return noop;
    const entry = SFX_MANIFEST[name] as { loop?: readonly number[] };
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    if (entry.loop) {
      src.loopStart = entry.loop[0];
      src.loopEnd = Math.min(entry.loop[1], buf.duration);
    }
    src.playbackRate.value = o.rate ?? 1;
    const { input, gain, pan } = this.chain(ctx, o);
    const t = ctx.currentTime + (o.delay ?? 0) + 0.005;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(o.gain ?? 1, t + (o.fadeIn ?? 0.3));
    src.connect(input);
    // random start point inside the loop so repeats are never identical
    const start = entry.loop ? entry.loop[0] + Math.random() * (entry.loop[1] - entry.loop[0]) * 0.8 : 0;
    src.start(t, start);
    let stopped = false;
    const v: Live = {
      name,
      bus: o.bus ?? 'foley',
      started: t,
      stop: (fade = 0.35) => {
        if (stopped) return;
        stopped = true;
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0.0001, now + fade);
        src.stop(now + fade + 0.05);
        this.live.delete(v);
      },
    };
    this.live.add(v);
    return {
      set(p, ramp = 0.08) {
        if (stopped) return;
        const now = ctx.currentTime;
        const to = (param: AudioParam, v: number) => {
          param.cancelScheduledValues(now);
          param.setValueAtTime(param.value, now);
          param.setTargetAtTime(v, now, ramp);
        };
        if (p.gain !== undefined) to(gain.gain, Math.max(0.0001, p.gain));
        if (p.rate !== undefined) to(src.playbackRate, p.rate);
        if (p.pan !== undefined && pan) to(pan.pan, Math.max(-1, Math.min(1, p.pan)));
      },
      stop: (fade) => v.stop(fade),
    };
  }

  /** Fade out every voice (optionally only one bus). */
  stopAll(fade = 0.15, bus?: BusName) {
    Array.from(this.live).forEach((v) => (!bus || v.bus === bus) && v.stop(fade));
  }

  /** Scene foley + ambience (keeps interface sounds such as transition tails). */
  stopScene(fade = 0.12) {
    this.stopAll(fade, 'foley');
    this.stopAll(fade, 'amb');
  }

  /* ---------------- interface ---------------- */

  /** tactile wooden press (generic buttons) */
  press() {
    this.play('btn', { bus: 'ui', gain: 0.75, send: 0.05 });
    this.play('tick', { bus: 'ui', gain: 0.18, rate: 1.4, send: 0 });
  }
  /** the big Play button: press + a soft air lift */
  playPress() {
    this.press();
    this.play('whoosh_quick', { bus: 'ui', gain: 0.22, rate: 1.25, delay: 0.03, lowpass: 5000, send: 0.2 });
  }
  /** answer choice */
  select() {
    this.play('btn', { bus: 'ui', gain: 0.9, rate: 0.92, send: 0.06 });
    this.play('tick', { bus: 'ui', gain: 0.25, rate: 1.1, send: 0 });
  }
  /** ถัดไป: press + a paper-like forward swipe */
  next() {
    this.press();
    this.play('page', { bus: 'ui', gain: 0.32, rate: 1.1, delay: 0.02, send: 0.1 });
  }
  /** feedback card / overlay entrance */
  popup() {
    this.play('page', { bus: 'ui', gain: 0.38, rate: 0.95, send: 0.12 });
    this.play('whoosh_short', { bus: 'ui', gain: 0.12, rate: 1.5, lowpass: 3500, send: 0.1 });
  }
  /** warm two-note kalimba with a light chime shimmer */
  correct() {
    this.play('kalimba', { bus: 'ui', gain: 0.5, send: 0.3, vary: 0.2 });
    this.play('kalimba', { bus: 'ui', gain: 0.42, rate: 1.335, delay: 0.13, send: 0.35, vary: 0.2, pan: 0.15 });
    this.play('sparkle', { bus: 'ui', gain: 0.22, delay: 0.18, send: 0.4, pan: -0.1 });
  }
  /** gentle and non-punitive: two soft, low wooden knocks */
  incorrect() {
    this.play('woodblock', { bus: 'ui', gain: 0.32, rate: 0.62, lowpass: 1800, send: 0.25, vary: 0.2 });
    this.play('woodblock', { bus: 'ui', gain: 0.26, rate: 0.55, lowpass: 1500, delay: 0.16, send: 0.3, vary: 0.2 });
  }

  /** scene-change sweep: kind-specific colour */
  whoosh(kind: 'heavy' | 'light' | 'air' = 'air') {
    if (kind === 'heavy') {
      this.play('whoosh_air', { bus: 'ui', gain: 0.4, rate: 0.8, lowpass: 3200, send: 0.3 });
      this.play('whoosh_short', { bus: 'ui', gain: 0.18, rate: 0.7, delay: 0.12, lowpass: 2000, send: 0.2 });
    } else if (kind === 'light') {
      this.play('whoosh_quick', { bus: 'ui', gain: 0.38, send: 0.25 });
    } else {
      this.play('whoosh_air', { bus: 'ui', gain: 0.42, send: 0.3 });
    }
  }
  /** the giant chapter-title reveal: low cinematic swell + air + faint shimmer */
  titleIn() {
    this.play('title_boom', { bus: 'ui', gain: 0.3, lowpass: 900, send: 0.35, vary: 0.3 });
    this.play('whoosh_air', { bus: 'ui', gain: 0.2, rate: 0.7, lowpass: 2600, delay: 0.05, send: 0.4 });
    this.play('shimmer', { bus: 'ui', gain: 0.11, delay: 0.32, send: 0.6, rate: 0.9 });
  }
  /** title leaving: soft reverse-feeling air */
  titleOut() {
    this.play('whoosh_quick', { bus: 'ui', gain: 0.22, rate: 0.85, lowpass: 4200, send: 0.35 });
  }
  /** door / panel contact */
  thud() {
    this.play('creak_deep', { bus: 'ui', gain: 0.18, lowpass: 900, variant: 0, duration: 0.4, send: 0.2 });
    this.play('woodblock', { bus: 'ui', gain: 0.22, rate: 0.45, lowpass: 700, send: 0.25 });
  }
}

/** Stereo position for a scene x coordinate (scene view box is ~960 wide). */
export const panAt = (x: number, center = 480, width = 600) => Math.max(-0.7, Math.min(0.7, (x - center) / width));

export const sfx = new SoundEngine();
export type { SoundEngine };
