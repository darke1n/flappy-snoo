export type Vec2 = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Circle = {
  x: number;
  y: number;
  radius: number;
};

export type PipePair = {
  id: number;
  /** Left edge of the pipe column in world units. */
  x: number;
  /** Top edge of the gap. */
  gapY: number;
  /** Height of the gap. */
  gapH: number;
  scored: boolean;
};

export type Pickup = {
  id: number;
  x: number;
  y: number;
  /** Animation phase in radians, advanced by the renderer. */
  phase: number;
  collected: boolean;
};

export type ObstacleSpec = {
  index: number;
  gapY: number;
  gapH: number;
  /** Vertical offset of the upvote inside the gap, or `null` for none. */
  pickupOffsetY: number | null;
};
