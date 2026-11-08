import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, type ReactNode } from 'react';
import type { RigHandle, RigOptions } from '../rig/runtime';

export const VB_W = 960;
export const VB_H = 640;
export const GROUND = 520;

export interface SceneModule {
  Art: (props: { uid: string }) => ReactNode;
  createRig(svg: SVGSVGElement, opts: RigOptions): RigHandle;
  /** aria description of the illustration */
  alt: string;
  /** region that must always be visible: [x, y, w, h]; the viewBox grows around it to fill the plate */
  focus: [number, number, number, number];
}

/* ------------------------------------------------------------------ */
/* Physics overlay primitives                                          */
/* ------------------------------------------------------------------ */

interface ArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  label?: string;
  lx?: number;
  ly?: number;
  width?: number;
  dashed?: boolean;
  head?: number;
  anchor?: 'start' | 'middle' | 'end';
  labelSize?: number;
}

export function Arrow({ x1, y1, x2, y2, color, label, lx, ly, width = 6, dashed, head = 18, anchor = 'middle', labelSize = 22 }: ArrowProps) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  // shorten the shaft so the round cap hides under the head
  const sx2 = x2 - Math.cos(a) * head * 0.6;
  const sy2 = y2 - Math.sin(a) * head * 0.6;
  const hw = head * 0.62;
  const p1 = `${x2},${y2}`;
  const p2 = `${x2 - Math.cos(a) * head + Math.cos(a + Math.PI / 2) * hw},${y2 - Math.sin(a) * head + Math.sin(a + Math.PI / 2) * hw}`;
  const p3 = `${x2 - Math.cos(a) * head - Math.cos(a + Math.PI / 2) * hw},${y2 - Math.sin(a) * head - Math.sin(a + Math.PI / 2) * hw}`;
  return (
    <g>
      <path
        className="phys-line"
        d={`M${x1},${y1} L${sx2},${sy2}`}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        fill="none"
        data-dash={dashed ? '3 11' : undefined}
      />
      <polygon className="phys-head" points={`${p1} ${p2} ${p3}`} fill={color} strokeLinejoin="round" stroke={color} strokeWidth={2} />
      {label && <Label x={lx ?? (x1 + x2) / 2} y={ly ?? (y1 + y2) / 2 - 22} text={label} color={color} anchor={anchor} size={labelSize} />}
    </g>
  );
}

export function Label({ x, y, text, color, anchor = 'middle', size = 22, filled }: { x: number; y: number; text: string; color: string; anchor?: 'start' | 'middle' | 'end'; size?: number; filled?: boolean }) {
  return (
    <g className="phys-label">
      <rect className="phys-pill" rx={12} fill={filled ? color : '#ffffff'} stroke={color} strokeWidth={2.5} />
      <text
        x={x}
        y={y}
        textAnchor={anchor}
        dominantBaseline="central"
        fontSize={size}
        fontWeight={600}
        fill={filled ? '#ffffff' : color}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {text}
      </text>
    </g>
  );
}

/** Size every label pill to its text (needs real font metrics). */
export function fitLabels(svg: SVGSVGElement) {
  svg.querySelectorAll<SVGGElement>('.phys-label').forEach((g) => {
    const t = g.querySelector('text');
    const r = g.querySelector('rect');
    if (!t || !r) return;
    try {
      const b = t.getBBox();
      const px = 12;
      const py = 5;
      r.setAttribute('x', String(b.x - px));
      r.setAttribute('y', String(b.y - py));
      r.setAttribute('width', String(b.width + px * 2));
      r.setAttribute('height', String(b.height + py * 2));
    } catch {
      /* not rendered yet */
    }
  });
}

/* ------------------------------------------------------------------ */
/* Ground / markers                                                    */
/* ------------------------------------------------------------------ */

