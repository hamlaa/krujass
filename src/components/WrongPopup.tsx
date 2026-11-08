import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Icon } from './Icon';

/**
 * Wrong-answer pop-up: covers the left panel, then fades away on its own.
 * Remount it (via `key`) to replay. It never blocks input (pointer-events: none).
 */
export function WrongPopup({ reduced, onDone }: { reduced: boolean; onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = root.current!;
    const icon = el.querySelector('.wp-icon');
    const word = el.querySelector('.wp-word');
    const sub = el.querySelector('.wp-sub');
    const tl = gsap.timeline({ onComplete: onDone });
    if (reduced) {
      tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }).to(el, { autoAlpha: 0, duration: 0.5, delay: 0.9 });
    } else {
      tl.fromTo(el, { xPercent: -100, autoAlpha: 1 }, { xPercent: 0, duration: 0.5, ease: 'back.out(1.25)' })
        .fromTo(icon, { scale: 0, rotate: -40 }, { scale: 1, rotate: 0, duration: 0.55, ease: 'back.out(2.4)' }, 0.25)
        .fromTo(word, { y: 30, autoAlpha: 0, scale: 0.7 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, 0.35)
        .fromTo(sub, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.6)
        .to(el, { x: -14, duration: 0.06, yoyo: true, repeat: 5, ease: 'none' }, 0.55)
        .to(el, { autoAlpha: 0, scale: 1.04, duration: 0.7, ease: 'power2.in' }, 1.5);
    }
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={root} className="wrong-popup" aria-hidden="true">
      <span className="wp-icon">
        <Icon name="close" size={96} stroke={3.6} />
      </span>
      <span className="wp-word">ผิด</span>
      <span className="wp-sub">ลองอีกครั้ง</span>
    </div>
  );
}
