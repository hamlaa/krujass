import { gsap } from 'gsap';
import { sfx } from '../audio/soundEngine';
import { EASE } from './motionPresets';

export type TransitionKind = 'cart' | 'beam' | 'window' | 'stairs' | 'travel' | 'doors' | 'recap' | 'home' | 'fade';

export interface TransitionLabel {
  num?: string;
  title: string;
  kicker?: string;
  accent: string;
}

export interface TransitionArgs {
  layer: HTMLElement;
  w: number;
  h: number;
  dir: 1 | -1;
  label: TransitionLabel;
  reduced: boolean;
  onMid: () => void;
  onShake?: (amount: number) => void;
}

/**
 * Chapter-title timing (seconds, real time).
 *   in      title entrance (the last line lands at in + 2·stagger)
 *   hold    fully readable hold
 *   out     title exit
 *   total   target length of the whole transition (cover → title → reveal)
 * Each transition keeps its own choreography: its cover and reveal are played
 * proportionally faster (up to maxSpeed) so the whole thing lands near `total`.
 * The presenter can tap / press ถัดไป during the hold to continue early.
 */
export const TITLE_TIMING = {
  in: 0.45,
  hold: 1.3,
  out: 0.45,
  stagger: 0.05,
  total: 2.6,
  maxSpeed: 2,
};

/** Seconds from the title's first line starting to its last line being fully in. */
export const titleEntrance = () => TITLE_TIMING.in + TITLE_TIMING.stagger * 2;

export interface TitlePlan {
  /** playback speed of the transition's own cover / reveal choreography */
  speed: number;
  /** real time the title starts to enter */
  inAt: number;
  /** real time the title starts to leave */
  outAt: number;
  /** real length of the whole transition */
  total: number;
}

/**
 * Plan a transition from its as-authored choreography: the title enters at
 * `inAt`, leaves at `outAt`, and the reveal ends at `end` (authoring seconds).
 */
export function planTitle(inAt: number, outAt: number, end: number): TitlePlan {
  const T = TITLE_TIMING;
  const tail = Math.max(0, end - outAt);
  const budget = Math.max(0.1, T.total - titleEntrance() - T.hold);
  const speed = Math.min(T.maxSpeed, Math.max(1, (inAt + tail) / budget));
  const realIn = inAt / speed;
  const realOut = realIn + titleEntrance() + T.hold;
  const exitEnd = realOut + T.out + T.stagger * 0.6 * 2;
  return { speed, inAt: realIn, outAt: realOut, total: Math.max(realOut + tail / speed, exitEnd) };
}

/** Each transition's whoosh colour. */
const WHOOSH: Record<TransitionKind, 'heavy' | 'light' | 'air' | null> = {
  cart: 'air',
  beam: 'heavy',
  window: 'light',
  stairs: 'light',
  travel: 'air',
  doors: 'heavy',
  recap: 'air',
  home: 'air',
  fade: null,
};

const SCENE_ACCENTS = ['#3fae4a', '#f2b705', '#3aa6a0', '#6366d1', '#ec4f93', '#a8642f'];

