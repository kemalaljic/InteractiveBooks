import { Howler } from 'howler';
import type { AmbientConfig } from '../core/types';

/**
 * Layered background soundscape on raw Web Audio (shares Howler's AudioContext + master volume).
 *
 * Why not Howler for this: MP3 encoders pad the start/end with silence, which makes a looped
 * MP3 "hiccup" at every loop point. Here we decode the buffer ourselves, find where the real
 * audio starts and ends, and loop exactly between those points: gapless on every browser.
 *
 * Signal path: loop / sprinkle sources → (panner) → gain → bus → Howler.masterGain
 * The bus is what fades in/out and ducks under narration.
 */
export class AmbientBed {
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private session?: { bus: GainNode; sources: AudioBufferSourceNode[]; timers: number[] };
  private ducked = false;

  private get ctx(): AudioContext {
    if (!Howler.ctx) Howler.volume(Howler.volume()); // creates the context synchronously
    return Howler.ctx;
  }

  /** Fetch + decode (works while the context is still suspended, i.e. before the unlock tap). */
  load(url: string): Promise<AudioBuffer | null> {
    let p = this.buffers.get(url);
    if (!p) {
      p = fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`${r.status} ${url}`);
          return r.arrayBuffer();
        })
        .then((data) => this.ctx.decodeAudioData(data))
        .catch((err) => {
          console.warn(`[ambient] failed to load ${url}:`, err);
          return null; // a missing file must never block the book
        });
      this.buffers.set(url, p);
    }
    return p;
  }

  preload(urls: string[]): Promise<void> {
    return Promise.all(urls.map((u) => this.load(u))).then(() => undefined);
  }

  /**
   * Start a soundscape, cross-fading from whatever was playing.
   * Safe to call inside the unlock gesture: already-decoded loops start synchronously.
   */
  start(cfg: AmbientConfig, resolve: { loop: (key: string) => string; sprinkle: (key: string) => string }, fadeMs = 2500): void {
    this.stop(fadeMs);
    const ctx = this.ctx;
    const bus = ctx.createGain();
    bus.gain.value = 0;
    bus.connect(Howler.masterGain);
    const session = { bus, sources: [] as AudioBufferSourceNode[], timers: [] as number[] };
    this.session = session;
    this.rampBus(this.ducked ? 0.35 : 1, fadeMs / 1000);

    for (const loop of cfg.loops) {
      const url = resolve.loop(loop.key);
      const begin = (buffer: AudioBuffer | null) => {
        if (!buffer || this.session !== session) return;
        const { start, end } = trimPoints(buffer);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        src.loopStart = start;
        src.loopEnd = end;
        const gain = ctx.createGain();
        gain.gain.value = loop.volume;
        src.connect(gain).connect(bus);
        // Start each layer at a random point so stacked loops never line up the same way twice.
        src.start(0, start + Math.random() * (end - start));
        session.sources.push(src);
      };
      void this.load(url).then(begin);
    }

    for (const sp of cfg.sprinkles ?? []) {
      const schedule = () => {
        const [min, max] = sp.every;
        const t = window.setTimeout(
          () => {
            if (this.session !== session) return;
            if (document.visibilityState === 'visible') this.playSprinkle(sp, resolve.sprinkle, bus);
            schedule();
          },
          (min + Math.random() * (max - min)) * 1000,
        );
        session.timers.push(t);
      };
      schedule();
    }
  }

  stop(fadeMs = 1200): void {
    const s = this.session;
    if (!s) return;
    this.session = undefined;
    s.timers.forEach(clearTimeout);
    const now = this.ctx.currentTime;
    s.bus.gain.cancelScheduledValues(now);
    s.bus.gain.setValueAtTime(s.bus.gain.value, now);
    s.bus.gain.linearRampToValueAtTime(0, now + fadeMs / 1000);
    window.setTimeout(() => {
      s.sources.forEach((src) => {
        try {
          src.stop();
        } catch {
          /* already stopped */
        }
      });
      s.bus.disconnect();
    }, fadeMs + 100);
  }

  /** Lower the whole bed under narration. */
  duck(on: boolean): void {
    this.ducked = on;
    this.rampBus(on ? 0.35 : 1, on ? 0.25 : 0.8);
  }

  private rampBus(to: number, seconds: number): void {
    const bus = this.session?.bus;
    if (!bus) return;
    const now = this.ctx.currentTime;
    bus.gain.cancelScheduledValues(now);
    bus.gain.setValueAtTime(bus.gain.value, now);
    bus.gain.linearRampToValueAtTime(to, now + Math.max(0.01, seconds));
  }

  private playSprinkle(
    sp: NonNullable<AmbientConfig['sprinkles']>[number],
    resolve: (key: string) => string,
    bus: GainNode,
  ): void {
    const key = sp.keys[Math.floor(Math.random() * sp.keys.length)];
    void this.load(resolve(key)).then((buffer) => {
      if (!buffer || this.session?.bus !== bus) return;
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = 0.92 + Math.random() * 0.16; // small pitch variety
      const gain = ctx.createGain();
      gain.gain.value = sp.volume * (0.7 + Math.random() * 0.3);
      const [pl, pr] = sp.pan ?? [-0.8, 0.8];
      let node: AudioNode = src;
      if (typeof ctx.createStereoPanner === 'function') {
        const pan = ctx.createStereoPanner();
        pan.pan.value = pl + Math.random() * (pr - pl);
        node = src.connect(pan);
      }
      node.connect(gain).connect(bus);
      src.start();
    });
  }
}

/** Find where audible content starts/ends (skips encoder padding) so loops are seamless. */
function trimPoints(buffer: AudioBuffer): { start: number; end: number } {
  const threshold = 0.0015;
  const maxScan = Math.min(buffer.length, Math.floor(buffer.sampleRate * 0.25));
  const chans = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
  const loud = (i: number) => chans.some((c) => Math.abs(c[i]) > threshold);
  let first = 0;
  while (first < maxScan && !loud(first)) first++;
  let last = buffer.length - 1;
  while (last > buffer.length - maxScan && !loud(last)) last--;
  if (last <= first) return { start: 0, end: buffer.duration };
  return { start: first / buffer.sampleRate, end: (last + 1) / buffer.sampleRate };
}
