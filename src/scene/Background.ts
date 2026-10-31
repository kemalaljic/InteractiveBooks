import { Assets, Sprite } from 'pixi.js';
import { asset } from '../core/assets';
import type { PageConfig } from '../core/types';
import { painters, type PaintContext } from './painters';
import type { Stage } from './Stage';

/** Build the parallax layers described in the page config (back to front). */
export async function buildBackground(stage: Stage, page: PageConfig, onTick: PaintContext['onTick']): Promise<void> {
  for (const [i, cfg] of page.layers.entries()) {
    const layer = stage.addLayer(cfg.id, cfg.parallax, i * 10);
    if ('painter' in cfg) {
      painters[cfg.painter]({ layer, variant: cfg.variant ?? 'day', onTick });
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
