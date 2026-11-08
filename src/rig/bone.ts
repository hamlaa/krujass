/**
 * Tiny forward-kinematics rig for hand-drawn SVG characters.
 *
 * Each `<g data-bone="name" data-pivot="x y">` is a joint. Its transform is
 * rebuilt from scratch every frame from numeric pose values (never
 * accumulated), which makes every timeline deterministic and replay-safe.
 */
export interface Pt {
  x: number;
  y: number;
}

export const DEG = 180 / Math.PI;
export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const fract = (v: number) => v - Math.floor(v);

export class Bone {
  x = 0;
  y = 0;
  r = 0;
  sx = 1;
  sy = 1;
  parent: Bone | null = null;
  private last = '';

  constructor(
    public readonly name: string,
    public readonly el: SVGGraphicsElement | null,
    public readonly px = 0,
    public readonly py = 0,
  ) {}

  local(): DOMMatrix {
    const m = new DOMMatrix();
    m.translateSelf(this.x + this.px, this.y + this.py);
    if (this.r) m.rotateSelf(this.r);
    if (this.sx !== 1 || this.sy !== 1) m.scaleSelf(this.sx, this.sy);
    m.translateSelf(-this.px, -this.py);
    return m;
  }

  world(): DOMMatrix {
    return this.parent ? this.parent.world().multiply(this.local()) : this.local();
  }

  /** Absolute rotation of this bone's frame (degrees). */
  worldAngle(): number {
    const m = this.world();
    return Math.atan2(m.b, m.a) * DEG;
  }

  toWorld(p: Pt): Pt {
    const q = this.world().transformPoint(new DOMPoint(p.x, p.y));
    return { x: q.x, y: q.y };
  }

  toLocalOfParent(p: Pt): Pt {
    if (!this.parent) return p;
    const q = this.parent.world().inverse().transformPoint(new DOMPoint(p.x, p.y));
    return { x: q.x, y: q.y };
  }

  reset() {
    this.x = this.y = this.r = 0;
    this.sx = this.sy = 1;
  }

  apply() {
    if (!this.el) return;
    const m = this.local();
    const s = `matrix(${m.a.toFixed(5)} ${m.b.toFixed(5)} ${m.c.toFixed(5)} ${m.d.toFixed(5)} ${m.e.toFixed(2)} ${m.f.toFixed(2)})`;
    if (s !== this.last) {
      this.el.setAttribute('transform', s);
      this.last = s;
    }
  }
}

export class Rig {
  readonly bones = new Map<string, Bone>();
  private order: Bone[] = [];

  constructor(root: SVGElement) {
    root.querySelectorAll<SVGGraphicsElement>('[data-bone]').forEach((el) => {
      const name = el.getAttribute('data-bone')!;
      const [px, py] = (el.getAttribute('data-pivot') || '0 0').split(/[ ,]+/).map(Number);
      const b = new Bone(name, el, px || 0, py || 0);
      if (this.bones.has(name)) throw new Error(`Duplicate bone "${name}"`);
      this.bones.set(name, b);
      this.order.push(b);
    });
    for (const b of this.order) {
      let p: Element | null = b.el!.parentElement;
      while (p && p !== (root as Element)) {
        const n = p.getAttribute('data-bone');
        if (n) {
          b.parent = this.bones.get(n)!;
          break;
        }
        p = p.parentElement;
      }
    }
  }

  b(name: string): Bone {
    const b = this.bones.get(name);
    if (!b) throw new Error(`Missing bone "${name}"`);
    return b;
  }

  resetAll() {
    for (const b of this.order) b.reset();
  }

  apply() {
    for (const b of this.order) b.apply();
  }
}

/**
 * Analytic two-bone IK.
 * @param upper  bone rotating at its pivot (shoulder / hip)
 * @param lower  child bone rotating at its pivot (elbow / knee), pivot = `mid` in upper's frame
 * @param end    effector point (wrist / ankle) in lower's local frame
 * @param target effector target in scene (root SVG) coordinates
 * @param bend   +1 / -1 chooses which side the middle joint folds to
 */
export function ik2(upper: Bone, lower: Bone, end: Pt, target: Pt, bend: 1 | -1) {
  const J: Pt = { x: upper.px, y: upper.py };
  const M: Pt = { x: lower.px, y: lower.py };
  upper.r = 0;
  lower.r = 0;
  const t = upper.toLocalOfParent(target);
  const S: Pt = { x: upper.x + J.x, y: upper.y + J.y };
  const L1 = Math.hypot(M.x - J.x, M.y - J.y);
  const L2 = Math.hypot(end.x - M.x, end.y - M.y);
  const a0 = Math.atan2(M.y - J.y, M.x - J.x);
  const b0 = Math.atan2(end.y - M.y, end.x - M.x);
  const dx = t.x - S.x;
  const dy = t.y - S.y;
  const d = clamp(Math.hypot(dx, dy), Math.abs(L1 - L2) + 0.01, L1 + L2 - 0.01);
  const phi = Math.atan2(dy, dx);
  const alpha = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const ua = phi + bend * alpha;
  const E: Pt = { x: S.x + L1 * Math.cos(ua), y: S.y + L1 * Math.sin(ua) };
  const T: Pt = { x: S.x + d * Math.cos(phi), y: S.y + d * Math.sin(phi) };
  const la = Math.atan2(T.y - E.y, T.x - E.x);
  upper.r = (ua - a0) * DEG;
  lower.r = (la - b0) * DEG - upper.r;
}

/** Rotate `bone` so that its absolute world angle equals `angle` (deg). */
export function setWorldAngle(bone: Bone, angle: number) {
  bone.r = 0;
  const parentAngle = bone.parent ? bone.parent.worldAngle() : 0;
  bone.r = angle - parentAngle;
}
