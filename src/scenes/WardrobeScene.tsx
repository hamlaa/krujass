import { gsap } from 'gsap';
import { Rig, ik2, setWorldAngle, lerp, clamp, DEG } from '../rig/bone';
import { createRuntime, DustPool } from '../rig/runtime';
import { sfx, panAt } from '../audio/soundEngine';
import { Arrow, Ground, Label, StartMarker, GROUND, type SceneModule } from './common';

/*
 * Scene 6 — a different visual language: a smooth, featureless, light-grey
 * pseudo-3D mannequin (gradient shading, no outlines) straining against a
 * heavy shaded wooden wardrobe. The wardrobe NEVER translates: s = 0.
 * It only rocks a fraction of a degree about its far bottom corner (the
 * "ตำแหน่งเดิมของตู้" marker), so that corner never moves and every push
 * returns it to exactly the same place.
 */
const HIP = { x: 650, y: 402 }; // rest pose hip (world), legs hang straight to the ground
const WL = 250; // wardrobe left edge
const WR = 480;
const WT = 190;
const HAND_N = { x: 497, y: 318 };
const HAND_F = { x: 493, y: 290 };
const FOOT_FRONT = 604;
const W_SHADOW_X = (WL + WR) / 2 + 10;
/** horizontal reach from the rocking pivot to the near legs */
const LEG_REACH = WR - 16 - WL;

function Limb({ x, y, w, h, fill, r }: { x: number; y: number; w: number; h: number; fill: string; r?: number }) {
  return <rect x={x - w / 2} y={y} width={w} height={h} rx={r ?? w / 2} fill={fill} />;
}

