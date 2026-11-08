import { gsap } from 'gsap';
import { Rig } from '../rig/bone';
import { createRuntime } from '../rig/runtime';
import { sfx, panAt, type LoopVoice } from '../audio/soundEngine';
import { Ground, Label, type SceneModule } from './common';

/*
 * Scene 3 — soft Japanese educational illustration: thin brown outlines,
 * muted warm colours. A seated woman on a video call. Everything stays put:
 * time passes (the clock spins), but no object is displaced.
 */
const OUT = '#7a5038';
const SW = 2;
const ROOT = { x: 660, y: 432 };

const HAIR = '#8a5a3b';
const HAIR_S = '#6e452c';
const SKIN = '#fbe6d6';
const SHIRT = '#dcdee3';
const SHIRT_S = '#c3c6cd';
const PANTS = '#f2c230';
const PANTS_S = '#d9a91a';

function Art({ uid }: { uid: string }) {
  const screen = `${uid}-screen`;
  return (
    <>
      <defs>
        <linearGradient id={screen} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#36425a" />
          <stop offset="1" stopColor="#222a3a" />
        </linearGradient>
      </defs>

      {/* soft window grid backdrop */}
      <g opacity={0.5}>
        <rect x={610} y={92} width={250} height={170} rx={10} fill="#eef5f4" stroke="#cfe0de" strokeWidth={3} />
        <path d="M735,92 V262 M610,177 H860" stroke="#cfe0de" strokeWidth={3} />
        <path d="M630,240 Q690,214 748,236 T850,226" stroke="#d7e9e6" strokeWidth={5} fill="none" />
      </g>

      {/* wall clock — time passes, positions don't change */}
      <g transform="translate(320 168)">
        <circle r={46} fill="#fffdf8" stroke={OUT} strokeWidth={3} />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={0} y1={-38} x2={0} y2={i % 3 ? -34 : -30} stroke={OUT} strokeWidth={i % 3 ? 2 : 3} transform={`rotate(${i * 30})`} strokeLinecap="round" />
        ))}
        <g data-bone="d-hour">
          <line x1={0} y1={4} x2={0} y2={-20} stroke="#4a3426" strokeWidth={4.5} strokeLinecap="round" />
        </g>
        <g data-bone="d-min">
          <line x1={0} y1={6} x2={0} y2={-32} stroke="#4a3426" strokeWidth={3} strokeLinecap="round" />
        </g>
        <circle r={4} fill="#e2574c" />
      </g>

      <Ground ticks={false} color="#3b2b22" />

      {/* desk: thin brown lines, as in the worksheet */}
      <g stroke="#8b5a36" strokeLinecap="round">
        <line x1={196} y1={380} x2={582} y2={380} strokeWidth={4} />
        <line x1={196} y1={388} x2={582} y2={388} strokeWidth={2} />
        <line x1={214} y1={388} x2={214} y2={520} strokeWidth={4} />
        <line x1={564} y1={388} x2={564} y2={520} strokeWidth={4} />
        <line x1={226} y1={388} x2={226} y2={470} strokeWidth={2} opacity={0.6} />
      </g>

      {/* turquoise mug + steam */}
      <g>
        <g className="steam" stroke="#b9d8d6" strokeWidth={3} fill="none" strokeLinecap="round">
          <path data-steam="0" d="M250,328 Q242,314 250,300 T250,272" />
          <path data-steam="1" d="M262,326 Q270,312 262,298 T262,270" />
        </g>
        <path d="M238,334 Q230,334 228,346 Q228,360 240,362" fill="none" stroke={OUT} strokeWidth={4} />
        <rect x={238} y={332} width={38} height={46} rx={6} fill="#3bb3b0" stroke={OUT} strokeWidth={SW} />
        <ellipse cx={257} cy={333} rx={19} ry={4.5} fill="#2c8f8c" stroke={OUT} strokeWidth={SW} />
        <path d="M266,340 V370" stroke="#7fd3d0" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
      </g>

      {/* laptop, 3/4 view, screen facing her */}
      <g>
        <path d="M380,372 L478,368 L516,379 L398,380 Z" fill="#b6bbc4" stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M392,375 L476,372 L500,378 L404,378 Z" fill="#9ea4ae" />
        <path d="M382,372 L368,282 L470,268 L478,368 Z" fill="#c9ccd3" stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M388,362 L377,290 L463,278 L470,359 Z" fill={`url(#${screen})`} />
        {/* video call tile */}
        <g>
          <path d="M398,348 L390,298 L452,290 L458,342 Z" fill="#e3eef6" />
          <circle cx={424} cy={312} r={10} fill="#f2d2bc" />
          <path d="M412,308 Q424,292 436,306 Q432,298 424,298 Q414,298 412,308 Z" fill="#3a3030" />
          <path d="M406,342 Q408,324 424,323 Q440,322 444,340 Z" fill="#5b7fc4" />
          <g data-bone="d-callMouth" data-pivot="424 317">
            <ellipse cx={424} cy={317} rx={3} ry={1.6} fill="#a2483e" />
          </g>
          <g data-bone="d-rec">
            <circle cx={447} cy={298} r={3.5} fill="#3ccf6e" />
          </g>
          <g data-bone="d-bars">
            {[0, 1, 2].map((i) => (
              <rect key={i} className="callbar" x={400 + i * 5} y={336 - (i === 1 ? 8 : 5)} width={3} height={i === 1 ? 8 : 5} rx={1} fill="#3ccf6e" />
            ))}
          </g>
        </g>
        <path d="M383,286 L466,274" stroke="#ffffff" strokeWidth={2} opacity={0.35} />
      </g>

      {/* pale blue notepad & stationery */}
      <g>
        <path d="M512,374 L560,372 L572,378 L522,380 Z" fill="#cfe6f5" stroke={OUT} strokeWidth={1.6} strokeLinejoin="round" />
        <path d="M520,376 L560,374.5" stroke="#9cc4df" strokeWidth={1.2} />
        <g data-bone="d-pencil" data-pivot="548 368">
          <rect x={528} y={365} width={34} height={5} rx={2} fill="#f2c230" stroke={OUT} strokeWidth={1.2} transform="rotate(-4 545 367)" />
          <path d="M562,364.5 L570,366 L562,370" fill="#f7dcc0" stroke={OUT} strokeWidth={1.2} transform="rotate(-4 545 367)" />
        </g>
        <rect x={304} y={372} width={16} height={8} rx={2} fill="#f39bb0" stroke={OUT} strokeWidth={1.4} />
        <rect x={326} y={374} width={30} height={6} rx={2} fill="#9bd0c4" stroke={OUT} strokeWidth={1.4} />
      </g>

      {/* chair */}
      <g transform={`translate(${ROOT.x} ${ROOT.y})`} stroke={OUT} strokeWidth={SW} strokeLinejoin="round">
        <path d="M-34,10 L-38,88 M48,10 L52,88" stroke="#7a4b2c" strokeWidth={5} strokeLinecap="round" />
        <path d="M60,4 L66,-112" stroke="#7a4b2c" strokeWidth={6} strokeLinecap="round" />
        <rect x={52} y={-118} width={26} height={70} rx={8} fill="#8b5a36" />
        <rect x={-44} y={0} width={104} height={12} rx={5} fill="#9a6640" />
      </g>

      {/* woman */}
      <g data-bone="d-root">
        <g data-bone="d-legF">
          <path d="M-4,-12 L-60,-12 Q-70,-8 -66,6 L-70,78" stroke={PANTS_S} strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M-86,80 Q-88,90 -78,90 L-60,90 Q-54,88 -56,78 Z" fill="#8f7766" stroke={OUT} strokeWidth={SW} />
        </g>
        <g data-bone="d-legN">
          <path d="M8,-8 L-54,-6 Q-64,-2 -62,10 L-62,78" stroke={OUT} strokeWidth={27} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M8,-8 L-54,-6 Q-64,-2 -62,10 L-62,78" stroke={PANTS} strokeWidth={23} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M-20,-14 L-50,-13" stroke="#f7d76a" strokeWidth={4} strokeLinecap="round" />
          <path d="M-80,80 Q-82,92 -70,92 L-48,92 Q-42,90 -45,78 Z" fill="#a38b78" stroke={OUT} strokeWidth={SW} />
        </g>
        <g data-bone="d-torso" data-pivot="6 -6">
          <g data-bone="d-armF" data-pivot="0 -84">
            <path d="M0,-84 L-6,-48" stroke={SHIRT_S} strokeWidth={17} strokeLinecap="round" />
            <g data-bone="d-foreF" data-pivot="-6 -48">
              <path d="M-6,-48 L-30,-66" stroke={SHIRT_S} strokeWidth={14} strokeLinecap="round" />
              <circle cx={-34} cy={-70} r={7} fill="#f1d3c0" stroke={OUT} strokeWidth={1.6} />
            </g>
          </g>
          <path d="M-22,-90 Q-30,-50 -20,-6 L22,-6 Q26,-50 18,-92 Q0,-104 -22,-90 Z" fill={SHIRT} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M8,-96 Q22,-60 20,-8 L12,-8 Q14,-56 2,-98 Z" fill={SHIRT_S} opacity={0.8} />
          <path d="M-12,-96 Q-4,-88 6,-96" fill="none" stroke={OUT} strokeWidth={1.6} />
          <g data-bone="d-head" data-pivot="-4 -98">
            <rect x={-10} y={-106} width={12} height={12} fill="#f1d3c0" />
            <g data-bone="d-pony" data-pivot="22 -122">
              <path d="M20,-126 Q44,-122 46,-100 Q40,-106 34,-104 Q36,-112 20,-114 Z" fill={HAIR} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
            </g>
            <ellipse cx={-10} cy={-136} rx={32} ry={33} fill={SKIN} stroke={OUT} strokeWidth={SW} />
            <path d="M-42,-140 Q-46,-172 -12,-174 Q22,-174 24,-138 Q24,-118 18,-108 Q12,-124 4,-130 Q-6,-150 -22,-146 Q-34,-150 -42,-140 Z" fill={HAIR} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
            <path d="M-24,-164 Q-6,-170 10,-160" stroke="#a87553" strokeWidth={3} fill="none" strokeLinecap="round" />
            <rect x={15} y={-128} width={9} height={7} rx={2} fill="#e5776b" stroke={OUT} strokeWidth={1.4} />
            <ellipse cx={4} cy={-128} rx={5} ry={7} fill={SKIN} stroke={OUT} strokeWidth={1.6} />
            <g data-bone="d-eyes" data-pivot="-26 -134">
              <ellipse cx={-30} cy={-134} rx={2.6} ry={3.8} fill="#2a1d18" />
              <ellipse cx={-15} cy={-134} rx={2.6} ry={3.8} fill="#2a1d18" />
              <circle cx={-29.2} cy={-135.4} r={0.9} fill="#fff" />
              <circle cx={-14.2} cy={-135.4} r={0.9} fill="#fff" />
            </g>
            <path d="M-35,-143 Q-31,-145 -27,-143 M-19,-143 Q-15,-145 -11,-143" stroke={HAIR_S} strokeWidth={1.6} fill="none" strokeLinecap="round" />
            <ellipse cx={-36} cy={-123} rx={6} ry={3.6} fill="#f3a5a0" opacity={0.75} />
            <ellipse cx={-8} cy={-123} rx={6} ry={3.6} fill="#f3a5a0" opacity={0.75} />
            <g data-bone="d-mouth" data-pivot="-26 -116">
              <ellipse cx={-26} cy={-116} rx={2.6} ry={2.2} fill="#c8604f" />
            </g>
          </g>
          <g data-bone="d-armN" data-pivot="0 -84">
            <path d="M0,-84 L-4,-46" stroke={OUT} strokeWidth={19} strokeLinecap="round" />
            <path d="M0,-84 L-4,-46" stroke={SHIRT} strokeWidth={15.5} strokeLinecap="round" />
            <g data-bone="d-foreN" data-pivot="-4 -46">
              <path d="M-4,-46 L-26,-62" stroke={OUT} strokeWidth={15} strokeLinecap="round" />
              <path d="M-4,-46 L-26,-62" stroke={SHIRT} strokeWidth={11.5} strokeLinecap="round" />
              <circle cx={-30} cy={-66} r={7} fill={SKIN} stroke={OUT} strokeWidth={1.6} />
            </g>
          </g>
        </g>
        {/* little red emphasis lines */}
        <g data-bone="d-emph" data-pivot="-40 -176">
          <path d="M-62,-170 L-74,-182 M-46,-184 L-50,-200 M-28,-186 L-22,-202" stroke="#e2574c" strokeWidth={3.5} strokeLinecap="round" />
        </g>
      </g>

      <g className="phys">
        <rect className="phys-line" data-dash="8 8" x={560} y={250} width={220} height={276} rx={18} fill="none" stroke="#1d625e" strokeWidth={3} />
        <circle className="phys-head" cx={660} cy={528} r={8} fill="#1d625e" />
        <Label x={660} y={222} text="ตำแหน่งไม่เปลี่ยน: s = 0" color="#1d625e" filled />
        <Label x={384} y={168} text="เวลาผ่านไป" color="#7a5038" anchor="start" />
      </g>
    </>
  );
}

