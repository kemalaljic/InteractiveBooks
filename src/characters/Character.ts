import type { Container } from 'pixi.js';
import type { SceneObjectConfig } from '../core/types';

/**
 * Everything the page needs from a tappable thing. Implemented by:
 *  - PlaceholderCharacter: vector drawing + code-driven idle/tap motion
 *  - RiveCharacter: .riv file with a state machine "Main" (inputs: tap, happy)
 * The page never knows which one it has.
 */
export interface Character {
  readonly config: SceneObjectConfig;
  /** Positioned at (config.x, config.y) inside its layer. */
  readonly view: Container;
  /** Seconds the tap reaction lasts (for timing particles etc). */
  readonly reactionDuration: number;
  /** Optional moment (0..1 of the reaction) where something lands, e.g. the fish hitting the water. */
  readonly landAt?: number;
  update(dtMs: number, timeMs: number): void;
  tap(): void;
  happy(): void;
  destroy(): void;
}
