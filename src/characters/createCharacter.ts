import type { SceneObjectConfig } from '../core/types';
import type { Character } from './Character';
import { PlaceholderCharacter } from './PlaceholderCharacter';

/**
 * Rive if the config names a .riv file and it loads; otherwise the vector placeholder.
 * So a missing or broken .riv never breaks a page.
 */
export async function createCharacter(config: SceneObjectConfig): Promise<Character> {
  const rive = config.art.rive;
  if (rive) {
    try {
      const { RiveCharacter } = await import('./RiveCharacter');
      const character = new RiveCharacter(config, rive);
      await character.load();
      return character;
    } catch (err) {
      console.warn(`[character] ${config.id}: Rive unavailable, using placeholder.`, err);
    }
  }
  return new PlaceholderCharacter(config);
}
