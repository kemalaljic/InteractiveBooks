import { Container, Graphics, Sprite, type Renderer, type Texture, type Ticker } from 'pixi.js';
import type { ParticleKind } from '../core/types';

interface Particle {
  s: Sprite;
  vx: number;
  vy: number;
  g: number;
  drag: number;
  spin: number;
  life: number;
  max: number;
  wobble: number;
  baseScale: number;
  grow: number;
}

const CONFETTI = [0xff5d5d, 0xffd23f, 0x3ec46d, 0x4fa3ff, 0xc77dff, 0xff8a3d];

/** Small pooled particle system for sparkles, bubbles, splashes and the reward confetti. */
export class Particles {
  private live: Particle[] = [];
  private pool: Sprite[] = [];
  private tex: Record<'dot' | 'ring' | 'star' | 'rect', Texture>;

  constructor(
    private readonly container: Container,
    renderer: Renderer,
    ticker: Ticker,
  ) {
    const make = (g: Graphics) => renderer.generateTexture({ target: g, resolution: 2, antialias: true });
    this.tex = {
      dot: make(new Graphics().circle(0, 0, 16).fill(0xffffff)),
      ring: make(
        new Graphics()
          .circle(0, 0, 16)
          .fill({ color: 0xffffff, alpha: 0.15 })
          .stroke({ width: 3, color: 0xffffff, alpha: 0.9 })
          .circle(-5, -5, 4)
          .fill(0xffffff),
      ),
      star: make(new Graphics().star(0, 0, 5, 20, 8).fill(0xffffff)),
      rect: make(new Graphics().rect(0, 0, 18, 10).fill(0xffffff)),
    };
    ticker.add((t) => this.update(t.deltaMS / 1000));
  }

  emit(kind: ParticleKind, x: number, y: number, count?: number): void {
    switch (kind) {
      case 'sparkles':
        for (let i = 0; i < (count ?? 14); i++) {
          const a = Math.random() * Math.PI * 2;
          const v = 180 + Math.random() * 260;
          this.spawn('star', x, y, {
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v - 80,
            g: 220,
            drag: 2.2,
            spin: (Math.random() - 0.5) * 8,
            max: 0.7 + Math.random() * 0.5,
            scale: 0.6 + Math.random() * 0.7,
            tint: Math.random() < 0.5 ? 0xffe066 : 0xffffff,
          });
        }
        break;
      case 'bubbles':
        for (let i = 0; i < (count ?? 8); i++) {
          this.spawn('ring', x + (Math.random() - 0.5) * 80, y + Math.random() * 30, {
            vx: (Math.random() - 0.5) * 20,
            vy: -60 - Math.random() * 80,
            g: 0,
            drag: 0.3,
            max: 1.6 + Math.random() * 1.2,
            scale: 0.35 + Math.random() * 0.7,
            wobble: 30,
            grow: 0.3,
          });
        }
        break;
      case 'splash':
        for (let i = 0; i < (count ?? 18); i++) {
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
          const v = 250 + Math.random() * 350;
          this.spawn('dot', x + (Math.random() - 0.5) * 60, y, {
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            g: 1400,
            drag: 0.4,
            max: 0.8 + Math.random() * 0.4,
            scale: 0.25 + Math.random() * 0.45,
            tint: Math.random() < 0.5 ? 0xd9f6ff : 0xffffff,
          });
        }
        this.emit('bubbles', x, y + 20, 4);
        break;
      case 'confetti':
        for (let i = 0; i < (count ?? 160); i++) {
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
          const v = 500 + Math.random() * 900;
          this.spawn(Math.random() < 0.75 ? 'rect' : 'star', x, y, {
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            g: 900,
            drag: 1.3,
            spin: (Math.random() - 0.5) * 14,
            max: 2.6 + Math.random() * 1.4,
            scale: 0.8 + Math.random() * 0.9,
            tint: CONFETTI[i % CONFETTI.length],
            wobble: 60,
          });
        }
        break;
    }
  }

  private spawn(
    tex: keyof Particles['tex'],
    x: number,
    y: number,
    o: {
      vx: number;
      vy: number;
      g: number;
      drag: number;
      max: number;
      scale: number;
      spin?: number;
      tint?: number;
      wobble?: number;
      grow?: number;
    },
  ): void {
    const s = this.pool.pop() ?? new Sprite();
    s.texture = this.tex[tex];
    s.anchor.set(0.5);
    s.position.set(x, y);
    s.tint = o.tint ?? 0xffffff;
    s.alpha = 1;
    s.rotation = Math.random() * Math.PI * 2;
    s.scale.set(o.scale);
    s.visible = true;
    this.container.addChild(s);
    this.live.push({
      s,
      vx: o.vx,
      vy: o.vy,
      g: o.g,
      drag: o.drag,
      spin: o.spin ?? 0,
      life: 0,
      max: o.max,
      wobble: o.wobble ?? 0,
      baseScale: o.scale,
      grow: o.grow ?? 0,
    });
  }

  private update(dt: number): void {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      p.life += dt;
      if (p.life >= p.max) {
        this.container.removeChild(p.s);
        this.pool.push(p.s);
        this.live.splice(i, 1);
        continue;
      }
      const damp = Math.exp(-p.drag * dt);
      p.vx *= damp;
      p.vy = p.vy * damp + p.g * dt;
      p.s.x += p.vx * dt + (p.wobble ? Math.sin(p.life * 7 + i) * p.wobble * dt : 0);
      p.s.y += p.vy * dt;
      p.s.rotation += p.spin * dt;
      const k = p.life / p.max;
      p.s.alpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      if (p.grow) p.s.scale.set(p.baseScale * (1 + p.grow * k));
    }
  }
}
