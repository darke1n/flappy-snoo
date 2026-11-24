import { COLORS, FIELD, PIPE } from '../../../shared/game/config';
import type { PipePair } from '../../../shared/game/types';

const CARD_RADIUS = 10;
const CAP_HEIGHT = 26;
const CAP_OVERHANG = 4;
const SHADOW_OFFSET_X = 5;
const SHADOW_OFFSET_Y = 6;

const drawCardBody = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void => {
  // Cheap offset shadow instead of shadowBlur.
  ctx.beginPath();
  ctx.roundRect(
    x + SHADOW_OFFSET_X,
    y + SHADOW_OFFSET_Y,
    width,
    height,
    radius
  );
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.fill();

  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = COLORS.surface;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.accent;
  ctx.stroke();
};

const drawVoteChevron = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  alpha: number
): void => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.85, y + size * 0.15);
  ctx.lineTo(x + size * 0.3, y + size * 0.15);
  ctx.lineTo(x + size * 0.3, y + size);
  ctx.lineTo(x - size * 0.3, y + size);
  ctx.lineTo(x - size * 0.3, y + size * 0.15);
  ctx.lineTo(x - size * 0.85, y + size * 0.15);
  ctx.closePath();
  ctx.fillStyle = COLORS.accent;
  ctx.fill();
  ctx.restore();
};

const drawPostLines = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number
): void => {
  ctx.fillStyle = 'rgba(229, 235, 238, 0.09)';
  ctx.fillRect(x + 12, y, width - 24, 3);
  ctx.fillRect(x + 12, y + 10, width - 34, 3);
};

const drawPipePair = (ctx: CanvasRenderingContext2D, pipe: PipePair): void => {
  const x = pipe.x;
  const width = PIPE.width;
  const groundTop = FIELD.height - FIELD.groundHeight;

  const topBodyHeight = pipe.gapY + 24;
  drawCardBody(ctx, x, -24, width, topBodyHeight, CARD_RADIUS);
  drawCardBody(
    ctx,
    x - CAP_OVERHANG,
    pipe.gapY - CAP_HEIGHT,
    width + CAP_OVERHANG * 2,
    CAP_HEIGHT,
    CARD_RADIUS
  );

  const bottomY = pipe.gapY + pipe.gapH;
  const bottomBodyHeight = groundTop - bottomY + 24;
  drawCardBody(ctx, x, bottomY, width, bottomBodyHeight, CARD_RADIUS);
  drawCardBody(
    ctx,
    x - CAP_OVERHANG,
    bottomY,
    width + CAP_OVERHANG * 2,
    CAP_HEIGHT,
    CARD_RADIUS
  );

  // Card content: comment lines and an upvote glyph facing the gap.
  drawPostLines(ctx, x, pipe.gapY - 108, width);
  drawPostLines(ctx, x, pipe.gapY - 82, width);
  drawPostLines(ctx, x, bottomY + 58, width);
  drawPostLines(ctx, x, bottomY + 84, width);

  drawVoteChevron(
    ctx,
    x + width / 2,
    pipe.gapY - 46,
    10,
    0.75
  );
  drawVoteChevron(
    ctx,
    x + width / 2,
    bottomY + 46,
    10,
    0.75
  );
};

export const drawPipes = (
  ctx: CanvasRenderingContext2D,
  pipes: readonly PipePair[]
): void => {
  for (const pipe of pipes) {
    if (pipe.x > FIELD.width + 20 || pipe.x + PIPE.width < -20) {
      continue;
    }
    drawPipePair(ctx, pipe);
  }
};
