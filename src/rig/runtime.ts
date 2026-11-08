import { gsap } from 'gsap';
import { sfx } from '../audio/soundEngine';

export interface RigOptions {
  onComplete: () => void;
  reduced: boolean;
  /** Static thumbnail: no ticker, no ambient loops, final pose only. */
  still?: boolean;
}

export interface RigHandle {
  play(): void;
  showFinal(): void;
  reset(): void;
  setPhysics(on: boolean, animate: boolean): void;
  destroy(): void;
}

export interface FrameInfo {
  /** true only while the main timeline is actually advancing (not seeking) */
  playing: boolean;
  /** seconds since rig creation (for ambient noise) */
  time: number;
}

export interface SceneSpec<P extends object> {
  /** Initial pose; also the replay reset state. Main timeline tweens only these keys. */
  pose: P;
  /** Ambient (idle) values, never touched by the main timeline. */
  ambient?: Record<string, number>;
  build(tl: gsap.core.Timeline, P: P, ctx: BuildCtx): void;
  buildAmbient?(A: Record<string, number>, ctx: BuildCtx): gsap.core.Animation[];
  render(P: P, A: Record<string, number>, f: FrameInfo): void;
  onPlay?(): void;
  /** Called on stop/reset/destroy — stop loop sounds, clear particles. */
  onStop?(): void;
}

export interface BuildCtx {
  reduced: boolean;
  /** register a sound/fx callback that only fires during real playback */
  cue(tl: gsap.core.Timeline, at: number | string, fn: () => void): void;
}

/**
 * Generic scene runtime: owns the main timeline, ambient loops, one ticker
 * callback and the physics overlay. All state is rebuilt from `pose` each
 * frame, so replay never accumulates transforms.
 */
export function createRuntime<P extends object>(svg: SVGSVGElement, spec: SceneSpec<P>, opts: RigOptions): RigHandle {
  const initial = { ...spec.pose } as P;
  const P = { ...spec.pose } as P;
  const A = { ...(spec.ambient ?? {}) };
  const t0 = performance.now();
  let destroyed = false;

  const ctx: BuildCtx = {
    reduced: opts.reduced,
    cue(tl, at, fn) {
      tl.call(() => {
        if (tl.isActive() || tl.progress() < 1) fn();
      }, undefined, at);
    },
  };

  const tl = gsap.timeline({
    paused: true,
    onComplete: () => {
      spec.onStop?.();
      if (!destroyed) opts.onComplete();
    },
  });
  spec.build(tl, P, ctx);

  const ambient = opts.still ? [] : spec.buildAmbient?.(A, ctx) ?? [];

  const frame = () => {
    spec.render(P, A, { playing: tl.isActive(), time: (performance.now() - t0) / 1000 });
  };
  if (!opts.still) gsap.ticker.add(frame);

  const phys = svg.querySelector<SVGGElement>('.phys');
  let physTl: gsap.core.Timeline | null = null;

  const setPhysics = (on: boolean, animate: boolean) => {
    if (!phys) return;
    physTl?.kill();
    physTl = null;
    const lines = Array.from(phys.querySelectorAll<SVGPathElement>('.phys-line'));
    const heads = phys.querySelectorAll('.phys-head');
    const labels = phys.querySelectorAll('.phys-label');
    if (!on) {
      gsap.set(phys, { autoAlpha: 0 });
      return;
    }
    gsap.set(phys, { autoAlpha: 1 });
    lines.forEach((l) => {
      const len = l.getTotalLength ? l.getTotalLength() : 200;
      l.style.strokeDasharray = l.dataset.dash ?? `${len} ${len}`;
      if (!l.dataset.dash) l.style.strokeDashoffset = '0';
    });
    if (!animate || opts.reduced) {
      gsap.set([heads, labels], { autoAlpha: 1, scale: 1, y: 0 });
      return;
    }
    physTl = gsap.timeline();
    lines.forEach((l, i) => {
      if (l.dataset.dash) {
        physTl!.fromTo(l, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.15 + i * 0.12);
      } else {
        const len = l.getTotalLength ? l.getTotalLength() : 200;
        physTl!.fromTo(l, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.55, ease: 'power2.inOut' }, 0.1 + i * 0.12);
      }
    });
    physTl.fromTo(heads, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.35, ease: 'back.out(2.5)', stagger: 0.1 }, 0.45);
    physTl.fromTo(labels, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.08 }, 0.6);
  };
  setPhysics(false, false);

  const restoreInitial = () => Object.assign(P, initial);

  const handle: RigHandle = {
    play() {
      if (destroyed) return;
      sfx.stopScene(0.08); // a replay never overlaps the previous take
      spec.onStop?.();
      restoreInitial();
      spec.onPlay?.();
      tl.restart();
    },
    showFinal() {
      spec.onStop?.();
      tl.progress(1, true).pause();
      frame();
    },
    reset() {
      sfx.stopScene();
      spec.onStop?.();
      tl.pause(0, true);
      restoreInitial();
      frame();
    },
    setPhysics,
    destroy() {
      destroyed = true;
      gsap.ticker.remove(frame);
      tl.kill();
      physTl?.kill();
      ambient.forEach((a) => a.kill());
      spec.onStop?.();
    },
  };
  frame();
  return handle;
}

/* ------------------------------------------------------------------ */
/* Particle pool (SVG circles, capped)                                 */
/* ------------------------------------------------------------------ */
export class DustPool {
  private items: SVGCircleElement[] = [];
  private i = 0;
  constructor(group: SVGGElement | null, count = 14, fill = '#cbbfae') {
    if (!group) return;
    const ns = 'http://www.w3.org/2000/svg';
    for (let k = 0; k < count; k++) {
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('r', '0');
      c.setAttribute('cx', '0');
      c.setAttribute('cy', '0');
      c.setAttribute('fill', fill);
      c.style.opacity = '0';
      group.appendChild(c);
      this.items.push(c);
    }
  }
  emit(x: number, y: number, o: { dx?: number; dy?: number; r?: number; dur?: number; opacity?: number } = {}) {
    if (!this.items.length) return;
    const c = this.items[this.i++ % this.items.length];
    gsap.killTweensOf(c);
    const r = o.r ?? 5;
    gsap.fromTo(
      c,
      { attr: { cx: x, cy: y, r: r * 0.4 }, opacity: o.opacity ?? 0.55 },
      {
        attr: { cx: x + (o.dx ?? 0) + (Math.random() - 0.5) * 10, cy: y + (o.dy ?? -10) - Math.random() * 6, r: r * (1.2 + Math.random() * 0.6) },
        opacity: 0,
        duration: o.dur ?? 0.8 + Math.random() * 0.4,
        ease: 'power2.out',
      },
    );
  }
  clear() {
    this.items.forEach((c) => {
      gsap.killTweensOf(c);
      c.style.opacity = '0';
    });
  }
}