function Joint({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  return <circle cx={x} cy={y} r={r} fill={fill} />;
}

function Leg({ id, far, uid }: { id: string; far?: boolean; uid: string }) {
  const g = `url(#${uid}-${far ? 'limD' : 'lim'})`;
  const j = `url(#${uid}-${far ? 'jointD' : 'joint'})`;
  const { x, y } = HIP;
  return (
    <g data-bone={`m-thigh${id}`} data-pivot={`${x} ${y}`}>
      <Limb x={x} y={y - 8} w={27} h={66} fill={g} />
      <g data-bone={`m-shin${id}`} data-pivot={`${x} ${y + 56}`}>
        <Limb x={x} y={y + 52} w={21} h={60} fill={g} />
        <Joint x={x} y={y + 56} r={12} fill={j} />
        <g data-bone={`m-foot${id}`} data-pivot={`${x} ${y + 110}`}>
          <path d={`M${x + 9},${y + 104} Q${x + 12},${y + 118} ${x + 6},${y + 118} L${x - 26},${y + 118} Q${x - 32},${y + 118} ${x - 30},${y + 112} Q${x - 24},${y + 104} ${x - 8},${y + 102} Z`} fill={g} />
        </g>
      </g>
    </g>
  );
}

function Arm({ id, far, uid }: { id: string; far?: boolean; uid: string }) {
  const g = `url(#${uid}-${far ? 'limD' : 'lim'})`;
  const j = `url(#${uid}-${far ? 'jointD' : 'joint'})`;
  const sx = HIP.x;
  const sy = HIP.y - 92;
  return (
    <g data-bone={`m-up${id}`} data-pivot={`${sx} ${sy}`}>
      <Limb x={sx} y={sy - 8} w={19} h={54} fill={g} />
      <Joint x={sx} y={sy} r={12} fill={j} />
      <g data-bone={`m-fore${id}`} data-pivot={`${sx} ${sy + 44}`}>
        <Limb x={sx} y={sy + 40} w={16} h={48} fill={g} />
        <Joint x={sx} y={sy + 44} r={9} fill={j} />
        <g data-bone={`m-hand${id}`} data-pivot={`${sx} ${sy + 86}`}>
          <rect x={sx - 9} y={sy + 82} width={18} height={24} rx={8} fill={g} />
        </g>
      </g>
    </g>
  );
}

function Wardrobe({ uid }: { uid: string }) {
  const wood = `url(#${uid}-wood)`;
  const door = `url(#${uid}-door)`;
  return (
    <g>
      {/* side face (pseudo-3D) — the face being pushed */}
      <path d={`M${WR},${WT} L${WR + 24},${WT - 14} L${WR + 24},${GROUND - 28} L${WR},${GROUND - 14} Z`} fill="#7c4a26" />
      <path d={`M${WL - 8},${WT - 14} L${WR + 8},${WT - 14} L${WR + 32},${WT - 28} L${WL + 16},${WT - 28} Z`} fill="#9a5f33" />
      <rect x={WL - 8} y={WT - 14} width={WR - WL + 16} height={16} fill="#7a4523" />
      <rect x={WL} y={WT} width={WR - WL} height={GROUND - 14 - WT} fill={wood} />
      {/* doors */}
      {[0, 1].map((i) => {
        const x = WL + 12 + i * 106;
        return (
          <g key={i} data-bone={`w-door${i}`} data-pivot={`${i ? x + 100 : x} ${WT + 12}`}>
            <rect x={x} y={WT + 12} width={100} height={196} rx={3} fill={door} stroke="#6e4223" strokeWidth={2.5} />
            <rect x={x + 12} y={WT + 26} width={76} height={168} rx={3} fill="none" stroke="#8a5530" strokeWidth={2} opacity={0.8} />
            <path d={`M${x + 30},${WT + 40} Q${x + 36},${WT + 110} ${x + 28},${WT + 180}`} stroke="#c58650" strokeWidth={2} fill="none" opacity={0.5} />
            <rect x={i ? x + 10 : x + 82} y={WT + 92} width={7} height={48} rx={3.5} fill="#e6cf9e" stroke="#7a5a34" strokeWidth={1.5} />
          </g>
        );
      })}
      {/* drawers */}
      {[0, 1].map((i) => {
        const y = WT + 218 + i * 48;
        return (
          <g key={i} data-bone={`w-drawer${i}`}>
            <rect x={WL + 12} y={y} width={WR - WL - 24} height={42} rx={3} fill={door} stroke="#6e4223" strokeWidth={2.5} />
            <circle cx={(WL + WR) / 2} cy={y + 21} r={5.5} fill="#e6cf9e" stroke="#7a5a34" strokeWidth={1.5} />
          </g>
        );
      })}
      <rect x={WL} y={WT} width={WR - WL} height={GROUND - 14 - WT} fill="none" stroke="#5e3313" strokeWidth={3} />
      {/* short legs */}
      <rect x={WL + 8} y={GROUND - 15} width={16} height={15} rx={3} fill="#5e3313" />
      <rect x={WR - 24} y={GROUND - 15} width={16} height={15} rx={3} fill="#5e3313" />
      <rect x={WR + 6} y={GROUND - 26} width={12} height={12} rx={3} fill="#4d2a10" />
    </g>
  );
}

function Art({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-lim`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f2f3f5" />
          <stop offset="0.45" stopColor="#cfd2d7" />
          <stop offset="1" stopColor="#8e939b" />
        </linearGradient>
        <linearGradient id={`${uid}-limD`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c7cad0" />
          <stop offset="0.5" stopColor="#a6aab1" />
          <stop offset="1" stopColor="#767b83" />
        </linearGradient>
        <radialGradient id={`${uid}-joint`} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#d2d5da" />
          <stop offset="1" stopColor="#979ca4" />
        </radialGradient>
        <radialGradient id={`${uid}-jointD`} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#d9dce0" />
          <stop offset="1" stopColor="#7c818a" />
        </radialGradient>
        <radialGradient id={`${uid}-head`} cx="0.32" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#e2e4e8" />
          <stop offset="1" stopColor="#8d929a" />
        </radialGradient>
        <linearGradient id={`${uid}-torso`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#eceef1" />
          <stop offset="0.5" stopColor="#c8cbd1" />
          <stop offset="1" stopColor="#868b93" />
        </linearGradient>
        <linearGradient id={`${uid}-wood`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b8763f" />
          <stop offset="1" stopColor="#8d5226" />
        </linearGradient>
        <linearGradient id={`${uid}-door`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c0814a" />
          <stop offset="0.5" stopColor="#a96a37" />
          <stop offset="1" stopColor="#995e2f" />
        </linearGradient>
      </defs>

      {/* strong rectangular backdrop motif */}
      <g opacity={0.28} fill="none" stroke="#d6c2ad" strokeWidth={3}>
        <rect x={60} y={70} width={140} height={140} />
        <rect x={740} y={110} width={160} height={90} />
        <path d="M700,90 h40 M880,240 v40" />
      </g>

      <Ground ticks={false} />
      <StartMarker x={WL} label="ตำแหน่งเดิมของตู้" height={360} anchor="start" />

      {/* contact shadows stay on the floor; they tighten when the near legs lift a hair */}
      <ellipse data-shadow="wardrobe" cx={W_SHADOW_X} cy={GROUND + 3} rx={150} ry={8} fill="rgba(60,30,10,0.16)" />
      <ellipse data-shadow="wleg" cx={WR - 16} cy={GROUND + 1} rx={14} ry={3} fill="rgba(50,25,8,0.3)" />
      <g data-bone="wardrobe" data-pivot={`${WL} ${GROUND}`}>
        <Wardrobe uid={uid} />
      </g>

      <g className="impact" stroke="#5e3313" strokeWidth={3} strokeLinecap="round" opacity={0}>
        <path d="M488,268 l-14,-10 M486,300 l-18,0 M488,336 l-14,10" />
      </g>
      <g className="dust" />

      <ellipse data-shadow="front" cx={FOOT_FRONT - 8} cy={GROUND + 2} rx={26} ry={4} fill="rgba(30,30,40,0.18)" />
      <ellipse data-shadow="rear" cx={720} cy={GROUND + 2} rx={26} ry={4} fill="rgba(30,30,40,0.18)" />

      {/* mannequin */}
      <g data-bone="m-hips">
        <g data-bone="m-torsoB" data-pivot={`${HIP.x} ${HIP.y}`}>
          <Arm id="F" far uid={uid} />
        </g>
        <Leg id="F" far uid={uid} />
        <g data-bone="m-torso" data-pivot={`${HIP.x} ${HIP.y}`}>
          <path
            d={`M${HIP.x - 22},${HIP.y + 10} Q${HIP.x - 26},${HIP.y - 20} ${HIP.x - 18},${HIP.y - 46} Q${HIP.x - 30},${HIP.y - 70} ${HIP.x - 26},${HIP.y - 96} Q${HIP.x},${HIP.y - 110} ${HIP.x + 26},${HIP.y - 96} Q${HIP.x + 30},${HIP.y - 70} ${HIP.x + 18},${HIP.y - 46} Q${HIP.x + 26},${HIP.y - 20} ${HIP.x + 22},${HIP.y + 10} Q${HIP.x},${HIP.y + 20} ${HIP.x - 22},${HIP.y + 10} Z`}
            fill={`url(#${uid}-torso)`}
          />
          <path d={`M${HIP.x - 14},${HIP.y - 48} Q${HIP.x},${HIP.y - 42} ${HIP.x + 14},${HIP.y - 48}`} stroke="#a7abb2" strokeWidth={2} fill="none" opacity={0.6} />
          <g data-bone="m-head" data-pivot={`${HIP.x} ${HIP.y - 104}`}>
            <Limb x={HIP.x} y={HIP.y - 122} w={14} h={24} fill={`url(#${uid}-lim)`} />
            <ellipse cx={HIP.x} cy={HIP.y - 140} rx={21} ry={25} fill={`url(#${uid}-head)`} />
            <ellipse cx={HIP.x - 8} cy={HIP.y - 150} rx={6} ry={4} fill="#ffffff" opacity={0.55} />
          </g>
        </g>
        <Leg id="N" uid={uid} />
        <g data-bone="m-torsoF" data-pivot={`${HIP.x} ${HIP.y}`}>
          <Arm id="N" uid={uid} />
        </g>
      </g>

      <g className="phys">
        <Arrow x1={640} y1={244} x2={WR + 26} y2={244} color="#e2412b" label="F (แรง)" lx={600} ly={212} />
        <circle className="phys-head" cx={WL} cy={GROUND + 30} r={9} fill="#5e3313" />
        <Label x={(WL + WR) / 2} y={GROUND - 88} text="s = 0  (ตู้ไม่เคลื่อนที่)" color="#5e3313" filled />
        <Label x={(WL + WR) / 2 + 40} y={142} text="W = F × 0 = 0" color="#1b1a2e" />
      </g>
    </>
  );
}

function createRig(svg: SVGSVGElement, opts: Parameters<SceneModule['createRig']>[1]) {
  const rig = new Rig(svg);
  const B = (n: string) => rig.b(n);
  const hips = B('m-hips'),
    torso = B('m-torso'),
    torsoB = B('m-torsoB'),
    torsoF = B('m-torsoF'),
    head = B('m-head'),
    wardrobe = B('wardrobe');
  const legF = { th: B('m-thighF'), sh: B('m-shinF'), ft: B('m-footF') };
  const legN = { th: B('m-thighN'), sh: B('m-shinN'), ft: B('m-footN') };
  const armN = { up: B('m-upN'), lo: B('m-foreN'), hd: B('m-handN') };
  const armF = { up: B('m-upF'), lo: B('m-foreF'), hd: B('m-handF') };
  const doors = [B('w-door0'), B('w-door1')];
  const drawers = [B('w-drawer0'), B('w-drawer1')];
  const impact = svg.querySelector<SVGGElement>('.impact')!;
  const wShadow = svg.querySelector<SVGEllipseElement>('[data-shadow="wardrobe"]')!;
  const legShadow = svg.querySelector<SVGEllipseElement>('[data-shadow="wleg"]')!;
  const rearShadow = svg.querySelector<SVGEllipseElement>('[data-shadow="rear"]')!;
  const dust = new DustPool(svg.querySelector<SVGGElement>('.dust'), 14, '#cfc6ba');
  const PAN_W = panAt((WL + WR) / 2); // wardrobe
  const PAN_M = panAt(640); // mannequin

  // tilt: wardrobe rock (deg, ≥ 0) · rattle: loose doors / drawers · shoulder: protraction into the push
  const pose = { hx: 8, hy: -2, lean: -34, rearX: 700, rearLift: 0, effort: 0, shake: 0, headDown: 0, impact: 0, exhale: 0, tilt: 0, rattle: 0, shoulder: 0 };

  // P is the runtime's live pose (a copy of `pose`): tweens must target it, not the template
  const pulse = (tl: gsap.core.Timeline, P: typeof pose, t: number, k: number, cue: (at: number, fn: () => void) => void) => {
    const peak = 0.3 + k * 0.15; // degrees: 0.3° → 0.45° → 0.6° as the pushes get harder (≤ 0.8° with vibration)
    // drive: knees and hips load up, shoulders protract into the wood
    tl.to(P, { effort: 0.7 + k * 0.15, hx: -6 - k * 3, hy: 18 + k * 2, lean: -48 - k * 2, headDown: 1, shoulder: 1, duration: 0.38, ease: 'power3.in' }, t);
    tl.to(P, { impact: 1, duration: 0.08 }, t + 0.36).to(P, { impact: 0, duration: 0.35 }, t + 0.5);
    tl.to(P, { shake: 1, duration: 0.1 }, t + 0.36).to(P, { shake: 0, duration: 0.5, ease: 'power2.out' }, t + 0.7);
    // the wardrobe resists, then its near side lifts a hair about the far corner…
    tl.to(P, { tilt: peak, duration: 0.24, ease: 'power2.out' }, t + 0.22);
    tl.to(P, { rattle: 1, duration: 0.06 }, t + 0.36).to(P, { rattle: 0, duration: 0.42, ease: 'power2.out' }, t + 0.42);
    // …and its weight shoves back: the body recoils a little
    tl.to(P, { hx: -3 - k * 3, lean: -46 - k * 2, duration: 0.22, ease: 'power2.out' }, t + 0.42);
    // weight wins: it drops back onto its legs, settling to exactly 0
    tl.to(P, { tilt: 0, duration: 0.34, ease: 'bounce.out' }, t + 0.72);
    const land = t + 0.72 + 0.34 * 0.364; // bounce.out first touches down at ~36% of its duration
    tl.to(P, { rattle: 0.6 + k * 0.15, duration: 0.04 }, land).to(P, { rattle: 0, duration: 0.36, ease: 'power2.out' }, land + 0.05);
    tl.to(P, { effort: 0.45, hx: -1, hy: 15, lean: -45, shoulder: 0.4, duration: 0.42, ease: 'power2.out' }, t + 0.82);
    // build-up: breath held behind the effort, palms press into the wood
    cue(t + 0.02, () => sfx.play('strain', { gain: 0.12 + k * 0.03, pan: PAN_M, lowpass: 2200, send: 0.12, duration: 0.5 }));
    cue(t + 0.22, () => sfx.play('wood_rub', { gain: 0.1 + k * 0.03, pan: PAN_W, duration: 0.25, lowpass: 2400, offset: 0.3 }));
    // the frame groans as the near side starts to lift
    cue(t + 0.28, () => sfx.play('creak_deep', { gain: 0.34 + k * 0.1, pan: PAN_W, lowpass: 3800 - k * 600, send: 0.22 }));
    // peak of the shove: contents shiver, feet grind on the floor (nothing slides)
    cue(t + 0.36, () => {
      sfx.play('cabinet_rattle', { gain: 0.14 + k * 0.04, pan: PAN_W, lowpass: 5000, send: 0.12 });
      sfx.play('squeak', { gain: 0.2 + k * 0.06, pan: PAN_M + 0.08, lowpass: 3600 });
      sfx.play('step_work', { gain: 0.3, pan: PAN_M, rate: 0.85, lowpass: 1800 });
      dust.emit(FOOT_FRONT + 6, GROUND - 4, { dx: 30, dy: -10, r: 6 });
      dust.emit(P.rearX - 10, GROUND - 4, { dx: 34, dy: -12, r: 7 });
    });
    // touch-down: a dull wooden knock and a short rattle of the doors
    cue(land, () => {
      sfx.play('woodblock', { gain: 0.14 + k * 0.05, pan: PAN_W, rate: 0.45, lowpass: 700, send: 0.2 });
      sfx.play('cabinet_rattle', { gain: 0.08 + k * 0.03, pan: PAN_W, delay: 0.02, lowpass: 3800, send: 0.1 });
      dust.emit(WR - 10, GROUND - 4, { dx: 12, dy: -6, r: 4, opacity: 0.35 });
    });
  };

  return createRuntime(
    svg,
    {
      pose,
      ambient: { t: 0, breathe: 0 },
      build(tl, P, ctx) {
        const cue = (at: number, fn: () => void) => ctx.cue(tl, at, fn);
        // brace: rear foot steps back into a wide stance
        tl.to(P, { rearLift: 1, duration: 0.25, ease: 'power2.out' }, 0.1);
        tl.to(P, { rearX: 742, duration: 0.5, ease: 'power2.inOut' }, 0.1);
        tl.to(P, { rearLift: 0, duration: 0.25, ease: 'power2.in' }, 0.35);
        cue(0.36, () => sfx.play('squeak', { gain: 0.18, pan: panAt(742), lowpass: 3400 }));
        cue(0.6, () => sfx.play('step_work', { gain: 0.45, pan: panAt(742), rate: 0.9, lowpass: 2400 }));
        cue(0.95, () => sfx.play('wood_rub', { gain: 0.12, pan: PAN_W, duration: 0.3, lowpass: 2600 }));
        // knees bend, torso drops into the push
        tl.to(P, { hx: 2, hy: 14, lean: -45, duration: 0.7, ease: 'power2.inOut' }, 0.6);
        pulse(tl, P, 1.35, 0, cue);
        pulse(tl, P, 2.6, 1, cue);
        pulse(tl, P, 3.85, 2, cue);
        // release: the wardrobe settles back with a tiny creak, a long breath out
        cue(5.15, () => sfx.play('creak_deep', { gain: 0.14, pan: PAN_W, lowpass: 2400, rate: 0.9 }));
        cue(5.35, () => sfx.play('breath_m', { gain: 0.16, pan: PAN_M, lowpass: 2800, rate: 0.9, send: 0.14 }));
        // give up: straighten, exhale. Wardrobe hasn't moved at all.
        tl.to(P, { effort: 0, hx: 8, hy: 0, lean: -32, headDown: 0, duration: 1.0, ease: 'power2.inOut' }, 5.1);
        tl.to(P, { exhale: 1, duration: 0.4, ease: 'power2.out' }, 5.3).to(P, { exhale: 0, duration: 0.6 }, 5.7);
        tl.to({}, { duration: 0.1 }, 6.5);
      },
      buildAmbient(A) {
        return [
          gsap.to(A, { t: 1000, duration: 1000, ease: 'none', repeat: -1 }),
          gsap.to(A, { breathe: 1, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }),
        ];
      },
      onStop() {
        dust.clear();
      },
      render(P, A) {
        const t = A.t;
        const trem = P.effort * P.effort;
        const n1 = (Math.sin(t * 47) * 0.6 + Math.sin(t * 31.7) * 0.4) * trem;
        const n2 = (Math.sin(t * 53.3) * 0.5 + Math.sin(t * 23.1) * 0.5) * trem;
        // wardrobe: rock about the far bottom corner (never below rest) + pressure vibration
        const nz = Math.sin(t * 61) * 0.55 + Math.sin(t * 97.3) * 0.3 + Math.sin(t * 143.9) * 0.15;
        // only a hard shove buzzes the frame; between pushes it rests exactly at 0
        const pressing = clamp((P.effort - 0.5) / 0.3, 0, 1);
        const vib = (0.06 * trem * pressing + 0.12 * P.rattle) * (0.5 + 0.5 * nz);
        const rock = Math.max(0, P.tilt) + vib;
        wardrobe.r = -rock;
        wardrobe.x = 0; // no translation, ever
        wardrobe.y = 0;
        doors.forEach((d, i) => (d.r = Math.sin(t * (83 + i * 17) + i) * 0.35 * P.rattle * (i ? -1 : 1)));
        drawers.forEach((d, i) => (d.y = Math.sin(t * (91 + i * 13) + i * 2) * 0.6 * P.rattle));
        const lift = LEG_REACH * Math.sin(rock / DEG);
        wShadow.setAttribute('rx', (150 - lift * 4).toFixed(2));
        wShadow.setAttribute('cx', (W_SHADOW_X - lift * 2).toFixed(2));
        legShadow.setAttribute('opacity', clamp(1 - lift / 2.5, 0.25, 1).toFixed(3));
        legShadow.setAttribute('rx', (14 + lift * 2).toFixed(2));

        // the body shudders harder at the moment of impact
        hips.x = P.hx + n1 * (1.6 + 1.4 * P.shake);
        hips.y = P.hy + n2 * (1.0 + 0.8 * P.shake) + A.breathe * 0.8 * (1 - P.effort);
        torso.r = torsoB.r = torsoF.r = P.lean + n2 * 1.2;
        head.r = -14 * P.headDown + 10 * P.exhale + n1 * 1.5 - 2;
        // strain: shoulders drive forward / down into the push, neck sinks between them
        torsoF.x = torsoB.x = -2.5 * P.shoulder + n2 * 0.6;
        torsoF.y = torsoB.y = 1.5 * P.shoulder;
        head.y = 2.5 * P.shoulder;

        // feet stay planted (front fixed; rear re-plants once)
        ik2(legF.th, legF.sh, { x: HIP.x, y: HIP.y + 110 }, { x: P.rearX, y: GROUND - 8 - P.rearLift * 16 }, 1);
        ik2(legN.th, legN.sh, { x: HIP.x, y: HIP.y + 110 }, { x: FOOT_FRONT, y: GROUND - 8 }, 1);
        setWorldAngle(legF.ft, -P.rearLift * 12 + (1 - P.rearLift) * -14 * clamp(P.effort * 1.5, 0, 1));
        setWorldAngle(legN.ft, 0);
        rearShadow.setAttribute('cx', String(P.rearX - 8));
        rearShadow.setAttribute('opacity', String(1 - P.rearLift * 0.6));

        // hands pinned to the wardrobe's side face (they ride its tiny rock)
        const sy = HIP.y - 92;
        ik2(armN.up, armN.lo, { x: HIP.x, y: sy + 86 }, wardrobe.toWorld(HAND_N), -1);
        ik2(armF.up, armF.lo, { x: HIP.x, y: sy + 86 }, wardrobe.toWorld(HAND_F), -1);
        setWorldAngle(armN.hd, lerp(-88, -96, P.effort) - rock);
        setWorldAngle(armF.hd, lerp(-86, -94, P.effort) - rock);

        impact.setAttribute('opacity', (P.impact * 0.9).toFixed(3));
        impact.setAttribute('transform', `translate(${(-P.impact * 4).toFixed(2)} 0)`);
        rig.apply();
      },
    },
    opts,
  );
}

export const WardrobeScene: SceneModule = {
  Art,
  createRig,
  focus: [200, 96, 620, 524],
  alt: 'หุ่นคนสีเทาไร้ใบหน้ายืนแยกขากว้างเอนตัวผลักตู้ไม้สีน้ำตาลบานใหญ่สุดแรง แต่ตู้ยังอยู่ที่ตำแหน่งเดิม',
};
