import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { SCENARIOS, CHOICE_ORDER, INTRO, SUMMARY } from './data/scenarios';
import { deckReducer, initialDeck, type SceneAction } from './state/sceneMachine';
import { useStageScale } from './hooks/useStageScale';
import { useReducedMotion } from './hooks/useReducedMotion';
import { runTransition, skipTitleHold, type TransitionKind, type TransitionLabel } from './animations/transitions';
import { sfx } from './audio/soundEngine';
import { IntroSlide } from './slides/IntroSlide';
import { SceneSlide } from './slides/SceneSlide';
import { SummarySlide } from './slides/SummarySlide';
import { RotatePrompt } from './components/RotatePrompt';
import { AnimatedButton } from './components/AnimatedButton';
import { Icon } from './components/Icon';
import { FullscreenInvite } from './components/FullscreenInvite';

const N = SCENARIOS.length;
const SUMMARY_INDEX = N + 1;
const TOTAL = N + 2;

/** Transition used when moving forward INTO slide i (navigation is forward-only). */
const KIND_INTO: TransitionKind[] = ['home', ...SCENARIOS.map((s) => s.transitionIn), 'recap'];

function labelFor(i: number): TransitionLabel {
  if (i === 0) return { title: INTRO.title, kicker: 'W = Fs', accent: '#ff5a36' };
  if (i === SUMMARY_INDEX) return { title: SUMMARY.title.replace('สรุป: ', ''), kicker: 'สรุปบทเรียน', accent: '#ff5a36' };
  const s = SCENARIOS[i - 1];
  return { num: s.number, title: s.title, kicker: 'สถานการณ์', accent: s.accent };
}

type FsDoc = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => void };

