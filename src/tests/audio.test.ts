import { describe, expect, it } from 'vitest';
import { SFX_MANIFEST } from '../audio/sfxManifest';

// the files Vite will actually bundle
const bundled = new Set(Object.keys(import.meta.glob('../audio/samples/*.mp3')).map((k) => k.replace('../audio/samples/', '').replace('.mp3', '')));

describe('sound manifest', () => {
  it('every listed variant is a local, bundled file (and nothing unused is shipped)', () => {
    const listed = new Set<string>();
    for (const [name, entry] of Object.entries(SFX_MANIFEST)) {
      expect(entry.files.length, name).toBeGreaterThan(0);
      for (const f of entry.files) {
        expect(bundled.has(f), f).toBe(true);
        listed.add(f);
      }
    }
    expect([...bundled].filter((f) => !listed.has(f))).toEqual([]);
  });

  it('loops carry valid seamless loop points', () => {
    const loops = Object.entries(SFX_MANIFEST).filter(([n]) => n.startsWith('loop_'));
    expect(loops.length).toBeGreaterThanOrEqual(4);
    for (const [name, entry] of loops) {
      const lp = (entry as { loop?: readonly number[] }).loop;
      expect(lp, name).toBeDefined();
      expect(lp![1] - lp![0], name).toBeGreaterThan(2);
    }
  });

  it('covers the foley layers each scene needs', () => {
    const need = [
      'loop_cart_rattle', 'loop_cart_wheels', 'step_sneaker', 'box_shift', 'cart_jolt',
      'step_work', 'wood_creak', 'wood_rub', 'cloth', 'breath_m',
      'loop_office', 'key', 'typing', 'mouse', 'chair', 'mug', 'paper',
      'step_stair', 'bag', 'breath_f',
      'loop_case_wheels', 'step_boot', 'case_bump', 'handle', 'coat',
      'squeak', 'creak_deep', 'cabinet_rattle', 'strain',
      'btn', 'whoosh_air', 'title_boom', 'kalimba', 'woodblock', 'page',
    ];
    for (const n of need) expect(Object.keys(SFX_MANIFEST), n).toContain(n);
  });
});
