import { Container, Graphics } from 'pixi.js';
import type { PlaceholderArt } from '../core/types';

/**
 * Vector stand-ins drawn with Pixi Graphics. Replace with Rive files; nothing else changes.
 * Origin is the visual center, except `reed` whose origin is its base (so it sways from the root).
 */
export interface Art {
  view: Container;
  /** Per-frame secondary motion (blinks, wing flaps, tail wag). */
  update?: (t: number) => void;
}

const OUTLINE = { width: 5, color: 0x1d3b53, alpha: 0.25 };

function frog(): Art {
  const view = new Container();
  const body = new Graphics()
    // back legs
    .ellipse(-105, 55, 70, 38)
    .fill(0x49b04a)
    .ellipse(105, 55, 70, 38)
    .fill(0x49b04a)
    // body
    .ellipse(0, 10, 125, 100)
    .fill(0x5cc85a)
    .stroke(OUTLINE)
    // belly
    .ellipse(0, 42, 78, 55)
    .fill(0xc8f0a0)
    // front feet
    .ellipse(-52, 100, 34, 15)
    .fill(0x49b04a)
    .ellipse(52, 100, 34, 15)
    .fill(0x49b04a)
    // cheeks
    .ellipse(-82, 5, 20, 11)
    .fill({ color: 0xff8fa3, alpha: 0.65 })
    .ellipse(82, 5, 20, 11)
    .fill({ color: 0xff8fa3, alpha: 0.65 })
    // smile
    .moveTo(-48, -8)
    .quadraticCurveTo(0, 32, 48, -8)
    .stroke({ width: 8, color: 0x2e6b2c, cap: 'round' });
  view.addChild(body);

  const eyes = [-58, 58].map((x) => {
    const bump = new Graphics().circle(0, 0, 44).fill(0x5cc85a).stroke(OUTLINE);
    bump.position.set(x, -78);
    const eye = new Graphics()
      .circle(0, 0, 33)
      .fill(0xffffff)
      .circle(3, 3, 17)
      .fill(0x1d2b36)
      .circle(-4, -5, 6)
      .fill(0xffffff);
    eye.position.set(x, -78);
    view.addChild(bump, eye);
    return eye;
  });

  let nextBlink = 2 + Math.random() * 3;
  return {
    view,
    update: (t) => {
      // quick blink every few seconds
      const since = t - nextBlink;
      const k = since > 0 && since < 0.16 ? Math.abs(Math.cos((since / 0.16) * Math.PI)) : 1;
      eyes.forEach((e) => (e.scale.y = Math.max(0.08, k)));
      if (since >= 0.16) nextBlink = t + 2.5 + Math.random() * 3.5;
    },
  };
}

function lilypad(): Art {
  const view = new Container();
  const rx = 160;
  const ry = 58;
  const pad = new Graphics();
  const notch = 0.3;
  pad.moveTo(0, 0);
  for (let a = notch; a <= Math.PI * 2 - notch + 0.001; a += 0.05) pad.lineTo(Math.cos(a) * rx, Math.sin(a) * ry);
  pad.closePath().fill(0x3fa34d).stroke(OUTLINE);
  // veins
  for (let a = notch + 0.4; a < Math.PI * 2 - notch; a += 0.55) {
    pad.moveTo(0, 0).lineTo(Math.cos(a) * rx * 0.85, Math.sin(a) * ry * 0.85);
  }
  pad.stroke({ width: 3, color: 0x2f8a3c, alpha: 0.8 });
  view.addChild(pad);

  const flower = new Container();
  flower.position.set(-50, -22);
  for (let i = 0; i < 8; i++) {
    const petal = new Graphics().ellipse(0, -26, 13, 28).fill(i % 2 ? 0xff9ec7 : 0xffb8d6);
    petal.rotation = (i / 8) * Math.PI * 2;
    petal.scale.y = 0.75;
    flower.addChild(petal);
  }
  flower.addChild(new Graphics().circle(0, 0, 12).fill(0xffd23f));
  flower.scale.y = 0.8;
  view.addChild(flower);

  return { view, update: (t) => (flower.rotation = Math.sin(t * 0.7) * 0.06) };
}

