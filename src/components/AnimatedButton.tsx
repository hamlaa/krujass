import { forwardRef, useRef, type ButtonHTMLAttributes, type PointerEvent as RPointerEvent } from 'react';
import { gsap } from 'gsap';
import { sfx } from '../audio/soundEngine';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  sound?: 'press' | 'select' | false;
  /** max press compression (1 = none) */
  press?: number;
}

/**
 * Tactile button: compresses on press, springs back on release, emits a soft
 * highlight ripple from the touch point. Pointer-based (no hover reliance),
 * keyboard-activatable, and unlocks Web Audio on the first gesture.
 */
export const AnimatedButton = forwardRef<HTMLButtonElement, Props>(function AnimatedButton(
  { sound = 'press', press = 0.94, className = '', onPointerDown, onPointerUp, onPointerCancel, onPointerLeave, onClick, children, ...rest },
  fwd,
) {
  const local = useRef<HTMLButtonElement | null>(null);
  const setRef = (el: HTMLButtonElement | null) => {
    local.current = el;
    if (typeof fwd === 'function') fwd(el);
    else if (fwd) fwd.current = el;
  };

  const release = () => {
    const el = local.current;
    if (!el) return;
    gsap.to(el, { scale: 1, duration: 0.65, ease: 'elastic.out(1.1, 0.42)', overwrite: 'auto' });
  };

  const down = (e: RPointerEvent<HTMLButtonElement>) => {
    sfx.unlock();
    onPointerDown?.(e);
    const el = local.current;
    if (!el || rest.disabled) return;
    gsap.to(el, { scale: press, duration: 0.12, ease: 'power2.out', overwrite: 'auto' });
    const r = el.getBoundingClientRect();
    const k = r.width / el.offsetWidth || 1; // stage scale
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    const size = Math.max(el.offsetWidth, el.offsetHeight) * 2.2;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${(e.clientX - r.left) / k - size / 2}px`;
    ripple.style.top = `${(e.clientY - r.top) / k - size / 2}px`;
    el.appendChild(ripple);
    gsap.fromTo(ripple, { scale: 0, opacity: 0.38 }, { scale: 1, opacity: 0, duration: 0.7, ease: 'power2.out', onComplete: () => ripple.remove() });
  };

  return (
    <button
      ref={setRef}
      type="button"
      className={`abtn ${className}`}
      onPointerDown={down}
      onPointerUp={(e) => {
        release();
        onPointerUp?.(e);
      }}
      onPointerCancel={(e) => {
        release();
        onPointerCancel?.(e);
      }}
      onPointerLeave={(e) => {
        release();
        onPointerLeave?.(e);
      }}
      onClick={(e) => {
        sfx.unlock();
        if (sound) sfx[sound]();
        // keyboard activation: give a tiny press pulse too
        if (e.detail === 0 && local.current) gsap.fromTo(local.current, { scale: press }, { scale: 1, duration: 0.5, ease: 'elastic.out(1.1, 0.45)' });
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
});
