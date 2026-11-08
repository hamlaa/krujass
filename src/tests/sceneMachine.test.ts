import { describe, expect, it } from 'vitest';
import { deckReducer, initialDeck, initialSceneState, sceneReducer, type SceneAction, type SceneState } from '../state/sceneMachine';

const run = (actions: SceneAction[], s: SceneState = initialSceneState()) => actions.reduce(sceneReducer, s);

describe('sceneReducer', () => {
  it('follows idle → playing → ready → answered', () => {
    let s = initialSceneState();
    expect(s.phase).toBe('idle');
    s = sceneReducer(s, { type: 'PLAY' });
    expect(s).toMatchObject({ phase: 'playing', playToken: 1 });
    s = sceneReducer(s, { type: 'PLAY_DONE', token: 1 });
    expect(s).toMatchObject({ phase: 'ready', completed: true });
    s = sceneReducer(s, { type: 'ANSWER', choice: 'work' });
    expect(s).toMatchObject({ phase: 'answered', choice: 'work', feedbackOpen: true });
  });

  it('does not allow answering before the animation has been watched', () => {
    expect(run([{ type: 'ANSWER', choice: 'work' }]).choice).toBeNull();
    const playing = run([{ type: 'PLAY' }, { type: 'ANSWER', choice: 'work' }]);
    expect(playing).toMatchObject({ phase: 'playing', choice: null });
  });

  it('ignores a second answer', () => {
    const s = run([{ type: 'PLAY' }, { type: 'PLAY_DONE', token: 1 }, { type: 'ANSWER', choice: 'noWork' }, { type: 'ANSWER', choice: 'work' }]);
    expect(s.choice).toBe('noWork');
  });

  it('ignores double-tap PLAY while playing', () => {
    const once = run([{ type: 'PLAY' }]);
    expect(sceneReducer(once, { type: 'PLAY' })).toBe(once);
  });

  it('ignores completions from stale timelines', () => {
    const s = run([{ type: 'PLAY' }, { type: 'PLAY_DONE', token: 0 }]);
    expect(s.phase).toBe('playing');
  });

  it('replay after answering keeps the answer and returns to answered', () => {
    let s = run([{ type: 'PLAY' }, { type: 'PLAY_DONE', token: 1 }, { type: 'ANSWER', choice: 'work' }]);
    s = sceneReducer(s, { type: 'PLAY' });
    expect(s).toMatchObject({ phase: 'playing', feedbackOpen: false, playToken: 2, choice: 'work' });
    s = sceneReducer(s, { type: 'PLAY_DONE', token: 2 });
    expect(s.phase).toBe('answered');
  });

  it('LEAVE mid-play never leaves a dangling playing phase', () => {
    expect(run([{ type: 'PLAY' }, { type: 'LEAVE' }]).phase).toBe('idle');
    expect(run([{ type: 'PLAY' }, { type: 'PLAY_DONE', token: 1 }, { type: 'PLAY' }, { type: 'LEAVE' }]).phase).toBe('ready');
    const idle = initialSceneState();
    expect(sceneReducer(idle, { type: 'LEAVE' })).toBe(idle);
  });

  it('feedback can be closed and reopened only after answering', () => {
    expect(run([{ type: 'OPEN_FEEDBACK' }]).feedbackOpen).toBe(false);
    let s = run([{ type: 'PLAY' }, { type: 'PLAY_DONE', token: 1 }, { type: 'ANSWER', choice: 'work' }, { type: 'CLOSE_FEEDBACK' }]);
    expect(s.feedbackOpen).toBe(false);
    s = sceneReducer(s, { type: 'OPEN_FEEDBACK' });
    expect(s.feedbackOpen).toBe(true);
  });
});

describe('deckReducer', () => {
  it('updates one scene and keeps the others by reference', () => {
    const d = initialDeck(6);
    const next = deckReducer(d, { type: 'SCENE', index: 2, action: { type: 'PLAY' } });
    expect(next.scenes[2].phase).toBe('playing');
    expect(next.scenes[0]).toBe(d.scenes[0]);
  });

  it('returns the same deck for no-op or out-of-range actions', () => {
    const d = initialDeck(6);
    expect(deckReducer(d, { type: 'SCENE', index: 0, action: { type: 'LEAVE' } })).toBe(d);
    expect(deckReducer(d, { type: 'SCENE', index: 42, action: { type: 'PLAY' } })).toBe(d);
  });

  it('RESET_ALL restores every scene', () => {
    let d = deckReducer(initialDeck(6), { type: 'SCENE', index: 1, action: { type: 'PLAY' } });
    d = deckReducer(d, { type: 'RESET_ALL' });
    expect(d).toEqual(initialDeck(6));
  });
});