function dragonfly(): Art {
  const view = new Container();
  const wings = new Container();
  wings.position.set(-25, -6);
  const wingShape = (rot: number, len: number) => {
    const w = new Graphics().ellipse(0, -len, 20, len).fill({ color: 0xe8f6ff, alpha: 0.7 }).stroke({ width: 3, color: 0xffffff, alpha: 0.9 });
    w.rotation = rot;
    return w;
  };
  wings.addChild(wingShape(-0.5, 58), wingShape(-0.15, 52), wingShape(0.25, 58), wingShape(0.6, 50));

  const body = new Graphics()
    // tail
    .roundRect(-10, -8, 140, 16, 8)
    .fill(0x3c8ce7)
    .stroke(OUTLINE);
  for (let x = 15; x < 125; x += 18) body.rect(x, -8, 4, 16).fill({ color: 0x1b3f8a, alpha: 0.5 });
  body
    // thorax
    .ellipse(-30, 0, 30, 19)
    .fill(0x2f6fdb)
    .stroke(OUTLINE)
    // head + big eyes
    .circle(-72, -2, 24)
    .fill(0x2f6fdb)
    .circle(-82, -12, 15)
    .fill(0xffffff)
    .circle(-85, -12, 8)
    .fill(0x1d2b36)
    .circle(-88, -15, 3)
    .fill(0xffffff)
    .moveTo(-88, 8)
    .quadraticCurveTo(-78, 16, -66, 8)
    .stroke({ width: 4, color: 0x1b3f8a, cap: 'round' });

  view.addChild(wings, body);
  view.scale.set(1.25);
  return { view, update: (t) => (wings.scale.y = 0.55 + 0.45 * Math.abs(Math.sin(t * 38))) };
}

function fish(): Art {
  const view = new Container();
  const tail = new Graphics().poly([0, 0, -70, -50, -55, 0, -70, 50]).fill(0xff7f11).stroke(OUTLINE);
  tail.position.set(-75, 0);
  const body = new Graphics()
    .poly([-20, -45, 10, -80, 40, -46])
    .fill(0xff7f11)
    .ellipse(0, 0, 90, 52)
    .fill(0xff9f43)
    .stroke(OUTLINE)
    .ellipse(8, 20, 62, 22)
    .fill(0xffd19a)
    .rect(-30, -45, 9, 90)
    .fill({ color: 0xffffff, alpha: 0.35 })
    .rect(-5, -50, 9, 100)
    .fill({ color: 0xffffff, alpha: 0.35 })
    .circle(48, -12, 15)
    .fill(0xffffff)
    .circle(52, -12, 8)
    .fill(0x1d2b36)
    .circle(49, -15, 3)
    .fill(0xffffff)
    .moveTo(62, 14)
    .quadraticCurveTo(72, 22, 82, 12)
    .stroke({ width: 4, color: 0xb3530a, cap: 'round' });
  view.addChild(tail, body);
  return { view, update: (t) => (tail.rotation = Math.sin(t * 6) * 0.25) };
}

function reed(): Art {
  const view = new Container();
  const stalks = [
    { x: -40, h: 470, bend: -30, cat: true },
    { x: 0, h: 540, bend: 15, cat: true },
    { x: 38, h: 420, bend: 35, cat: true },
    { x: -70, h: 300, bend: -50, cat: false },
    { x: 70, h: 330, bend: 60, cat: false },
  ].map((s) => {
    const g = new Graphics();
    if (s.cat) {
      g.moveTo(0, 0)
        .quadraticCurveTo(s.bend * 0.4, -s.h * 0.5, s.bend, -s.h)
        .stroke({ width: 10, color: 0x3e8e41, cap: 'round' })
        .roundRect(s.bend - 15, -s.h - 40, 30, 100, 15)
        .fill(0x8b5a2b)
        .stroke(OUTLINE)
        .moveTo(s.bend, -s.h - 40)
        .lineTo(s.bend, -s.h - 75)
        .stroke({ width: 5, color: 0x3e8e41, cap: 'round' });
    } else {
      // long leaf
      g.moveTo(-10, 0)
        .quadraticCurveTo(s.bend * 0.3, -s.h * 0.6, s.bend, -s.h)
        .quadraticCurveTo(s.bend * 0.3 + 12, -s.h * 0.6, 10, 0)
        .closePath()
        .fill(0x56a83f);
    }
    g.position.set(s.x, 0);
    view.addChild(g);
    return g;
  });
  return {
    view,
    update: (t) => stalks.forEach((s, i) => (s.rotation = Math.sin(t * 1.6 + i * 1.3) * 0.025)),
  };
}

export const PLACEHOLDER_ART: Record<PlaceholderArt, () => Art> = { frog, lilypad, dragonfly, fish, reed };
