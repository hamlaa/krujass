import { describe, expect, it } from 'vitest';
import { TITLE_TIMING, planTitle, titleEntrance } from '../animations/transitions';

/** authoring cue points of each transition builder: [title in, title out, reveal end] */
const AUTHORED: Record<string, [number, number, number]> = {
  cart: [0.42, 1.05, 1.9],
  beam: [0.5, 1.1, 2.04],
  window: [0.45, 1.0, 1.8],
  stairs: [0.55, 1.1, 1.965],
  travel: [0.55, 1.05, 1.85],
  doors: [0.62, 1.2, 2.2],
  recap: [0.6, 1.15, 2.0],
  home: [0.4, 0.9, 1.57],
  fade: [0.35, 0.9, 1.4],
};

describe('chapter title timing', () => {
  it('matches the quick-reveal spec', () => {
    expect(titleEntrance()).toBeGreaterThanOrEqual(0.4);
    expect(titleEntrance()).toBeLessThanOrEqual(0.6);
    expect(TITLE_TIMING.hold).toBeGreaterThanOrEqual(1.2);
    expect(TITLE_TIMING.hold).toBeLessThanOrEqual(1.5);
    const exit = TITLE_TIMING.out + TITLE_TIMING.stagger * 0.6 * 2;
    expect(exit).toBeGreaterThanOrEqual(0.4);
    expect(exit).toBeLessThanOrEqual(0.6);
  });

  it.each(Object.entries(AUTHORED))('%s transition totals about 2–2.7 s', (_kind, [inAt, outAt, end]) => {
    const p = planTitle(inAt, outAt, end);
    expect(p.total).toBeGreaterThanOrEqual(2.0);
    expect(p.total).toBeLessThanOrEqual(2.7);
    expect(p.speed).toBeGreaterThanOrEqual(1);
    expect(p.speed).toBeLessThanOrEqual(TITLE_TIMING.maxSpeed);
    // the title is fully in, then held for exactly TITLE_TIMING.hold
    expect(p.outAt - (p.inAt + titleEntrance())).toBeCloseTo(TITLE_TIMING.hold, 5);
  });
});