function el(parent: HTMLElement, cls: string, style: Partial<CSSStyleDeclaration> = {}, html = ''): HTMLDivElement {
  const d = document.createElement('div');
  d.className = cls;
  Object.assign(d.style, style);
  if (html) d.innerHTML = html;
  parent.appendChild(d);
  return d;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

interface LabelTiming {
  /** authoring times requested by the builder */
  inAt: number;
  outAt: number;
  exitX: number;
  /** adds the title's tweens to the real-time master timeline */
  apply(master: gsap.core.Timeline, inAt: number, outAt: number): void;
}
/** set by makeLabel while a transition is being built (one transition at a time) */
let building: LabelTiming | null = null;

/**
 * Kinetic typography block shown while the screen is covered. Builders only
 * mark when the title enters / leaves; its tweens run in real time on the
 * master timeline, so they keep TITLE_TIMING regardless of the cover's pace.
 */
function makeLabel(parent: HTMLElement, l: TransitionLabel, tone: 'light' | 'dark' = 'light', calm = false) {
  const box = el(parent, `tx-label tx-${tone}`);
  if (l.num) el(box, 'tx-num-wrap', {}, `<span class="tx-num">${esc(l.num)}</span>`);
  const right = el(box, 'tx-text');
  if (l.kicker) el(right, 'tx-kicker-wrap', {}, `<span class="tx-kicker">${esc(l.kicker)}</span>`);
  el(right, 'tx-title-wrap', {}, `<span class="tx-title">${esc(l.title)}</span>`);
  const rule = el(right, 'tx-rule');
  const parts = box.querySelectorAll<HTMLElement>('.tx-num, .tx-kicker, .tx-title');
  const T = TITLE_TIMING;
  gsap.set(rule, { scaleX: 0, transformOrigin: '0% 50%' });
  if (calm) gsap.set(parts, { autoAlpha: 0 });
  else gsap.set(parts, { yPercent: 112 });
  const timing: LabelTiming = {
    inAt: 0,
    outAt: 0,
    exitX: 0,
    apply(tl, inAt, outAt) {
      tl.call(() => sfx.titleIn(), undefined, inAt);
      if (calm) {
        tl.fromTo(parts, { autoAlpha: 0 }, { autoAlpha: 1, duration: T.in * 0.6, ease: 'power1.out', stagger: T.stagger }, inAt);
        tl.to(rule, { scaleX: 1, duration: T.in * 0.6, ease: 'power1.out' }, inAt);
      } else {
        tl.fromTo(parts, { yPercent: 112, autoAlpha: 1 }, { yPercent: 0, duration: T.in, ease: 'expo.out', stagger: T.stagger }, inAt);
        tl.to(rule, { scaleX: 1, duration: T.in + 0.15, ease: 'power3.inOut' }, inAt + 0.08);
        // the slow documentary push-in while the title holds
        tl.fromTo(box, { scale: 0.985 }, { scale: 1.015, duration: outAt - inAt + T.out, ease: 'sine.inOut' }, inAt);
      }
      tl.call(() => sfx.titleOut(), undefined, outAt);
      if (calm) {
        tl.to([...parts, rule], { autoAlpha: 0, duration: T.out * 0.6, ease: 'power1.in' }, outAt);
        return;
      }
      tl.to(rule, { scaleX: 0, transformOrigin: '100% 50%', duration: T.out * 0.8, ease: 'power3.in' }, outAt);
      tl.to(parts, { yPercent: -112, x: timing.exitX, duration: T.out, ease: 'power3.in', stagger: T.stagger * 0.6 }, outAt);
    },
  };
  building = timing;
  return {
    box,
    in(_tl: gsap.core.Timeline, at: number) {
      timing.inAt = at;
    },
    out(_tl: gsap.core.Timeline, at: number, x = 0) {
      timing.outAt = at;
      timing.exitX = x;
    },
  };
}

let current: { tl: gsap.core.Timeline; shownAt: number; outAt: number } | null = null;

/** Presenter tapped during the hold: continue to the title's exit right away. */
export function skipTitleHold() {
  if (!current) return;
  const { tl, shownAt, outAt } = current;
  if (tl.time() > shownAt && tl.time() < outAt - 0.05) tl.time(outAt - 0.05, false);
}

function finish(layer: HTMLElement, tl: gsap.core.Timeline): Promise<void> {
  return new Promise((resolve) => {
    tl.eventCallback('onComplete', () => {
      layer.innerHTML = '';
      layer.classList.remove('is-active');
      resolve();
    });
  });
}

/* ------------------------------------------------------------------ */

export function runTransition(kind: TransitionKind, a: TransitionArgs): Promise<void> {
  const { layer } = a;
  gsap.killTweensOf(layer.querySelectorAll('*'));
  layer.innerHTML = '';
  layer.classList.add('is-active');
  if (a.reduced) kind = 'fade';
  const w = WHOOSH[kind];
  if (w) sfx.whoosh(w);
  const build = BUILDERS[kind] ?? BUILDERS.fade;
  building = null;
  // the transition's own cover / reveal choreography, in authoring time
  const cover = build(a).pause();
  const label = building as LabelTiming | null;
  const master = gsap.timeline();
  let shownAt = 0;
  let outAt = 0;
  if (label && label.outAt) {
    const plan = planTitle(label.inAt, label.outAt, cover.duration());
    // hold: push the reveal (everything from the title's exit on) later, then play it all faster
    const shift = plan.outAt * plan.speed - label.outAt;
    if (shift > 0) cover.shiftChildren(shift, true, label.outAt - 0.0001);
    cover.timeScale(plan.speed);
    label.apply(master, plan.inAt, plan.outAt);
    shownAt = plan.inAt + TITLE_TIMING.in;
    outAt = plan.outAt;
  }
  master.add(cover.play(0), 0);
  current = { tl: master, shownAt, outAt };
  return finish(layer, master).then(() => {
    if (current?.tl === master) current = null;
  });
}

type Builder = (a: TransitionArgs) => gsap.core.Timeline;

const BUILDERS: Record<TransitionKind, Builder> = {
  /* Intro → 1: kinetic velocity bands sweeping in the cart's direction, a rolling wheel */
  cart({ layer, w, h, dir, label, onMid }) {
    const tl = gsap.timeline();
    const colors = ['#1b1a2e', '#3fae4a', '#2c7d36', '#1b1a2e', '#8fd18f'];
    const bands = colors.map((c, i) =>
      el(layer, 'tx-band', { top: `${(i * h) / 5 - 1}px`, height: `${h / 5 + 2}px`, width: `${w * 1.5}px`, background: c, left: '0px' }),
    );
    const start = dir > 0 ? w : -w * 1.5;
    const cover = -w * 0.25;
    const exit = dir > 0 ? -w * 1.6 : w * 1.1;
    gsap.set(bands, { x: start });
    const wheel = el(layer, 'tx-wheel', { left: '0px', top: `${h * 0.8 - 70}px` }, '<i></i><i></i><i></i>');
    gsap.set(wheel, { x: dir > 0 ? w + 120 : -260 });
    const lab = makeLabel(layer, label, 'light');
    tl.to(bands, { x: cover, duration: 0.62, ease: EASE.inOutQuart, stagger: { each: 0.055, from: dir > 0 ? 'start' : 'end' } }, 0);
    tl.to(wheel, { x: dir > 0 ? -280 : w + 160, rotation: -dir * 900, duration: 1.5, ease: 'power1.inOut' }, 0.05);
    lab.in(tl, 0.42);
    tl.call(onMid, undefined, 0.8);
    lab.out(tl, 1.05, -dir * 120);
    tl.to(bands, { x: exit, duration: 0.6, ease: EASE.inQuart, stagger: { each: 0.05, from: dir > 0 ? 'end' : 'start' } }, 1.1);
    return tl;
  },

  /* 1 → 2: long wooden planks sweep across at different depths (parallax) */
  beam({ layer, w, h, dir, label, onMid }) {
    const tl = gsap.timeline();
    const specs = [
      { top: -0.14, ht: 0.36, cls: 'tx-plank', d: 0.72 },
      { top: 0.16, ht: 0.32, cls: 'tx-plank tx-plank-dark', d: 0.6 },
      { top: 0.42, ht: 0.34, cls: 'tx-plank tx-plank-yellow', d: 0.66 },
      { top: 0.7, ht: 0.42, cls: 'tx-plank', d: 0.56 },
    ];
    const planks = specs.map((s) =>
      el(layer, s.cls, { top: `${s.top * h}px`, height: `${s.ht * h}px`, width: `${w * 1.7}px`, left: '0px' }),
    );
    planks.forEach((p, i) => gsap.set(p, { x: dir > 0 ? w + i * 60 : -w * 1.7 - i * 60, rotation: -6 }));
    const lab = makeLabel(layer, label, 'dark');
    planks.forEach((p, i) => tl.to(p, { x: -w * 0.33, duration: specs[i].d, ease: EASE.inOutQuart }, i * 0.06));
    lab.in(tl, 0.5);
    tl.call(onMid, undefined, 0.85);
    lab.out(tl, 1.1, -dir * 160);
    planks.forEach((p, i) => tl.to(p, { x: dir > 0 ? -w * 1.9 : w * 1.2, duration: specs[i].d + 0.05, ease: EASE.inQuart }, 1.12 + (3 - i) * 0.05));
    return tl;
  },

  /* 2 → 3: screen-like window panes pop open from the centre, then fold away */
  window({ layer, w, h, label, onMid }) {
    const tl = gsap.timeline();
    const cols = 5;
    const rows = 3;
    const colors = ['#dcf0ee', '#a9dcd6', '#e9f6f4', '#f3eee4', '#c6e7e2'];
    // solid backdrop so the old slide never shows through the pane gaps during the hold
    const back = el(layer, 'tx-fade', { width: `${w}px`, height: `${h}px`, background: '#f7fbfa' });
    gsap.set(back, { autoAlpha: 0 });
    const panes: HTMLDivElement[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const p = el(layer, 'tx-pane', { left: `${(c * w) / cols}px`, top: `${(r * h) / rows}px`, width: `${w / cols + 1}px`, height: `${h / rows + 1}px` });
        el(p, 'tx-pane-in', { background: colors[(r * 2 + c) % colors.length] });
        panes.push(p);
      }
    const inner = panes.map((p) => p.firstElementChild as HTMLElement);
    gsap.set(inner, { scale: 0, borderRadius: 40 });
    const lab = makeLabel(layer, label, 'dark');
    tl.to(inner, { scale: 1.02, borderRadius: 0, duration: 0.55, ease: 'back.out(1.3)', stagger: { grid: [rows, cols], from: 'center', amount: 0.32 } }, 0);
    tl.to(back, { autoAlpha: 1, duration: 0.2 }, 0.62);
    lab.in(tl, 0.45);
    tl.call(onMid, undefined, 0.82);
    lab.out(tl, 1.0);
    tl.to(back, { autoAlpha: 0, duration: 0.15 }, 1.05);
    tl.to(inner, { scaleY: 0, transformOrigin: '50% 0%', duration: 0.45, ease: EASE.inQuart, stagger: { grid: [rows, cols], from: 'start', axis: 'y', amount: 0.3 } }, 1.05);
    return tl;
  },

  /* 3 → 4: columns rise into a staircase silhouette, then climb off the top */
  stairs({ layer, w, h, dir, label, onMid }) {
    const tl = gsap.timeline();
    const n = 8;
    const colors = ['#363894', '#6366d1', '#4b4eb8', '#8183e0'];
    const cols = Array.from({ length: n }, (_, i) =>
      el(layer, 'tx-col', { left: `${(i * w) / n}px`, width: `${w / n + 1}px`, height: `${h}px`, top: '0px', background: colors[i % colors.length] }),
    );
    const up = dir > 0;
    gsap.set(cols, { y: up ? h : -h });
    // stair profile ascends to the left, like the scene's staircase
    tl.to(cols, {
      y: (i: number) => (up ? h * ((i + 1) / (n + 1)) * 0.9 : -h * ((n - i) / (n + 1)) * 0.9),
      duration: 0.42,
      ease: EASE.outQuart,
      stagger: { each: 0.045, from: up ? 'start' : 'end' },
    }, 0);
    tl.to(cols, { y: 0, duration: 0.38, ease: EASE.inOutQuart, stagger: { each: 0.035, from: up ? 'end' : 'start' } }, 0.36);
    const lab = makeLabel(layer, label, 'light');
    lab.in(tl, 0.55);
    tl.call(onMid, undefined, 0.92);
    lab.out(tl, 1.1);
    tl.to(cols, { y: up ? -h : h, duration: 0.5, ease: EASE.inQuart, stagger: { each: 0.045, from: up ? 'start' : 'end' } }, 1.15);
    return tl;
  },

  /* 4 → 5: a pink "suitcase" orb travels along a curved dotted path and engulfs the screen */
  travel({ layer, w, h, dir, label, onMid }) {
    const tl = gsap.timeline();
    const D = Math.hypot(w, h) * 2.2;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'tx-svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const path = document.createElementNS(ns, 'path');
    const P0 = dir > 0 ? { x: -0.05 * w, y: 0.95 * h } : { x: 1.05 * w, y: 0.05 * h };
    const P1 = dir > 0 ? { x: 0.3 * w, y: 0.3 * h } : { x: 0.7 * w, y: 0.7 * h };
    const P2 = { x: 0.5 * w, y: 0.5 * h };
    const P3 = dir > 0 ? { x: 1.15 * w, y: -0.15 * h } : { x: -0.15 * w, y: 1.15 * h };
    path.setAttribute('d', `M${P0.x},${P0.y} Q${P1.x},${P1.y + (dir > 0 ? 0.35 : -0.35) * h} ${P2.x},${P2.y} T${P3.x},${P3.y}`);
    path.setAttribute('class', 'tx-trail');
    svg.appendChild(path);
    layer.appendChild(svg);
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: `4 18`, strokeDashoffset: 0, clipPath: 'none' });
    const reveal = { p: 0 };
    const ring = el(layer, 'tx-orb', { width: `${D}px`, height: `${D}px`, left: `${-D / 2}px`, top: `${-D / 2}px` });
    el(ring, 'tx-orb-core');
    const at = (t: number) => path.getPointAtLength(len * t);
    const place = (t: number, s: number) => {
      const p = at(t);
      gsap.set(ring, { x: p.x, y: p.y, scale: s });
    };
    place(0, 0.01);
    const lab = makeLabel(layer, label, 'light');
    const o = { t: 0, s: 0.01 };
    tl.fromTo(svg, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0);
    tl.to(reveal, { p: 1, duration: 0.5 }, 0);
    tl.to(o, { t: 0.5, duration: 0.75, ease: 'power2.inOut', onUpdate: () => place(o.t, o.s) }, 0);
    tl.to(o, { s: 1, duration: 0.75, ease: 'power3.in' }, 0);
    lab.in(tl, 0.55);
    tl.call(onMid, undefined, 0.85);
    lab.out(tl, 1.05, dir * 120);
    tl.to(svg, { autoAlpha: 0, duration: 0.2 }, 0.8);
    tl.to(o, { t: 1, s: 0.02, duration: 0.75, ease: 'power2.in', onUpdate: () => place(o.t, o.s) }, 1.1);
    return tl;
  },

  /* 5 → 6: wardrobe doors slam shut (with impact), then swing open in 3D */
  doors({ layer, w, h, label, onMid, onShake }) {
    const tl = gsap.timeline();
    const stage = el(layer, 'tx-doorstage', { width: `${w}px`, height: `${h}px` });
    const L = el(stage, 'tx-door tx-door-l', { width: `${w / 2 + 16}px`, height: `${h}px`, left: '0px' }, '<span class="tx-door-panel"></span><span class="tx-door-panel b"></span><span class="tx-handle"></span>');
    const R = el(stage, 'tx-door tx-door-r', { width: `${w / 2 + 16}px`, height: `${h}px`, left: `${w / 2 - 16}px` }, '<span class="tx-door-panel"></span><span class="tx-door-panel b"></span><span class="tx-handle"></span>');
    const shade = el(layer, 'tx-shade');
    const dust = el(layer, 'tx-dust', { top: `${h - 40}px`, width: `${w}px` });
    for (let i = 0; i < 14; i++) el(dust, 'tx-puff', { left: `${w / 2 + (i - 7) * 26}px` });
    gsap.set(L, { x: -w / 2 - 40 });
    gsap.set(R, { x: w / 2 + 40 });
    gsap.set(shade, { autoAlpha: 0 });
    const lab = makeLabel(layer, label, 'light');
    tl.to([L, R], { x: 0, duration: 0.5, ease: 'power3.in' }, 0);
    tl.to(shade, { autoAlpha: 0.35, duration: 0.5 }, 0);
    tl.call(() => {
      sfx.thud();
      onShake?.(1);
    }, undefined, 0.5);
    tl.to(L, { x: -8, duration: 0.09, ease: 'power2.out' }, 0.5).to(L, { x: 0, duration: 0.25, ease: 'bounce.out' }, 0.59);
    tl.to(R, { x: 8, duration: 0.09, ease: 'power2.out' }, 0.5).to(R, { x: 0, duration: 0.25, ease: 'bounce.out' }, 0.59);
    tl.fromTo(dust.children, { y: 0, scale: 0.3, autoAlpha: 0.7 }, { y: () => -20 - Math.random() * 30, x: (i: number) => (i - 7) * 10, scale: 1.4, autoAlpha: 0, duration: 0.8, ease: 'power2.out', stagger: 0.01 }, 0.5);
    const handles = stage.querySelectorAll('.tx-handle');
    tl.to(handles, { autoAlpha: 0, duration: 0.3 }, 0.62);
    lab.in(tl, 0.62);
    tl.call(onMid, undefined, 0.95);
    lab.out(tl, 1.2);
    tl.to(handles, { autoAlpha: 1, duration: 0.3 }, 1.21);
    tl.to(L, { rotationY: -100, duration: 0.85, ease: 'power2.inOut' }, 1.3);
    tl.to(R, { rotationY: 100, duration: 0.85, ease: 'power2.inOut' }, 1.3);
    tl.to(shade, { autoAlpha: 0, duration: 0.6 }, 1.4);
    tl.to([L, R], { autoAlpha: 0, duration: 0.25 }, 1.95);
    return tl;
  },

  /* 6 → summary: six scene tiles flip in, then condense into the recap */
  recap({ layer, w, h, dir, label, onMid }) {
    const tl = gsap.timeline();
    const stage = el(layer, 'tx-doorstage', { width: `${w}px`, height: `${h}px` });
    const tiles = SCENE_ACCENTS.map((c, i) =>
      el(stage, 'tx-tile', {
        left: `${(i % 3) * (w / 3)}px`,
        top: `${Math.floor(i / 3) * (h / 2)}px`,
        width: `${w / 3 + 1}px`,
        height: `${h / 2 + 1}px`,
        background: c,
      }, `<span>0${i + 1}</span>`),
    );
    gsap.set(tiles, { rotationY: dir > 0 ? -90 : 90, transformOrigin: '50% 50%' });
    const card = el(layer, 'tx-recap-card');
    gsap.set(card, { xPercent: -50, yPercent: -50, scale: 0.6, autoAlpha: 0 });
    const lab = makeLabel(layer, label, 'light');
    tl.to(tiles, { rotationY: 0, duration: 0.55, ease: EASE.outQuart, stagger: 0.07 }, 0);
    tl.to(tiles.map((t) => t.firstElementChild), { autoAlpha: 0.35, duration: 0.3 }, 0.5);
    tl.to(card, { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'back.out(1.6)' }, 0.48);
    lab.in(tl, 0.6);
    tl.call(onMid, undefined, 1.0);
    lab.out(tl, 1.15);
    tl.to(tiles, { scale: 0.18, autoAlpha: 0, borderRadius: 40, duration: 0.55, ease: EASE.inQuart, stagger: { each: 0.05, from: 'center' } }, 1.2);
    tl.to(card, { scale: 0.8, autoAlpha: 0, duration: 0.35, ease: EASE.inQuart }, 1.3);
    return tl;
  },

  /* generic jump / restart: an ink curtain with the title */
  home({ layer, w, h, label, onMid }) {
    const tl = gsap.timeline();
    const panel = el(layer, 'tx-curtain', { width: `${w}px`, height: `${h}px` });
    const strip = el(layer, 'tx-curtain tx-curtain-accent', { width: `${w}px`, height: `${h}px` });
    gsap.set([panel, strip], { yPercent: 100 });
    const lab = makeLabel(layer, label, 'light');
    tl.to(strip, { yPercent: 0, duration: 0.45, ease: EASE.inOutQuart }, 0);
    tl.to(panel, { yPercent: 0, duration: 0.5, ease: EASE.inOutQuart }, 0.08);
    lab.in(tl, 0.4);
    tl.call(onMid, undefined, 0.72);
    lab.out(tl, 0.9);
    tl.to(panel, { yPercent: -100, duration: 0.55, ease: EASE.inOutQuart }, 0.95);
    tl.to(strip, { yPercent: -100, duration: 0.55, ease: EASE.inOutQuart }, 1.02);
    return tl;
  },

  /* reduced motion: a calm cross-fade through paper */
  fade({ layer, w, h, label, onMid }) {
    const tl = gsap.timeline();
    const p = el(layer, 'tx-fade', { width: `${w}px`, height: `${h}px` });
    gsap.set(p, { autoAlpha: 0 });
    const lab = makeLabel(layer, label, 'dark', true);
    tl.to(p, { autoAlpha: 1, duration: 0.3, ease: 'power1.out' }, 0);
    tl.call(onMid, undefined, 0.32);
    lab.in(tl, 0.35);
    lab.out(tl, 0.9);
    tl.to(p, { autoAlpha: 0, duration: 0.4, ease: 'power1.in' }, 1.0);
    return tl;
  },
};
