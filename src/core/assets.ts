import type { PageConfig } from './types';

/** Resolve a path under public/ against the deployed base URL. */
export const asset = (path: string): string => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

export const sfxUrl = (key: string) => asset(`audio/sfx/${key}.mp3`);
export const narrationUrl = (key: string) => asset(`audio/narration/${key}.mp3`);
export const ambientUrl = (key: string) => asset(`audio/ambient/${key}.mp3`);

export const narrationKeyFor = (page: PageConfig, objectId: string) =>
  page.objects.find((o) => o.id === objectId)?.narration ?? `${page.id}-${objectId}`;

/** How ambient keys map to files: loops live in audio/ambient/, sprinkles are sfx. */
export const ambientResolvers = { loop: ambientUrl, sprinkle: sfxUrl };

/** Files the ambient bed needs for a page (decoded by AmbientBed, not Howler). */
export const ambientUrlsFor = (page: PageConfig): string[] => [
  ...page.ambient.loops.map((l) => ambientUrl(l.key)),
  ...(page.ambient.sprinkles ?? []).flatMap((s) => s.keys.map(sfxUrl)),
];