/** The original worksheet's double black ground line, extended for camera travel. */
export function Ground({ y = GROUND, x1 = -1200, x2 = 2400, ticks = true, color = '#232323' }: { y?: number; x1?: number; x2?: number; ticks?: boolean; color?: string }) {
  const marks: ReactNode[] = [];
  if (ticks) {
    for (let x = Math.ceil(x1 / 64) * 64; x < x2; x += 64) {
      marks.push(<line key={x} x1={x} y1={y + 16} x2={x - 10} y2={y + 26} stroke="#d9d4cb" strokeWidth={2} strokeLinecap="round" />);
    }
  }
  return (
    <g className="ground">
      <rect x={x1} y={y} width={x2 - x1} height={600} fill="#faf8f4" />
      {marks}
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={3} />
      <line x1={x1} y1={y + 7} x2={x2} y2={y + 7} stroke={color} strokeWidth={1.6} />
    </g>
  );
}

export function StartMarker({ x, y = GROUND, label = 'จุดเริ่มต้น', color = '#8a8478', height = 250, anchor = 'middle' }: { x: number; y?: number; label?: string; color?: string; height?: number; anchor?: 'start' | 'middle' }) {
  return (
    <g className="start-marker" opacity={0.85}>
      <line x1={x} y1={y - height} x2={x} y2={y + 30} stroke={color} strokeWidth={2} strokeDasharray="6 7" />
      <circle cx={x} cy={y + 30} r={5} fill={color} />
      <text x={anchor === 'start' ? x + 12 : x} y={y + 54} textAnchor={anchor} fontSize={17} fill={color} fontWeight={500} style={{ fontFamily: 'var(--font-body)' }}>
        {label}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* View wrapper                                                        */
/* ------------------------------------------------------------------ */

interface ViewProps {
  scene: SceneModule;
  uid: string;
  onComplete?: () => void;
  reduced: boolean;
  still?: boolean;
  className?: string;
}

export const SceneView = forwardRef<RigHandle | null, ViewProps>(function SceneView({ scene, uid, onComplete, reduced, still, className }, ref) {
  const svgRef = useRef<SVGSVGElement>(null);
  const rigRef = useRef<RigHandle | null>(null);
  const cbRef = useRef(onComplete);
  cbRef.current = onComplete;

  useLayoutEffect(() => {
    const svg = svgRef.current!;
    const rig = scene.createRig(svg, { reduced, still, onComplete: () => cbRef.current?.() });
    rigRef.current = rig;
    if (still) rig.showFinal();
    fitLabels(svg);
    let alive = true;
    document.fonts?.ready.then(() => alive && fitLabels(svg));
    return () => {
      alive = false;
      rig.destroy();
      rigRef.current = null;
    };
  }, [scene, reduced, still]);

  // Fit the scene's focus rect to the plate, extending the world (not letterboxing).
  useLayoutEffect(() => {
    const svg = svgRef.current!;
    const [fx, fy, fw, fh] = scene.focus;
    const fit = () => {
      const r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const a = r.width / r.height;
      let x = fx, y = fy, w = fw, h = fh;
      if (a > fw / fh) {
        w = fh * a;
        x = fx - (w - fw) / 2;
      } else {
        h = fw / a;
        y = fy - (h - fh) * 0.55;
      }
      svg.setAttribute('viewBox', `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(svg);
    return () => ro.disconnect();
  }, [scene]);

  useImperativeHandle(ref, () => ({
    play: () => rigRef.current?.play(),
    showFinal: () => rigRef.current?.showFinal(),
    reset: () => rigRef.current?.reset(),
    setPhysics: (on, animate) => rigRef.current?.setPhysics(on, animate),
    destroy: () => rigRef.current?.destroy(),
  }));

  const Art = scene.Art;
  return (
    <svg ref={svgRef} className={className} viewBox={scene.focus.join(' ')} preserveAspectRatio="xMidYMid meet" role="img" aria-label={scene.alt}>
      <Art uid={uid} />
    </svg>
  );
});
