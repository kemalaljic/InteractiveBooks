import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { PainterId, TimeOfDay } from '../core/types';
import { WORLD_H, WORLD_W } from './Stage';

/**
 * Procedural prototype backgrounds. Each painter fills its layer well beyond the
 * 1600x1200 world so any screen aspect ratio is covered. Replace with painted art
 * by using an `image` layer in the page config.
 */

const BLEED_X = 900;
const BLEED_Y = 900;
export const HORIZON_Y = 600;

export interface PaintContext {
  layer: Container;
  variant: TimeOfDay;
  /** Register a per-frame update. Removed automatically when the page is torn down. */
  onTick: (fn: (dtMs: number, tSec: number) => void) => void;
}

const PALETTE = {
  day: {
    sky: ['#5bb8e8', '#9fdcf6', '#e6f7ff'],
    hillBack: 0x86c56b,
    hillFront: 0x5fae55,
    trunk: 0x8a5a3b,
    tree: 0x3f8f4a,
    treeHi: 0x5cb85c,
    reed: 0x3e7d3a,
    water: ['#7fd0e6', '#4fb3cf', '#227f9f'],
    edge: 0.35,
    shimmer: 0xffffff,
    cloud: 0.95,
  },
  night: {
    sky: ['#0b1a3a', '#1d3566', '#3b4f86'],
    hillBack: 0x2b4a4a,
    hillFront: 0x213d3b,
    trunk: 0x3a2c2a,
    tree: 0x173330,
    treeHi: 0x23463f,
    reed: 0x1f3a33,
    water: ['#2d4f7c', '#1c3a63', '#0d2244'],
    edge: 0.18,
    shimmer: 0xfff3c4,
    cloud: 0.1,
  },
} as const;

function gradientTexture(stops: readonly string[], height = 256): Texture {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = height;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, height);
  stops.forEach((col, i) => grad.addColorStop(i / (stops.length - 1), col));
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, height);
  return Texture.from(c);
}

function softEllipseTexture(w: number, h: number): Texture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.save();
  g.scale(1, h / w);
  g.beginPath();
  g.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2);
  g.fill();
  g.restore();
  return Texture.from(c);
}

function cloud(alpha: number): Graphics {
  const g = new Graphics();
  [
    [0, 0, 60],
    [60, -25, 70],
    [130, 0, 55],
    [70, 20, 60],
  ].forEach(([x, y, r]) => g.circle(x, y, r));
  return g.fill({ color: 0xffffff, alpha });
}

export function paintPondSky({ layer, variant, onTick }: PaintContext): void {
  const pal = PALETTE[variant];
  const sky = new Sprite(gradientTexture(pal.sky));
  sky.position.set(-BLEED_X, -BLEED_Y);
  sky.width = WORLD_W + BLEED_X * 2;
  sky.height = HORIZON_Y + BLEED_Y + 50;
  layer.addChild(sky);

  if (variant === 'day') {
    const sun = new Graphics().circle(0, 0, 130).fill({ color: 0xfff3b0, alpha: 0.35 }).circle(0, 0, 85).fill(0xffe066);
    sun.position.set(220, 250);
    layer.addChild(sun);
    onTick((dt) => (sun.rotation += dt * 0.00005));
  } else {
    // twinkling stars
    const stars = Array.from({ length: 90 }, () => {
      const s = new Graphics().star(0, 0, 4, 6, 2).fill(0xffffff);
      s.position.set(-BLEED_X / 2 + Math.random() * (WORLD_W + BLEED_X), -300 + Math.random() * (HORIZON_Y + 200));
      s.scale.set(0.5 + Math.random() * 1.1);
      layer.addChild(s);
      return { s, phase: Math.random() * 6.28, speed: 0.8 + Math.random() * 2 };
    });
    onTick((_dt, t) => stars.forEach((st) => (st.s.alpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * st.speed + st.phase)))));
  }

  const clouds = [
    { x: 520, y: 180, s: 1.1, v: 6 },
    { x: 1250, y: 290, s: 0.8, v: 9 },
    { x: -200, y: 380, s: 0.65, v: 12 },
  ].map((c) => {
    const g = cloud(pal.cloud);
    g.position.set(c.x, c.y);
    g.scale.set(c.s);
    layer.addChild(g);
    return { g, v: c.v };
  });
  onTick((dt) => {
    for (const c of clouds) {
      c.g.x += (c.v * dt) / 1000;
      if (c.g.x > WORLD_W + BLEED_X) c.g.x = -BLEED_X;
    }
  });
}