function createRig(svg: SVGSVGElement, opts: Parameters<SceneModule['createRig']>[1]) {
  const rig = new Rig(svg);
  const B = (n: string) => rig.b(n);
  const root = B('d-root'),
    torso = B('d-torso'),
    head = B('d-head'),
    eyes = B('d-eyes'),
    mouth = B('d-mouth'),
    pony = B('d-pony'),
    armN = B('d-armN'),
    foreN = B('d-foreN'),
    armF = B('d-armF'),
    foreF = B('d-foreF'),
    emph = B('d-emph'),
    hour = B('d-hour'),
    min = B('d-min'),
    callMouth = B('d-callMouth'),
    rec = B('d-rec'),
    pencil = B('d-pencil');
  const steam = Array.from(svg.querySelectorAll<SVGPathElement>('[data-steam]'));
  const bars = Array.from(svg.querySelectorAll<SVGRectElement>('.callbar'));
  root.x = ROOT.x;
  root.y = ROOT.y;

  const pose = { look: 0, nod: 0, surprise: 0, hands: 0, clock: 0, talk: 0, settle: 0 };
  let room: LoopVoice | null = null;
  const PAN_DESK = panAt(560); // laptop / mug
  const PAN_HER = panAt(ROOT.x);

  return createRuntime(
    svg,
    {
      pose,
      ambient: { blink: 1, breathe: 0, t: 0, eyeX: 0, rec: 1 },
      build(tl, P, ctx) {
        // a quiet office: soft room tone under everything
        ctx.cue(tl, 0.0, () => {
          room = sfx.loop('loop_office', { bus: 'amb', gain: 0.55, fadeIn: 0.8, send: 0 });
          sfx.play('mouse', { gain: 0.42, pan: PAN_DESK, send: 0.04 });
        });
        // she finishes a line of notes before the call picks up
        ctx.cue(tl, 0.32, () => sfx.play('typing', { gain: 0.3, pan: PAN_DESK, duration: 0.8, lowpass: 7000, send: 0.04 }));
        ctx.cue(tl, 0.75, () => sfx.play('chair', { gain: 0.22, pan: PAN_HER, duration: 0.7, lowpass: 4000 }));
        tl.to(P, { look: 1, duration: 0.7, ease: 'power2.inOut' }, 0);
        tl.to(P, { clock: 1, duration: 5.2, ease: 'power1.inOut' }, 0.2);
        tl.to(P, { talk: 1, duration: 0.3 }, 0.5).to(P, { talk: 0, duration: 0.4 }, 4.6);
        // two attentive nods
        tl.to(P, { nod: 1, duration: 0.28, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 1.1);
        // surprised beat
        ctx.cue(tl, 1.25, () => sfx.play('key', { gain: 0.26, pan: PAN_DESK }));
        ctx.cue(tl, 1.42, () => sfx.play('key', { gain: 0.22, pan: PAN_DESK }));
        // surprised beat: she sits back, the chair answers, sleeves rustle
        ctx.cue(tl, 2.6, () => {
          sfx.play('chair', { gain: 0.34, pan: PAN_HER, duration: 0.9 });
          sfx.play('cloth', { gain: 0.22, pan: PAN_HER, delay: 0.04 });
        });
        ctx.cue(tl, 3.7, () => sfx.play('mug', { gain: 0.32, pan: panAt(420), send: 0.1 }));
        tl.to(P, { surprise: 1, hands: 1, duration: 0.35, ease: 'back.out(2.2)' }, 2.6);
        tl.to(P, { surprise: 0.25, duration: 0.9, ease: 'power2.inOut' }, 3.5);
        tl.to(P, { hands: 0.4, duration: 0.8, ease: 'power2.inOut' }, 3.6);
        ctx.cue(tl, 4.3, () => sfx.play('mouse', { gain: 0.36, pan: PAN_DESK, send: 0.04 }));
        ctx.cue(tl, 4.65, () => sfx.play('paper', { gain: 0.3, pan: panAt(610), duration: 0.8 }));
        [4.95, 5.08, 5.19, 5.36].forEach((t) => ctx.cue(tl, t, () => sfx.play('key', { gain: 0.2, pan: PAN_DESK })));
        ctx.cue(tl, 5.55, () => {
          room?.stop(1.4);
          room = null;
        });
        tl.to(P, { settle: 1, look: 0.6, duration: 0.8, ease: 'power2.inOut' }, 4.6);
        tl.to({}, { duration: 0.1 }, 5.6);
      },
      buildAmbient(A) {
        const blink = gsap.timeline({ repeat: -1, repeatDelay: 2.4 }).to(A, { blink: 0.1, duration: 0.07 }).to(A, { blink: 1, duration: 0.11 }).to(A, { blink: 1, duration: 1.3 }).to(A, { blink: 0.1, duration: 0.07 }).to(A, { blink: 1, duration: 0.11 });
        const breathe = gsap.to(A, { breathe: 1, duration: 2.1, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        const t = gsap.to(A, { t: 1000, duration: 1000, ease: 'none', repeat: -1 });
        const eye = gsap.timeline({ repeat: -1 }).to(A, { eyeX: -1.6, duration: 0.25, delay: 1.8 }).to(A, { eyeX: 0.6, duration: 0.3, delay: 1.4 }).to(A, { eyeX: 0, duration: 0.25, delay: 1.2 });
        const recBlink = gsap.to(A, { rec: 0.15, duration: 0.6, ease: 'steps(1)', yoyo: true, repeat: -1 });
        return [blink, breathe, t, eye, recBlink];
      },
      onStop() {
        room?.stop(0.3);
        room = null;
      },
      render(P, A) {
        torso.r = -4 - P.look * 2 + P.surprise * 2;
        torso.sy = 1 + A.breathe * 0.016;
        torso.y = -A.breathe * 0.6;
        head.r = -P.look * 3 + P.nod * 6 + P.surprise * 5 + Math.sin(A.t * 0.9) * 0.8;
        eyes.sy = A.blink * (1 + P.surprise * 0.25);
        eyes.sx = 1 + P.surprise * 0.15;
        eyes.x = A.eyeX - P.look * 0.8;
        mouth.sy = 1 + P.surprise * 0.8;
        mouth.sx = 1 + P.surprise * 0.2;
        pony.r = Math.sin(A.t * 1.6) * 2 + P.nod * -5 + P.surprise * -6;
        armN.r = -P.hands * 10 + A.breathe * 1;
        foreN.r = -P.hands * 16;
        armF.r = -P.hands * 8;
        foreF.r = -P.hands * 14;
        emph.sx = emph.sy = 0.55 + P.surprise * 0.6 + Math.sin(A.t * 2.4) * 0.04;
        emph.el!.setAttribute('opacity', String(0.55 + P.surprise * 0.45));
        min.r = P.clock * 720;
        hour.r = 60 + P.clock * 60;
        callMouth.sy = 1 + (P.talk > 0 ? Math.abs(Math.sin(A.t * 13)) * 2.2 * P.talk : 0);
        rec.el!.setAttribute('opacity', String(A.rec));
        bars.forEach((b, i) => b.setAttribute('transform', `translate(0 ${-(Math.abs(Math.sin(A.t * 9 + i * 1.3)) * 4 * P.talk).toFixed(2)})`));
        pencil.r = Math.sin(A.t * 0.7) * 0.6;
        steam.forEach((s, i) => {
          s.setAttribute('stroke-dasharray', '18 14');
          s.setAttribute('stroke-dashoffset', String(-(A.t * 14 + i * 9) % 32));
          s.setAttribute('opacity', String(0.55 + Math.sin(A.t * 1.3 + i) * 0.25));
        });
        rig.apply();
      },
    },
    opts,
  );
}

export const DeskScene: SceneModule = {
  Art,
  createRig,
  focus: [170, 80, 660, 470],
  alt: 'หญิงสาวผมหางม้าเสื้อเทากางเกงเหลือง นั่งบนเก้าอี้หน้าโต๊ะที่มีแล็ปท็อปประชุมออนไลน์ แก้วน้ำสีเขียวฟ้าและกระดาษโน้ต ตัวเธอและเก้าอี้อยู่ที่เดิมตลอด',
};
