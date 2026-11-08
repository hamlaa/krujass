import { gsap } from 'gsap';
import { Rig, ik2, setWorldAngle, lerp, smooth, clamp, type Pt } from '../rig/bone';
import { createRuntime } from '../rig/runtime';
import { sfx, panAt } from '../audio/soundEngine';
import { Arrow, Ground, Label, GROUND, type SceneModule } from './common';

/*
 * Scene 4 — chibi woman with a dark bob, blue/purple office dress and an
 * orange handbag climbing THREE light-grey pseudo-3D stairs (ascending left).
 */
const OUT = '#2b2540';
const SW = 2.2;
const RISE = 36;
const DEPTH = { x: 30, y: -18 };
const SKIN = '#fde5d6';
const DRESS = '#5b5fc7';
const DRESS_S = '#4448a8';
const HAIR = '#3b2a26';

// tread heights (feet ground level) and foot x positions
const LV = [GROUND, GROUND - RISE, GROUND - 2 * RISE, GROUND - 3 * RISE];
const FOOT_N = [600, 522, 442, 362];
const FOOT_F = [622, 538, 458, 380];
const SOLE = 8; // ankle height above sole
const TREAD_Z = -7; // stand mid-depth on the tread

const at = (x: number, lv: number): Pt => ({ x, y: LV[lv] + TREAD_Z - SOLE });
const MOVES: { foot: 'N' | 'F'; from: Pt; to: Pt }[] = [
  { foot: 'N', from: at(FOOT_N[0], 0), to: at(FOOT_N[1], 1) },
  { foot: 'F', from: at(FOOT_F[0], 0), to: at(FOOT_F[1], 1) },
  { foot: 'F', from: at(FOOT_F[1], 1), to: at(FOOT_F[2], 2) },
  { foot: 'N', from: at(FOOT_N[1], 1), to: at(FOOT_N[2], 2) },
  { foot: 'N', from: at(FOOT_N[2], 2), to: at(FOOT_N[3], 3) },
  { foot: 'F', from: at(FOOT_F[2], 2), to: at(FOOT_F[3], 3) },
];

function Stairs() {
  const els = [];
  // landing (top step) extends off to the left
  const steps = [
    { x0: 480, x1: 560, y: LV[1] },
    { x0: 400, x1: 480, y: LV[2] },
    { x0: 120, x1: 400, y: LV[3] },
  ];
  // side (front-facing) stepped face
  const side = `M560,${GROUND} L560,${LV[1]} L480,${LV[1]} L480,${LV[2]} L400,${LV[2]} L400,${LV[3]} L120,${LV[3]} L120,${GROUND} Z`;
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i];
    els.push(
      <g key={`t${i}`}>
        {/* tread top */}
        <path d={`M${s.x0},${s.y} L${s.x1},${s.y} L${s.x1 + DEPTH.x},${s.y + DEPTH.y} L${s.x0 + DEPTH.x},${s.y + DEPTH.y} Z`} fill="#f1f2f5" stroke="#7a7f8e" strokeWidth={2} strokeLinejoin="round" />
        {/* riser face (facing right) */}
        <path d={`M${s.x1},${s.y} L${s.x1 + DEPTH.x},${s.y + DEPTH.y} L${s.x1 + DEPTH.x},${s.y + DEPTH.y + RISE * (i === 2 ? 1 : 1)} L${s.x1},${s.y + RISE} Z`} fill="#c3c8d1" stroke="#7a7f8e" strokeWidth={2} strokeLinejoin="round" />
      </g>,
    );
  }
  return (
    <g>
      {els}
      <path d={side} fill="#dde0e6" stroke="#7a7f8e" strokeWidth={2.2} strokeLinejoin="round" />
      {/* soft light on tread nosings */}
      {steps.map((s, i) => (
        <line key={i} x1={s.x0 + 4} y1={s.y + 3} x2={s.x1 - 2} y2={s.y + 3} stroke="#ffffff" strokeWidth={3} opacity={0.7} />
      ))}
      <path d={`M560,${LV[1] + 6} L560,${GROUND} M480,${LV[2] + 6} L480,${LV[1]} M400,${LV[3] + 6} L400,${LV[2]}`} stroke="#b4b9c3" strokeWidth={6} opacity={0.6} />
    </g>
  );
}

