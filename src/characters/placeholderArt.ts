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

function duck(): Art {
  const view = new Container();
  const ripple = new Graphics().ellipse(0, 48, 120, 16).stroke({ width: 4, color: 0xffffff, alpha: 0.5 });
  const body = new Graphics()
    // tail
    .poly([70, -10, 125, -45, 105, 20])
    .fill(0xf4f1e6)
    .stroke(OUTLINE)
    .ellipse(5, 10, 100, 50)
    .fill(0xfdfcf6)
    .stroke(OUTLINE)
    // wing
    .ellipse(20, 2, 55, 28)
    .fill(0xe6e9ec)
    .moveTo(-10, 0)
    .quadraticCurveTo(20, 18, 70, 4)
    .stroke({ width: 3, color: 0xc7ccd1, cap: 'round' })
    // head
    .circle(-70, -52, 40)
    .fill(0xfdfcf6)
    .stroke(OUTLINE)
    // beak
    .ellipse(-114, -44, 28, 11)
    .fill(0xff9f1c)
    .stroke({ width: 3, color: 0xd9770a })
    .circle(-80, -62, 7)
    .fill(0x1d2b36)
    .circle(-82, -64, 2.5)
    .fill(0xffffff)
    .ellipse(-62, -40, 10, 6)
    .fill({ color: 0xff8fa3, alpha: 0.5 });
  view.addChild(ripple, body);
  return {
    view,
    update: (t) => {
      const k = (t * 0.6) % 1;
      ripple.scale.set(0.9 + k * 0.35, 1);
      ripple.alpha = 0.7 * (1 - k);
    },
  };
}

function butterfly(): Art {
  const view = new Container();
  const wings = new Container();
  const wing = (side: 1 | -1) => {
    const g = new Graphics()
      .ellipse(side * 40, -22, 42, 34)
      .fill(0xff9ec7)
      .stroke(OUTLINE)
      .ellipse(side * 30, 26, 28, 22)
      .fill(0xffc46b)
      .stroke(OUTLINE)
      .circle(side * 48, -26, 10)
      .fill({ color: 0xffffff, alpha: 0.8 })
      .circle(side * 30, 26, 7)
      .fill({ color: 0xffffff, alpha: 0.7 });
    return g;
  };
  wings.addChild(wing(-1), wing(1));
  const body = new Graphics()
    .roundRect(-7, -38, 14, 80, 7)
    .fill(0x4a3b5c)
    .moveTo(-3, -36)
    .quadraticCurveTo(-14, -60, -24, -66)
    .moveTo(3, -36)
    .quadraticCurveTo(14, -60, 24, -66)
    .stroke({ width: 3, color: 0x4a3b5c, cap: 'round' })
    .circle(-24, -66, 4)
    .circle(24, -66, 4)
    .fill(0x4a3b5c);
  view.addChild(wings, body);
  view.scale.set(1.15);
  return { view, update: (t) => (wings.scale.x = 0.25 + 0.75 * Math.abs(Math.sin(t * 9))) };
}

function bird(): Art {
  const view = new Container();
  const tail = new Graphics().poly([0, 0, 42, -22, 46, 8]).fill(0x3f7fd9).stroke(OUTLINE);
  tail.position.set(26, 6);
  const body = new Graphics()
    .moveTo(-8, 34)
    .lineTo(-12, 50)
    .moveTo(8, 34)
    .lineTo(6, 50)
    .stroke({ width: 4, color: 0xd9770a, cap: 'round' })
    .circle(0, 0, 38)
    .fill(0x4fa3ff)
    .stroke(OUTLINE)
    .ellipse(-6, 14, 24, 20)
    .fill(0xffe2b8)
    .ellipse(14, 4, 22, 14)
    .fill(0x3f7fd9)
    .circle(-16, -12, 7)
    .fill(0x1d2b36)
    .circle(-18, -14, 2.5)
    .fill(0xffffff);
  const beak = new Graphics().poly([0, -6, -18, 0, 0, 6]).fill(0xff9f1c);
  beak.position.set(-36, -4);
  view.addChild(tail, body, beak);
  view.scale.set(1.25);
  return {
    view,
    update: (t) => {
      tail.rotation = Math.sin(t * 3) * 0.12;
      beak.scale.y = Math.sin(t * 2.2) > 0.97 ? 1.8 : 1; // occasional little chirp
    },
  };
}

function moon(): Art {
  const view = new Container();
  const halo = new Graphics().circle(0, 0, 150).fill({ color: 0xfff3c4, alpha: 0.08 }).circle(0, 0, 118).fill({ color: 0xfff3c4, alpha: 0.12 });
  const face = new Graphics()
    .circle(0, 0, 88)
    .fill(0xfff3c4)
    .circle(-38, -40, 14)
    .fill({ color: 0xeedc95, alpha: 0.7 })
    .circle(42, 30, 18)
    .fill({ color: 0xeedc95, alpha: 0.7 })
    .circle(20, -52, 8)
    .fill({ color: 0xeedc95, alpha: 0.7 })
    // sleepy eyes + smile
    .moveTo(-42, -6)
    .quadraticCurveTo(-28, 6, -14, -6)
    .moveTo(14, -6)
    .quadraticCurveTo(28, 6, 42, -6)
    .moveTo(-18, 28)
    .quadraticCurveTo(0, 42, 18, 28)
    .stroke({ width: 6, color: 0xb59a4a, cap: 'round' })
    .ellipse(-50, 18, 14, 8)
    .fill({ color: 0xffb3a7, alpha: 0.6 })
    .ellipse(50, 18, 14, 8)
    .fill({ color: 0xffb3a7, alpha: 0.6 });
  view.addChild(halo, face);
  return { view, update: (t) => (halo.alpha = 0.75 + 0.25 * Math.sin(t * 1.3)) };
}

