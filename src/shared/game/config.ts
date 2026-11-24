/**
 * Physics and layout are expressed in virtual units on a 360x640 field.
 * The renderer scales the field to the viewport, so difficulty is identical
 * on every screen size.
 */
export const FIELD = {
  width: 360,
  height: 640,
  groundHeight: 72,
  topMargin: 40,
  bottomMargin: 40,
} as const;

export const SNOO = {
  x: 96,
  radius: 16,
  hitboxRadius: 13,
  gravity: 1500,
  flapVelocity: -420,
  maxFallSpeed: 640,
} as const;

export const PIPE = {
  width: 62,
  spacing: 290,
  leadInX: 420,
  speed: 150,
  baseGapHeight: 200,
  minGapHeight: 160,
  gapRampStart: 3,
  gapRampLength: 40,
  scoringLineX: SNOO.x,
} as const;

export const UPVOTE = {
  radius: 14,
  value: 2,
  chance: 0.35,
  edgePadding: 12,
} as const;

export const SCORE = {
  pipe: 1,
  upvote: UPVOTE.value,
} as const;

export const COLORS = {
  background: '#0B1416',
  surface: '#121E21',
  accent: '#FF4500',
  accentSoft: '#FF6534',
  text: '#E5EBEE',
  textMuted: '#8BA1A8',
} as const;
