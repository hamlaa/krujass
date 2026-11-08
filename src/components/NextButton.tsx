import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { AnimatedButton } from './AnimatedButton';
import { Icon } from './Icon';
import { sfx } from '../audio/soundEngine';

/**
 * The single forward control. Quiet while the class is still working on the
 * slide; becomes the primary action (and nudges once) when it is the obvious
 * next step.
 */
export function NextButton({ primary, onClick, label = 'ถัดไป' }: { primary: boolean; onClick: () => void; label?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!primary || !el) return;
    const arrow = el.querySelector('.next-arrow');
    const tl = gsap.timeline({ delay: 1.1 });
    tl.fromTo(el, { scale: 0.92 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1.2, 0.45)' });
    if (arrow) tl.to(arrow, { x: 7, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 0.2);
    return () => {
      tl.kill();
    };
  }, [primary]);
  return (
    <AnimatedButton
      ref={ref}
      className={`btn-next ${primary ? 'is-primary' : 'is-quiet'}`}
      sound={false}
      onClick={() => {
        sfx.next();
        onClick();
      }}
      aria-label={label}
    >
      <span>{label}</span>
      <span className="next-arrow" aria-hidden="true">
        <Icon name="right" size={primary ? 28 : 22} />
      </span>
    </AnimatedButton>
  );
}
