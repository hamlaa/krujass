import { gsap } from 'gsap';
import { Rig, ik2, setWorldAngle, lerp, smooth, DEG } from '../rig/bone';
import { footAt, bobAt, contactsBetween } from '../rig/gait';
import { createRuntime } from '../rig/runtime';
import { sfx, panAt, type LoopVoice } from '../audio/soundEngine';
import { Arrow, Ground, StartMarker, GROUND, type SceneModule } from './common';

/*
 * Scene 5 — soft fashion-cartoon with painterly gradient shading.
 * Beanie, oversized dark-brown coat, light skirt, tall brown boots,
 * pulling a bright pink roller suitcase to the RIGHT.
 */
const OUT = '#3d2a22';
const SW = 1.6;
const HX0 = 350;
const STRIDE = 128;
const PHASE_END = 2.8;
const CAM_END = 16;
const TILT = 38;
const PIVOT = { x: -4, y: -9 };
const GRIP = { x: -9, y: -167 };
const CASE_BEHIND = 160; // wheel axle behind the hips

function gripOffset(tilt: number) {
  const a = tilt / DEG;
  const dx = GRIP.x - PIVOT.x;
  const dy = GRIP.y - PIVOT.y;
  return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
}
const FINAL_WHEEL = HX0 - CASE_BEHIND + STRIDE * PHASE_END;
const G_OFF = gripOffset(TILT);
const FINAL_GRIP = { x: FINAL_WHEEL + G_OFF.x, y: GROUND - 9 + G_OFF.y };
const PULL_ANGLE = 40; // handle-to-shoulder direction above horizontal
const INSET = { x: 140, y: 190, w: 330, h: 150 };
const IO = { x: INSET.x + 40, y: INSET.y + 128 };

function Leg({ id, far, uid }: { id: string; far?: boolean; uid: string }) {
  return (
    <g data-bone={`p-thigh${id}`} data-pivot="0 -104">
      <rect x={-9} y={-108} width={18} height={56} rx={8.5} fill={far ? '#e3c4b4' : '#f3d9cb'} stroke={OUT} strokeWidth={SW} />
      <g data-bone={`p-shin${id}`} data-pivot="0 -56">
        <path d="M-9,-62 L9,-62 L8,-10 L-8,-10 Z" fill={far ? '#5e3920' : `url(#${uid}-boot)`} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M-9.5,-62 L9.5,-62 L9.5,-56 L-9.5,-56 Z" fill={far ? '#4d2e19' : '#8c5733'} stroke={OUT} strokeWidth={SW} />
        <g data-bone={`p-foot${id}`} data-pivot="0 -10">
          <path d="M-9,-14 L8,-14 Q24,-12 26,-4 Q27,0 22,0 L-6,0 L-9,-2 Z" fill={far ? '#5e3920' : '#7a4a2b'} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
          <rect x={-9} y={-6} width={7} height={6} fill="#3b2416" />
        </g>
      </g>
    </g>
  );
}

