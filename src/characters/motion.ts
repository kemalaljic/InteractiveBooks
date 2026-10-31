import type { IdleKind, ReactionKind } from '../core/types';

/** Offset from the rest pose. Translations in world units, rotation in radians. */
export interface Pose {
  dx: number;
  dy: number;
  sx: number;
  sy: number;
  rot: number;
}

export const REST: Pose = { dx: 0, dy: 0, sx: 1, sy: 1, rot: 0 };

const TAU = Math.PI * 2;
const damped = (p: number, decay: number, cycles: number) => Math.exp(-decay * p) * Math.sin(p * Math.PI * cycles);
const smooth = (a: number, b: number, p: number) => {
  const k = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** Idle loops, functions of time in seconds. `seed` de-syncs identical objects. */
export const IDLE: Record<IdleKind, (t: number, seed: number) => Pose> = {
  bob: (t, s) => {
    const b = Math.sin(t * 2.2 + s);
    return { dx: 0, dy: b * 6, sx: 1 + b * 0.015, sy: 1 - b * 0.015, rot: 0 };
  },
  hover: (t, s) => ({
    dx: Math.sin(t * 0.6 + s) * 70,
    dy: Math.sin(t * 1.2 + s) * 28,
    sx: 1,
    sy: 1,
    rot: Math.cos(t * 0.6 + s) * 0.08,
  }),
  swim: (t, s) => {
    const c = Math.cos(t * 0.45 + s);
    // Turn around by squishing through zero instead of snapping.
    return { dx: Math.sin(t * 0.45 + s) * 80, dy: Math.sin(t * 1.3) * 6, sx: Math.max(-1, Math.min(1, c * 4)), sy: 1, rot: 0 };
  },
  sway: (t, s) => ({ dx: 0, dy: 0, sx: 1, sy: 1, rot: Math.sin(t * 1.1 + s) * 0.035 + Math.sin(t * 2.3 + s) * 0.012 }),
  float: (t, s) => ({ dx: 0, dy: Math.sin(t + s) * 4, sx: 1, sy: 1, rot: Math.sin(t * 0.8 + s) * 0.02 }),
  // duck: slow drift on the water with a gentle rock
  paddle: (t, s) => ({ dx: Math.sin(t * 0.3 + s) * 45, dy: Math.sin(t * 1.6 + s) * 4, sx: 1, sy: 1, rot: Math.sin(t * 1.6 + s) * 0.04 }),
  // butterfly: irregular wandering (sum of incommensurate sines)
  flutter: (t, s) => ({
    dx: Math.sin(t * 0.5 + s) * 60 + Math.sin(t * 1.7 + s) * 18,
    dy: Math.sin(t * 0.8 + s) * 30 + Math.sin(t * 3.1) * 10,
    sx: 1,
    sy: 1,
    rot: Math.sin(t * 1.3 + s) * 0.15,
  }),
  // moon, fireflies: slow breathing glow
  glow: (t, s) => {
    const b = Math.sin(t * 0.9 + s);
    return { dx: 0, dy: b * 5, sx: 1 + b * 0.025, sy: 1 + b * 0.025, rot: 0 };
  },
};

export interface Reaction {
  duration: number;
  landAt?: number;
  pose: (p: number) => Pose;
}

/** Tap reactions, functions of progress p in 0..1. Composed on top of the idle pose. */
export const REACTIONS: Record<ReactionKind, Reaction> = {
  squash: {
    duration: 0.7,
    pose: (p) => {
      const w = damped(p, 5, 5) * 0.28;
      return { dx: 0, dy: 0, sx: 1 + w, sy: 1 - w, rot: 0 };
    },
  },
  jump: {
    // anticipation squash → stretch up → land squash → settle
    duration: 1.0,
    landAt: 0.72,
    pose: (p) => {
      const crouch = p < 0.15 ? Math.sin((p / 0.15) * Math.PI) * 0.25 : 0;
      const air = p >= 0.15 && p < 0.72 ? (p - 0.15) / 0.57 : -1;
      const dy = air >= 0 ? -260 * Math.sin(air * Math.PI) : 0;
      const stretch = air >= 0 ? Math.cos(air * Math.PI) * 0.18 : 0;
      const land = p >= 0.72 ? damped((p - 0.72) / 0.28, 3, 3) * 0.28 : 0;
      const squash = crouch + land - stretch;
      return { dx: 0, dy, sx: 1 + squash, sy: 1 - squash, rot: air >= 0 ? Math.sin(air * TAU) * 0.08 : 0 };
    },
  },
  wobble: {
    duration: 1.2,
    pose: (p) => ({
      dx: 0,
      dy: damped(p, 4, 5) * 22,
      sx: 1 + damped(p, 4, 6) * 0.12,
      sy: 1 - damped(p, 4, 6) * 0.12,
      rot: damped(p, 4, 7) * 0.14,
    }),
  },
  loop: {
    // a full loop-the-loop
    duration: 1.3,
    pose: (p) => {
      const a = smooth(0, 1, p) * TAU;
      const R = 130;
      return { dx: Math.sin(a) * R, dy: -(1 - Math.cos(a)) * R, sx: 1, sy: 1, rot: -a };
    },
  },
  leap: {
    // out of the water, somersault, back in
    duration: 1.2,
    landAt: 0.92,
    pose: (p) => {
      const air = smooth(0, 0.92, p);
      const settle = p > 0.92 ? damped((p - 0.92) / 0.08, 2, 1) * 0.2 : 0;
      return { dx: 0, dy: -380 * Math.sin(air * Math.PI), sx: 1 + settle, sy: 1 - settle, rot: -air * TAU };
    },
  },
  dive: {
    // duck tips bottom-up, then pops back
    duration: 1.4,
    landAt: 0.15,
    pose: (p) => {
      const down = smooth(0, 0.25, p) * (1 - smooth(0.6, 0.85, p));
      const pop = p > 0.85 ? damped((p - 0.85) / 0.15, 3, 2) * 0.2 : 0;
      return { dx: 0, dy: down * 40, sx: 1 + pop, sy: 1 - pop, rot: -down * 1.6 };
    },
  },
  hop: {
    // small double hop
    duration: 0.9,
    pose: (p) => {
      const h = Math.abs(Math.sin(p * Math.PI * 2)) * (1 - p * 0.4);
      const squash = (1 - h) * 0.12 * Math.sin(p * Math.PI);
      return { dx: 0, dy: -70 * h, sx: 1 + squash, sy: 1 - squash + h * 0.08, rot: Math.sin(p * TAU) * 0.12 };
    },
  },
  spin: {
    // pop + a full turn
    duration: 1.1,
    pose: (p) => {
      const pop = damped(p, 4, 3) * 0.3;
      return { dx: 0, dy: 0, sx: 1 + pop, sy: 1 + pop, rot: smooth(0, 0.8, p) * TAU };
    },
  },
  sway: {
    duration: 1.6,
    pose: (p) => ({ dx: 0, dy: 0, sx: 1, sy: 1, rot: damped(p, 3, 6) * 0.32 }),
  },
};

/** Generic celebration used by happy(). */
export const HAPPY: Reaction = {
  duration: 0.8,
  pose: (p) => {
    const hop = Math.abs(Math.sin(p * Math.PI * 2)) * (1 - p);
    return { dx: 0, dy: -90 * hop, sx: 1 - hop * 0.08, sy: 1 + hop * 0.12, rot: Math.sin(p * TAU * 2) * 0.1 * (1 - p) };
  },
};

export function compose(a: Pose, b: Pose): Pose {
  return { dx: a.dx + b.dx, dy: a.dy + b.dy, sx: a.sx * b.sx, sy: a.sy * b.sy, rot: a.rot + b.rot };
}
