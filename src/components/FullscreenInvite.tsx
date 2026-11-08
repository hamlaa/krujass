import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { AnimatedButton } from './AnimatedButton';
import { Icon } from './Icon';

type FsDoc = Document & { webkitFullscreenEnabled?: boolean; webkitFullscreenElement?: Element | null };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => void | Promise<void> };

/** True only when the browser offers real (native) element fullscreen. iPhone Safari does not. */
export function nativeFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const d = document as FsDoc;
  const el = document.documentElement as FsEl;
  const enabled = d.fullscreenEnabled ?? d.webkitFullscreenEnabled ?? false;
  return !!enabled && !!(el.requestFullscreen || el.webkitRequestFullscreen);
}

export const isNativeFullscreen = () => {
  const d = document as FsDoc;
  return !!(d.fullscreenElement || d.webkitFullscreenElement);
};

/**
 * Ask for native fullscreen. Must be called synchronously inside the user's tap.
 * Resolves with whether the page is *actually* fullscreen afterwards.
 */
export function requestNativeFullscreen(timeoutMs = 1500): Promise<boolean> {
  if (!nativeFullscreenSupported()) return Promise.resolve(false);
  const el = document.documentElement as FsEl;
  return new Promise((resolve) => {
    let done = false;
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'fullscreenerror', 'webkitfullscreenerror'];
    const settle = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      events.forEach((e) => document.removeEventListener(e, settle));
      resolve(isNativeFullscreen());
    };
    events.forEach((e) => document.addEventListener(e, settle));
    // older WebKit returns nothing and may never fire an event when refused
    const timer = setTimeout(settle, timeoutMs);
    try {
      const r = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen?.();
      if (r && typeof r.then === 'function') r.then(settle, settle);
    } catch {
      settle();
    }
  });
}

interface Props {
  open: boolean;
  /** the stage scale, so the card matches the presentation's proportions */
  scale: number;
  reduced: boolean;
  onDone: () => void;
}

/**
 * The once-per-load invitation to present full screen. It overlays the whole
 * interface; the app behind it is made inert by the caller while `open`.
 */
export function FullscreenInvite({ open, scale, reduced, onDone }: Props) {
  const [supported] = useState(nativeFullscreenSupported);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const toast = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  // entrance
  useLayoutEffect(() => {
    if (!open || !root.current || !card.current) return;
    const items = card.current.querySelectorAll('[data-fi]');
    const tl = gsap.timeline();
    // opacity (not visibility) so the primary button can take focus straight away
    tl.fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.out' }, 0);
    if (reduced) tl.fromTo(card.current, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.05);
    else {
      tl.fromTo(card.current, { opacity: 0, y: 34, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(1.5)' }, 0.08);
      tl.fromTo(items, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.06 }, 0.2);
    }
    primary.current?.focus({ preventScroll: true });
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = (message: string | null) => {
    if (closing.current) return;
    closing.current = true;
    const finish = () => {
      onDone();
      setNotice(message);
      // hand focus back to the presentation's first action
      requestAnimationFrame(() => document.querySelector<HTMLElement>('.intro-slide .btn-cta')?.focus({ preventScroll: true }));
    };
    if (!root.current || !card.current) return finish();
    const tl = gsap.timeline({ onComplete: finish });
    if (!reduced) tl.to(card.current, { opacity: 0, y: 18, scale: 0.97, duration: 0.25, ease: 'power2.in' }, 0);
    tl.to(root.current, { opacity: 0, duration: 0.28, ease: 'power1.in' }, reduced ? 0 : 0.08);
  };

  /** ยกเลิก and X: close, no fullscreen request */
  const cancel = () => close(null);

  const goFullscreen = () => {
    if (busy || closing.current) return;
    if (!supported) {
      close('อุปกรณ์นี้ไม่รองรับโหมดเต็มหน้าจอ จึงแสดงผลในโหมดปกติ');
      return;
    }
    setBusy(true);
    // requested synchronously inside the tap, as browsers require
    void requestNativeFullscreen().then((ok) => {
      setBusy(false);
      close(ok ? null : 'ไม่สามารถเปิดโหมดเต็มหน้าจอได้ จึงแสดงผลในโหมดปกติ');
    });
  };

  // keyboard: trap focus inside the dialog, Esc = cancel, and keep the
  // presentation's own shortcuts from firing behind it
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      } else if (e.key === 'Tab' && root.current) {
        const f = Array.from(root.current.querySelectorAll<HTMLElement>('button:not([disabled])'));
        if (f.length) {
          const i = f.indexOf(document.activeElement as HTMLElement);
          const n = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : i === -1 || i === f.length - 1 ? 0 : i + 1;
          e.preventDefault();
          f[n].focus();
        }
      }
      e.stopPropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // the honest "stayed in normal display mode" notice
  useEffect(() => {
    if (!notice || !toast.current) return;
    const tl = gsap.timeline({ onComplete: () => setNotice(null) });
    tl.fromTo(toast.current, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power3.out' });
    tl.to(toast.current, { autoAlpha: 0, y: 8, duration: 0.3, ease: 'power1.in' }, '+=3');
    return () => {
      tl.kill();
    };
  }, [notice]);

  return (
    <>
      {open && (
        <div ref={root} className="fs-invite" role="presentation">
          <div className="fs-invite-scale" style={{ transform: `scale(${scale})` }}>
            <div ref={card} className="fs-invite-card" role="dialog" aria-modal="true" aria-labelledby="fs-invite-title" aria-describedby="fs-invite-desc">
              <AnimatedButton className="nav-btn fs-invite-x" onClick={cancel} disabled={busy} aria-label="ปิด">
                <Icon name="close" />
              </AnimatedButton>
              <div className="fs-invite-glyph" data-fi aria-hidden="true">
                <Icon name="expand" size={44} stroke={2.6} />
              </div>
              <h2 id="fs-invite-title" className="fs-invite-title" data-fi>
                พร้อมเริ่มการนำเสนอหรือยัง?
              </h2>
              <p id="fs-invite-desc" className="fs-invite-desc" data-fi>
                เปิดโหมดเต็มหน้าจอเพื่อการแสดงผลที่สมบูรณ์แบบ
              </p>
              {!supported && (
                <p className="fs-invite-note" data-fi>
                  เบราว์เซอร์นี้ไม่รองรับโหมดเต็มหน้าจอ จะแสดงผลในโหมดปกติ · บน iPhone/iPad แตะ แชร์ → เพิ่มไปยังหน้าจอโฮม เพื่อเปิดแบบไม่มีแถบเบราว์เซอร์
                </p>
              )}
              <div className="fs-invite-actions" data-fi>
                <AnimatedButton ref={primary} className="btn-cta fs-invite-go" onClick={goFullscreen} disabled={busy}>
                  <Icon name="expand" size={30} stroke={2.6} />
                  เปิดเต็มหน้าจอ
                </AnimatedButton>
                <AnimatedButton className="fs-invite-cancel" onClick={cancel} disabled={busy}>
                  ยกเลิก
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="fs-toast-wrap" role="status" aria-live="polite">
        {notice && (
          <div className="fs-invite-scale fs-toast-scale" style={{ transform: `scale(${scale})` }}>
            <div ref={toast} className="fs-toast">
              {notice}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
