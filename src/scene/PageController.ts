import { Point, type FederatedPointerEvent, type Ticker } from 'pixi.js';
import type { AudioManager } from '../audio/AudioManager';
import type { Character } from '../characters/Character';
import { createCharacter } from '../characters/createCharacter';
import { narrationKeyFor, narrationUrl, sfxUrl } from '../core/assets';
import type { PageConfig } from '../core/types';
import type { Hud } from '../ui/Hud';
import { buildBackground } from './Background';
import type { Particles } from './Particles';
import { WORLD_W, type Stage } from './Stage';

/** Minimum hit radius in CSS px (= 100px target, comfortably above the 80px rule). */
const MIN_HIT_RADIUS_PX = 50;
/** Extra forgiveness around each hit circle, CSS px. Near-misses still count. */
const HIT_SLOP_PX = 40;
const TAP_COOLDOWN_MS = 450;
const NARRATION_DELAY_MS = 350;

/** Every Howler sound a page needs (narration + SFX). Ambient files are handled by AmbientBed. */
export function audioUrlsFor(page: PageConfig): string[] {
  return [
    sfxUrl(page.reward.sfx),
    narrationUrl(page.reward.narration),
    ...(page.intro ? [narrationUrl(page.intro.narration)] : []),
    ...page.objects.flatMap((o) => [sfxUrl(o.sfx), narrationUrl(narrationKeyFor(page, o.id))]),
  ];
}

/** One page on screen: characters, taps, captions, reward. Fully disposable via destroy(). */
export class PageController {
  readonly characters: Character[] = [];
  readonly found = new Set<string>();
  private lastTap = new Map<string, number>();
  private narrationTimer?: number;
  private rewardShown = false;
  private started = false;
  private destroyed = false;
  private lastNarration: Promise<void> = Promise.resolve();
  private updates: Array<(dtMs: number, tSec: number) => void> = [];
  private timers = new Set<number>();
  private readonly tick = (t: Ticker) => {
    const now = performance.now();
    for (const c of this.characters) c.update(t.deltaMS, now);
    for (const fn of this.updates) fn(t.deltaMS, now / 1000);
  };
  private readonly onPointerDown = (e: FederatedPointerEvent) => {
    if (!this.started) return;
    const target = this.pick(e.global);
    if (target) this.activate(target);
  };

  constructor(
    private readonly stage: Stage,
    private readonly audio: AudioManager,
    private readonly hud: Hud,
    private readonly particles: Particles,
    readonly page: PageConfig,
  ) {}

  async build(): Promise<void> {
    await buildBackground(this.stage, this.page, (fn) => this.updates.push(fn));
    const chars = await Promise.all(this.page.objects.map((o) => createCharacter(o)));
    this.characters.push(...chars);
    for (const c of chars) this.stage.layer(c.config.layer ?? 'water').addChild(c.view);

    this.stage.app.ticker.add(this.tick);
    // One stage-level handler does all hit testing, so we can be forgiving with near-misses.
    const root = this.stage.app.stage;
    root.eventMode = 'static';
    root.hitArea = this.stage.app.screen;
    root.on('pointerdown', this.onPointerDown);

    this.startAmbientBubbles();
  }

  /**
   * Begin interaction. Taps work immediately; only the intro line waits for audio
   * decoding (capped, so it can never hang).
   */
  start(audioReady: Promise<void> = Promise.resolve()): void {
    this.started = true;
    const intro = this.page.intro;
    if (!intro) return;
    const cap = new Promise((r) => setTimeout(r, 5000));
    void Promise.race([audioReady, cap]).then(() =>
      this.later(() => {
        if (this.found.size > 0) return; // child already exploring; don't talk over them
        this.hud.showCaption(intro.caption);
        this.lastNarration = this.audio.playNarration(narrationUrl(intro.narration));
      }, 500),
    );
  }

  /** "Opet!": reset the page for another round. */
  again(): void {
    this.hud.showReward(false);
    this.found.clear();
    this.hud.setProgress(0);
    this.rewardShown = false;
    this.audio.stopNarration();
    this.start();
  }

  destroy(): void {
    this.destroyed = true;
    this.started = false;
    this.timers.forEach(clearTimeout);
    clearTimeout(this.narrationTimer);
    this.stage.app.ticker.remove(this.tick);
    this.stage.app.stage.off('pointerdown', this.onPointerDown);
    this.characters.forEach((c) => c.destroy());
    this.stage.clearLayers();
  }

