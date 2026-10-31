/**
 * Content schema. A new page or book should be pure data in this shape;
 * no engine code changes needed.
 *
 * Coordinates are in WORLD units: a fixed 1600 x 1200 (4:3) design space that the
 * stage scales to fit the screen. Keep tappable objects below y ≈ 330 so the
 * caption bar at the top never covers them.
 */

export type Lang = 'hr' | 'bs' | 'en';

/** Placeholder idle loops (used until a Rive file exists for the object). */
export type IdleKind = 'bob' | 'hover' | 'swim' | 'sway' | 'float' | 'paddle' | 'flutter' | 'glow';

/** Placeholder tap reactions. */
export type ReactionKind = 'jump' | 'wobble' | 'loop' | 'leap' | 'sway' | 'squash' | 'dive' | 'hop' | 'spin';

/** Built-in vector placeholder drawings. */
export type PlaceholderArt =
  | 'frog'
  | 'lilypad'
  | 'dragonfly'
  | 'fish'
  | 'reed'
  | 'duck'
  | 'butterfly'
  | 'bird'
  | 'moon'
  | 'owl'
  | 'fireflies'
  | 'cricket';

export type ParticleKind = 'sparkles' | 'bubbles' | 'splash' | 'confetti';

export type LayerId = 'sky' | 'far' | 'water';

export interface RiveArt {
  /** Path under public/, e.g. 'rive/zaba.riv'. State machine must be named "Main". */
  src: string;
  artboard?: string;
  /** Size of the drawn artboard in world units. */
  width: number;
  height: number;
}

export interface SceneObjectConfig {
  /** Stable id, also the default for file names: narration/<pageId>-<id>.mp3 */
  id: string;
  x: number;
  y: number;
  scale?: number;
  /** Which parallax layer the object rides on. Default 'water'. */
  layer?: LayerId;
  /** Draw order inside the layer (higher = in front). Default 0. */
  z?: number;
  /** Hit circle in world units, relative to (x, y). Enlarged at runtime to stay ≥ 100 CSS px. */
  hit: { r: number; dx?: number; dy?: number };
  caption: string;
  /** File key in public/audio/sfx/<sfx>.mp3 */
  sfx: string;
  /** File key in public/audio/narration/<narration>.mp3. Default `${pageId}-${id}`. */
  narration?: string;
  art: { placeholder: PlaceholderArt; rive?: RiveArt };
  idle: IdleKind;
  reaction: ReactionKind;
  particles?: ParticleKind;
}

export type PainterId = 'pondSky' | 'pondFarBank' | 'pondWater';
export type TimeOfDay = 'day' | 'night';

export type BackgroundLayerConfig =
  /** Built-in procedural painter (prototype art). */
  | { id: LayerId; parallax: number; painter: PainterId; variant?: TimeOfDay }
  /** Painted artwork: an image under public/ placed at world (x, y) with the given size. */
  | { id: LayerId; parallax: number; image: string; x: number; y: number; width: number; height: number };

/**
 * Background soundscape: several seamless loops mixed together, plus short one-shots
 * (a bird chirp, a distant frog) fired at random moments from random directions.
 * Everything here is ducked while narration plays.
 */
export interface AmbientConfig {
  /** Loops from public/audio/ambient/<key>.mp3, played together. */
  loops: Array<{ key: string; volume: number }>;
  /** One-shots from public/audio/sfx/<key>.mp3. A random key from `keys` every `every` seconds. */
  sprinkles?: Array<{
    keys: string[];
    volume: number;
    /** Seconds between plays: [min, max]. */
    every: [number, number];
    /** Stereo position range -1 (left) .. 1 (right). Default [-0.8, 0.8]. */
    pan?: [number, number];
  }>;
}

export interface PageConfig {
  /** Unique across all books, used as the narration file prefix, e.g. 'mala-zaba-1'. */
  id: string;
  bookTitle: string;
  lang: Lang;
  /** Back-to-front. */
  layers: BackgroundLayerConfig[];
  ambient: AmbientConfig;
  intro?: { caption: string; narration: string };
  objects: SceneObjectConfig[];
  reward: { caption: string; narration: string; sfx: string };
  /** Text for UI chrome. */
  ui: { start: string; again: string; bravo: string; next: string };
}
