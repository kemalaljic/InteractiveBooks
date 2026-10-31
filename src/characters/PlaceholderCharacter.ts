import { Container } from 'pixi.js';
import type { SceneObjectConfig } from '../core/types';
import type { Character } from './Character';
import { compose, HAPPY, IDLE, REACTIONS, REST, type Reaction } from './motion';
import { PLACEHOLDER_ART, type Art } from './placeholderArt';

/**
 * Vector placeholder with code-driven motion.
 * view (positioned + idle/reaction translation) → inner (scale/rotation) → art.
 */
export class PlaceholderCharacter implements Character {
  readonly view = new Container();
  private readonly inner = new Container();
  private readonly art: Art;
  private readonly seed = Math.random() * 10;
  private readonly baseScale: number;
  private active?: { reaction: Reaction; start: number };
  private nowMs = 0;

  constructor(readonly config: SceneObjectConfig) {
    this.art = PLACEHOLDER_ART[config.art.placeholder]();
    this.baseScale = config.scale ?? 1;
    this.inner.addChild(this.art.view);
    this.view.addChild(this.inner);
    this.view.position.set(config.x, config.y);
    this.view.zIndex = config.z ?? 0;
  }

  get reactionDuration(): number {
    return REACTIONS[this.config.reaction].duration;
  }

  get landAt(): number | undefined {
    return REACTIONS[this.config.reaction].landAt;
  }

  update(_dtMs: number, timeMs: number): void {
    this.nowMs = timeMs;
    const t = timeMs / 1000;
    let pose = IDLE[this.config.idle](t, this.seed);
    if (this.active) {
      const p = (timeMs - this.active.start) / (this.active.reaction.duration * 1000);
      if (p >= 1) this.active = undefined;
      else pose = compose(pose, this.active.reaction.pose(p));
    }
    pose ??= REST;
    this.view.position.set(this.config.x + pose.dx, this.config.y + pose.dy);
    this.inner.scale.set(pose.sx * this.baseScale, pose.sy * this.baseScale);
    this.inner.rotation = pose.rot;
    this.art.update?.(t);
  }

  tap(): void {
    this.active = { reaction: REACTIONS[this.config.reaction], start: this.nowMs };
  }

  happy(): void {
    this.active = { reaction: HAPPY, start: this.nowMs };
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }
}
