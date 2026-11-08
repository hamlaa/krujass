import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * Logical presentation canvas: fixed 900 units tall; width flexes between
 * 1200 (iPad 4:3) and 1600 (16:9) so both screen shapes are filled without
 * distortion. The viewport element already excludes iPad safe areas
 * (CSS env(safe-area-inset-*) padding), so we measure it, not the window.
 */
export const STAGE_H = 900;
export const STAGE_MIN_W = 1200;
export const STAGE_MAX_W = 1600;

export interface StageSize {
  w: number;
  h: number;
  scale: number;
  portrait: boolean;
}

export function computeStage(vw: number, vh: number): StageSize {
  const w = Math.round(Math.min(STAGE_MAX_W, Math.max(STAGE_MIN_W, (vw / Math.max(vh, 1)) * STAGE_H)));
  const scale = Math.min(vw / w, vh / STAGE_H);
  return { w, h: STAGE_H, scale, portrait: vh > vw * 1.05 };
}

export function useStageScale(ref: RefObject<HTMLElement | null>): StageSize {
  const [s, set] = useState<StageSize>({ w: 1600, h: 900, scale: 1, portrait: false });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = () => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const w = r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const h = r.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      set(computeStage(w, h));
    };
    on();
    const ro = new ResizeObserver(on);
    ro.observe(el);
    window.addEventListener('orientationchange', on);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', on);
    };
  }, [ref]);
  return s;
}
