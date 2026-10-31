import type { PageConfig } from '../../core/types';

/**
 * "Mala žaba", page 1: the pond.
 * Wording stays within vocabulary shared by Croatian and Bosnian.
 * File names have no diacritics: zaba, lopoc, vilin-konjic, riba, trska.
 */
const page: PageConfig = {
  id: 'mala-zaba-1',
  bookTitle: 'Mala žaba',
  lang: 'hr',
  ambient: 'mala-zaba-1',
  ambientVolume: 0.3,
  layers: [
    { id: 'sky', parallax: 0.15, painter: 'pondSky' },
    { id: 'far', parallax: 0.45, painter: 'pondFarBank' },
    { id: 'water', parallax: 1, painter: 'pondWater' },
  ],
  intro: {
    caption: 'Ovo je jezero. Tu živi mala žaba.',
    narration: 'mala-zaba-1-intro',
  },
  objects: [
    {
      id: 'lopoc',
      x: 1130,
      y: 975,
      z: 0,
      hit: { r: 150, dy: -10 },
      caption: 'Ovo je lopoč. Na njemu raste cvijet.',
      sfx: 'lopoc',
      art: { placeholder: 'lilypad' },
      idle: 'float',
      reaction: 'wobble',
      particles: 'splash',
    },
    {
      id: 'zaba',
      x: 640,
      y: 880,
      z: 2,
      hit: { r: 160 },
      caption: 'Kre-kre! Ja sam mala žaba.',
      sfx: 'zaba',
      art: {
        placeholder: 'frog',
        // Drop public/rive/zaba.riv in and uncomment to switch to the Rive character:
        // rive: { src: 'rive/zaba.riv', width: 320, height: 300 },
      },
      idle: 'bob',
      reaction: 'jump',
      particles: 'sparkles',
    },
    {
      id: 'vilin-konjic',
      x: 1010,
      y: 500,
      z: 3,
      hit: { r: 130 },
      caption: 'Vilin konjic leti iznad vode. Bzzz!',
      sfx: 'vilin-konjic',
      art: { placeholder: 'dragonfly' },
      idle: 'hover',
      reaction: 'loop',
      particles: 'sparkles',
    },
    {
      id: 'riba',
      x: 300,
      y: 1060,
      z: 1,
      hit: { r: 140 },
      caption: 'Riba skače iz vode. Pljus!',
      sfx: 'riba',
      art: { placeholder: 'fish' },
      idle: 'swim',
      reaction: 'leap',
      particles: 'splash',
    },
    {
      id: 'trska',
      x: 1420,
      y: 900,
      z: 1,
      hit: { r: 150, dy: -230 },
      caption: 'Trska se njiše na vjetru. Šššš!',
      sfx: 'trska',
      art: { placeholder: 'reed' },
      idle: 'sway',
      reaction: 'sway',
      particles: 'sparkles',
    },
  ],
  reward: {
    caption: 'Bravo! Sve smo pronašli!',
    narration: 'mala-zaba-1-bravo',
    sfx: 'bravo',
  },
  ui: { start: 'Kreni!', again: 'Opet!', bravo: 'Bravo!' },
};

export default page;
