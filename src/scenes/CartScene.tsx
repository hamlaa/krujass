import { gsap } from 'gsap';
import { Rig, ik2, setWorldAngle, lerp, smooth, clamp, DEG } from '../rig/bone';
import { footAt, bobAt, contactsBetween } from '../rig/gait';
import { createRuntime, DustPool } from '../rig/runtime';
import { sfx, panAt, type LoopVoice } from '../audio/soundEngine';
import { Arrow, Ground, StartMarker, GROUND, type SceneModule } from './common';

/*
 * Scene 1 — cute flat 2D cartoon: boy in a green tee pushing a loaded
 * wire shopping cart to the LEFT. Dark outlines, simple cel shading.
 */
const OUT = '#2a2220';
const SW = 3;
const CART_S = 0.8;
const BOY_S = 1.15;
const CX0 = 560; // cart start (world)
const BOY_DX = 206; // boy root offset behind cart
const STRIDE = 104;
const PHASE_END = 3.5;
const CAM_END = 210;
const FINAL_CX = CX0 - STRIDE * PHASE_END;

function Leg({ id, far }: { id: string; far?: boolean }) {
  const tr = far ? '#a7825a' : '#c9a06f';
  const trS = far ? '#8d6b46' : '#ab8456';
  const shoe = far ? '#4a2f1e' : '#5d3b26';
  return (
    <g data-bone={`b-thigh${id}`} data-pivot="0 -76">
      <rect x={-11} y={-84} width={22} height={48} rx={10} fill={tr} stroke={OUT} strokeWidth={SW} />
      <path d="M4,-80 Q9,-60 6,-40" stroke={trS} strokeWidth={5} fill="none" strokeLinecap="round" />
      <g data-bone={`b-shin${id}`} data-pivot="0 -40">
        <rect x={-9.5} y={-46} width={19} height={40} rx={8} fill={tr} stroke={OUT} strokeWidth={SW} />
        <line x1={-9} y1={-15} x2={9} y2={-15} stroke={trS} strokeWidth={2.5} />
        <g data-bone={`b-foot${id}`} data-pivot="0 -8">
          <path d="M8,-15 Q11,-3 6,0 L-21,0 Q-28,0 -27,-6 Q-25,-12 -14,-13 L-6,-16 Z" fill={shoe} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M-24,-3 L6,-3" stroke="#2a1a10" strokeWidth={2} opacity={0.6} />
        </g>
      </g>
    </g>
  );
}

function Arm({ id, far }: { id: string; far?: boolean }) {
  const sleeve = far ? '#2f8a3a' : '#40b04c';
  const skin = far ? '#ecc4a6' : '#fde3cf';
  return (
    <g data-bone={`b-up${id}`} data-pivot="0 -132">
      <rect x={-6} y={-122} width={12} height={20} rx={5} fill={skin} stroke={OUT} strokeWidth={SW} />
      <path d="M-10,-140 Q-11,-124 -9,-114 L9,-114 Q11,-124 10,-140 Q0,-146 -10,-140 Z" fill={sleeve} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
      <g data-bone={`b-fore${id}`} data-pivot="0 -106">
        <rect x={-5.5} y={-110} width={11} height={28} rx={5} fill={skin} stroke={OUT} strokeWidth={SW} />
        <circle cx={0} cy={-78} r={7.5} fill={skin} stroke={OUT} strokeWidth={SW} />
      </g>
    </g>
  );
}

