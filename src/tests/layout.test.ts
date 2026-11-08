import { describe, expect, it } from 'vitest';
import { STAGE_H, STAGE_MAX_W, STAGE_MIN_W, computeStage } from '../hooks/useStageScale';
import { bobAt, contactsBetween, footAt } from '../rig/gait';

describe('computeStage', () => {
  it('fills a 16:9 projector exactly', () => {
    const s = computeStage(1920, 1080);
    expect(s.w).toBe(1600);
    expect(s.h).toBe(STAGE_H);
    expect(s.scale).toBeCloseTo(1.2);
    expect(s.portrait).toBe(false);
  });

  it('adapts the canvas width to a 4:3 iPad instead of letterboxing', () => {
    const s = computeStage(1180, 820);
    expect(s.w).toBeGreaterThanOrEqual(STAGE_MIN_W);
    expect(s.w).toBeLessThan(STAGE_MAX_W);
    expect(s.w * s.scale).toBeCloseTo(1180, 0);
  });

  it('clamps very wide and very narrow screens and never overflows', () => {
    for (const [vw, vh] of [[2560, 900], [1024, 1000], [1366, 1024], [3440, 1440]]) {
      const s = computeStage(vw, vh);
      expect(s.w).toBeGreaterThanOrEqual(STAGE_MIN_W);
      expect(s.w).toBeLessThanOrEqual(STAGE_MAX_W);
      expect(s.w * s.scale).toBeLessThanOrEqual(vw + 0.5);
      expect(s.h * s.scale).toBeLessThanOrEqual(vh + 0.5);
    }
  });

  it('flags portrait orientation', () => {
    expect(computeStage(820, 1180).portrait).toBe(true);
  });
});

describe('gait', () => {
  it('keeps the stance foot planted (no sliding)', () => {
    const stride = 100;
    for (let p = 0; p < 3; p += 0.01) {
      const a = footAt(p, 0, stride, 1, 20);
      const b = footAt(p + 0.004, 0, stride, 1, 20);
      if (a.stance && b.stance) expect(b.x).toBe(a.x);
      if (a.stance) expect(a.lift).toBe(0);
    }
  });

  it('feet alternate: one foot is always on the ground', () => {
    for (let p = 0; p < 3; p += 0.013) {
      const l = footAt(p, 0, 100, -1, 20);
      const r = footAt(p, 0.5, 100, -1, 20);
      expect(l.stance || r.stance).toBe(true);
    }
  });

  it('advances one stride per cycle in the walking direction', () => {
    const a = footAt(0.1, 0, 100, -1, 20).x;
    const b = footAt(1.1, 0, 100, -1, 20).x;
    expect(b - a).toBeCloseTo(-100);
  });

  it('counts contacts and bobs twice per cycle', () => {
    expect(contactsBetween(0.2, 2.2, 0)).toBe(2);
    expect(contactsBetween(1, 0.5, 0)).toBe(0);
    expect(bobAt(0, 3)).toBeCloseTo(3);
    expect(bobAt(0.5, 3)).toBeCloseTo(3);
    expect(bobAt(0.25, 3)).toBeCloseTo(-3);
  });
});
