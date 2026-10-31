import type { AudioManager } from '../audio/AudioManager';
import { ambientResolvers, ambientUrlsFor } from '../core/assets';
import type { PageConfig } from '../core/types';
import type { Hud } from '../ui/Hud';
import { audioUrlsFor, PageController } from './PageController';
import type { Particles } from './Particles';
import type { Stage } from './Stage';

/**
 * Owns the sequence of pages. Turning a page happens in-app (no reload), so the
 * audio unlock from the first "Kreni!" tap stays valid for the whole book.
 */
export class Book {
  controller?: PageController;
  index = 0;
  private turning = false;

  constructor(
    private readonly stage: Stage,
    private readonly audio: AudioManager,
    private readonly hud: Hud,
    private readonly particles: Particles,
    readonly pages: PageConfig[],
  ) {}

  get page(): PageConfig {
    return this.pages[this.index];
  }

  /** Start decoding a page's audio. Returns when its narration/SFX are ready. */
  preloadAudio(index: number): Promise<void> {
    const page = this.pages[index];
    void this.audio.ambient.preload(ambientUrlsFor(page));
    return this.audio.preload(audioUrlsFor(page));
  }

  /** Build a page (tearing down the current one). Does not start interaction. */
  async load(index: number): Promise<void> {
    this.controller?.destroy();
    this.index = index;
    const page = this.page;
    this.hud.configure(page.objects.length, page.ui, index < this.pages.length - 1);
    this.controller = new PageController(this.stage, this.audio, this.hud, this.particles, page);
    await this.controller.build();
  }

  /** Must stay synchronous: called from inside the "Kreni!" gesture for the first page. */
  startAmbient(fadeMs?: number): void {
    this.audio.startAmbient(this.page.ambient, ambientResolvers, fadeMs);
  }

  /** Page turn with a curtain fade and an ambient cross-fade. */
  async goTo(index: number): Promise<void> {
    if (this.turning || index < 0 || index >= this.pages.length) return;
    this.turning = true;
    try {
      this.audio.stopNarration();
      const audioReady = this.preloadAudio(index);
      await this.hud.setCurtain(true);
      await this.load(index);
      this.startAmbient(1800); // cross-fades from the previous page's bed
      await this.hud.setCurtain(false);
      this.controller!.start(audioReady);
      if (index + 1 < this.pages.length) void this.preloadAudio(index + 1); // warm up the next page
    } finally {
      this.turning = false;
    }
  }

  next(): void {
    void this.goTo(this.index + 1);
  }
}