function Leg({ id, far }: { id: string; far?: boolean }) {
  const skin = far ? '#efcdbb' : SKIN;
  return (
    <g data-bone={`s-thigh${id}`} data-pivot="0 -62">
      <rect x={-8} y={-66} width={16} height={36} rx={7} fill={skin} stroke={OUT} strokeWidth={SW} />
      <g data-bone={`s-shin${id}`} data-pivot="0 -32">
        <rect x={-6.5} y={-36} width={13} height={30} rx={6} fill={skin} stroke={OUT} strokeWidth={SW} />
        <g data-bone={`s-foot${id}`} data-pivot="0 -8">
          <path d="M6,-12 Q8,-2 4,0 L-16,0 Q-22,0 -20,-6 Q-18,-10 -8,-10 L-4,-13 Z" fill={far ? '#3a3266' : '#4a4280'} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M5,-2 L8,4" stroke={OUT} strokeWidth={2.5} strokeLinecap="round" />
        </g>
      </g>
    </g>
  );
}

function Art() {
  return (
    <>
      {/* stair-step backdrop pattern */}
      <g opacity={0.35} fill="none" stroke="#c9c9ee" strokeWidth={3}>
        <path d="M620,250 h60 v-40 h60 v-40 h60 v-40 h60" />
        <path d="M60,300 h50 v-34 h50 v-34 h50" />
      </g>
      <g data-bone="world">
        <Ground x1={-600} x2={1600} />
        <Stairs />

        <g data-bone="s-root">
          <ellipse cx={4} cy={-3} rx={30} ry={5} fill="rgba(30,20,60,0.13)" />
          <g data-bone="s-hips">
            <g data-bone="s-torsoB" data-pivot="0 -62">
              <g data-bone="s-upF" data-pivot="-2 -106">
                <rect x={-8} y={-110} width={13} height={28} rx={6} fill={DRESS_S} stroke={OUT} strokeWidth={SW} />
                <g data-bone="s-foreF" data-pivot="-2 -84">
                  <rect x={-6.5} y={-88} width={10} height={24} rx={5} fill="#efcdbb" stroke={OUT} strokeWidth={SW} />
                  <circle cx={-1.5} cy={-62} r={5.5} fill="#efcdbb" stroke={OUT} strokeWidth={SW} />
                </g>
              </g>
            </g>
            <Leg id="F" far />
            <Leg id="N" />
            <g data-bone="s-torso" data-pivot="0 -62">
              {/* A-line skirt */}
              <g data-bone="s-skirt" data-pivot="0 -70">
                <path d="M-20,-74 L20,-74 L32,-30 Q0,-24 -32,-30 Z" fill={DRESS} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
                <path d="M8,-72 L20,-31 Q26,-30 31,-31 L19,-73 Z" fill={DRESS_S} opacity={0.8} />
                <path d="M-10,-70 L-16,-32" stroke={DRESS_S} strokeWidth={2} />
              </g>
              <path d="M-19,-108 Q-24,-90 -19,-70 L19,-70 Q23,-90 18,-108 Q0,-116 -19,-108 Z" fill={DRESS} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
              <path d="M6,-112 Q20,-92 18,-71 L10,-71 Q13,-92 0,-113 Z" fill={DRESS_S} opacity={0.85} />
              <path d="M-12,-111 L-2,-98 L8,-111" fill="#ffffff" stroke={OUT} strokeWidth={1.8} strokeLinejoin="round" />
              <rect x={-19} y={-76} width={38} height={6} fill="#3a3d92" />
              <g data-bone="s-head" data-pivot="-2 -112">
                <rect x={-7} y={-120} width={10} height={10} fill="#efcdbb" />
                <path d="M-40,-150 Q-44,-186 -6,-188 Q32,-188 34,-150 Q36,-128 30,-116 L18,-116 Q22,-130 18,-138 L-28,-138 Q-34,-128 -32,-116 L-42,-118 Q-44,-132 -40,-150 Z" fill={HAIR} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
                <ellipse cx={-4} cy={-146} rx={32} ry={31} fill={SKIN} stroke={OUT} strokeWidth={SW} />
                {/* side-swept bangs + bob */}
                <path d="M-38,-146 Q-42,-182 -4,-182 Q30,-182 34,-148 Q36,-126 30,-114 Q24,-122 22,-136 Q12,-160 -10,-160 Q-22,-150 -38,-146 Z" fill={HAIR} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
                <path d="M-36,-150 Q-20,-152 -8,-168 Q4,-176 16,-172" stroke="#5a443d" strokeWidth={2.5} fill="none" strokeLinecap="round" />
                <path d="M-38,-146 Q-40,-128 -34,-116 Q-30,-132 -30,-142 Z" fill={HAIR} stroke={OUT} strokeWidth={1.8} />
                <g data-bone="s-eyes" data-pivot="-14 -142">
                  <ellipse cx={-22} cy={-142} rx={3.8} ry={5.2} fill="#231b2e" />
                  <ellipse cx={-5} cy={-142} rx={3.8} ry={5.2} fill="#231b2e" />
                  <circle cx={-21} cy={-144} r={1.4} fill="#fff" />
                  <circle cx={-4} cy={-144} r={1.4} fill="#fff" />
                </g>
                <ellipse cx={-30} cy={-130} rx={5.5} ry={3.4} fill="#f6a5b0" opacity={0.8} />
                <ellipse cx={4} cy={-130} rx={5.5} ry={3.4} fill="#f6a5b0" opacity={0.8} />
                <g data-bone="s-mouth" data-pivot="-14 -126">
                  <path d="M-18,-127 Q-14,-121 -10,-127 Z" fill="#b8465a" stroke={OUT} strokeWidth={1.4} strokeLinejoin="round" />
                </g>
                <g data-bone="s-sweat1" data-pivot="44 -168">
                  <path d="M44,-180 Q52,-168 44,-162 Q36,-168 44,-180 Z" fill="#7ab8f5" stroke="#3a6fb3" strokeWidth={1.8} />
                </g>
                <g data-bone="s-sweat2" data-pivot="54 -146">
                  <path d="M54,-156 Q60,-146 54,-141 Q48,-146 54,-156 Z" fill="#7ab8f5" stroke="#3a6fb3" strokeWidth={1.8} />
                </g>
              </g>
              <g data-bone="s-upN" data-pivot="-2 -106">
                <rect x={-8.5} y={-111} width={14} height={30} rx={6.5} fill={DRESS} stroke={OUT} strokeWidth={SW} />
                <g data-bone="s-foreN" data-pivot="-2 -84">
                  <rect x={-7} y={-88} width={11} height={24} rx={5} fill={SKIN} stroke={OUT} strokeWidth={SW} />
                  <circle cx={-1.5} cy={-62} r={5.8} fill={SKIN} stroke={OUT} strokeWidth={SW} />
                  {/* orange handbag hanging from the hand (pendulum) */}
                  <g data-bone="s-bag" data-pivot="-1.5 -62">
                    <path d="M-10,-44 Q-10,-66 -1.5,-66 Q7,-66 7,-44" fill="none" stroke="#b8601a" strokeWidth={3} />
                    <path d="M-17,-46 L14,-46 Q18,-46 18,-40 L16,-20 Q15,-14 9,-14 L-12,-14 Q-18,-14 -19,-20 L-21,-40 Q-21,-46 -17,-46 Z" fill="#f28c28" stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
                    <path d="M-20,-36 L17,-36" stroke="#c96d16" strokeWidth={2.5} />
                    <rect x={-4} y={-39} width={7} height={6} rx={1.5} fill="#ffd27a" stroke={OUT} strokeWidth={1.4} />
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>

        <g className="phys">
          <line className="phys-line" data-dash="3 10" x1={566} y1={GROUND} x2={612} y2={GROUND} stroke="#363894" strokeWidth={3} />
          <line className="phys-line" data-dash="3 10" x1={410} y1={LV[3]} x2={612} y2={LV[3]} stroke="#363894" strokeWidth={3} />
          <Arrow x1={598} y1={GROUND - 4} x2={598} y2={LV[3] + 4} color="#363894" width={5} head={15} label="h" lx={580} ly={LV[3] + 34} anchor="end" />
          <Label x={262} y={LV[3] + 54} text="ตัวสูงขึ้น h (การกระจัดขึ้น)" color="#363894" size={19} />
          <Arrow x1={428} y1={LV[3] - 80} x2={428} y2={LV[3] - 186} color="#e2412b" label="F (แรง)" lx={470} ly={LV[3] - 210} />
          <Arrow x1={318} y1={LV[3] - 120} x2={318} y2={LV[3] - 62} color="#8a8478" width={4} head={13} label="mg" lx={288} ly={LV[3] - 96} labelSize={18} anchor="end" />
        </g>
      </g>
    </>
  );
}

