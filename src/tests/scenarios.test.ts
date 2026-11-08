import { describe, expect, it } from 'vitest';
import { CHOICE_LABEL, CHOICE_ORDER, QUESTION, SCENARIOS, SUMMARY, isCorrect } from '../data/scenarios';

describe('scenario content', () => {
  it('has exactly six scenes in the specified order', () => {
    expect(SCENARIOS.map((s) => s.id)).toEqual(['cart', 'worker', 'desk', 'stairs', 'suitcase', 'wardrobe']);
    expect(SCENARIOS.map((s) => s.number)).toEqual(['01', '02', '03', '04', '05', '06']);
  });

  it('uses the physically correct answers', () => {
    const answers = Object.fromEntries(SCENARIOS.map((s) => [s.id, s.correct]));
    expect(answers).toEqual({
      cart: 'work', // F parallel to s
      worker: 'noWork', // F vertical, s horizontal (θ = 90°)
      desk: 'noWork', // s = 0
      stairs: 'work', // body rises against gravity
      suitcase: 'work', // F cosθ along s
      wardrobe: 'noWork', // wardrobe never moves, s = 0
    });
  });

  it('offers exactly two choices with the required Thai labels', () => {
    expect(CHOICE_ORDER).toEqual(['work', 'noWork']);
    expect(CHOICE_LABEL.work).toBe('เกิดงาน');
    expect(CHOICE_LABEL.noWork).toBe('ไม่เกิดงาน');
    expect(QUESTION).toBe('การกระทำในสถานการณ์นี้เกิดงานทางวิทยาศาสตร์หรือไม่?');
  });

  it('explanations start with the verdict that matches the correct answer', () => {
    for (const s of SCENARIOS) {
      const starts = s.explanation.startsWith('ไม่เกิดงาน') ? 'noWork' : s.explanation.startsWith('เกิดงาน') ? 'work' : null;
      expect(starts, s.id).toBe(s.correct);
    }
  });

  it('gives every scene a distinct transition and feedback animation', () => {
    expect(new Set(SCENARIOS.map((s) => s.transitionIn)).size).toBe(6);
    expect(new Set(SCENARIOS.map((s) => s.feedback)).size).toBe(6);
  });

  it('isCorrect checks the answer and rejects unknown scenes', () => {
    expect(isCorrect(0, 'work')).toBe(true);
    expect(isCorrect(0, 'noWork')).toBe(false);
    expect(isCorrect(5, 'noWork')).toBe(true);
    expect(() => isCorrect(9, 'work')).toThrow();
  });

  it('summary carries the principle and message', () => {
    expect(SUMMARY.title).toBe('สรุป: งานในทางฟิสิกส์');
    expect(SUMMARY.principle).toBe('W = Fs cosθ');
    expect(SUMMARY.message).toBe('มีแรงอย่างเดียวไม่พอ ต้องพิจารณาการกระจัดและทิศทางของแรงด้วย');
  });
});
