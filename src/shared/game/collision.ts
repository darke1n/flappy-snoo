import { FIELD, PIPE } from './config';
import type { Circle, PipePair, Rect } from './types';

export const circleHitsRect = (circle: Circle, rect: Rect): boolean => {
  const nearestX = Math.min(
    Math.max(circle.x, rect.x),
    rect.x + rect.w
  );
  const nearestY = Math.min(
    Math.max(circle.y, rect.y),
    rect.y + rect.h
  );
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
};

export const groundY = (fieldHeight: number = FIELD.height): number => {
  return fieldHeight - FIELD.groundHeight;
};

/** Top and bottom collision rectangles of a pipe column. */
export const pipeRects = (
  pipe: PipePair,
  fieldHeight: number = FIELD.height
): readonly [Rect, Rect] => {
  const floor = groundY(fieldHeight);
  const top: Rect = {
    x: pipe.x,
    y: 0,
    w: PIPE.width,
    h: Math.max(0, pipe.gapY),
  };
  const bottom: Rect = {
    x: pipe.x,
    y: pipe.gapY + pipe.gapH,
    w: PIPE.width,
    h: Math.max(0, floor - (pipe.gapY + pipe.gapH)),
  };
  return [top, bottom];
};

export const hitsPipePair = (
  circle: Circle,
  pipe: PipePair,
  fieldHeight: number = FIELD.height
): boolean => {
  const [top, bottom] = pipeRects(pipe, fieldHeight);
  return circleHitsRect(circle, top) || circleHitsRect(circle, bottom);
};

export const hitsGround = (
  circle: Circle,
  fieldHeight: number = FIELD.height
): boolean => {
  return circle.y + circle.radius >= groundY(fieldHeight);
};

export const hitsCeiling = (circle: Circle): boolean => {
  return circle.y - circle.radius <= 0;
};
