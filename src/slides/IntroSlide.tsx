import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { INTRO } from '../data/scenarios';
import { AnimatedButton } from '../components/AnimatedButton';
import { KineticText } from '../components/KineticText';
import { Icon } from '../components/Icon';
import { enter } from '../animations/motionPresets';
import { sfx } from '../audio/soundEngine';

function VectorHero({ reduced }: { reduced: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  useLayoutEffect(() => {
    const svg = ref.current!;
    const q = (s: string) => svg.querySelector(s) as SVGElement;
    const F = q('.vh-f'), Fh = q('.vh-fh'), drop = q('.vh-drop'), arc = q('.vh-arc'), headF = q('.vh-headf'), headH = q('.vh-headh');
    const wT = q('.vh-w');
    const O = { x: 190, y: 250 };
    const L = 230;
    const st = { th: 37 };
    const draw = () => {
      const a = (st.th * Math.PI) / 180;
      const tx = O.x + L * Math.cos(a);
      const ty = O.y - L * Math.sin(a);
      const hx = O.x + L * Math.cos(a);
      F.setAttribute('d', `M${O.x},${O.y} L${tx},${ty}`);
      headF.setAttribute('transform', `translate(${tx} ${ty}) rotate(${-st.th})`);
      Fh.setAttribute('d', `M${O.x},${O.y} L${Math.max(O.x + 1, hx)},${O.y}`);
      headH.setAttribute('transform', `translate(${hx} ${O.y})`);
      headH.setAttribute('opacity', st.th > 86 ? '0' : '1');
      drop.setAttribute('d', `M${tx},${ty} L${hx},${O.y}`);
      const r = 62;
      arc.setAttribute('d', `M${O.x + r},${O.y} A${r},${r} 0 0 0 ${O.x + r * Math.cos(a)},${O.y - r * Math.sin(a)}`);
      const c = Math.cos(a);
      wT.textContent = c > 0.02 ? 'W > 0' : 'W = 0';
      wT.setAttribute('class', `vh-w ${c > 0.02 ? 'pos' : 'zero'}`);
    };
    draw();
    if (reduced) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6, delay: 1.2 });
    tl.to(st, { th: 0, duration: 1.6, ease: 'power2.inOut', onUpdate: draw })
      .to(st, { th: 90, duration: 2.4, ease: 'power2.inOut', onUpdate: draw }, '+=0.8')
      .to(st, { th: 37, duration: 1.6, ease: 'power2.inOut', onUpdate: draw }, '+=1.0');
    const box = gsap.to(svg.querySelector('.vh-box'), { x: 10, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    return () => {
      tl.kill();
      box.kill();
    };
  }, [reduced]);

  return (
    <svg ref={ref} className="vector-hero" viewBox="0 0 560 420" aria-hidden="true">
      <defs>
        <pattern id="vh-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke="#d8cfc0" strokeWidth="3" />
        </pattern>
      </defs>
      <rect x="0" y="300" width="560" height="26" fill="url(#vh-hatch)" />
      <line x1="0" y1="300" x2="560" y2="300" stroke="#1b1a2e" strokeWidth="4" />
      <g className="vh-box">
        <rect x="120" y="200" width="140" height="100" rx="10" fill="#f8c35a" stroke="#1b1a2e" strokeWidth="4" />
        <path d="M120 236h140" stroke="#1b1a2e" strokeWidth="3" opacity=".25" />
      </g>
      <path className="vh-drop" stroke="#1b1a2e" strokeWidth="2.5" strokeDasharray="5 7" fill="none" />
      <path className="vh-arc" stroke="#1b1a2e" strokeWidth="3" fill="none" />
      <path className="vh-fh" stroke="#ff5a36" strokeWidth="7" strokeLinecap="round" opacity=".55" />
      <g className="vh-headh"><path d="M0,0 l-16,-10 v20z" fill="#ff5a36" opacity=".55" /></g>
      <path className="vh-f" stroke="#ff5a36" strokeWidth="9" strokeLinecap="round" />
      <g className="vh-headf"><path d="M6,0 l-24,-14 v28z" fill="#ff5a36" /></g>
      <circle cx="190" cy="250" r="8" fill="#1b1a2e" />
      <path d="M150 358 H470" stroke="#1b1a2e" strokeWidth="6" strokeLinecap="round" />
      <path d="M470 358 l-16 -10 v20z" fill="#1b1a2e" />
      <text x="310" y="398" className="vh-label" textAnchor="middle">การกระจัด s</text>
      <text x="420" y="60" className="vh-label vh-flabel">แรง F</text>
      <g className="vh-read" transform="translate(22 64)">
        <text className="vh-w pos" y="96">W &gt; 0</text>
      </g>
    </svg>
  );
}

export function IntroSlide({ onStart, reduced }: { onStart: () => void; reduced: boolean }) {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const tl = enter(root.current!, { delay: 0.1, reduced });
    return () => {
      tl.kill();
    };
  }, [reduced]);

  return (
    <section ref={root} className="slide intro-slide" aria-label="หน้าแรก">
      <div className="intro-grid-bg" aria-hidden="true" />
      <div className="intro-left">
        <div className="intro-kicker" data-enter="left" data-at="0">
          <span className="dot" /> วิทยาศาสตร์พื้นฐาน ม.2 · งานและพลังงาน​
        </div>
        <KineticText as="h1" className="intro-title" text={INTRO.title} at={0.12} />
        <KineticText as="p" className="intro-sub" text={INTRO.subtitle} at={0.45} />
        <p className="intro-secondary" data-enter data-at="0.75">
          {INTRO.secondary}
        </p>
        <div className="intro-cta-row" data-enter="pop" data-at="0.95">
          <AnimatedButton
            className="btn-cta"
            sound={false}
            onClick={() => {
              sfx.next();
              // first tap of the lesson also unlocks audio: give the sounds a moment to decode
              void sfx.whenReady(450).then(onStart);
            }}
          >
            <span>{INTRO.cta}</span>
            <Icon name="right" size={30} stroke={3} />
          </AnimatedButton>
        </div>
      </div>
      <div className="intro-right" data-enter="plate" data-at="0.3">
        <div className="intro-card">
          <div className="intro-formula">
            <span className="math">W</span> = <span className="math">F</span>
            <span className="math">s</span> cos<span className="math">θ</span>
          </div>
          <VectorHero reduced={reduced} />
        </div>
      </div>
    </section>
  );
}
