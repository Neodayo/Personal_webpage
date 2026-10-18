"use client";

import { useEffect, useRef, useState } from "react";

type Item = { id: string; label: string };

/* ------------------------------------------------------------------ */
/* Hand model: a pointing hand built from tapered capsules             */
/* ------------------------------------------------------------------ */
// [x1, y1, x2, y2, radius at start, radius at end], y is down.
// Index fingertip is at TIP; the forearm runs off to the lower left.
type Seg = [number, number, number, number, number, number];
const SEGS: Seg[] = [
  // index finger, extended up and to the right
  [292, 132, 345, 102, 17, 13],
  [345, 102, 392, 74, 13, 7],
  // middle finger, curled: out, then down
  [282, 150, 330, 152, 17, 15],
  [330, 152, 348, 176, 15, 13],
  [348, 176, 348, 214, 13, 10],
  // ring finger, curled
  [268, 170, 312, 178, 16, 14],
  [312, 178, 326, 198, 14, 12],
  [326, 198, 324, 224, 12, 9],
  // pinky, curled
  [258, 190, 296, 200, 14, 12],
  [296, 200, 312, 216, 12, 10],
  [312, 216, 314, 230, 10, 8],
  // thumb, tucked under
  [236, 206, 278, 214, 15, 12],
  [278, 214, 300, 214, 12, 9],
  // back of hand
  [212, 200, 272, 160, 46, 34],
  // wrist + forearm
  [196, 214, 120, 232, 38, 36],
  [120, 232, -40, 268, 36, 40],
];
const TIP = { x: 392, y: 74 };

// Sprite bounds in the same space
const BX = -40;
const BY = 55;
const BW = 450;
const BH = 250;
const SCALE = 1.2; // model units -> screen px at scale 1

// Look & feel knobs
const COLW = 5; // column spacing
const ROWH = 4.4; // row spacing
const ZIG = 1.8; // sideways zigzag of each column
const GLYPH = 6.5; // font size
const RES = 3; // sprite sharpness
const CHARS = "01{;01";
const AMBIENT = 0.3;
const DIFFUSE = 0.62;
const RIM = 0.28;

const LIGHT = (() => {
  const v = [-0.35, -0.75, 0.55];
  const l = Math.hypot(v[0], v[1], v[2]);
  return v.map((n) => n / l);
})();

// Surface height at (x, y): every segment is a cylinder.
function field(x: number, y: number) {
  let H = 0;
  let edge = 0;
  for (const [x1, y1, x2, y2, r1, r2] of SEGS) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const t = Math.max(
      0,
      Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy))
    );
    const r = r1 + (r2 - r1) * t;
    const d = Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
    if (d >= r) continue;
    const h = Math.sqrt(r * r - d * d);
    if (h > H) {
      H = h;
      edge = d / r;
    }
  }
  return { H, edge };
}

// 0..1 brightness, or null outside the hand.
function shade(x: number, y: number): number | null {
  const { H, edge } = field(x, y);
  if (H <= 0) return null;
  const e = 1.5;
  const hx = (1.6 * (field(x + e, y).H - field(x - e, y).H)) / (2 * e);
  const hy = (1.6 * (field(x, y + e).H - field(x, y - e).H)) / (2 * e);
  const diffuse = Math.max(
    0,
    (-hx * LIGHT[0] - hy * LIGHT[1] + LIGHT[2]) / Math.hypot(hx, hy, 1)
  );
  return Math.max(
    0,
    Math.min(1, AMBIENT + DIFFUSE * diffuse + RIM * Math.pow(edge, 4))
  );
}

function buildSprite(fontFamily: string, color: string) {
  const sprite = document.createElement("canvas");
  sprite.width = Math.ceil(BW * SCALE * RES);
  sprite.height = Math.ceil(BH * SCALE * RES);
  const ctx = sprite.getContext("2d")!;
  ctx.scale(SCALE * RES, SCALE * RES);
  ctx.translate(-BX, -BY);
  ctx.font = `${GLYPH}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Vertical columns of glyphs; odd rows shift sideways so each column
  // zigzags, which gives the herringbone texture.
  for (let c = 0, cx = BX + COLW / 2; cx < BX + BW; c++, cx += COLW) {
    for (let r = 0, y = BY + ROWH / 2; y < BY + BH; r++, y += ROWH) {
      const x = cx + (r % 2 ? ZIG : -ZIG);
      const b = shade(x, y);
      if (b === null) continue;
      // The forearm fades out toward the left edge.
      const u = Math.max(0, Math.min(1, (60 - x) / 100));
      const a = b * (1 - u * u * (3 - 2 * u));
      if (a < 0.08) continue;
      ctx.globalAlpha = Math.min(1, a * 1.2);
      ctx.fillText(CHARS[(c * 7 + r * 13) % CHARS.length], x, y);
    }
  }
  return sprite;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function HandNav({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0].id);
  const activeRef = useRef(items[0].id);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Track which section is in the middle of the screen.
  useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            activeRef.current = e.target.id;
            setActive(e.target.id);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  // Draw the hand and ease it toward the active item.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { fontFamily, color } = getComputedStyle(canvas);

    let sprite: HTMLCanvasElement | null = null;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) sprite = buildSprite(fontFamily, color);
    });

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let cur: { x: number; y: number } | null = null;

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    };

    const frame = (t: number) => {
      const el = itemRefs.current[activeRef.current];
      if (el) {
        const r = el.getBoundingClientRect();
        const tx = r.left - 14; // stop just short of the label
        const ty = r.top + r.height / 2;
        if (!cur) cur = { x: reduce ? tx : tx - 240, y: ty }; // slide in on load
        const k = reduce ? 1 : 0.08;
        cur.x += (tx - cur.x) * k;
        cur.y += (ty - cur.y) * k;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (cur && sprite) {
        const scale = Math.max(0.5, Math.min(1.2, cur.x / 640));
        const bob = reduce ? 0 : Math.sin(t / 900) * 3;
        ctx.save();
        ctx.translate(cur.x + bob, cur.y);
        // The pose is baked in, so only a slight tilt with scroll.
        ctx.rotate(((cur.y - h * 0.5) / h) * 0.25);
        ctx.scale(scale, scale);
        // Draw with the fingertip at the origin.
        ctx.drawImage(
          sprite,
          (BX - TIP.x) * SCALE,
          (BY - TIP.y) * SCALE,
          BW * SCALE,
          BH * SCALE
        );
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="hand-canvas" aria-hidden="true" />
      <nav className="handnav" aria-label="Sections">
        <ul>
          {items.map((it) => (
            <li
              key={it.id}
              ref={(el) => {
                itemRefs.current[it.id] = el;
              }}
            >
              <a
                href={`#${it.id}`}
                className={active === it.id ? "is-active" : undefined}
                aria-current={active === it.id ? "true" : undefined}
              >
                {it.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}