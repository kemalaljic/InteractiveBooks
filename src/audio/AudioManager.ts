import { Howl, Howler } from 'howler';

/**
 * All audio goes through here (Howler, Web Audio mode).
 *
 * iOS rules this class encodes:
 *  1. unlock() is SYNCHRONOUS and must be called directly inside the first tap handler,
 *     before any await. WebKit silently ignores audio started after an async hop.
 *  2. A visibilitychange/pageshow listener resumes a suspended/interrupted AudioContext.
 *     Resuming can still be refused outside a gesture, so every later tap also retries.
 */
export class AudioManager {
  private sounds = new Map<string, Howl>();
  private ambient?: Howl;
  private ambientId?: number;
  private ambientTarget = 0.3;
  private narrationId?: { howl: Howl; id: number };
  private narrationResolve?: () => void;
  unlocked = false;

  constructor() {
    // Howler's auto-suspend resumes asynchronously, which iOS may reject. We manage the context ourselves.
    Howler.autoSuspend = false;
    Howler.autoUnlock = true;
  }

  /** Create + start decoding Howls. Safe before the unlock (decoding works on a suspended context). */
  preload(urls: string[]): Promise<void> {
    const pending = urls
      .filter((url) => !this.sounds.has(url))
      .map(
        (url) =>
          new Promise<void>((resolve) => {
            const howl = new Howl({
              src: [url],
              preload: true,
              html5: false,
              onload: () => resolve(),
              onloaderror: (_id, err) => {
                console.warn(`[audio] failed to load ${url}:`, err);
                resolve(); // a missing file must never block the book
              },
            });
            this.sounds.set(url, howl);
          }),
      );
    return Promise.all(pending).then(() => undefined);
  }

  /**
   * MUST be called synchronously from a user-gesture handler (touchend/click). No awaits before it.
   */
  unlock(): void {
    // Safari 17+: treat Web Audio as media playback so the silent switch / mute doesn't silence the book.
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) {
      try {
        session.type = 'playback';
      } catch {
        /* older Safari */
      }
    }

    // Howler.volume() creates the AudioContext synchronously if it doesn't exist yet.
    Howler.volume(Howler.volume());
    const ctx = Howler.ctx;
    if (ctx) {
      if (ctx.state !== 'running') void ctx.resume().catch(() => {}); // fire, don't await
      // Playing a 1-sample silent buffer inside the gesture is what actually unlocks WebKit.
      const src = ctx.createBufferSource();
      src.buffer = ctx.createBuffer(1, 1, 22050);
      src.connect(ctx.destination);
      src.start(0);
    }
    this.unlocked = true;
  }

  /** Re-check the context on lifecycle events and on every tap. */
  installLifecycleHandlers(): void {
    const resume = () => {
      const ctx = Howler.ctx;
      // iOS reports 'interrupted' (non-standard) after calls, Siri or backgrounding.
      if (this.unlocked && ctx && ctx.state !== 'running') void ctx.resume().catch(() => {});
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') resume();
      else this.stopNarration();
    });
    window.addEventListener('pageshow', resume);
    window.addEventListener('focus', resume);
    // Fallback: if resume was refused outside a gesture, the next tap fixes it (synchronously).
    document.addEventListener('touchend', resume, { capture: true, passive: true });
    document.addEventListener('pointerdown', resume, { capture: true, passive: true });
  }

  playSfx(url: string, volume = 1): void {
    const howl = this.sounds.get(url);
    if (!howl) return;
    const id = howl.play();
    howl.volume(volume, id);
  }

  /**
   * Play a narration line. Stops any line already playing, ducks the ambient bed.
   * Resolves when the line ends or is interrupted.
   */
  playNarration(url: string): Promise<void> {
    this.stopNarration();
    const howl = this.sounds.get(url);
    if (!howl || howl.state() !== 'loaded') return Promise.resolve();

    this.duckAmbient(true);
    const id = howl.play();
    this.narrationId = { howl, id };
    return new Promise<void>((resolve) => {
      this.narrationResolve = resolve;
      const done = () => {
        if (this.narrationId?.id !== id) return;
        this.narrationId = undefined;
        this.narrationResolve = undefined;
        this.duckAmbient(false);
        resolve();
      };
      howl.once('end', done, id);
      howl.once('stop', done, id);
    });
  }

  stopNarration(): void {
    if (!this.narrationId) return;
    const { howl, id } = this.narrationId;
    const resolve = this.narrationResolve;
    this.narrationId = undefined;
    this.narrationResolve = undefined;
    howl.stop(id);
    this.duckAmbient(false);
    resolve?.();
  }

  /** Start the looping ambient bed with a fade-in. Call inside the unlock gesture for best results. */
  startAmbient(url: string, volume = 0.3, fadeMs = 2500): void {
    this.stopAmbient(0);
    const howl = this.sounds.get(url);
    if (!howl) return;
    this.ambient = howl;
    this.ambientTarget = volume;
    howl.loop(true);
    howl.volume(0);
    const id = howl.play(); // queued by Howler if still decoding
    this.ambientId = id;
    howl.fade(0, volume, fadeMs, id);
  }

  stopAmbient(fadeMs = 1200): void {
    const howl = this.ambient;
    const id = this.ambientId;
    if (!howl || id === undefined) return;
    this.ambient = undefined;
    this.ambientId = undefined;
    if (fadeMs <= 0) return void howl.stop(id);
    howl.fade(howl.volume(id) as number, 0, fadeMs, id);
    howl.once('fade', () => howl.stop(id), id);
  }

  private duckAmbient(duck: boolean): void {
    const howl = this.ambient;
    const id = this.ambientId;
    if (!howl || id === undefined || !howl.playing(id)) return;
    const to = duck ? this.ambientTarget * 0.35 : this.ambientTarget;
    howl.fade(howl.volume(id) as number, to, duck ? 250 : 800, id);
  }
}