  /** Nearest object whose (enlarged) hit circle contains the point, or is within the slop margin. */
  private pick(global: Point): Character | undefined {
    let best: Character | undefined;
    let bestScore = Infinity;
    for (const c of this.characters) {
      const h = c.config.hit;
      const center = c.view.toGlobal(new Point(h.dx ?? 0, h.dy ?? 0));
      const r = Math.max(h.r * this.stage.scale * c.view.scale.x, MIN_HIT_RADIUS_PX);
      const d = Math.hypot(global.x - center.x, global.y - center.y);
      if (d > r + HIT_SLOP_PX) continue;
      const score = d / r - (c.view.zIndex ?? 0) * 0.01; // prefer the closest, then the front-most
      if (score < bestScore) {
        bestScore = score;
        best = c;
      }
    }
    return best;
  }

  private activate(c: Character): void {
    const now = performance.now();
    if (now - (this.lastTap.get(c.config.id) ?? 0) < TAP_COOLDOWN_MS) return;
    this.lastTap.set(c.config.id, now);

    const cfg = c.config;
    c.tap();
    this.audio.playSfx(sfxUrl(cfg.sfx));
    this.hud.showCaption(cfg.caption);
    this.stage.lookAt(cfg.x, cfg.y);

    const at = this.fxPoint(c, cfg.hit.dx ?? 0, cfg.hit.dy ?? 0);
    if (cfg.particles) this.particles.emit(cfg.particles, at.x, at.y);
    if (c.landAt !== undefined && cfg.particles === 'splash') {
      this.later(() => {
        const p = this.fxPoint(c, 0, 0);
        this.particles.emit('splash', p.x, p.y);
      }, c.reactionDuration * c.landAt * 1000);
    }

    // Narration follows the SFX; a newer tap replaces a pending or playing line.
    clearTimeout(this.narrationTimer);
    this.audio.stopNarration();
    this.narrationTimer = window.setTimeout(() => {
      this.lastNarration = this.audio.playNarration(narrationUrl(narrationKeyFor(this.page, cfg.id)));
    }, NARRATION_DELAY_MS);

    this.found.add(cfg.id);
    this.hud.setProgress(this.found.size);
    if (!this.rewardShown && this.found.size === this.characters.length) {
      this.rewardShown = true;
      // Let the last line finish (but don't wait forever), then celebrate.
      this.later(() => {
        const wait = Promise.race([this.lastNarration, new Promise((r) => setTimeout(r, 4000))]);
        void wait.then(() => !this.destroyed && this.reward());
      }, NARRATION_DELAY_MS + 50);
    }
  }

  private reward(): void {
    this.hud.showReward(true);
    this.audio.playSfx(sfxUrl(this.page.reward.sfx));
    const bursts: Array<[number, number, number]> = [
      [WORLD_W / 2, 900, 0],
      [WORLD_W * 0.2, 950, 350],
      [WORLD_W * 0.8, 950, 650],
      [WORLD_W / 2, 950, 1100],
    ];
    for (const [x, y, delay] of bursts) this.later(() => this.particles.emit('confetti', x, y), delay);
    this.characters.forEach((c, i) => this.later(() => c.happy(), 200 + i * 160));
    this.later(() => {
      this.hud.showCaption(this.page.reward.caption, 8000);
      void this.audio.playNarration(narrationUrl(this.page.reward.narration));
    }, 1300);
  }

  /** setTimeout that is cancelled automatically when the page is destroyed. */
  private later(fn: () => void, ms: number): void {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      if (!this.destroyed) fn();
    }, ms);
    this.timers.add(id);
  }

  private fxPoint(c: Character, dx: number, dy: number): Point {
    return this.stage.fx.toLocal(c.view.toGlobal(new Point(dx, dy)));
  }

  private startAmbientBubbles(): void {
    const fish = this.characters.find((c) => c.config.art.placeholder === 'fish');
    if (!fish) return;
    const tick = () => {
      const p = this.fxPoint(fish, 60, -30);
      this.particles.emit('bubbles', p.x, p.y, 3);
      this.later(tick, 2500 + Math.random() * 2500);
    };
    this.later(tick, 1500);
  }
}
