import { COLORS, UPVOTE } from '../../../shared/game/config';
import type { Pickup } from '../../../shared/game/types';

const TAU = Math.PI * 2;

const drawUpvoteGlyph = (
  ctx: CanvasRenderingContext2D,
  size: number
): void => {
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.9, size * 0.12);
  ctx.lineTo(size * 0.34, size * 0.12);
  ctx.lineTo(size * 0.34, size * 0.92);
  ctx.lineTo(-size * 0.34, size * 0.92);
  ctx.lineTo(-size * 0.34, size * 0.12);
  ctx.lineTo(-size * 0.9, size * 0.12);
  ctx.closePath();
  ctx.fillStyle = COLORS.accent;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = COLORS.accentSoft;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -size * 0.72);
  ctx.lineTo(size * 0.5, size * 0.05);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
};

export const drawPickups = (
  ctx: CanvasRenderingContext2D,
  pickups: readonly Pickup[]
): void => {
  for (const pickup of pickups) {
    if (pickup.collected) {
      continue;
    }

    const pulse = 1 + Math.sin(pickup.phase) * 0.08;
    const haloAlpha = 0.08 + (Math.sin(pickup.phase) + 1) * 0.045;

    ctx.save();
    ctx.translate(pickup.x, pickup.y);

    ctx.beginPath();
    ctx.arc(0, 0, UPVOTE.radius + 7, 0, TAU);
    ctx.fillStyle = `rgba(255, 69, 0, ${haloAlpha.toFixed(3)})`;
    ctx.fill();

    ctx.scale(pulse, pulse);
    drawUpvoteGlyph(ctx, 11);
    ctx.restore();
  }
};
