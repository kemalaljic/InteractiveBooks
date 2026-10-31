import { Assets, Sprite } from 'pixi.js';
import { asset } from '../core/assets';
import type { PageConfig } from '../core/types';
import { painters } from './painters';
import type { Stage } from './Stage';

/** Build the parallax layers described in the page config (back to front). */
export async function buildBackground(stage: Stage, page: PageConfig): Promise<void> {
  for (const [i, cfg] of page.layers.entries()) {
    const layer = stage.addLayer(cfg.id, cfg.parallax, i * 10);
    if ('painter' in cfg) {
      painters[cfg.painter](layer, stage.app.ticker);
    } else {
      const texture = await Assets.load(asset(cfg.image));
      const sprite = new Sprite(texture);
      sprite.position.set(cfg.x, cfg.y);
      sprite.width = cfg.width;
      sprite.height = cfg.height;
      sprite.zIndex = -100;
      layer.addChild(sprite);
    }
  }
}
