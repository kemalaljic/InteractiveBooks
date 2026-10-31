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
  ambient: {
    loops: [
      { key: 'jezero-voda', volume: 0.4 }, // water lapping at the bank
      { key: 'jezero-ptice', volume: 0.2 }, // distant birdsong
      { key: 'jezero-vjetar', volume: 0.15 }, // soft wind in leaves
    ],
    sprinkles: [
      { keys: ['ptica-cvrkut-1', 'ptica-cvrkut-2'], volume: 0.35, every: [6, 14] },
      { keys: ['zaba-daleko'], volume: 0.25, every: [12, 25] },
      { keys: ['riba-pljus-mali'], volume: 0.3, every: [9, 20] },
    ],
  },
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
    {
      id: 'patka',
      x: 880,
      y: 735,
      scale: 0.8,
      z: 1,
      hit: { r: 130 },
      caption: 'Patka pliva po jezeru. Kva-kva!',
      sfx: 'patka',
      art: { placeholder: 'duck' },
      idle: 'paddle',
      reaction: 'dive',
      particles: 'splash',
    },
    {
      id: 'leptir',
      x: 560,
      y: 440,
      z: 5,
      hit: { r: 115 },
      caption: 'Šareni leptir leti iznad trave.',
      sfx: 'leptir',
      art: { placeholder: 'butterfly' },
      idle: 'flutter',
      reaction: 'loop',
      particles: 'sparkles',
    },
    {
      id: 'ptica',
      x: 190,
      y: 345,
      layer: 'far',
      z: 2,
      hit: { r: 110 },
      caption: 'Ptičica pjeva na drvetu. Ćiju-ćiju!',
      sfx: 'ptica',
      art: { placeholder: 'bird' },
      idle: 'bob',
      reaction: 'hop',
      particles: 'sparkles',
    },
  ],
  reward: {
    caption: 'Bravo! Sve smo pronašli!',
    narration: 'mala-zaba-1-bravo',
    sfx: 'bravo',
  },
  ui: { start: 'Kreni!', again: 'Opet!', bravo: 'Bravo!', next: 'Dalje' },
};

export default page;