function Art({ uid }: { uid: string }) {
  const coat = `${uid}-coat`;
  const hair = `${uid}-hair`;
  const pink = `${uid}-pink`;
  const tilt = gripOffset(TILT);
  const fx = Math.cos(PULL_ANGLE / DEG) * 120;
  const fy = -Math.sin(PULL_ANGLE / DEG) * 120;
  void tilt;
  return (
    <>
      <defs>
        <linearGradient id={coat} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stopColor="#4d382d" />
          <stop offset="0.55" stopColor="#3b2a22" />
          <stop offset="1" stopColor="#271a14" />
        </linearGradient>
        <radialGradient id={hair} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#efd6a6" />
          <stop offset="0.6" stopColor="#d7b27a" />
          <stop offset="1" stopColor="#b08a55" />
        </radialGradient>
        <linearGradient id={pink} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8cbd" />
          <stop offset="0.5" stopColor="#ff5fa2" />
          <stop offset="1" stopColor="#e0468a" />
        </linearGradient>
        <linearGradient id={`${uid}-boot`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9a6640" />
          <stop offset="0.6" stopColor="#7a4a2b" />
          <stop offset="1" stopColor="#5e3920" />
        </linearGradient>
      </defs>

      {/* gentle snow (screen space) */}
      <g className="snow">
        {Array.from({ length: 12 }, (_, i) => (
          <circle key={i} data-snow={i} r={2 + (i % 3)} fill="#dfe3ee" opacity={0.8} />
        ))}
      </g>

      <g data-bone="world" data-pivot="440 400">
        {/* curved travel-path motif */}
        <g data-bone="far" opacity={0.4} fill="none" stroke="#f3c3d8" strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round">
          <path d="M-400,300 Q0,180 400,290 T1200,270 T2000,280" />
          <path d="M-300,380 Q100,300 500,370 T1300,350 T2100,360" />
        </g>
        <Ground />
        <StartMarker x={HX0 - CASE_BEHIND - 62} height={220} anchor="start" />

        {/* ---------------- SUITCASE ---------------- */}
        <g data-bone="p-case" data-pivot={`${PIVOT.x} ${PIVOT.y}`}>
          <circle cx={-10} cy={-11} r={8} fill="#1d1d22" />
          <path d="M-62,-104 Q-62,-114 -52,-114 L-10,-114 Q0,-114 0,-104 L0,-18 Q0,-8 -10,-8 L-52,-8 Q-62,-8 -62,-18 Z" fill={`url(#${pink})`} stroke={OUT} strokeWidth={2} />
          <path d="M-46,-110 L-46,-12 M-18,-110 L-18,-12" stroke="#d63f80" strokeWidth={3} opacity={0.85} />
          <path d="M-58,-100 Q-58,-108 -50,-110" stroke="#ffc1dc" strokeWidth={3} fill="none" strokeLinecap="round" />
          <path d="M-62,-26 Q-62,-8 -50,-8 L-44,-8 L-44,-14 L-56,-14 L-56,-26 Z" fill="#3a2a34" />
          <path d="M0,-96 Q0,-114 -14,-114 L-14,-108 L-6,-108 L-6,-96 Z" fill="#3a2a34" />
          <rect x={-40} y={-70} width={14} height={22} rx={4} fill="none" stroke="#b8336f" strokeWidth={2.5} />
          {/* telescoping handle */}
          <rect x={-12} y={-142} width={6} height={30} fill="#2a2a30" />
          <g data-bone="p-handle">
            <rect x={-11} y={-166} width={4} height={26} fill="#3a3a42" />
            <rect x={-18} y={-172} width={18} height={10} rx={5} fill="#1d1d22" stroke={OUT} strokeWidth={1.2} />
          </g>
          <g data-bone="p-wheel" data-pivot={`${PIVOT.x} ${PIVOT.y}`}>
            <circle cx={PIVOT.x} cy={PIVOT.y} r={9} fill="#2a2a2e" stroke={OUT} strokeWidth={1.5} />
            <line x1={PIVOT.x - 6} y1={PIVOT.y} x2={PIVOT.x + 6} y2={PIVOT.y} stroke="#7a7a84" strokeWidth={2} />
            <circle cx={PIVOT.x} cy={PIVOT.y} r={2.5} fill="#9a9aa4" />
          </g>
        </g>
        <ellipse data-shadow="case" cx={0} cy={GROUND + 2} rx={38} ry={4} fill="rgba(60,30,40,0.16)" />

        {/* ---------------- WOMAN ---------------- */}
        <g data-bone="p-root">
          <ellipse cx={0} cy={2} rx={40} ry={5} fill="rgba(40,25,20,0.14)" />
          <g data-bone="p-hips">
            <g data-bone="p-torsoB" data-pivot="0 -104">
              <g data-bone="p-hairB" data-pivot="6 -236">
                <path d="M-26,-246 Q-34,-212 -30,-192 Q-20,-184 -12,-190 Q-6,-200 6,-198 L28,-198 Q40,-206 38,-236 Z" fill="#b8925c" stroke={OUT} strokeWidth={SW} />
              </g>
              <g data-bone="p-upF" data-pivot="2 -184">
                <rect x={-9} y={-190} width={20} height={48} rx={9} fill="#2a1d17" stroke={OUT} strokeWidth={SW} />
                <g data-bone="p-foreF" data-pivot="2 -146">
                  <rect x={-7} y={-150} width={17} height={42} rx={8} fill="#2a1d17" stroke={OUT} strokeWidth={SW} />
                  <circle cx={2} cy={-106} r={6.5} fill="#ecd0c2" stroke={OUT} strokeWidth={SW} />
                </g>
              </g>
            </g>
            <Leg id="F" far uid={uid} />
            <Leg id="N" uid={uid} />
            <path d="M-21,-102 L23,-102 L27,-82 Q2,-76 -25,-82 Z" fill="#efe6d8" stroke={OUT} strokeWidth={SW} />
            <g data-bone="p-torso" data-pivot="0 -104">
              <g data-bone="p-hem" data-pivot="0 -124">
                <path d="M-30,-130 L30,-130 L36,-88 Q4,-80 -34,-88 Z" fill={`url(#${coat})`} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
                <path d="M4,-128 L6,-84" stroke="#1d130e" strokeWidth={2} />
              </g>
              <path d="M-26,-192 Q-36,-160 -30,-124 L30,-124 Q36,-160 26,-192 Q2,-206 -26,-192 Z" fill={`url(#${coat})`} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
              <path d="M-4,-194 Q8,-176 6,-124" stroke="#1d130e" strokeWidth={2} fill="none" />
              <path d="M-18,-198 Q-2,-182 16,-198 L14,-186 Q-2,-176 -16,-186 Z" fill="#5a4234" stroke={OUT} strokeWidth={SW} />
              <circle cx={10} cy={-164} r={2.4} fill="#7a5a44" />
              <circle cx={9} cy={-144} r={2.4} fill="#7a5a44" />
              <g data-bone="p-head" data-pivot="4 -198">
                <rect x={-2} y={-206} width={12} height={12} fill="#ecd0c2" />
                <ellipse cx={8} cy={-232} rx={31} ry={32} fill="#fbe4d8" stroke={OUT} strokeWidth={SW} />
                {/* wavy shoulder-length hair */}
                <path d="M-24,-246 Q-30,-214 -22,-196 Q-30,-190 -26,-182 Q-16,-186 -12,-194 Q-16,-214 -10,-230 Q4,-240 26,-236 Q40,-232 42,-246 Z" fill={`url(#${hair})`} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
                <path d="M30,-240 Q44,-222 38,-204 Q44,-198 40,-190 Q32,-194 32,-204 Q36,-222 26,-236 Z" fill={`url(#${hair})`} stroke={OUT} strokeWidth={SW} />
                <path d="M-18,-232 Q-20,-214 -16,-200" stroke="#f3dcb0" strokeWidth={2} fill="none" strokeLinecap="round" />
                <g data-bone="p-eyes" data-pivot="22 -230">
                  <ellipse cx={16} cy={-230} rx={4.6} ry={6.4} fill="#3a2a26" />
                  <ellipse cx={31} cy={-229} rx={4.2} ry={6} fill="#3a2a26" />
                  <circle cx={17.4} cy={-232.4} r={1.8} fill="#fff" />
                  <circle cx={32.2} cy={-231.4} r={1.6} fill="#fff" />
                </g>
                <path d="M11,-237 Q16,-240 21,-238 M27,-237 Q32,-239 36,-236" stroke="#3a2a26" strokeWidth={1.8} fill="none" strokeLinecap="round" />
                <path d="M21,-215 Q26,-211 31,-215" stroke="#b65a54" strokeWidth={2} fill="none" strokeLinecap="round" />
                <ellipse cx={10} cy={-219} rx={6} ry={3.4} fill="#f4a8a8" opacity={0.6} />
                <ellipse cx={36} cy={-219} rx={4.5} ry={3} fill="#f4a8a8" opacity={0.6} />
                {/* knitted beanie + pom-pom */}
                <path d="M-26,-246 Q-26,-288 10,-290 Q44,-288 44,-246 Z" fill="#2f2b33" stroke={OUT} strokeWidth={SW} />
                <path d="M-6,-286 Q-10,-266 -12,-248 M10,-290 L10,-248 M26,-286 Q30,-266 32,-248" stroke="#46414c" strokeWidth={2} fill="none" />
                <rect x={-28} y={-254} width={74} height={14} rx={6} fill="#3a3540" stroke={OUT} strokeWidth={SW} />
                <path d="M-20,-252 v10 M-12,-252 v10 M-4,-252 v10 M4,-252 v10 M12,-252 v10 M20,-252 v10 M28,-252 v10 M36,-252 v10" stroke="#2a262e" strokeWidth={1.6} />
                <g data-bone="p-pom" data-pivot="10 -290">
                  <circle cx={10} cy={-296} r={9} fill="#3c3742" stroke={OUT} strokeWidth={SW} />
                  <circle cx={7} cy={-299} r={3} fill="#55505c" />
                </g>
              </g>
              <g data-bone="p-upN" data-pivot="2 -184">
                <rect x={-9} y={-192} width={22} height={50} rx={10} fill={`url(#${coat})`} stroke={OUT} strokeWidth={SW} />
                <g data-bone="p-foreN" data-pivot="2 -146">
                  <rect x={-7.5} y={-150} width={19} height={42} rx={8} fill={`url(#${coat})`} stroke={OUT} strokeWidth={SW} />
                  <path d="M-7,-116 L11,-116" stroke="#5a4234" strokeWidth={4} />
                  <circle cx={2} cy={-106} r={7} fill="#fbe4d8" stroke={OUT} strokeWidth={SW} />
                </g>
              </g>
            </g>
          </g>
        </g>

        <g className="phys">
          {/* the pull acts at the grip … */}
          <Arrow x1={FINAL_GRIP.x} y1={FINAL_GRIP.y} x2={FINAL_GRIP.x + fx * 0.5} y2={FINAL_GRIP.y + fy * 0.5} color="#e2412b" width={5} head={15} label="F (แรงดึง)" lx={FINAL_GRIP.x - 18} ly={FINAL_GRIP.y - 52} anchor="end" />
          <line className="phys-line" data-dash="2 8" x1={FINAL_GRIP.x - 10} y1={FINAL_GRIP.y - 10} x2={INSET.x + INSET.w - 20} y2={INSET.y + INSET.h} stroke="#d987ad" strokeWidth={2.5} />
          {/* … and its components, drawn large in an inset */}
          <rect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} rx={18} fill="#fff" stroke="#f3c3d8" strokeWidth={3} />
          <text x={INSET.x + 18} y={INSET.y + 30} fontSize={18} fontWeight={600} fill="#9c1f58" style={{ fontFamily: 'var(--font-display)' }}>แรงดึงที่มือกระทำต่อกระเป๋า</text>
          <line className="phys-line" data-dash="5 7" x1={IO.x + fx * 0.78} y1={IO.y + fy * 0.78} x2={IO.x + fx * 0.78} y2={IO.y} stroke="#1b1a2e" strokeWidth={2} />
          <Arrow x1={IO.x} y1={IO.y} x2={IO.x + fx * 0.78} y2={IO.y + fy * 0.78} color="#e2412b" width={5} head={15} label="F" lx={IO.x + fx * 0.78 + 22} ly={IO.y + fy * 0.78 - 4} labelSize={19} />
          <Arrow x1={IO.x} y1={IO.y} x2={IO.x + fx * 0.78} y2={IO.y} color="#9c1f58" width={5} head={15} label="F cosθ (ไปข้างหน้า)" lx={IO.x + fx * 0.78 + 14} ly={IO.y} anchor="start" labelSize={17} />
          <path className="phys-line" d={`M${IO.x + 36},${IO.y} A36,36 0 0 0 ${IO.x + 36 * Math.cos(PULL_ANGLE / DEG)},${IO.y - 36 * Math.sin(PULL_ANGLE / DEG)}`} stroke="#1b1a2e" strokeWidth={2.5} fill="none" />
          <text x={IO.x + 44} y={IO.y - 12} fontSize={18} fill="#1b1a2e" style={{ fontFamily: 'var(--font-math)', fontStyle: 'italic' }}>θ</text>
          <Arrow x1={HX0 - CASE_BEHIND - 62} y1={GROUND + 84} x2={FINAL_WHEEL - 62} y2={GROUND + 84} color="#1f7a3d" label="s (การกระจัด)" ly={GROUND + 118} />
        </g>
      </g>
    </>
  );
}