function createRig(svg: SVGSVGElement, opts: Parameters<SceneModule['createRig']>[1]) {
  const rig = new Rig(svg);
  const B = (n: string) => rig.b(n);
  const world = B('world'),
    root = B('s-root'),
    hips = B('s-hips'),
    torso = B('s-torso'),
    torsoB = B('s-torsoB'),
    head = B('s-head'),
    eyes = B('s-eyes'),
    mouth = B('s-mouth'),
    skirt = B('s-skirt'),
    bag = B('s-bag'),
    s1 = B('s-sweat1'),
    s2 = B('s-sweat2');
  const leg = {
    N: { th: B('s-thighN'), sh: B('s-shinN'), ft: B('s-footN'), home: at(FOOT_N[0], 0) },
    F: { th: B('s-thighF'), sh: B('s-shinF'), ft: B('s-footF'), home: at(FOOT_F[0], 0) },
  };
  const armN = { up: B('s-upN'), lo: B('s-foreN') };
  const armF = { up: B('s-upF'), lo: B('s-foreF') };

  const pose: Record<string, number> = { hx: 612, hy: GROUND, lean: 0, look: 0, camX: 0, camY: 0, swing: 0, puff: 0 };
  MOVES.forEach((_, i) => (pose[`m${i}`] = 0));

  return createRuntime(
    svg,
    {
      pose,
      ambient: { blink: 1, breathe: 0, sw: 0 },
      build(tl, P, ctx) {
        // look up at the stairs, small dip (anticipation)
        tl.to(P, { look: 1, duration: 0.45, ease: 'power2.inOut' }, 0);
        tl.to(P, { hy: GROUND + 3, duration: 0.3, ease: 'power2.inOut' }, 0.1);
        const hips: Pt[] = [
          { x: 586, y: GROUND - 6 },
          { x: 528, y: LV[1] },
          { x: 508, y: LV[1] - 6 },
          { x: 450, y: LV[2] },
          { x: 430, y: LV[2] - 6 },
          { x: 371, y: LV[3] },
        ];
        let t = 0.4;
        MOVES.forEach((m, i) => {
          const lead = i % 2 === 0;
          const dur = lead ? 0.62 : 0.66;
          tl.to(P, { [`m${i}`]: 1, duration: dur, ease: 'power1.inOut' }, t);
          tl.to(P, { hx: hips[i].x, hy: hips[i].y, duration: dur + 0.08, ease: lead ? 'power1.inOut' : 'power2.inOut' }, t + (lead ? 0.12 : 0));
          tl.to(P, { lean: lead ? 7 : 2, duration: dur * 0.6, ease: 'sine.inOut' }, t);
          tl.to(P, { swing: lead ? 1 : -1, duration: dur * 0.5, ease: 'sine.out' }, t);
          // each footfall lands on hard stone; the lead step carries the weight transfer,
          // the bag swings and fabric follows a beat later
          const at = t + dur * 0.92;
          const x = hips[i].x + 150;
          const climb = i / (MOVES.length - 1);
          ctx.cue(tl, at, () => {
            sfx.play('step_stair', { gain: lead ? 0.6 : 0.42, pan: panAt(x), rate: lead ? 0.97 : 1.04, send: 0.16 });
            if (lead) sfx.play('cloth', { gain: 0.14, pan: panAt(x), delay: 0.05 });
          });
          if (lead) ctx.cue(tl, t + 0.18, () => sfx.play('bag', { gain: 0.3, pan: panAt(x - 10), send: 0.06 }));
          // light exertion grows as she climbs (breath only, no voice)
          if (lead && i > 0) ctx.cue(tl, t + 0.3, () => sfx.play('breath_f', { gain: 0.08 + climb * 0.1, pan: panAt(x), lowpass: 4200, send: 0.1 }));
          void m;
          t += dur - 0.02;
        });
        // vertical camera tracking
        tl.to(P, { camY: 70, camX: 150, duration: t + 0.2, ease: 'power2.inOut' }, 0.3);
        tl.to(P, { swing: 0, lean: 0, duration: 1.1, ease: 'elastic.out(1, 0.35)' }, t);
        tl.to(P, { look: 0, puff: 1, duration: 0.5, ease: 'power2.out' }, t + 0.1);
        // at the top: the bag settles against her, one relieved breath out
        ctx.cue(tl, t + 0.05, () => sfx.play('bag', { gain: 0.26, pan: panAt(hips[5].x + 150), variant: 1 }));
        ctx.cue(tl, t + 0.15, () => sfx.play('breath_f', { gain: 0.2, pan: panAt(hips[5].x + 150), lowpass: 3800, send: 0.14 }));
        tl.to(P, { puff: 0, duration: 0.6, ease: 'power2.in' }, t + 0.7);
        tl.to({}, { duration: 0.1 }, t + 1.3);
      },
      buildAmbient(A) {
        const blink = gsap.timeline({ repeat: -1, repeatDelay: 2.8 }).to(A, { blink: 0.1, duration: 0.07 }).to(A, { blink: 1, duration: 0.1 });
        const breathe = gsap.to(A, { breathe: 1, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        const sw = gsap.to(A, { sw: 1, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        return [blink, breathe, sw];
      },
      render(P, A) {
        world.x = P.camX;
        world.y = P.camY;
        root.x = P.hx;
        root.y = P.hy;
        hips.y = -A.breathe * 0.6;
        torso.r = torsoB.r = -P.lean;
        torso.sy = torsoB.sy = 1 + A.breathe * 0.015;
        head.r = P.look * 7 + P.lean * 0.4;
        eyes.sy = A.blink;
        mouth.sy = 1 + P.puff * 0.9;
        skirt.r = P.swing * 2;

        // feet from the step choreography
        for (const k of ['N', 'F'] as const) {
          const L = leg[k];
          let pos = L.home;
          let ang = 0;
          MOVES.forEach((m, i) => {
            if (m.foot !== k) return;
            const p = P[`m${i}`];
            if (p <= 0) return;
            const rise = smooth(clamp(p * 1.7, 0, 1));
            const fwd = smooth(clamp((p - 0.18) / 0.82, 0, 1));
            pos = {
              x: lerp(m.from.x, m.to.x, fwd),
              y: lerp(m.from.y, m.to.y, rise) - 14 * Math.sin(Math.PI * p),
            };
            ang = p < 1 ? Math.sin(Math.PI * p) * 14 - (p < 0.2 ? p * 60 : 0) : 0;
          });
          ik2(L.th, L.sh, { x: 0, y: -8 }, world.toWorld(pos), 1);
          setWorldAngle(L.ft, ang);
        }

        // arms: far arm swings, near arm carries the bag
        armF.up.r = 10 + P.swing * 16;
        armF.lo.r = -12 - Math.abs(P.swing) * 10;
        armN.up.r = -6 - P.swing * 10;
        armN.lo.r = -20;
        // bag hangs vertically, swings with secondary motion
        const hang = -(armN.up.r + armN.lo.r + torso.r);
        bag.r = hang + P.swing * -16 + Math.sin(A.sw * Math.PI) * 2;

        // effort sweat
        s1.y = -A.sw * 4;
        s2.y = -A.sw * 3;
        s1.sx = s1.sy = 0.85 + A.sw * 0.2;
        s2.sx = s2.sy = 0.95 - A.sw * 0.15;
        rig.apply();
      },
    },
    opts,
  );
}

export const StairsScene: SceneModule = {
  Art,
  createRig,
  focus: [236, 214, 560, 404],
  alt: 'หญิงสาวผมบ๊อบสวมชุดทำงานสีน้ำเงินม่วง ถือกระเป๋าสีส้ม เดินขึ้นบันไดสามขั้นสีเทา ร่างกายสูงขึ้นทีละขั้น',
};
