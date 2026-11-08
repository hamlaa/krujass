import { gsap } from 'gsap';
import { Rig, ik2, setWorldAngle, lerp, smooth, DEG } from '../rig/bone';
import { footAt, bobAt, contactsBetween } from '../rig/gait';
import { createRuntime, DustPool } from '../rig/runtime';
import { sfx, panAt } from '../audio/soundEngine';
import { Arrow, Ground, Label, StartMarker, GROUND, type SceneModule } from './common';

/*
 * Scene 2 — bright Japanese chibi style, thick rounded outlines.
 * Worker in a glossy yellow helmet & cyan uniform carries a wooden beam
 * horizontally. The beam's height is locked: it never rises or falls.
 */
const OUT = '#1d2433';
const SW = 4.5;
const WX0 = 650;
const STRIDE = 90;
const PHASE_END = 4.5;
const CAM_END = 250;
const BEAM_Y = 380;
const BEAM_ANGLE = -11;
const HAND_ON_BEAM = { x: -46, y: 21 };
const FINAL_X = WX0 - STRIDE * PHASE_END;
/** beam-local point → offset in world (beam rotated by BEAM_ANGLE) */
const bp = (lx: number, ly: number) => {
  const a = (BEAM_ANGLE * Math.PI) / 180;
  return { x: lx * Math.cos(a) - ly * Math.sin(a), y: lx * Math.sin(a) + ly * Math.cos(a) };
};
const O = { x: FINAL_X + 4 + bp(-150, -12).x, y: BEAM_Y + bp(-150, -12).y };
const TIP = bp(-262, 0);

const BLUE = '#2fa6de';
const BLUE_S = '#1f86bd';
const BLUE_D = '#1a73a6';
const SKIN = '#f2b98a';

function Leg({ id, far }: { id: string; far?: boolean }) {
  const c = far ? BLUE_D : BLUE;
  return (
    <g data-bone={`w-thigh${id}`} data-pivot="0 -64">
      <rect x={-13} y={-72} width={26} height={40} rx={12} fill={c} stroke={OUT} strokeWidth={SW} />
      <g data-bone={`w-shin${id}`} data-pivot="0 -36">
        <rect x={-12} y={-42} width={24} height={34} rx={10} fill={c} stroke={OUT} strokeWidth={SW} />
        <g data-bone={`w-foot${id}`} data-pivot="0 -11">
          <path d="M13,-21 Q15,-2 9,0 L-22,0 Q-31,0 -30,-8 Q-28,-16 -15,-17 L-12,-23 Z" fill={far ? '#164e82' : '#1b5f9e'} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M-27,-4 L10,-4" stroke="#0f3a63" strokeWidth={3} />
        </g>
      </g>
    </g>
  );
}

function Arm({ id, far }: { id: string; far?: boolean }) {
  const c = far ? BLUE_D : BLUE;
  return (
    <g data-bone={`w-up${id}`} data-pivot="-2 -118">
      <rect x={-13} y={-126} width={22} height={36} rx={10} fill={c} stroke={OUT} strokeWidth={SW} />
      <g data-bone={`w-fore${id}`} data-pivot="-2 -94">
        <rect x={-12} y={-100} width={20} height={30} rx={9} fill={c} stroke={OUT} strokeWidth={SW} />
        <circle cx={-2} cy={-68} r={9.5} fill={far ? '#de9a68' : SKIN} stroke={OUT} strokeWidth={SW} />
      </g>
    </g>
  );
}

function Drop({ id, x, y, s = 1 }: { id: string; x: number; y: number; s?: number }) {
  return (
    <g data-bone={id} data-pivot={`${x} ${y}`}>
      <path
        d={`M${x},${y - 14 * s} Q${x + 10 * s},${y} ${x},${y + 6 * s} Q${x - 10 * s},${y} ${x},${y - 14 * s} Z`}
        fill="#3fd0d8"
        stroke="#1a8f99"
        strokeWidth={2.5}
      />
      <ellipse cx={x - 2.5 * s} cy={y - 1 * s} rx={2 * s} ry={3 * s} fill="#ffffff" opacity={0.8} />
    </g>
  );
}