function Wheel({ id, cx, r = 16, far }: { id: string; cx: number; r?: number; far?: boolean }) {
  const cy = -r;
  return (
    <g data-bone={`c-wheel${id}`} data-pivot={`${cx} ${cy}`}>
      <circle cx={cx} cy={cy} r={r} fill={far ? '#4a4a52' : '#26262b'} stroke={OUT} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke={far ? '#6b6b75' : '#4a4a55'} strokeWidth={2} />
      {[0, 60, 120].map((a) => (
        <line
          key={a}
          x1={cx + Math.cos(a / DEG) * r * 0.6}
          y1={cy + Math.sin(a / DEG) * r * 0.6}
          x2={cx - Math.cos(a / DEG) * r * 0.6}
          y2={cy - Math.sin(a / DEG) * r * 0.6}
          stroke="#9aa0aa"
          strokeWidth={2}
        />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.3} fill="#b9bec7" stroke={OUT} strokeWidth={1.5} />
    </g>
  );
}

function Art({ uid }: { uid: string }) {
  const tri = `${uid}-tri`;
  const clip = `${uid}-basket`;
  const basket = 'M-136,-176 L114,-176 L100,-78 L-110,-78 Z';
  const wires: number[] = [];
  for (let x = -126; x <= 108; x += 18) wires.push(x);
  return (
    <>
      <defs>
        <pattern id={tri} width={24} height={34} patternUnits="userSpaceOnUse" x={-118} y={-112}>
          <rect width={24} height={34} fill="#f7f4fb" />
          <path d="M0,34 L12,6 L24,34 Z" fill="#7a4cc2" />
          <path d="M6,0 L18,0 L12,12 Z" fill="#a17fd9" />
        </pattern>
        <clipPath id={clip}>
          <path d={basket} />
        </clipPath>
      </defs>

      <g data-bone="world">
        {/* faint supermarket shelving — parallax layer */}
        <g data-bone="far">
          {[-640, -260, 120, 500, 880, 1260].map((x) => (
            <g key={x} opacity={0.32}>
              <rect x={x} y={250} width={300} height={270} rx={6} fill="none" stroke="#c7c0d6" strokeWidth={3} />
              {[300, 370, 440].map((y) => (
                <g key={y}>
                  <line x1={x} y1={y + 46} x2={x + 300} y2={y + 46} stroke="#c7c0d6" strokeWidth={3} />
                  {[0, 1, 2, 3, 4, 5].map((k) => (
                    <rect key={k} x={x + 14 + k * 47} y={y + (k % 2 ? 6 : 14)} width={34} height={k % 2 ? 40 : 32} rx={4} fill={['#f6d6b8', '#d9e6c9', '#d8d3ef', '#f3c9d6'][(k + y) % 4]} />
                  ))}
                </g>
              ))}
            </g>
          ))}
        </g>

        <Ground />
        <StartMarker x={CX0 - 136 * CART_S} height={230} />

        <g className="dust" />

        {/* ---------------- CART ---------------- */}
        <g data-bone="c-root">
          <ellipse cx={0} cy={3} rx={150} ry={9} fill="rgba(40,30,20,0.13)" />
          <Wheel id="FF" cx={-66} r={13} far />
          <Wheel id="FB" cx={102} r={13} far />
          <g data-bone="c-body">
            {/* chassis */}
            <path d="M-108,-78 L-90,-34 M98,-78 L86,-34" stroke="#3d4250" strokeWidth={5} strokeLinecap="round" fill="none" />
            <path d="M-100,-52 L100,-52" stroke="#3d4250" strokeWidth={4.5} strokeLinecap="round" />
            <path d="M-92,-50 L-84,-30 M86,-50 L84,-30" stroke="#3d4250" strokeWidth={4} strokeLinecap="round" />
            {/* basket back */}
            <path d={basket} fill="#e3e6ee" opacity={0.55} />
            {/* goods */}
            <g clipPath={undefined}>
              <g data-bone="c-itemA" data-pivot="-88 -112">
                <rect x={-124} y={-216} width={68} height={104} rx={3} fill="#f28a1f" stroke={OUT} strokeWidth={SW} />
                <rect x={-124} y={-198} width={68} height={9} fill="#d4680a" />
                <path d="M-70,-214 L-70,-112" stroke="#d4680a" strokeWidth={5} />
              </g>
              <g data-bone="c-itemE" data-pivot="-92 -216">
                <rect x={-116} y={-238} width={46} height={22} rx={3} fill="#2f4aa8" stroke={OUT} strokeWidth={SW} transform="rotate(-6 -92 -227)" />
              </g>
              <g data-bone="c-itemB" data-pivot="-30 -112">
                <rect x={-52} y={-246} width={42} height={134} rx={3} fill="#1e2b5a" stroke={OUT} strokeWidth={SW} />
                <rect x={-46} y={-230} width={30} height={22} rx={2} fill="#f7c948" />
                <path d="M-14,-244 L-14,-112" stroke="#14204a" strokeWidth={5} />
              </g>
              <g data-bone="c-itemC" data-pivot="20 -112">
                <rect x={-8} y={-212} width={58} height={100} rx={3} fill="#f7c948" stroke={OUT} strokeWidth={SW} />
                <path d="M2,-196 h38 M2,-186 h26" stroke="#c9961c" strokeWidth={4} strokeLinecap="round" />
                <path d="M44,-210 L44,-112" stroke="#dca92a" strokeWidth={5} />
              </g>
              <g data-bone="c-itemD" data-pivot="78 -112">
                <rect x={52} y={-150} width={52} height={38} fill="#1e2b5a" stroke={OUT} strokeWidth={SW} />
                <rect x={56} y={-170} width={46} height={20} rx={2} fill="#2c4fa3" stroke={OUT} strokeWidth={SW} />
                <rect x={52} y={-188} width={50} height={18} rx={2} fill="#f28a1f" stroke={OUT} strokeWidth={SW} />
                <path d="M58,-180 h36" stroke="#fff3df" strokeWidth={2.5} />
                <rect x={58} y={-204} width={42} height={16} rx={2} fill="#14204a" stroke={OUT} strokeWidth={SW} />
              </g>
            </g>
            {/* front mesh */}
            <g clipPath={`url(#${clip})`}>
              <path d={basket} fill="rgba(214,219,230,0.28)" />
              {wires.map((x) => (
                <line key={x} x1={x} y1={-180} x2={x - 6} y2={-74} stroke="#3d4250" strokeWidth={2.2} />
              ))}
              {[-160, -144, -128].map((y) => (
                <line key={y} x1={-150} y1={y} x2={130} y2={y} stroke="#3d4250" strokeWidth={2.2} />
              ))}
              {/* purple & white geometric lower panel */}
              <rect x={-150} y={-112} width={280} height={34} fill={`url(#${tri})`} />
              <line x1={-150} y1={-112} x2={130} y2={-112} stroke={OUT} strokeWidth={2.5} />
            </g>
            <path d={basket} fill="none" stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
            <line x1={-138} y1={-176} x2={116} y2={-176} stroke="#3d4250" strokeWidth={6.5} strokeLinecap="round" />
            {/* handle */}
            <path d="M112,-176 L142,-186 L152,-186" stroke="#3d4250" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <rect x={142} y={-193} width={30} height={14} rx={7} fill="#7a4cc2" stroke={OUT} strokeWidth={SW} />
          </g>
          <Wheel id="F" cx={-86} />
          <Wheel id="B" cx={84} />
        </g>

        {/* ---------------- BOY ---------------- */}
        <g data-bone="b-root">
          <ellipse cx={0} cy={3} rx={46} ry={6} fill="rgba(40,30,20,0.14)" />
          <g data-bone="speed" opacity={0}>
            {[
              [70, -160, 110],
              [86, -130, 80],
              [62, -100, 120],
            ].map(([x, y, w], i) => (
              <line key={i} className="speedline" x1={x} y1={y} x2={x + w} y2={y} stroke="#3fae4a" strokeWidth={4} strokeLinecap="round" strokeDasharray="30 16" />
            ))}
          </g>
          <g data-bone="b-hips">
            <Leg id="F" far />
            <g data-bone="b-torso" data-pivot="0 -76">
              <Arm id="F" far />
            </g>
            <path d="M-16,-92 Q-19,-72 -12,-64 L14,-64 Q20,-72 16,-92 Z" fill="#c29966" stroke={OUT} strokeWidth={SW} />
            <Leg id="N" />
            <g data-bone="b-torso2" data-pivot="0 -76">
              <path d="M-17,-142 Q-24,-110 -21,-70 Q0,-63 21,-70 Q23,-110 17,-142 Q0,-150 -17,-142 Z" fill="#40b04c" stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
              <path d="M7,-144 Q20,-112 19,-71 Q14,-67 9,-67 Q14,-110 3,-145 Z" fill="#2f8a3a" opacity={0.85} />
              <path d="M-10,-143 Q-2,-134 7,-143" fill="none" stroke={OUT} strokeWidth={2.5} strokeLinecap="round" />
              <g data-bone="b-head" data-pivot="-2 -142">
                <rect x={-8} y={-154} width={12} height={14} fill="#f2c9ad" stroke={OUT} strokeWidth={2} />
                <ellipse cx={-6} cy={-182} rx={37} ry={35} fill="#fde3cf" stroke={OUT} strokeWidth={SW} />
                <path d="M-43,-184 Q-47,-206 -31,-215 Q-31,-228 -14,-223 Q-5,-236 9,-225 Q23,-229 27,-214 Q42,-209 35,-194 Q44,-183 32,-173 Q31,-159 24,-151 Q19,-166 13,-176 Q7,-168 1,-176 Q-4,-195 -19,-193 Q-27,-185 -32,-196 Q-37,-186 -43,-184 Z" fill="#4a3022" stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
                <path d="M-20,-214 Q-6,-222 8,-214 M14,-206 Q24,-204 28,-196" stroke="#6e4832" strokeWidth={3} fill="none" strokeLinecap="round" />
                <ellipse cx={12} cy={-176} rx={7} ry={9} fill="#fde3cf" stroke={OUT} strokeWidth={2.5} />
                <path d="M11,-180 Q15,-176 11,-172" stroke="#e0b598" strokeWidth={2} fill="none" />
                <g data-bone="b-eyes" data-pivot="-22 -178">
                  <ellipse cx={-31} cy={-178} rx={3} ry={4.3} fill="#1a1414" />
                  <ellipse cx={-13} cy={-178} rx={3.2} ry={4.5} fill="#1a1414" />
                </g>
                <path d="M-38,-190 L-27,-186 M-18,-187 L-6,-191" stroke={OUT} strokeWidth={3} strokeLinecap="round" />
                <path d="M-33,-161 Q-27,-164 -20,-161" stroke={OUT} strokeWidth={2.5} fill="none" strokeLinecap="round" />
                <ellipse cx={-38} cy={-167} rx={5.5} ry={3.2} fill="#f6a6a0" opacity={0.7} />
                <ellipse cx={-6} cy={-167} rx={5.5} ry={3.2} fill="#f6a6a0" opacity={0.7} />
              </g>
              <Arm id="N" />
            </g>
          </g>
        </g>

        {/* ---------------- PHYSICS OVERLAY (final pose, world coords) ---------------- */}
        <g className="phys">
          <Arrow x1={FINAL_CX + 122} y1={300} x2={FINAL_CX - 6} y2={300} color="#e2412b" label="F (แรงเข็น)" lx={FINAL_CX - 24} ly={300} anchor="end" />
          <Arrow x1={CX0 - 136 * CART_S} y1={GROUND + 84} x2={FINAL_CX - 136 * CART_S} y2={GROUND + 84} color="#1f6b2a" label="s (การกระจัด)" ly={GROUND + 118} />
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
    cart = B('c-root'),
    body = B('c-body'),
    boy = B('b-root'),
    hips = B('b-hips'),
    torsoF = B('b-torso'),
    torso = B('b-torso2'),
    head = B('b-head'),
    eyes = B('b-eyes'),
    speed = B('speed');
  const wheels = ['F', 'B', 'FF', 'FB'].map((k) => B(`c-wheel${k}`));
  const items = ['A', 'B', 'C', 'D', 'E'].map((k) => B(`c-item${k}`));
  const legs = (['F', 'N'] as const).map((k) => ({ th: B(`b-thigh${k}`), sh: B(`b-shin${k}`), ft: B(`b-foot${k}`), off: k === 'N' ? 0 : 0.5 }));
  const arms = (['F', 'N'] as const).map((k) => ({ up: B(`b-up${k}`), lo: B(`b-fore${k}`), grip: k === 'N' ? { x: 151, y: -186 } : { x: 163, y: -188 } }));
  const dust = new DustPool(svg.querySelector<SVGGElement>('.dust'), 16, '#d6cbbb');
  const speedLines = svg.querySelectorAll<SVGLineElement>('.speedline');
  let rattle: LoopVoice | null = null;
  let wheels_: LoopVoice | null = null;
  let lastPhase = 0;
  let lastT = 0;
  let vel = 0;

  cart.sx = cart.sy = CART_S;
  boy.sx = boy.sy = BOY_S;

  const pose = { phase: 0, walk: 0, lean: -16, crouch: 0, cam: 0, tilt: 0, speed: 0, squash: 0, look: 0 };

  return createRuntime(
    svg,
    {
      pose,
      ambient: { blink: 1, breathe: 0 },
      build(tl, P, ctx) {
        // anticipation: crouch & lean into the handle
        tl.to(P, { crouch: 1, lean: -27, squash: 1, duration: 0.6, ease: 'power2.inOut' }, 0);
        // grip: hands land on the handle, the goods shift, the frame clinks
        ctx.cue(tl, 0.12, () => sfx.play('cloth', { gain: 0.35, pan: panAt(CX0 + BOY_DX), send: 0.05 }));
        ctx.cue(tl, 0.42, () => sfx.play('cart_jolt', { gain: 0.32, pan: panAt(CX0), variant: 2 }));
        ctx.cue(tl, 0.55, () => {
          rattle = sfx.loop('loop_cart_rattle', { gain: 0.0001, fadeIn: 0.05, pan: panAt(CX0) });
          wheels_ = sfx.loop('loop_cart_wheels', { gain: 0.0001, fadeIn: 0.05, pan: panAt(CX0), lowpass: 2400 });
          sfx.play('box_shift', { gain: 0.42, pan: panAt(CX0), delay: 0.05 });
        });
        ctx.cue(tl, 2.4, () => sfx.play('box_shift', { gain: 0.16, pan: panAt(CX0 - 150), lowpass: 3000 }));
        // main push — ease gives a real acceleration / deceleration
        tl.to(P, { walk: 1, duration: 0.45, ease: 'power1.out' }, 0.5);
        tl.to(P, { phase: PHASE_END, duration: 4.6, ease: 'power1.inOut' }, 0.5);
        tl.to(P, { cam: CAM_END, duration: 4.8, ease: 'power2.inOut' }, 0.55);
        tl.to(P, { speed: 1, duration: 1.4, ease: 'sine.inOut' }, 1.3).to(P, { speed: 0, duration: 1.0, ease: 'sine.inOut' }, 3.8);
        // goods inertia: tilt back on start, forward on stop
        tl.to(P, { tilt: 4, duration: 0.45, ease: 'power2.out' }, 0.55)
          .to(P, { tilt: 0, duration: 1.2, ease: 'elastic.out(1, 0.4)' }, 1.0)
          .to(P, { tilt: -5, duration: 0.35, ease: 'power2.out' }, 4.75)
          .to(P, { tilt: 0, duration: 1.2, ease: 'elastic.out(1.1, 0.35)' }, 5.1);
        // braking: packages lurch forward, one last rattle, wheels die away
        ctx.cue(tl, 4.72, () => {
          sfx.play('box_shift', { gain: 0.48, pan: panAt(CX0 - STRIDE * PHASE_END) });
          sfx.play('cart_jolt', { gain: 0.26, pan: panAt(CX0 - STRIDE * PHASE_END), delay: 0.04 });
        });
        ctx.cue(tl, 5.0, () => {
          rattle?.stop(0.5);
          wheels_?.stop(0.7);
          rattle = wheels_ = null;
        });
        ctx.cue(tl, 5.15, () => sfx.play('cloth', { gain: 0.3, pan: panAt(CX0 + BOY_DX - STRIDE * PHASE_END) }));
        // settle
        tl.to(P, { walk: 0, duration: 0.5, ease: 'power2.inOut' }, 4.75);
        tl.to(P, { crouch: 0, lean: -16, squash: 0, duration: 0.9, ease: 'power2.inOut' }, 5.0);
        tl.to(P, { look: 1, duration: 0.5, ease: 'power2.out' }, 5.4);
        tl.to({}, { duration: 0.1 }, 6.3);
      },
      buildAmbient(A) {
        const blink = gsap.timeline({ repeat: -1, repeatDelay: 2.6 }).to(A, { blink: 0.1, duration: 0.07 }).to(A, { blink: 1, duration: 0.1 });
        const breathe = gsap.to(A, { breathe: 1, duration: 1.7, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        return [blink, breathe];
      },
      onPlay() {
        lastPhase = 0;
        lastT = performance.now();
        vel = 0;
      },
      onStop() {
        rattle?.stop(0.2);
        wheels_?.stop(0.2);
        rattle = wheels_ = null;
        dust.clear();
      },
      render(P, A, f) {
        const travel = STRIDE * P.phase; // distance moved to the left
        world.x = P.cam;
        far.x = -P.cam * 0.45;
        cart.x = CX0 - travel;
        cart.y = GROUND;
        boy.x = CX0 + BOY_DX - travel;
        boy.y = GROUND;

        // wheel spin = arc length / radius
        const spin = (-travel / (16 * CART_S)) * DEG;
        wheels.forEach((w, i) => (w.r = spin * (i > 1 ? 16 / 13 : 1)));
        body.y = -P.squash * 1.5 + Math.sin(travel / 14) * 1.1 * P.walk;
        items.forEach((it, i) => {
          it.r = P.tilt * (1 + i * 0.12) + Math.sin(travel / 11 + i * 1.7) * 1.2 * P.walk;
          it.y = -Math.abs(Math.sin(travel / 13 + i)) * 1.4 * P.walk;
        });

        // hips: crouch + gait bob
        hips.y = P.crouch * 5 + bobAt(P.phase, 2.4) * P.walk + A.breathe * 0.6;
        hips.x = P.crouch * 2;
        const pulse = Math.sin(P.phase * Math.PI * 4) * 1.6 * P.walk;
        torso.r = torsoF.r = P.lean + pulse;
        torso.sy = torsoF.sy = 1 + A.breathe * 0.012;
        head.r = 12 + P.lean * -0.35 - P.look * 6 + Math.sin(P.phase * Math.PI * 4 + 0.8) * 1.2 * P.walk;
        eyes.sy = A.blink;
        eyes.x = -P.look * 1.5;

        // speed lines
        speed.el!.setAttribute('opacity', String(P.speed * 0.9));
        speedLines.forEach((l, i) => l.setAttribute('stroke-dashoffset', String(-travel * (1.4 + i * 0.3))));

        // legs — planted feet in world space, solved with IK
        const boyStart = CX0 + BOY_DX;
        for (const L of legs) {
          const s = footAt(P.phase, L.off, STRIDE, -1, 14);
          const neutral = boy.x + (L.off ? 14 : -6);
          const gx = boyStart + s.x + 12 + (L.off ? 6 : 0);
          const x = lerp(neutral, gx, P.walk);
          const y = GROUND - 8 * BOY_S + s.lift * P.walk * BOY_S;
          ik2(L.th, L.sh, { x: 0, y: -8 }, world.toWorld({ x, y }), 1);
          const c = ((P.phase + L.off) % 1 + 1) % 1;
          let ang = 0;
          if (s.stance) ang = c > 0.36 ? -18 * smooth(clamp((c - 0.36) / 0.14, 0, 1)) : 0;
          else ang = lerp(-18, 6, smooth(s.swing));
          setWorldAngle(L.ft, ang * P.walk);
        }
        // arms glued to the cart handle
        for (const a of arms) ik2(a.up, a.lo, { x: 0, y: -78 }, cart.toWorld(a.grip), -1);

        // rolling foley follows the real speed of the cart (gain, pitch and stereo position)
        const now = performance.now();
        const dt = Math.max(1, now - lastT) / 1000;
        lastT = now;
        vel = lerp(vel, Math.min(1.4, (P.phase - lastPhase) / dt / (PHASE_END / 4.6) / 1.4), 0.2);
        if (f.playing) {
          const pan = panAt(cart.x + 120 + P.cam);
          rattle?.set({ gain: 0.42 * vel, rate: 0.9 + 0.18 * vel, pan });
          wheels_?.set({ gain: 0.55 * vel, rate: 0.85 + 0.25 * vel, pan });
        }

        // footstep foley + dust
        if (f.playing && P.walk > 0.3) {
          for (const L of legs) {
            if (contactsBetween(lastPhase, P.phase, L.off) > 0) {
              const pan = panAt(boy.x + P.cam);
              sfx.play('step_sneaker', { gain: 0.5, pan, send: 0.08 });
              if (Math.random() < 0.35) sfx.play('cloth', { gain: 0.14, pan, delay: 0.04 });
              const s = footAt(P.phase, L.off, STRIDE, -1, 14);
              dust.emit(boyStart + s.x + 20, GROUND - 4, { dx: 22, dy: -12, r: 6 });
            }
          }
          if (Math.floor(travel / 70) !== Math.floor((STRIDE * lastPhase) / 70)) {
            dust.emit(cart.x + 70 * CART_S, GROUND - 3, { dx: 26, dy: -8, r: 5, opacity: 0.4 });
          }
        }
        lastPhase = P.phase;
        rig.apply();
      },
    },
    opts,
  );
}

export const CartScene: SceneModule = {
  Art,
  createRig,
  focus: [130, 190, 720, 450],
  alt: 'เด็กชายเสื้อเขียวเอนตัวเข็นรถเข็นสินค้าที่มีกล่องและหนังสือ รถเข็นเคลื่อนที่ไปทางซ้ายตามทิศแรงเข็น',
};
