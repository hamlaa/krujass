import type { Choice } from '../data/scenarios';

/**
 * Deterministic per-scene interaction state machine.
 *
 *   idle ──PLAY──▶ playing ──PLAY_DONE──▶ ready ──ANSWER──▶ answered
 *                    ▲                                         │
 *                    └──────────────── PLAY (replay) ◀─────────┘
 */
export type Phase = 'idle' | 'playing' | 'ready' | 'answered';

export interface SceneState {
  phase: Phase;
  choice: Choice | null;
  /** True once the main animation has been watched to the end at least once. */
  completed: boolean;
  feedbackOpen: boolean;
  /** Monotonic counter, bumps on every accepted PLAY so views can restart timelines. */
  playToken: number;
}

export const initialSceneState = (): SceneState => ({
  phase: 'idle',
  choice: null,
  completed: false,
  feedbackOpen: false,
  playToken: 0,
});

export type SceneAction =
  | { type: 'PLAY' }
  | { type: 'PLAY_DONE'; token: number }
  | { type: 'ANSWER'; choice: Choice }
  | { type: 'OPEN_FEEDBACK' }
  | { type: 'CLOSE_FEEDBACK' }
  | { type: 'LEAVE' };

export function sceneReducer(s: SceneState, a: SceneAction): SceneState {
  switch (a.type) {
    case 'PLAY':
      if (s.phase === 'playing') return s; // double-tap guard
      return { ...s, phase: 'playing', feedbackOpen: false, playToken: s.playToken + 1 };

    case 'PLAY_DONE':
      // Ignore completions from stale timelines.
      if (s.phase !== 'playing' || a.token !== s.playToken) return s;
      return { ...s, phase: s.choice ? 'answered' : 'ready', completed: true };

    case 'ANSWER':
      if (s.phase !== 'ready' || s.choice) return s; // no answering mid-play or twice
      return { ...s, phase: 'answered', choice: a.choice, feedbackOpen: true };

    case 'OPEN_FEEDBACK':
      if (s.phase !== 'answered' || s.feedbackOpen) return s;
      return { ...s, feedbackOpen: true };

    case 'CLOSE_FEEDBACK':
      if (!s.feedbackOpen) return s;
      return { ...s, feedbackOpen: false };

    case 'LEAVE':
      // Leaving mid-playback must not leave a dangling "playing" phase.
      if (s.phase !== 'playing') return s;
      return { ...s, phase: s.choice ? 'answered' : s.completed ? 'ready' : 'idle' };
  }
}

/* ------------------------------------------------------------------ */
/* Presentation-level state                                            */
/* ------------------------------------------------------------------ */

export interface DeckState {
  scenes: SceneState[];
}

export type DeckAction =
  | { type: 'SCENE'; index: number; action: SceneAction }
  | { type: 'RESET_ALL' };

export const initialDeck = (count: number): DeckState => ({
  scenes: Array.from({ length: count }, initialSceneState),
});

export function deckReducer(d: DeckState, a: DeckAction): DeckState {
  switch (a.type) {
    case 'RESET_ALL':
      return initialDeck(d.scenes.length);
    case 'SCENE': {
      const cur = d.scenes[a.index];
      if (!cur) return d;
      const next = sceneReducer(cur, a.action);
      if (next === cur) return d;
      const scenes = d.scenes.slice();
      scenes[a.index] = next;
      return { scenes };
    }
  }
}
