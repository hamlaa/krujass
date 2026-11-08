import { fract, lerp, smooth } from './bone';

/**
 * Planted-foot walking gait.
 *
 * `phase` counts gait cycles (1 cycle = left + right step). The body advances
 * `stride` scene units per cycle. A foot in stance stays at a fixed world
 * position, so there is no foot sliding regardless of how `phase` is eased.
 */
export interface FootSample {
  /** travel-space x (add the walker's start x to get world x) */
  x: number;
  /** vertical lift (negative = up) */
  lift: number;
  stance: boolean;
  /** 0..1 progress through swing (0 while in stance) */
  swing: number;
}

export function footAt(
  phase: number,
  offset: number,
  stride: number,
  dir: 1 | -1,
  liftHeight: number,
): FootSample {
  const c = phase + offset;
  const n = Math.floor(c);
  const f = c - n;
  const plant = (k: number) => dir * stride * (k + 0.25 - offset);
  if (f < 0.5) return { x: plant(n), lift: 0, stance: true, swing: 0 };
  const s = (f - 0.5) / 0.5;
  return {
    x: lerp(plant(n), plant(n + 1), smooth(s)),
    lift: -liftHeight * Math.sin(Math.PI * s),
    stance: false,
    swing: s,
  };
}

/** Body travel for a given phase. */
export const travelAt = (phase: number, stride: number, dir: 1 | -1) => dir * stride * phase;

/** Vertical bob: lowest at foot contact, highest at passing position. */
export const bobAt = (phase: number, amp: number) => amp * Math.cos(phase * Math.PI * 4);

/** Counts foot contacts between two phases (for footstep sounds / dust). */
export function contactsBetween(prev: number, next: number, offset: number): number {
  if (next <= prev) return 0;
  return Math.floor(next + offset) - Math.floor(prev + offset);
}

export const cyclePos = (phase: number, offset: number) => fract(phase + offset);