function owl(): Art {
  const view = new Container();
  const body = new Graphics()
    // ear tufts
    .poly([-50, -60, -38, -100, -18, -66])
    .fill(0x7a5a3c)
    .poly([50, -60, 38, -100, 18, -66])
    .fill(0x7a5a3c)
    // wings
    .ellipse(-56, 10, 22, 52)
    .fill(0x6b4e33)
    .ellipse(56, 10, 22, 52)
    .fill(0x6b4e33)
    .ellipse(0, 0, 62, 80)
    .fill(0x8b6b4a)
    .stroke(OUTLINE)
    .ellipse(0, 24, 40, 48)
    .fill(0xe2cfa9);
  for (let r = 0; r < 3; r++)
    for (let c = -1; c <= 1; c++) {
      const x = c * 18 + (r % 2) * 9 - 4;
      const y = 6 + r * 20;
      body.moveTo(x - 6, y).quadraticCurveTo(x, y + 7, x + 6, y);
    }
  body
    .stroke({ width: 3, color: 0xa88b62, cap: 'round' })
    // feet
    .ellipse(-18, 80, 14, 7)
    .fill(0xff9f1c)
    .ellipse(18, 80, 14, 7)
    .fill(0xff9f1c)
    // beak
    .poly([-9, -22, 9, -22, 0, -6])
    .fill(0xff9f1c);
  view.addChild(body);
  const eyes = [-26, 26].map((x) => {
    const e = new Graphics()
      .circle(0, 0, 25)
      .fill(0xffffff)
      .stroke(OUTLINE)
      .circle(0, 0, 15)
      .fill(0xffb000)
      .circle(0, 0, 8)
      .fill(0x1d2b36)
      .circle(-4, -4, 3)
      .fill(0xffffff);
    e.position.set(x, -36);
    view.addChild(e);
    return e;
  });
  let nextBlink = 1.5 + Math.random() * 2;
  return {
    view,
    update: (t) => {
      const since = t - nextBlink;
      const k = since > 0 && since < 0.22 ? Math.abs(Math.cos((since / 0.22) * Math.PI)) : 1;
      eyes.forEach((e) => (e.scale.y = Math.max(0.08, k)));
      if (since >= 0.22) nextBlink = t + 2 + Math.random() * 4;
      view.rotation = Math.sin(t * 0.5) * 0.05; // slow head-tilt feel
    },
  };
}

function fireflies(): Art {
  const view = new Container();
  const bugs = Array.from({ length: 8 }, (_, i) => {
    const g = new Graphics().circle(0, 0, 26).fill({ color: 0xfff176, alpha: 0.18 }).circle(0, 0, 13).fill({ color: 0xfff176, alpha: 0.35 }).circle(0, 0, 6).fill(0xfffde7);
    view.addChild(g);
    return { g, r: 30 + (i % 4) * 22, speed: 0.5 + Math.random() * 0.9, phase: (i / 8) * Math.PI * 2, blink: Math.random() * 6 };
  });
  return {
    view,
    update: (t) =>
      bugs.forEach((b) => {
        const a = t * b.speed + b.phase;
        b.g.position.set(Math.cos(a) * b.r, Math.sin(a * 1.3) * b.r * 0.6);
        b.g.alpha = 0.35 + 0.65 * Math.max(0, Math.sin(t * 2 + b.blink));
      }),
  };
}

function cricket(): Art {
  const view = new Container();
  const rock = new Graphics().ellipse(0, 40, 110, 42).fill(0x5b6470).ellipse(-25, 26, 50, 14).fill({ color: 0x8892a0, alpha: 0.6 });
  const bug = new Container();
  const legs = new Graphics()
    .moveTo(20, 0)
    .lineTo(52, -34)
    .lineTo(64, 14)
    .stroke({ width: 7, color: 0x4e9a3a, cap: 'round', join: 'round' })
    .moveTo(-10, 10)
    .lineTo(-20, 26)
    .moveTo(4, 12)
    .lineTo(0, 28)
    .stroke({ width: 4, color: 0x4e9a3a, cap: 'round' });
  const body = new Graphics()
    .ellipse(10, 0, 52, 20)
    .fill(0x6abf4b)
    .stroke(OUTLINE)
    .ellipse(18, -6, 38, 11)
    .fill(0x84d164)
    .circle(-44, -4, 18)
    .fill(0x6abf4b)
    .stroke(OUTLINE)
    .circle(-50, -9, 6)
    .fill(0x1d2b36)
    .circle(-52, -11, 2)
    .fill(0xffffff);
  const antennae = new Graphics()
    .moveTo(-56, -16)
    .quadraticCurveTo(-80, -70, -40, -96)
    .moveTo(-50, -18)
    .quadraticCurveTo(-60, -70, -10, -90)
    .stroke({ width: 3, color: 0x3e7d2c, cap: 'round' });
  bug.addChild(legs, body, antennae);
  bug.position.set(0, -6);
  view.addChild(rock, bug);
  view.scale.set(1.3);
  return {
    view,
    update: (t) => {
      antennae.rotation = Math.sin(t * 2.4) * 0.06;
      body.scale.y = 1 + Math.max(0, Math.sin(t * 22)) * 0.04 * (Math.sin(t * 0.8) > 0.3 ? 1 : 0); // chirping shiver
    },
  };
}

export const PLACEHOLDER_ART: Record<PlaceholderArt, () => Art> = {
  frog,
  lilypad,
  dragonfly,
  fish,
  reed,
  duck,
  butterfly,
  bird,
  moon,
  owl,
  fireflies,
  cricket,
};
