import { useLayoutEffect, useRef } from 'react';
import { SCENARIOS, SUMMARY } from '../data/scenarios';
import { SCENE_MODULES } from '../scenes';
import { SceneView } from '../scenes/common';
import { AnimatedButton } from '../components/AnimatedButton';
import { KineticText } from '../components/KineticText';
import { Icon } from '../components/Icon';
import { enter } from '../animations/motionPresets';
import { sfx } from '../audio/soundEngine';

export function SummarySlide({ onRestart, reduced }: { onRestart: () => void; reduced: boolean }) {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const tl = enter(root.current!, { delay: 0.1, reduced });
    if (!reduced) {
      tl.fromTo(
        root.current!.querySelectorAll('.sum-card'),
        { autoAlpha: 0, y: 40, rotationX: -25, transformPerspective: 900 },
        { autoAlpha: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'expo.out', stagger: { each: 0.08, grid: [2, 3], from: 'start' } },
        0.25,
      );
      tl.fromTo(root.current!.querySelectorAll('.sum-verdict'), { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.6, ease: 'back.out(2.4)', stagger: 0.08 }, 0.7);
    }
    return () => {
      tl.kill();
    };
  }, [reduced]);

  return (
    <section ref={root} className="slide summary-slide" aria-label="สรุป">
      <header className="sum-head">
        <p className="scene-progress" data-enter="left" data-at="0">
          <span className="sp-dot" aria-hidden="true" />
          สรุปบทเรียน · 6 สถานการณ์
        </p>
        <KineticText as="h1" className="sum-title" text={SUMMARY.title} at={0.05} />
      </header>

      <div className="sum-grid">
        {SCENARIOS.map((s) => {
          const work = s.correct === 'work';
          return (
            <article
              key={s.id}
              className={`sum-card ${work ? 'is-work' : 'is-nowork'}`}
              style={{ ['--accent' as string]: s.accent, ['--accent-soft' as string]: s.accentSoft, ['--accent-ink' as string]: s.accentInk }}
              aria-label={`สถานการณ์ที่ ${s.number} ${s.title}: ${s.summaryVerdict} — ${s.summaryReason}`}
            >
              <div className="sum-thumb">
                <SceneView scene={SCENE_MODULES[s.id]} uid={`t-${s.id}`} reduced still className="sum-svg" />
                <span className="sum-num">{s.number}</span>
              </div>
              <div className="sum-body">
                <div className="sum-name">{s.title}</div>
                <div className={`sum-verdict ${work ? 'v-work' : 'v-nowork'}`}>{s.summaryVerdict}</div>
                <div className="sum-reason">{s.summaryReason}</div>
              </div>
            </article>
          );
        })}
      </div>

      <footer className="sum-foot" data-enter data-at="1.1">
        <div className="sum-principle">
          <span className="math">W</span> = <span className="math">F</span>
          <span className="math">s</span> cos<span className="math">θ</span>
        </div>
        <p className="sum-message">“{SUMMARY.message}”</p>
        <AnimatedButton
          className="btn-cta btn-restart"
          sound={false}
          onClick={() => {
            sfx.next();
            onRestart();
          }}
        >
          <Icon name="restart" size={28} stroke={3} />
          <span>{SUMMARY.restart}</span>
        </AnimatedButton>
      </footer>
    </section>
  );
}