export default function App() {
  const viewport = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const stage = useStageScale(viewport);
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [deck, dispatchDeck] = useReducer(deckReducer, N, initialDeck);
  // the fullscreen invitation is shown once per page load (never after transitions or restart)
  const [invite, setInvite] = useState(true);
  const inviteRef = useRef(invite);
  inviteRef.current = invite;
  const busy = useRef(false);
  const indexRef = useRef(index);
  indexRef.current = index;
  const deckRef = useRef(deck);
  deckRef.current = deck;
  const stageSize = useRef(stage);
  stageSize.current = stage;

  const shake = useCallback(
    (amt: number) => {
      if (reduced || !stageRef.current) return;
      gsap.fromTo(stageRef.current, { x: -9 * amt, y: 3 * amt }, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1.6, 0.2)', clearProps: 'x,y' });
    },
    [reduced],
  );

  const go = useCallback(
    (to: number, kindOverride?: TransitionKind, beforeMid?: () => void) => {
      const from = indexRef.current;
      if (busy.current) {
        // a second press during the chapter title continues early (never skips the reveal itself)
        skipTitleHold();
        return;
      }
      if (to === from || to < 0 || to >= TOTAL || !layer.current) return;
      busy.current = true;
      sfx.stopScene(0.25);
      const kind = kindOverride ?? KIND_INTO[to];
      runTransition(kind, {
        layer: layer.current,
        w: stageSize.current.w,
        h: stageSize.current.h,
        dir: 1,
        label: labelFor(to),
        reduced,
        onShake: shake,
        onMid: () => {
          if (from >= 1 && from <= N) dispatchDeck({ type: 'SCENE', index: from - 1, action: { type: 'LEAVE' } });
          beforeMid?.();
          setIndex(to);
        },
      }).then(() => {
        busy.current = false;
      });
    },
    [reduced, shake],
  );

  const next = useCallback(() => go(indexRef.current + 1), [go]);
  const restart = useCallback(() => go(0, 'home', () => dispatchDeck({ type: 'RESET_ALL' })), [go]);

  const sceneDispatch = useCallback((i: number) => (a: SceneAction) => dispatchDeck({ type: 'SCENE', index: i, action: a }), []);

  const fsSupported = typeof document !== 'undefined' && !!(document.documentElement.requestFullscreen || (document.documentElement as FsEl).webkitRequestFullscreen);
  const toggleFullscreen = useCallback(() => {
    const d = document as FsDoc;
    const elx = document.documentElement as FsEl;
    try {
      if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen ? d.exitFullscreen() : d.webkitExitFullscreen?.());
      else if (elx.requestFullscreen) void elx.requestFullscreen().catch(() => undefined);
      else elx.webkitRequestFullscreen?.();
    } catch {
      /* not allowed */
    }
  }, []);

  // keyboard & presenter-clicker control
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || inviteRef.current) return;
      sfx.unlock();
      const t = e.target as HTMLElement;
      const onButton = t && t.tagName === 'BUTTON';
      const i = indexRef.current;
      const scene = i >= 1 && i <= N ? deckRef.current.scenes[i - 1] : null;
      const d = (a: SceneAction) => dispatchDeck({ type: 'SCENE', index: i - 1, action: a });
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          next();
          break;
        case ' ':
          if (onButton) return;
          e.preventDefault();
          next();
          break;
        case 'Enter':
        case 'p':
        case 'P':
          if (onButton && e.key === 'Enter') return;
          if (i === 0) next();
          else if (scene && scene.phase !== 'playing') {
            sfx.playPress();
            d({ type: 'PLAY' });
          }
          break;
        case '1':
        case '2':
          if (scene && scene.phase === 'ready') {
            sfx.select();
            d({ type: 'ANSWER', choice: CHOICE_ORDER[Number(e.key) - 1], correct: SCENARIOS[i - 1].correct });
          }
          break;
        case 'Escape':
          if (scene?.feedbackOpen) d({ type: 'CLOSE_FEEDBACK' });
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, toggleFullscreen]);

  // iOS: audio unlock on any touch; suppress pinch-zoom & rubber-band scrolling
  useEffect(() => {
    const unlock = () => sfx.unlock();
    const noGesture = (e: Event) => e.preventDefault();
    const noScroll = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
      else if (!(e.target as HTMLElement).closest('.scrollable')) e.preventDefault();
    };
    const onHide = () => document.hidden && sfx.stopAll();
    // a tap on the chapter-title overlay continues early
    const onLayer = () => busy.current && skipTitleHold();
    const lay = layer.current;
    lay?.addEventListener('pointerdown', onLayer);
    window.addEventListener('pointerdown', unlock, true);
    document.addEventListener('gesturestart', noGesture);
    document.addEventListener('touchmove', noScroll, { passive: false });
    document.addEventListener('visibilitychange', onHide);
    return () => {
      lay?.removeEventListener('pointerdown', onLayer);
      window.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('gesturestart', noGesture);
      document.removeEventListener('touchmove', noScroll);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);

  const isScene = index >= 1 && index <= N;
  const scene = isScene ? SCENARIOS[index - 1] : null;
  const sceneState = isScene ? deck.scenes[index - 1] : null;

  return (
    <>
      {/* while the fullscreen invitation is open, the presentation behind it is inert */}
      <div ref={viewport} className={`viewport ${reduced ? 'reduced' : ''}`} inert={invite} aria-hidden={invite || undefined}>
        <div
          className="stage"
          data-narrow={stage.w < 1420 ? 'true' : 'false'}
          style={{ width: stage.w, height: stage.h, transform: `translate(-50%, -50%) scale(${stage.scale})` }}
        >
          <div ref={stageRef} className="stage-inner">
            {index === 0 && <IntroSlide key="intro" onStart={next} reduced={reduced} />}
            {isScene && scene && sceneState && (
              <SceneSlide
                key={scene.id}
                scenario={scene}
                state={sceneState}
                dispatch={sceneDispatch(index - 1)}
                onNext={next}
                isLast={index === N}
                reduced={reduced}
              />
            )}
            {index === SUMMARY_INDEX && <SummarySlide key="summary" onRestart={restart} reduced={reduced} />}
            {index === 0 && fsSupported && (
              <div className="intro-corner">
                {fsSupported && (
                  <AnimatedButton className="nav-btn nav-icon nav-fs" onClick={toggleFullscreen} aria-label="เต็มจอ" title="เต็มจอ (F)">
                    <Icon name="expand" />
                  </AnimatedButton>
                )}
              </div>
            )}
          </div>
          <div ref={layer} className="tx-layer" aria-hidden="true" />
        </div>
        {stage.portrait && <RotatePrompt />}
      </div>
      <FullscreenInvite open={invite} scale={stage.scale} reduced={reduced} onDone={() => setInvite(false)} />
    </>
  );
}
