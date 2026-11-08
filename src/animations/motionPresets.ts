import { gsap } from 'gsap';

/** One motion vocabulary for the whole deck. */
export const EASE = {
  outExpo: 'expo.out',
  outQuart: 'power3.out',
  inQuart: 'power3.in',
  inOutQuart: 'power3.inOut',
  spring: 'elastic.out(1, 0.55)',
  softBack: 'back.out(1.6)',
} as const;

export const DUR = {
  micro: 0.18,
  short: 0.35,
  base: 0.6,
  long: 0.9,
} as const;

/** Split text into word spans for kinetic typography (Thai-aware via Intl.Segmenter). */
export function splitWords(text: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: new (l: string, o: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  if (!Seg) return [text];
  const out: string[] = [];
  for (const s of new Seg('th', { granularity: 'word' }).segment(text)) out.push(s.segment);
  return out;
}

/** Standard staggered entrance for elements tagged with [data-enter]. */
export function enter(root: HTMLElement, opts: { delay?: number; reduced?: boolean } = {}) {
  const items = root.querySelectorAll<HTMLElement>('[data-enter]');
  if (opts.reduced) {
    gsap.set(items, { autoAlpha: 1, y: 0, x: 0, scale: 1 });
    return gsap.timeline();
  }
  const tl = gsap.timeline({ delay: opts.delay ?? 0 });
  items.forEach((it, i) => {
    const kind = it.dataset.enter;
    const at = Number(it.dataset.at ?? i * 0.07);
    if (kind === 'words') {
      const words = it.querySelectorAll('.w > span');
      tl.fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: 0.8, ease: EASE.outExpo, stagger: 0.05 }, at);
      tl.set(it, { autoAlpha: 1 }, at);
    } else if (kind === 'plate') {
      tl.fromTo(it, { autoAlpha: 0, scale: 0.94, y: 30, clipPath: 'inset(8% 8% 8% 8% round 40px)' }, { autoAlpha: 1, scale: 1, y: 0, clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 0.9, ease: EASE.outExpo }, at);
    } else if (kind === 'left') {
      tl.fromTo(it, { autoAlpha: 0, x: -40 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: EASE.outExpo }, at);
    } else if (kind === 'pop') {
      tl.fromTo(it, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: EASE.spring }, at);
    } else {
      tl.fromTo(it, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: EASE.outExpo }, at);
    }
  });
  return tl;
}
