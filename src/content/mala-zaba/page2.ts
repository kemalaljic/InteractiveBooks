import type { PageConfig } from '../../core/types';

/**
 * "Mala žaba", page 2: night at the pond.
 * DRAFT TEXT: written as a placeholder; replace with the real story wording.
 * File names have no diacritics: mjesec, sova, krijesnice, cvrcak.
 */
const page: PageConfig = {
  id: 'mala-zaba-2',
  bookTitle: 'Mala žaba',
  lang: 'hr',
  ambient: {
    loops: [
      { key: 'noc-cvrcci', volume: 0.3 }, // crickets
      { key: 'noc-zabe', volume: 0.22 }, // distant frog chorus
      { key: 'jezero-voda', volume: 0.2 }, // same water bed as page 1, quieter
    ],
    sprinkles: [
      { keys: ['sova-daleko'], volume: 0.25, every: [18, 35] },
      { keys: ['zaba-daleko'], volume: 0.2, every: [10, 20] },
    ],
  },
  layers: [
    { id: 'sky', parallax: 0.15, painter: 'pondSky', variant: 'night' },
    { id: 'far', parallax: 0.45, painter: 'pondFarBank', variant: 'night' },
    { id: 'water', parallax: 1, painter: 'pondWater', variant: 'night' },
  ],
  intro: {
    caption: 'Pala je noć. Mala žaba ne spava.',
    narration: 'mala-zaba-2-intro',
  },
  objects: [
    {
      id: 'mjesec',
      x: 540,
      y: 340,
      layer: 'sky',
      hit: { r: 120 },
      caption: 'Mjesec sja na nebu. Laku noć, mjeseče!',
      sfx: 'mjesec',
      art: { placeholder: 'moon' },
      idle: 'glow',
      reaction: 'squash',
      particles: 'sparkles',
    },
    {
      id: 'sova',
      x: 1320,
      y: 395,
      layer: 'far',
      z: 2,
      hit: { r: 120 },
      caption: 'Sova sjedi na grani. Hu-hu!',
      sfx: 'sova',
      art: { placeholder: 'owl' },
      idle: 'sway',
      reaction: 'hop',
      particles: 'sparkles',
    },
    {
      id: 'zaba',
      x: 680,
      y: 880,
      z: 2,
      hit: { r: 160 },
      caption: 'Žaba pjeva noćnu pjesmu. Kre-kre!',
      sfx: 'zaba',
      art: { placeholder: 'frog' },
      idle: 'bob',
      reaction: 'jump',
      particles: 'sparkles',
    },
    {
      id: 'krijesnice',
      x: 1020,
      y: 640,
      z: 4,
      hit: { r: 130 },
      caption: 'Krijesnice svijetle u mraku.',
      sfx: 'krijesnice',
      art: { placeholder: 'fireflies' },
      idle: 'glow',
      reaction: 'spin',
      particles: 'sparkles',
    },
    {
      id: 'cvrcak',
      x: 1300,
      y: 960,
      z: 1,
      hit: { r: 130 },
      caption: 'Cvrčak pjeva: cvrć, cvrć!',
      sfx: 'cvrcak',
      art: { placeholder: 'cricket' },
      idle: 'float',
      reaction: 'hop',
      particles: 'sparkles',
    },
  ],
  reward: {
    caption: 'Bravo! Laku noć, mala žabo!',
    narration: 'mala-zaba-2-bravo',
    sfx: 'bravo',
  },
  ui: { start: 'Kreni!', again: 'Opet!', bravo: 'Bravo!', next: 'Dalje' },
};

export default page;