export function paintPondFarBank({ layer, variant, onTick }: PaintContext): void {
  const pal = PALETTE[variant];
  const hills = new Graphics();
  hills
    .moveTo(-BLEED_X, HORIZON_Y + 10)
    .bezierCurveTo(100, 380, 500, 420, 800, 500)
    .bezierCurveTo(1100, 430, 1500, 360, WORLD_W + BLEED_X, 470)
    .lineTo(WORLD_W + BLEED_X, HORIZON_Y + 40)
    .lineTo(-BLEED_X, HORIZON_Y + 40)
    .fill(pal.hillBack);
  hills
    .moveTo(-BLEED_X, HORIZON_Y + 20)
    .bezierCurveTo(200, 500, 600, 540, 900, 560)
    .bezierCurveTo(1200, 520, 1500, 520, WORLD_W + BLEED_X, 540)
    .lineTo(WORLD_W + BLEED_X, HORIZON_Y + 40)
    .lineTo(-BLEED_X, HORIZON_Y + 40)
    .fill(pal.hillFront);
  layer.addChild(hills);

  const trees = new Graphics();
  [
    [80, 470, 70],
    [190, 455, 90],
    [1320, 455, 80],
    [1440, 470, 60],
    [1700, 450, 90],
    [-180, 470, 80],
  ].forEach(([x, y, r]) => {
    trees.rect(x - 9, y, 18, 90).fill(pal.trunk);
    trees.circle(x, y, r).fill(pal.tree);
    trees.circle(x - r * 0.3, y - r * 0.3, r * 0.45).fill({ color: pal.treeHi, alpha: 0.6 });
  });
  layer.addChild(trees);

  const reeds = new Container();
  for (let i = 0; i < 26; i++) {
    const g = new Graphics()
      .moveTo(0, 0)
      .quadraticCurveTo(4, -30, 2, -60 - (i % 3) * 14)
      .stroke({ width: 5, color: pal.reed, cap: 'round' });
    g.position.set(380 + i * 22 + (i % 2) * 7, HORIZON_Y + 30);
    reeds.addChild(g);
  }
  layer.addChild(reeds);
  onTick((_dt, t) => reeds.children.forEach((r, i) => (r.rotation = Math.sin(t * 1.2 + i * 0.5) * 0.06)));
}

export function paintPondWater({ layer, variant, onTick }: PaintContext): void {
  const pal = PALETTE[variant];
  const water = new Sprite(gradientTexture(pal.water));
  water.position.set(-BLEED_X, HORIZON_Y);
  water.width = WORLD_W + BLEED_X * 2;
  water.height = WORLD_H - HORIZON_Y + BLEED_Y;
  water.zIndex = -100;
  layer.addChild(water);

  const edge = new Graphics().rect(-BLEED_X, HORIZON_Y - 4, WORLD_W + BLEED_X * 2, 10).fill({ color: 0xffffff, alpha: pal.edge });
  edge.zIndex = -99;
  layer.addChild(edge);

  // Shimmer: soft light streaks that drift and twinkle. Cheap sprites from one texture.
  const tex = softEllipseTexture(128, 16);
  const shimmer = new Container();
  shimmer.zIndex = -90;
  layer.addChild(shimmer);
  const streaks = Array.from({ length: 70 }, () => {
    const depth = Math.random();
    const s = new Sprite(tex);
    s.anchor.set(0.5);
    s.tint = pal.shimmer;
    s.x = -BLEED_X / 2 + Math.random() * (WORLD_W + BLEED_X);
    s.y = HORIZON_Y + 15 + depth * depth * (WORLD_H - HORIZON_Y + 200);
    s.height = 4 + depth * 9;
    shimmer.addChild(s);
    return { s, depth, phase: Math.random() * Math.PI * 2, speed: 0.6 + Math.random() * 1.2 };
  });

  onTick((dt, t) => {
    for (const st of streaks) {
      st.s.x += (dt / 1000) * (6 + st.depth * 14);
      if (st.s.x > WORLD_W + BLEED_X / 2) st.s.x = -BLEED_X / 2;
      const tw = 0.5 + 0.5 * Math.sin(t * st.speed + st.phase);
      st.s.alpha = 0.08 + tw * (0.25 + st.depth * 0.25);
      st.s.width = (40 + st.depth * 160) * (0.8 + tw * 0.4);
    }
  });
}

export const painters: Record<PainterId, (ctx: PaintContext) => void> = {
  pondSky: paintPondSky,
  pondFarBank: paintPondFarBank,
  pondWater: paintPondWater,
};