function Art({ uid }: { uid: string }) {
  const wood = `${uid}-wood`;
  return (
    <>
      <defs>
        <linearGradient id={wood} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9bb80" />
          <stop offset="0.55" stopColor="#d9a466" />
          <stop offset="1" stopColor="#b97f45" />
        </linearGradient>
      </defs>
      <g data-bone="world">
        {/* construction backdrop: angular beam geometry (parallax) */}
        <g data-bone="far" opacity={0.3}>
          {[-700, -200, 300, 800, 1300].map((x) => (
            <g key={x} stroke="#9fb6c9" strokeWidth={4} fill="none" strokeLinecap="round">
              <path d={`M${x},520 L${x},240 M${x + 140},520 L${x + 140},240 M${x},240 L${x + 140},240 M${x},330 L${x + 140},330 M${x},430 L${x + 140},430`} />
              <path d={`M${x},430 L${x + 140},330 M${x},330 L${x + 140},240`} strokeWidth={2.5} />
              <path d={`M${x + 200},520 L${x + 200},150 L${x + 380},150 M${x + 200},180 L${x + 360},150`} strokeWidth={3} />
              <line x1={x + 360} y1={150} x2={x + 360} y2={220} strokeWidth={2} />
              <rect x={x + 346} y={220} width={28} height={14} fill="#f6d77a" stroke="none" />
            </g>
          ))}
        </g>
        <Ground />
        <StartMarker x={WX0 - 260} height={270} />
        <g className="dust" />

        <g data-bone="w-root">
          <ellipse cx={-2} cy={3} rx={44} ry={6} fill="rgba(20,30,50,0.15)" />
          <g data-bone="w-hips">
            <g data-bone="w-torsoB" data-pivot="0 -64">
              <Arm id="F" far />
            </g>
            <Leg id="F" far />
            <Leg id="N" />
            <g data-bone="w-torso" data-pivot="0 -64">
              <path d="M-26,-118 Q-28,-90 -25,-60 Q-1,-50 24,-60 Q27,-90 23,-118 Q-2,-134 -26,-118 Z" fill={BLUE} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
              <path d="M10,-124 Q24,-96 21,-62 Q15,-58 9,-57 Q16,-92 3,-127 Z" fill={BLUE_S} opacity={0.9} />
              <path d="M-25,-70 L24,-70" stroke="#1a6f9d" strokeWidth={4} />
              <rect x={-22} y={-104} width={16} height={14} rx={3} fill="none" stroke="#1a6f9d" strokeWidth={3} />
              <path d="M-14,-124 Q-4,-114 6,-124" fill="none" stroke={OUT} strokeWidth={3.5} strokeLinecap="round" />
            </g>
          </g>
        </g>

        {/* the beam: world-locked height */}
        <g data-bone="beam">
          <g transform={`rotate(${BEAM_ANGLE})`}>
            <rect x={-262} y={-12} width={452} height={24} rx={3} fill={`url(#${wood})`} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
            <path d="M-240,-3 Q-170,-7 -100,-2 T40,-3 T170,-4 M-220,5 Q-140,2 -60,6 T120,5" stroke="#b07840" strokeWidth={2} fill="none" opacity={0.75} />
            <ellipse cx={-90} cy={-1} rx={8} ry={4} fill="none" stroke="#a66f3a" strokeWidth={2} />
            <rect x={-266} y={-12} width={10} height={24} rx={3} fill="#c58b4f" stroke={OUT} strokeWidth={3} />
          </g>
        </g>

        {/* parts drawn in front of the beam mirror the torso's transform */}
        <g data-bone="w-top">
          <g data-bone="w-head" data-pivot="-2 -126">
            <circle cx={-4} cy={-164} r={40} fill={SKIN} stroke={OUT} strokeWidth={SW} />
            <path d="M22,-170 Q40,-160 34,-140 Q28,-150 20,-152 Z" fill="#3a2a22" stroke={OUT} strokeWidth={3} />
            <ellipse cx={18} cy={-148} rx={7} ry={9} fill={SKIN} stroke={OUT} strokeWidth={3.5} />
            <g data-bone="w-eyes" data-pivot="-20 -150">
              <ellipse cx={-31} cy={-150} rx={3.6} ry={4.8} fill="#1d1a1a" />
              <ellipse cx={-12} cy={-150} rx={3.8} ry={5} fill="#1d1a1a" />
            </g>
            <path d="M-29,-133 Q-23,-138 -16,-133 Q-23,-129 -29,-133 Z" fill="#8a3b2c" stroke={OUT} strokeWidth={2.5} />
            <ellipse cx={-40} cy={-138} rx={6} ry={3.5} fill="#ee8a6c" opacity={0.6} />
            <ellipse cx={-2} cy={-138} rx={6} ry={3.5} fill="#ee8a6c" opacity={0.6} />
            {/* glossy oversized helmet */}
            <g data-bone="w-helmet" data-pivot="-4 -168">
              <path d="M-52,-168 Q-55,-222 -6,-224 Q44,-222 44,-170 Z" fill="#ffd21f" stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
              <path d="M14,-220 Q44,-206 44,-170 L22,-170 Q26,-198 8,-222 Z" fill="#e8b100" opacity={0.85} />
              <path d="M-10,-223 Q-14,-198 -12,-170" stroke="#d9a400" strokeWidth={6} fill="none" strokeLinecap="round" />
              <ellipse cx={-30} cy={-204} rx={13} ry={6} fill="#fff7c2" transform="rotate(-32 -30 -204)" />
              <circle cx={-16} cy={-214} r={3} fill="#ffffff" />
              <path d="M-66,-166 Q-10,-182 48,-170 Q50,-160 42,-159 Q-8,-169 -62,-156 Q-71,-158 -66,-166 Z" fill="#ffd21f" stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
              <path d="M-58,-162 Q-10,-174 40,-164" stroke="#fff3a8" strokeWidth={3} fill="none" strokeLinecap="round" />
            </g>
          </g>
          <Drop id="w-drop1" x={-72} y={-196} />
          <Drop id="w-drop2" x={46} y={-212} s={0.85} />
          <Drop id="w-drop3" x={58} y={-160} s={0.75} />
          <Arm id="N" />
        </g>

        <g className="phys">
          <line className="phys-line" data-dash="3 11" x1={WX0 + 4 + TIP.x} y1={BEAM_Y + TIP.y} x2={FINAL_X + 4 + TIP.x} y2={BEAM_Y + TIP.y} stroke="#8a5a00" strokeWidth={3.5} strokeLinecap="round" />
          <circle className="phys-head" cx={WX0 + 4 + TIP.x} cy={BEAM_Y + TIP.y} r={6} fill="#8a5a00" />
          <Label x={FINAL_X + 4 + TIP.x + 150} y={BEAM_Y + TIP.y + 34} text="ปลายไม้เคลื่อนที่ในแนวระดับ ความสูงคงที่" color="#8a5a00" size={19} />
          <Arrow x1={O.x} y1={O.y} x2={O.x} y2={O.y - 120} color="#2563c9" label="F (แรงพยุง)" lx={O.x} ly={O.y - 150} />
          <Arrow x1={O.x} y1={O.y} x2={O.x - 110} y2={O.y} color="#1f7a3d" label="s" lx={O.x - 136} ly={O.y} />
          <path className="phys-line" d={`M${O.x - 22},${O.y} L${O.x - 22},${O.y - 22} L${O.x},${O.y - 22}`} stroke="#1b1a2e" strokeWidth={3} fill="none" />
          <Label x={O.x - 74} y={O.y - 56} text="θ = 90°" color="#1b1a2e" />
          <Arrow x1={WX0 - 260} y1={GROUND + 84} x2={FINAL_X - 260} y2={GROUND + 84} color="#1f7a3d" label="s (การกระจัดในแนวระดับ)" ly={GROUND + 118} />
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
    root = B('w-root'),
    hips = B('w-hips'),
    torso = B('w-torso'),
    torsoB = B('w-torsoB'),
    top = B('w-top'),
    head = B('w-head'),
    helmet = B('w-helmet'),
    eyes = B('w-eyes'),
    beam = B('beam');
  const drops = [1, 2, 3].map((i) => B(`w-drop${i}`));
  const legs = (['F', 'N'] as const).map((k) => ({ th: B(`w-thigh${k}`), sh: B(`w-shin${k}`), ft: B(`w-foot${k}`), off: k === 'N' ? 0 : 0.5 }));
  const armN = { up: B('w-upN'), lo: B('w-foreN') };
  const armF = { up: B('w-upF'), lo: B('w-foreF') };
  const dust = new DustPool(svg.querySelector<SVGGElement>('.dust'), 12, '#d5d0c6');
  let lastPhase = 0;

  const pose = { phase: 0, walk: 0, dip: 0, cam: 0, lean: 4, grip: 0 };
  const beamRad = BEAM_ANGLE / DEG;
  const handOff = {
    x: HAND_ON_BEAM.x * Math.cos(beamRad) - HAND_ON_BEAM.y * Math.sin(beamRad),
    y: HAND_ON_BEAM.x * Math.sin(beamRad) + HAND_ON_BEAM.y * Math.cos(beamRad),
  };

  return createRuntime(
    svg,
    {
      pose,
      ambient: { blink: 1, d1: 0, d2: 0, d3: 0, breathe: 0 },
      build(tl, P, ctx) {
        // anticipation: settle the load, knees dip, grip tightens
        tl.to(P, { dip: 1, lean: 9, grip: 1, duration: 0.45, ease: 'power2.inOut' }, 0);
        // the load settles on the shoulder: wood rubs on fabric, grain creaks, a braced breath
        ctx.cue(tl, 0.08, () => {
          sfx.play('wood_rub', { gain: 0.32, pan: panAt(WX0), variant: 0, duration: 0.7, lowpass: 5000 });
          sfx.play('cloth', { gain: 0.3, pan: panAt(WX0), delay: 0.05 });
        });
        ctx.cue(tl, 0.3, () => sfx.play('wood_creak', { gain: 0.38, pan: panAt(WX0), variant: 0 }));
        ctx.cue(tl, 0.36, () => sfx.play('breath_m', { gain: 0.2, pan: panAt(WX0), lowpass: 3800, send: 0.1 }));
        // effort breathing paced with the walk (no voice)
        [1.6, 2.9, 4.1].forEach((t, i) => ctx.cue(tl, t, () => sfx.play('breath_m', { gain: 0.14 + i * 0.02, pan: panAt(WX0 - STRIDE * PHASE_END * (t / 5.3)), lowpass: 3400, send: 0.1 })));
        tl.to(P, { walk: 1, duration: 0.5, ease: 'power1.out' }, 0.4);
        tl.to(P, { phase: PHASE_END, duration: 4.9, ease: 'power1.inOut' }, 0.4);
        tl.to(P, { cam: CAM_END, duration: 5.0, ease: 'power2.inOut' }, 0.45);
        tl.to(P, { walk: 0, duration: 0.5, ease: 'power2.inOut' }, 4.85);
        tl.to(P, { dip: 0, lean: 4, grip: 0, duration: 0.8, ease: 'power2.inOut' }, 5.2);
        // stop: the beam's weight swings on, settles with a creak, a long exhale
        ctx.cue(tl, 5.05, () => sfx.play('wood_creak', { gain: 0.34, pan: panAt(WX0 - STRIDE * PHASE_END) }));
        ctx.cue(tl, 5.3, () => {
          sfx.play('wood_rub', { gain: 0.22, pan: panAt(WX0 - STRIDE * PHASE_END), variant: 1, duration: 0.6, lowpass: 4200 });
          sfx.play('cloth', { gain: 0.26, pan: panAt(WX0 - STRIDE * PHASE_END), delay: 0.08 });
        });
        ctx.cue(tl, 5.55, () => sfx.play('breath_m', { gain: 0.2, rate: 0.92, pan: panAt(WX0 - STRIDE * PHASE_END), lowpass: 3200, send: 0.12 }));
        tl.to({}, { duration: 0.1 }, 6.1);
      },
      buildAmbient(A) {
        const blink = gsap.timeline({ repeat: -1, repeatDelay: 3.1 }).to(A, { blink: 0.1, duration: 0.07 }).to(A, { blink: 1, duration: 0.1 });
        const d = [1, 2, 3].map((i) => gsap.fromTo(A, { [`d${i}`]: 0 }, { [`d${i}`]: 1, duration: 1.3 + i * 0.25, ease: 'none', repeat: -1, delay: i * 0.37 }));
        const breathe = gsap.to(A, { breathe: 1, duration: 1.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        return [blink, breathe, ...d];
      },
      onPlay() {
        lastPhase = 0;
      },
      onStop() {
        dust.clear();
      },
      render(P, A, f) {
        const travel = STRIDE * P.phase;
        world.x = P.cam;
        far.x = -P.cam * 0.4;
        root.x = WX0 - travel;
        root.y = GROUND;
        beam.x = root.x + 4;
        beam.y = BEAM_Y; // LOCKED — constant height, zero vertical displacement

        const bob = bobAt(P.phase, 1.6) * P.walk;
        hips.y = 3 + P.dip * 4 + bob;
        torso.r = torsoB.r = P.lean + Math.sin(P.phase * Math.PI * 4) * 1.2 * P.walk;
        torso.sy = torsoB.sy = 1 + A.breathe * 0.01;
        // w-top lives inside `world`, so express the torso transform relative to world
        const m = world.world().inverse().multiply(torso.world());
        top.x = m.e;
        top.y = m.f;
        top.r = Math.atan2(m.b, m.a) * DEG;
        top.sy = torso.sy;
        // helmet / head follow-through lags the bounce
        head.r = -P.lean * 0.6 + Math.sin(P.phase * Math.PI * 4 - 0.9) * 2.2 * P.walk;
        head.y = Math.cos(P.phase * Math.PI * 4 - 0.9) * 1.4 * P.walk;
        helmet.y = Math.cos(P.phase * Math.PI * 4 - 1.6) * 1.2 * P.walk;
        eyes.sy = A.blink;

        // independent sweat drops
        drops.forEach((d, i) => {
          const t = (A as Record<string, number>)[`d${i + 1}`];
          const dir = i === 0 ? -1 : 1;
          d.x = dir * t * 10;
          d.y = t * t * 16 - t * 4;
          const s = Math.sin(Math.PI * Math.min(t * 1.25, 1));
          d.sx = d.sy = 0.4 + 0.7 * s;
          d.el!.setAttribute('opacity', (s * 0.95).toFixed(3));
        });

        // legs
        const start = WX0;
        for (const L of legs) {
          const s = footAt(P.phase, L.off, STRIDE, -1, 13);
          const neutral = root.x + (L.off ? 8 : -8);
          const x = lerp(neutral, start + s.x + 2, P.walk);
          ik2(L.th, L.sh, { x: 0, y: -11 }, world.toWorld({ x, y: GROUND - 11 + s.lift * P.walk }), 1);
          const c = ((P.phase + L.off) % 1 + 1) % 1;
          const ang = s.stance ? (c > 0.38 ? -14 * smooth((c - 0.38) / 0.12) : 0) : lerp(-14, 5, smooth(s.swing));
          setWorldAngle(L.ft, ang * P.walk);
        }

        // near hand supports the beam from below; far arm swings
        ik2(armN.up, armN.lo, { x: -2, y: -68 }, world.toWorld({ x: beam.x + handOff.x, y: BEAM_Y + handOff.y - P.grip * 1.5 }), -1);
        const sw = Math.sin(P.phase * Math.PI * 2) * P.walk;
        armF.up.r = -6 + sw * 22;
        armF.lo.r = -18 + sw * 10;

        if (f.playing && P.walk > 0.3) {
          for (const L of legs) {
            if (contactsBetween(lastPhase, P.phase, L.off) > 0) {
              const pan = panAt(root.x + P.cam);
              sfx.play('step_work', { gain: 0.62, pan, send: 0.08 });
              // the long beam flexes a little on every other footfall; clothing moves with the gait
              if (L.off === 0) sfx.play('wood_creak', { gain: 0.1 + Math.random() * 0.06, pan, delay: 0.06, lowpass: 3000 });
              else sfx.play('cloth', { gain: 0.16, pan, delay: 0.03 });
              const s = footAt(P.phase, L.off, STRIDE, -1, 13);
              dust.emit(start + s.x + 14, GROUND - 4, { dx: 18, dy: -10, r: 5 });
            }
          }
        }
        lastPhase = P.phase;
        rig.apply();
      },
    },
    opts,
  );
}

export const WorkerScene: SceneModule = {
  Art,
  createRig,
  focus: [150, 180, 720, 460],
  alt: 'คนงานสวมหมวกนิรภัยสีเหลืองและชุดสีฟ้า แบกคานไม้ไว้บนบ่าแล้วเดินไปทางซ้ายบนพื้นราบ ไม้อยู่ที่ความสูงคงที่',
};