function createRig(svg: SVGSVGElement, opts: Parameters<SceneModule['createRig']>[1]) {
  const rig = new Rig(svg);
  const B = (n: string) => rig.b(n);
  const world = B('world'),
    far = B('far'),
    root = B('p-root'),
    hips = B('p-hips'),
    torso = B('p-torso'),
    torsoB = B('p-torsoB'),
    head = B('p-head'),
    eyes = B('p-eyes'),
    hem = B('p-hem'),
    hairB = B('p-hairB'),
    pom = B('p-pom'),
    sc = B('p-case'),
    wheel = B('p-wheel'),
    handle = B('p-handle');
  const legs = (['F', 'N'] as const).map((k) => ({ th: B(`p-thigh${k}`), sh: B(`p-shin${k}`), ft: B(`p-foot${k}`), off: k === 'N' ? 0 : 0.5 }));
  const armN = { up: B('p-upN'), lo: B('p-foreN') };
  const armF = { up: B('p-upF'), lo: B('p-foreF') };
  const caseShadow = svg.querySelector<SVGEllipseElement>('[data-shadow="case"]')!;
  const snow = Array.from(svg.querySelectorAll<SVGCircleElement>('[data-snow]'));
  let rolling: LoopVoice | null = null;
  let lastPhase = 0;
  let lastT = 0;
  let vel = 0;
  let nextBump = 0;

  const pose = { phase: 0, walk: 0, cam: 0, lag: 0, tiltAdd: 0, look: 0, stretch: 0, zoom: 0 };

  return createRuntime(
    svg,
    {
      pose,
      ambient: { blink: 1, breathe: 0, t: 0 },
      build(tl, P, ctx) {
        // anticipation: lean in, handle takes up the slack
        tl.to(P, { stretch: 1, lag: 6, duration: 0.45, ease: 'power2.inOut' }, 0);
        // the handle takes up the slack (latch click + rattle), the coat moves, wheels start
        ctx.cue(tl, 0.05, () => sfx.play('handle', { gain: 0.42, pan: panAt(HX0 - CASE_BEHIND), send: 0.08 }));
        ctx.cue(tl, 0.2, () => sfx.play('coat', { gain: 0.3, pan: panAt(HX0) }));
        ctx.cue(tl, 0.45, () => {
          rolling = sfx.loop('loop_case_wheels', { gain: 0.0001, fadeIn: 0.05, pan: panAt(HX0 - CASE_BEHIND), lowpass: 6000 });
          sfx.play('case_bump', { gain: 0.3, pan: panAt(HX0 - CASE_BEHIND), delay: 0.05 });
        });
        tl.to(P, { walk: 1, duration: 0.5, ease: 'power1.out' }, 0.35);
        tl.to(P, { phase: PHASE_END, duration: 4.4, ease: 'power1.inOut' }, 0.35);
        tl.to(P, { cam: CAM_END, zoom: 1, duration: 5.2, ease: 'power2.inOut' }, 0.2);
        // the suitcase lags behind then catches up (inertia)
        tl.to(P, { lag: 0, tiltAdd: 0, duration: 1.4, ease: 'elastic.out(1, 0.5)' }, 0.9);
        tl.to(P, { tiltAdd: -4, duration: 0.4, ease: 'power2.out' }, 4.3).to(P, { tiltAdd: 0, duration: 1.0, ease: 'elastic.out(1, 0.4)' }, 4.7);
        tl.to(P, { walk: 0, stretch: 0, duration: 0.5, ease: 'power2.inOut' }, 4.35);
        ctx.cue(tl, 4.4, () => sfx.play('handle', { gain: 0.3, pan: panAt(FINAL_WHEEL), lowpass: 6000 }));
        ctx.cue(tl, 4.6, () => {
          rolling?.stop(0.45);
          rolling = null;
          sfx.play('case_bump', { gain: 0.24, pan: panAt(FINAL_WHEEL), lowpass: 4000 });
        });
        ctx.cue(tl, 4.85, () => sfx.play('coat', { gain: 0.24, pan: panAt(FINAL_WHEEL + CASE_BEHIND) }));
        tl.to(P, { look: 1, duration: 0.6, ease: 'power2.inOut' }, 4.8);
        tl.to({}, { duration: 0.1 }, 5.7);
      },
      buildAmbient(A) {
        const blink = gsap.timeline({ repeat: -1, repeatDelay: 2.9 }).to(A, { blink: 0.1, duration: 0.07 }).to(A, { blink: 1, duration: 0.1 });
        const breathe = gsap.to(A, { breathe: 1, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        const t = gsap.to(A, { t: 1000, duration: 1000, ease: 'none', repeat: -1 });
        return [blink, breathe, t];
      },
      onPlay() {
        lastPhase = 0;
        lastT = performance.now();
        vel = 0;
        nextBump = 0.6 + Math.random() * 0.4;
      },
      onStop() {
        rolling?.stop();
        rolling = null;
      },
      render(P, A, f) {
        const travel = STRIDE * P.phase;
        world.x = -P.cam;
        world.sx = world.sy = 1 + 0.035 * P.zoom;
        far.x = P.cam * 0.4;
        root.x = HX0 + travel;
        root.y = GROUND;
        const ph4 = P.phase * Math.PI * 4;
        hips.y = 4 + bobAt(P.phase, 2.6) * P.walk;
        torso.r = torsoB.r = 3 * P.stretch + Math.sin(ph4) * 1 * P.walk;
        torso.sy = torsoB.sy = 1 + A.breathe * 0.012;
        head.r = -2 + Math.sin(ph4 - 0.8) * 1.6 * P.walk - P.look * 8;
        head.x = 0;
        eyes.sy = A.blink;
        eyes.x = -P.look * 3;
        hem.r = Math.sin(ph4 - 1.1) * 2.2 * P.walk - P.stretch * 1.5;
        hairB.r = Math.sin(ph4 - 1.6) * 3 * P.walk + Math.sin(A.t * 1.2) * 0.6;
        pom.y = Math.abs(Math.sin(ph4 * 0.5 - 0.7)) * -3 * P.walk;
        pom.r = Math.sin(ph4 - 1.3) * 6 * P.walk;

        // suitcase rolls on its corner wheels
        const tilt = TILT + P.tiltAdd + Math.sin(travel / 21) * 0.8 * P.walk;
        const wx = root.x - CASE_BEHIND - P.lag;
        sc.x = wx - PIVOT.x;
        sc.y = GROUND - 9 - PIVOT.y;
        sc.r = tilt;
        wheel.r = ((travel - P.lag) / 9) * DEG - tilt;
        handle.y = -P.stretch * 2;
        caseShadow.setAttribute('cx', String(wx - 26));

        // legs
        for (const L of legs) {
          const s = footAt(P.phase, L.off, STRIDE, 1, 18);
          const neutral = root.x + (L.off ? -6 : 8);
          const x = lerp(neutral, HX0 + s.x - 4, P.walk);
          ik2(L.th, L.sh, { x: 0, y: -10 }, world.toWorld({ x, y: GROUND - 10 + s.lift * P.walk }), -1);
          const c = ((P.phase + L.off) % 1 + 1) % 1;
          const ang = s.stance ? (c > 0.36 ? 18 * smooth((c - 0.36) / 0.14) : 0) : lerp(18, -6, smooth(s.swing));
          setWorldAngle(L.ft, ang * P.walk);
        }
        // pulling hand locked to the grip; other arm swings with the coat
        ik2(armN.up, armN.lo, { x: 2, y: -106 }, sc.toWorld({ x: GRIP.x, y: GRIP.y + 1 }), -1);
        const sw = Math.sin(P.phase * Math.PI * 2) * P.walk;
        armF.up.r = -4 - sw * 20;
        armF.lo.r = -14 - Math.max(0, sw) * 14;

        // snow drift (screen space, deterministic)
        snow.forEach((c, i) => {
          const sp = 14 + (i % 4) * 5;
          const y = ((i * 97 + A.t * sp) % 520) + 20;
          const x = ((i * 173) % 960) + Math.sin(A.t * 0.6 + i) * 16;
          c.setAttribute('cx', x.toFixed(1));
          c.setAttribute('cy', y.toFixed(1));
        });

        if (f.playing && P.walk > 0.3) {
          for (const L of legs)
            if (contactsBetween(lastPhase, P.phase, L.off) > 0) {
              const pan = panAt(root.x - P.cam);
              sfx.play('step_boot', { gain: 0.55, pan, send: 0.1 });
              if (L.off === 0) sfx.play('coat', { gain: 0.12, pan, delay: 0.05, lowpass: 5000 });
            }
        }
        // wheels: level & pitch follow the real speed; pavement joints give occasional bumps
        const now = performance.now();
        const dt = Math.max(1, now - lastT) / 1000;
        lastT = now;
        vel = lerp(vel, Math.min(1.4, (P.phase - lastPhase) / dt / (PHASE_END / 4.4) / 1.4), 0.2);
        if (f.playing && rolling) {
          const pan = panAt(wx - P.cam);
          rolling.set({ gain: 0.5 * vel, rate: 0.85 + 0.22 * vel, pan });
          if (P.phase > nextBump) {
            nextBump = P.phase + 0.55 + Math.random() * 0.5;
            sfx.play('case_bump', { gain: 0.14 + 0.16 * vel, pan, lowpass: 5000 });
          }
        }
        lastPhase = P.phase;
        rig.apply();
      },
    },
    opts,
  );
}

export const SuitcaseScene: SceneModule = {
  Art,
  createRig,
  focus: [84, 176, 686, 444],
  alt: 'หญิงสาวสวมหมวกไหมพรม เสื้อโค้ตสีน้ำตาลเข้ม และรองเท้าบูต เดินลากกระเป๋าเดินทางสีชมพูที่เอียงอยู่ด้านหลัง กระเป๋ากลิ้งไปทางขวา',
};
