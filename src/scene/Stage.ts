import { Application, Container } from 'pixi.js';
import type { LayerId } from '../core/types';

export const WORLD_W = 1600;
export const WORLD_H = 1200;

/**
 * Pixi application + a fixed 1600x1200 world scaled to fit ("contain") and centered.
 * Background painters draw past the world edges so letterbox areas are filled with scene.
 *
 * Parallax: each layer is offset by camera * layer.parallax. The camera eases toward the
 * last tap position and drifts gently on its own.
 */
export class Stage {
  readonly app = new Application();
  readonly world = new Container();
  readonly layers = new Map<LayerId, { view: Container; parallax: number }>();
  /** Overlay above all layers (particles, reward burst). Not affected by parallax. */
  readonly fx = new Container();
  scale = 1;

  private camX = 0;
  private camY = 0;
  private camTargetX = 0;
  private camTargetY = 0;
  private resizeListeners: Array<() => void> = [];

  async init(host: HTMLElement): Promise<void> {
    await this.app.init({
      resizeTo: window,
      background: '#8fd3f4',
      antialias: true,
      autoDensity: true,
      // Cap at 2x: iPad retina at 3x would cost fill-rate for no visible gain on soft art.
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      preference: 'webgl',
    });
    host.appendChild(this.app.canvas);
    this.app.stage.addChild(this.world);
    this.world.addChild(this.fx);
    this.fx.zIndex = 1000;
    this.world.sortableChildren = true;

    this.app.renderer.on('resize', () => this.layout());
    this.layout();
    this.app.ticker.add((t) => this.updateCamera(t.deltaMS));
  }

  addLayer(id: LayerId, parallax: number, zIndex: number): Container {
    const view = new Container();
    view.zIndex = zIndex;
    view.sortableChildren = true;
    this.world.addChild(view);
    this.layers.set(id, { view, parallax });
    return view;
  }

  layer(id: LayerId): Container {
    const l = this.layers.get(id);
    if (!l) throw new Error(`No layer "${id}"`);
    return l.view;
  }

  onResize(fn: () => void): void {
    this.resizeListeners.push(fn);
  }

  /** Point the camera a little toward a world position (called on taps). */
  lookAt(worldX: number, worldY: number): void {
    this.camTargetX = ((worldX - WORLD_W / 2) / (WORLD_W / 2)) * -40;
    this.camTargetY = ((worldY - WORLD_H / 2) / (WORLD_H / 2)) * -14;
  }

  private layout(): void {
    const { width, height } = this.app.screen;
    this.scale = Math.min(width / WORLD_W, height / WORLD_H);
    this.world.scale.set(this.scale);
    this.world.position.set((width - WORLD_W * this.scale) / 2, (height - WORLD_H * this.scale) / 2);
    this.resizeListeners.forEach((fn) => fn());
  }

  private updateCamera(dtMs: number): void {
    const t = performance.now() / 1000;
    const k = 1 - Math.exp(-dtMs / 900); // frame-rate independent easing
    this.camX += (this.camTargetX - this.camX) * k;
    this.camY += (this.camTargetY - this.camY) * k;
    const driftX = Math.sin(t * 0.11) * 18;
    const driftY = Math.sin(t * 0.17) * 5;
    for (const { view, parallax } of this.layers.values()) {
      view.position.set((this.camX + driftX) * parallax, (this.camY + driftY) * parallax);
    }
  }
}
