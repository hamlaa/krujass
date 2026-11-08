import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { CHOICE_LABEL, type Choice, type Scenario } from '../data/scenarios';
import { AnimatedButton } from './AnimatedButton';
import { Icon } from './Icon';

/** keep short formulas (s = 0, θ = 90°, W > 0) on one line */
const nb = (t: string) => t.replace(/ ([=>×]) /g, '\u00a0$1\u00a0').replace(/ (cos)/g, '\u00a0$1').replace(/cos (\d)/g, 'cos\u00a0$1');

interface Props {
  scenario: Scenario;
  choice: Choice;
  onClose: () => void;
  reduced: boolean;
  /** animate the entrance (false when restoring an already-answered slide) */
  animate: boolean;
}

/**
 * Six feedback personalities, one per scene (`scenario.feedback`).
 * The card lives in the left panel so it never hides the illustration.
 */
export function AnswerFeedback({ scenario, choice, onClose, reduced, animate }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const correct = choice === scenario.correct;
  const v = scenario.feedback;

  useLayoutEffect(() => {
    const el = root.current!;
    const card = el.querySelector<HTMLElement>('.fb-card')!;
    const content = el.querySelectorAll<HTMLElement>('.fb-card > *');
    const layers = el.querySelectorAll<HTMLElement>('.fb-layer');
    if (!animate || reduced) {
      gsap.set(el, { autoAlpha: 1 });
      if (reduced && animate) gsap.fromTo(card, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });
      gsap.set(layers, { autoAlpha: 0 });
      return;
    }
    const tl = gsap.timeline();
    tl.set(el, { autoAlpha: 1 });
    const contentIn = (at: number) => tl.fromTo(content, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.06 }, at);

    switch (v) {
      case 'slide':
        tl.fromTo(layers, { xPercent: -105 }, { xPercent: 0, duration: 0.5, ease: 'power3.inOut', stagger: 0.07 }, 0);
        tl.to(layers, { xPercent: 105, duration: 0.5, ease: 'power3.in', stagger: 0.06 }, 0.5);
        tl.fromTo(card, { x: -50, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out' }, 0.45);
        contentIn(0.55);
        break;
      case 'spring':
        tl.fromTo(card, { scale: 0.55, autoAlpha: 0, transformOrigin: choice === 'work' ? '25% 100%' : '75% 100%' }, { scale: 1, autoAlpha: 1, duration: 0.9, ease: 'elastic.out(1, 0.55)' }, 0);
        contentIn(0.18);
        break;
      case 'screen':
        tl.fromTo(layers[0], { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.35, ease: 'power3.out' }, 0);
        tl.fromTo(card, { clipPath: 'inset(49.5% 0% 49.5% 0% round 26px)', autoAlpha: 1 }, { clipPath: 'inset(0% 0% 0% 0% round 26px)', duration: 0.55, ease: 'power3.inOut' }, 0.3);
        tl.to(layers[0], { autoAlpha: 0, duration: 0.2 }, 0.6);
        contentIn(0.55);
        break;
      case 'steps':
        tl.fromTo(layers, { yPercent: 110, autoAlpha: 1 }, { yPercent: 0, duration: 0.42, ease: 'power3.out', stagger: 0.1 }, 0);
        tl.fromTo(card, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.35);
        tl.to(layers, { autoAlpha: 0, duration: 0.3 }, 0.8);
        tl.fromTo(content, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'steps(4)', stagger: 0.08 }, 0.45);
        tl.set(content, { clearProps: 'transform' });
        break;
      case 'curve':
        tl.fromTo(card, { clipPath: 'circle(0% at 8% 100%)', autoAlpha: 1 }, { clipPath: 'circle(150% at 8% 100%)', duration: 0.8, ease: 'power2.inOut' }, 0);
        contentIn(0.3);
        break;
      case 'impact':
        tl.fromTo(card, { y: -90, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.38, ease: 'power4.in' }, 0);
        tl.to(card, { scaleY: 0.93, scaleX: 1.03, transformOrigin: '50% 100%', duration: 0.08, ease: 'power2.out' }, 0.38);
        tl.to(card, { scaleY: 1, scaleX: 1, duration: 0.6, ease: 'elastic.out(1.1, 0.4)' }, 0.46);
        tl.fromTo(el, { x: -6 }, { x: 0, duration: 0.45, ease: 'elastic.out(1.4, 0.25)' }, 0.38);
        contentIn(0.42);
        break;
    }
    return () => {
      tl.kill();
    };
  }, [animate, reduced, v, choice]);

  return (
    <div ref={root} className={`fb fb-${v} ${correct ? 'is-correct' : 'is-wrong'}`} role="dialog" aria-live="polite" aria-label={correct ? 'ถูกต้อง' : 'ยังไม่ถูกต้อง'}>
      <div className="fb-layers" aria-hidden="true">
        <div className="fb-layer" />
        <div className="fb-layer" />
        <div className="fb-layer" />
      </div>
      <div className="fb-card">
        <header className="fb-head">
          <span className="fb-badge" aria-hidden="true">
            <Icon name={correct ? 'check' : 'info'} size={30} stroke={3.2} />
          </span>
          <h3 className="fb-title">{correct ? 'ถูกต้อง!' : 'ยังไม่ถูกต้อง'}</h3>
          <AnimatedButton className="fb-close" aria-label="ปิดคำอธิบาย" onClick={onClose}>
            <Icon name="close" size={24} />
          </AnimatedButton>
        </header>
        <p className="fb-answer">
          {!correct && (
            <span className="fb-picked">
              คุณเลือก: <b>{CHOICE_LABEL[choice]}</b>
            </span>
          )}
          <span>
            คำตอบที่ถูกต้อง: <b className="fb-correct">{CHOICE_LABEL[scenario.correct]}</b>
          </span>
        </p>
        <p className="fb-expl">{nb(scenario.explanation)}</p>
        <p className="fb-concept">{nb(scenario.concept)}</p>
      </div>
    </div>
  );
}
