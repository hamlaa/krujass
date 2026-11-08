import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { CHOICE_LABEL, CHOICE_ORDER, QUESTION, SCENARIOS, type Choice, type Scenario } from '../data/scenarios';
import type { SceneAction, SceneState } from '../state/sceneMachine';
import { SCENE_MODULES } from '../scenes';
import { SceneView } from '../scenes/common';
import type { RigHandle } from '../rig/runtime';
import { AnimatedButton } from '../components/AnimatedButton';
import { AnswerFeedback } from '../components/AnswerFeedback';
import { KineticText } from '../components/KineticText';
import { WrongPopup } from '../components/WrongPopup';
import { NextButton } from '../components/NextButton';
import { Icon } from '../components/Icon';
import { enter } from '../animations/motionPresets';
import { sfx } from '../audio/soundEngine';

interface Props {
  scenario: Scenario;
  state: SceneState;
  dispatch: (a: SceneAction) => void;
  onNext: () => void;
  isLast: boolean;
  reduced: boolean;
}

/**
 * One situation. Attention is staged so there is always a single obvious action:
 *   idle      → title, then the Play button
 *   playing   → the illustration (controls recede)
 *   ready     → the two answer buttons
 *   answered  → feedback + physics overlay, then ถัดไป
 */
export function SceneSlide({ scenario, state, dispatch, onNext, isLast, reduced }: Props) {
  const root = useRef<HTMLElement>(null);
  const rig = useRef<RigHandle | null>(null);
  const tokenRef = useRef(state.playToken);
  const mountToken = useRef(state.playToken);
  const prevPhase = useRef(state.phase);
  const answersRef = useRef<HTMLDivElement>(null);
  const module = SCENE_MODULES[scenario.id];

  // entrance choreography
  useLayoutEffect(() => {
    const tl = enter(root.current!, { delay: 0.05, reduced });
    return () => {
      tl.kill();
    };
  }, [reduced]);

  // restore pose for revisited slides
  useLayoutEffect(() => {
    const r = rig.current;
    if (!r) return;
    if (state.completed) r.showFinal();
    else r.reset();
    if (state.phase === 'answered') r.setPhysics(true, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // play requests
  useEffect(() => {
    tokenRef.current = state.playToken;
    if (state.playToken !== mountToken.current && state.phase === 'playing') {
      rig.current?.setPhysics(false, false);
      rig.current?.play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.playToken]);

  // phase transitions: reveal answers, physics overlay, feedback sound
  useEffect(() => {
    const prev = prevPhase.current;
    prevPhase.current = state.phase;
    if (state.phase === 'ready' && prev === 'playing' && answersRef.current) {
      const btns = answersRef.current.querySelectorAll('.answers-label, .answer-btn');
      if (reduced) gsap.fromTo(btns, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });
      else gsap.fromTo(btns, { autoAlpha: 0, y: 28, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(1.6)', stagger: 0.12 });
    }
    if (state.phase === 'answered' && prev === 'ready') {
      rig.current?.setPhysics(true, true);
      sfx.popup();
      if (state.choice === scenario.correct) sfx.correct();
      else sfx.incorrect();
    }
    if (state.phase === 'answered' && prev === 'playing') rig.current?.setPhysics(true, true);
  }, [state.phase, state.choice, scenario.correct, reduced]);

  // wrong pick: just the buzzer, no explanation
  const wrongCount = useRef(state.wrong.length);
  const [wrongPop, setWrongPop] = useState(0); // 0 = hidden, else the wrong-count that triggered it
  useEffect(() => {
    if (state.wrong.length > wrongCount.current) sfx.incorrect();
    if (state.wrong.length > wrongCount.current) setWrongPop(state.wrong.length);
    wrongCount.current = state.wrong.length;
  }, [state.wrong.length]);

  const onComplete = useCallback(() => dispatch({ type: 'PLAY_DONE', token: tokenRef.current }), [dispatch]);
  const play = () => dispatch({ type: 'PLAY' });
  const answer = (c: Choice) => dispatch({ type: 'ANSWER', choice: c, correct: scenario.correct });

  const playing = state.phase === 'playing';
  const showAnswers = state.completed;
  const answered = state.choice !== null;
  const fbOpen = answered && state.feedbackOpen;

  return (
    <section
      ref={root}
      className={`slide scene-slide scene-${scenario.id} phase-${state.phase} ${fbOpen ? 'fb-open' : ''}`}
      style={{ ['--accent' as string]: scenario.accent, ['--accent-ink' as string]: scenario.accentInk, ['--accent-soft' as string]: scenario.accentSoft }}
      aria-label={`สถานการณ์ที่ ${scenario.number}: ${scenario.title}`}
    >
      <div className="scene-left">
        <header className="scene-head">
          <p className="scene-progress" data-enter="left" data-at="0" aria-label={`สถานการณ์ที่ ${Number(scenario.number)} จาก ${SCENARIOS.length}`}>
            <span className="sp-dot" aria-hidden="true" />
            สถานการณ์ <b>{scenario.number}</b>
            <span className="sp-of"> / {String(SCENARIOS.length).padStart(2, '0')}</span>
          </p>
          <KineticText as="h1" className="scene-title" text={scenario.title} at={0.08} />
          {!fbOpen && (
            <p className="scene-situation" data-enter data-at="0.3">
              {scenario.situation}
            </p>
          )}
        </header>

        <div className="scene-body">
          {fbOpen && state.choice ? (
            <AnswerFeedback
              key={`fb-${state.choice}`}
              scenario={scenario}
              choice={state.choice}
              reduced={reduced}
              animate
              onClose={() => dispatch({ type: 'CLOSE_FEEDBACK' })}
            />
          ) : (
            <>
              <p className="question" data-enter data-at="0.42">
                {QUESTION.replace('หรือไม่?', '')}
                <span className="nowrap">หรือไม่?</span>
              </p>
              <div className="action-zone" data-enter data-at="0.55">
                {!showAnswers ? (
                  <AnimatedButton
                    className={`btn-play ${playing ? 'is-playing' : ''}`}
                    sound={false}
                    onClick={() => {
                      sfx.playPress();
                      play();
                    }}
                    disabled={playing}
                    aria-label="เล่นแอนิเมชัน"
                  >
                    <span className="btn-play-icon">{playing ? <span className="play-bars"><i /><i /><i /></span> : <Icon name="play" size={34} />}</span>
                    <span className="btn-play-text">{playing ? 'กำลังเล่น… สังเกตแรงและการเคลื่อนที่' : 'เล่นแอนิเมชัน'}</span>
                  </AnimatedButton>
                ) : (
                  <div className="answers" ref={answersRef} role="group" aria-label="เลือกคำตอบ">
                    <div className="answers-label">{answered ? 'คำตอบ' : 'เลือกคำตอบ'}</div>
                    <div className="answers-row">
                      {CHOICE_ORDER.map((c) => {
                        const isWrong = state.wrong.includes(c);
                        const isPick = state.choice === c || isWrong;
                        const isRight = answered && scenario.correct === c;
                        return (
                          <AnimatedButton
                            key={c}
                            sound="select"
                            className={`answer-btn answer-${c} ${isPick ? 'is-picked' : ''} ${isWrong ? 'is-wrong' : ''} ${isRight ? 'is-right' : ''} ${answered && !isRight ? 'is-dim' : ''}`}
                            disabled={answered || playing || isWrong}
                            aria-pressed={isPick}
                            onClick={() => answer(c)}
                          >
                            <span className="answer-text">{CHOICE_LABEL[c]}</span>
                            {isWrong && (
                              <span className="answer-wrong" role="img" aria-label="ผิด">
                                <Icon name="close" size={22} stroke={3.4} />
                                ผิด
                              </span>
                            )}
                            {isRight && (
                              <span className="answer-mark" aria-label="คำตอบที่ถูกต้อง">
                                <Icon name="check" size={24} stroke={3.4} />
                              </span>
                            )}
                          </AnimatedButton>
                        );
                      })}
                    </div>
                    {answered && (
                      <AnimatedButton className="btn-quiet" onClick={() => dispatch({ type: 'OPEN_FEEDBACK' })}>
                        <Icon name="info" size={20} /> ดูคำอธิบาย
                      </AnimatedButton>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {wrongPop > 0 && <WrongPopup key={wrongPop} reduced={reduced} onDone={() => setWrongPop(0)} />}

        <footer className="scene-foot">
          <NextButton primary={answered} onClick={onNext} label={isLast ? 'ไปหน้าสรุป' : 'ถัดไป'} />
        </footer>
      </div>

      <div className="scene-right">
        <div className={`plate ${state.phase === 'idle' ? 'is-poster' : ''}`} data-enter="plate" data-at="0.1">
          <SceneView ref={rig} scene={module} uid={`s-${scenario.id}`} reduced={reduced} onComplete={onComplete} className="plate-svg" />
          <div className="plate-frame" aria-hidden="true" />
          {state.phase === 'idle' && (
            // the whole picture is a (silent, unstyled) play target for touch
            <button type="button" className="plate-hit" aria-label="เล่นแอนิเมชัน" onPointerDown={() => sfx.unlock()} onClick={() => (sfx.playPress(), play())} />
          )}
          {showAnswers && (
            <AnimatedButton className="replay-chip" onClick={play} disabled={playing} aria-label="เล่นแอนิเมชันซ้ำ">
              <Icon name="replay" size={20} />
              <span>เล่นซ้ำ</span>
            </AnimatedButton>
          )}
        </div>
      </div>
    </section>
  );
}
