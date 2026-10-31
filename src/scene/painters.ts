import { Container, Graphics, Sprite, Texture, type Ticker } from 'pixi.js';
import { WORLD_H, WORLD_W } from './Stage';

/**
 * Procedural prototype backgrounds. Each painter fills its layer well beyond the
 * 1600x1200 world so any screen aspect ratio is covered. Replace with painted art
 * by using an `image` layer in the page config.
 */

const BLEED_X = 900;
const BLEED_Y = 900;
export const HORIZON_Y = 600;

function gradientTexture(stops: Array<[number, string]>, height = 256): Texture {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = height;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, height);
  stops.forEach(([o, col]) => grad.addColorStop(o, col));
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

function cloud(): Graphics {
  const g = new Graphics();
  [
    [0, 0, 60],
    [60, -25, 70],
    [130, 0, 55],
    [70, 20, 60],
  ].forEach(([x, y, r]) => g.circle(x, y, r));
  return g.fill({ color: 0xffffff, alpha: 0.95 });
}

export function paintPondSky(layer: Container, ticker: Ticker): void {
  const sky = new Sprite(
    gradientTexture([
      [0, '#5bb8e8'],
      [0.6, '#9fdcf6'],
      [1, '#e6f7ff'],
    ]),
  );
  sky.position.set(-BLEED_X, -BLEED_Y);
  sky.width = WORLD_W + BLEED_X * 2;
  sky.height = HORIZON_Y + BLEED_Y + 50;
  layer.addChild(sky);

  const sun = new Graphics()
    .circle(0, 0, 130)
    .fill({ color: 0xfff3b0, alpha: 0.35 })
    .circle(0, 0, 85)
    .fill(0xffe066);
  sun.position.set(220, 250);
  layer.addChild(sun);

  const clouds = [
    { x: 520, y: 180, s: 1.1, v: 6 },
    { x: 1250, y: 290, s: 0.8, v: 9 },
    { x: -200, y: 380, s: 0.65, v: 12 },
  ].map((c) => {
    const g = cloud();
    g.position.set(c.x, c.y);
    g.scale.set(c.s);
    layer.addChild(g);
    return { g, v: c.v };
  });

  ticker.add((t) => {
    for (const c of clouds) {
      c.g.x += (c.v * t.deltaMS) / 1000;
      if (c.g.x > WORLD_W + BLEED_X) c.g.x = -BLEED_X;
    }
    sun.rotation += t.deltaMS * 0.00005;
  });
}

export function paintPondFarBank(layer: Container, ticker: Ticker): void {
  const hills = new Graphics();
  // back hills
  hills
    .moveTo(-BLEED_X, HORIZON_Y + 10)
    .bezierCurveTo(100, 380, 500, 420, 800, 500)
    .bezierCurveTo(1100, 430, 1500, 360, WORLD_W + BLEED_X, 470)
    .lineTo(WORLD_W + BLEED_X, HORIZON_Y + 40)
    .lineTo(-BLEED_X, HORIZON_Y + 40)
    .fill(0x86c56b);
  // front bank
  hills
    .moveTo(-BLEED_X, HORIZON_Y + 20)
    .bezierCurveTo(200, 500, 600, 540, 900, 560)
    .bezierCurveTo(1200, 520, 1500, 520, WORLD_W + BLEED_X, 540)
    .lineTo(WORLD_W + BLEED_X, HORIZON_Y + 40)
    .lineTo(-BLEED_X, HORIZON_Y + 40)
    .fill(0x5fae55);
  layer.addChild(hills);

  // round trees
  const trees = new Graphics();
  [
    [80, 470, 70],
    [190, 455, 90],
    [1320, 455, 80],
    [1440, 470, 60],
    [1700, 450, 90],
    [-180, 470, 80],
  ].forEach(([x, y, r]) => {
    trees.rect(x - 9, y, 18, 90).fill(0x8a5a3b);
    trees.circle(x, y, r).fill(0x3f8f4a);
    trees.circle(x - r * 0.3, y - r * 0.3, r * 0.45).fill({ color: 0x5cb85c, alpha: 0.6 });
  });
  layer.addChild(trees);

  // little far reeds swaying on the bank
  const reeds = new Container();
  for (let i = 0; i < 26; i++) {
    const g = new Graphics()
      .moveTo(0, 0)
      .quadraticCurveTo(4, -30, 2, -60 - (i % 3) * 14)
      .stroke({ width: 5, color: 0x3e7d3a, cap: 'round' });
    g.position.set(380 + i * 22 + (i % 2) * 7, HORIZON_Y + 30);
    reeds.addChild(g);
  }
  layer.addChild(reeds);
  ticker.add(() => {
    const t = performance.now() / 1000;
    reeds.children.forEach((r, i) => (r.rotation = Math.sin(t * 1.2 + i * 0.5) * 0.06));
  });
}

export function paintPondWater(layer: Container, ticker: Ticker): void {
  const water = new Sprite(
    gradientTexture([
      [0, '#7fd0e6'],
      [0.25, '#4fb3cf'],
      [1, '#227f9f'],
    ]),
  );
  water.position.set(-BLEED_X, HORIZON_Y);
  water.width = WORLD_W + BLEED_X * 2;
  water.height = WORLD_H - HORIZON_Y + BLEED_Y;
  water.zIndex = -100;
  layer.addChild(water);

  // Bright edge where water meets the bank.
  const edge = new Graphics()
    .rect(-BLEED_X, HORIZON_Y - 4, WORLD_W + BLEED_X * 2, 10)
    .fill({ color: 0xffffff, alpha: 0.35 });
  edge.zIndex = -99;
  layer.addChild(edge);

  // Shimmer: soft light streaks that drift and twinkle. Cheap sprites from one texture.
  const tex = softEllipseTexture(128, 16);
  const shimmer = new Container();
  shimmer.zIndex = -90;
  layer.addChild(shimmer);
  const streaks = Array.from({ length: 70 }, () => {
    const depth = Math.random(); // 0 near horizon, 1 near viewer
    const s = new Sprite(tex);
    s.anchor.set(0.5);
    s.x = -BLEED_X / 2 + Math.random() * (WORLD_W + BLEED_X);
    s.y = HORIZON_Y + 15 + depth * depth * (WORLD_H - HORIZON_Y + 200);
    s.width = 40 + depth * 160;
    s.height = 4 + depth * 9;
    shimmer.addChild(s);
    return { s, depth, phase: Math.random() * Math.PI * 2, speed: 0.6 + Math.random() * 1.2 };
  });

  ticker.add((t) => {
    const time = performance.now() / 1000;
    for (const st of streaks) {
      st.s.x += (t.deltaMS / 1000) * (6 + st.depth * 14);
      if (st.s.x > WORLD_W + BLEED_X / 2) st.s.x = -BLEED_X / 2;
      const tw = 0.5 + 0.5 * Math.sin(time * st.speed + st.phase);
      st.s.alpha = 0.08 + tw * (0.25 + st.depth * 0.25);
      st.s.scale.x = (st.s.texture.width ? (40 + st.depth * 160) / st.s.texture.width : 1) * (0.8 + tw * 0.4);
    }
  });
}

export const painters = {
  pondSky: paintPondSky,
  pondFarBank: paintPondFarBank,
  pondWater: paintPondWater,
} as const;
