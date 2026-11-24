import { COLORS, SNOO } from '../../../shared/game/config';
import type { SnooState } from '../state';

const TAU = Math.PI * 2;

/** Wide, slightly oval Snoo head (~1.35:1). */
const HEAD_RX = SNOO.radius * 1.22;
const HEAD_RY = SNOO.radius * 0.9;
const EAR_RADIUS = SNOO.radius * 0.32;
const EYE_X = SNOO.radius * 0.45;
const EYE_RX = SNOO.radius * 0.29;
const EYE_RY = SNOO.radius * 0.33;

const drawAntenna = (
  ctx: CanvasRenderingContext2D,
  snoo: SnooState,
  time: number
): void => {
  // The spring value is kicked by the engine on every flap; the slow sine is
  // an idle breeze so the antenna never looks frozen.
  const sway =
    snoo.antenna + Math.sin(time * 2.2 + snoo.wing * 0.35) * 0.045;
  const baseX = 1;
  const baseY = -HEAD_RY + 2;
  const bend = 5 + sway * 22;
  const tipX = baseX + bend;
  const tipY = baseY - 17;

  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + bend * 0.35, baseY - 10, tipX, tipY);
  ctx.strokeStyle = COLORS.text;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Orange-and-white bobble at the tip.
  ctx.beginPath();
  ctx.arc(tipX, tipY, 4.3, 0, TAU);
  ctx.fillStyle = COLORS.accent;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(tipX - 1.3, tipY - 1.4, 1.5, 0, TAU);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(tipX + 1.2, tipY + 1.3, 0.9, 0, TAU);
  ctx.fillStyle = 'rgba(120, 25, 0, 0.35)';
  ctx.fill();
};

const drawEars = (ctx: CanvasRenderingContext2D): void => {
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.arc(side * (HEAD_RX - 1.4), -1.5, EAR_RADIUS, 0, TAU);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(229, 235, 238, 0.92)';
    ctx.stroke();
  }
};

const drawEyes = (
  ctx: CanvasRenderingContext2D,
  snoo: SnooState,
  time: number
): void => {
  const blink = Math.sin(time * 1.7 + snoo.wing * 0.2) > 0.975 ? 0.16 : 1;

  for (const eyeX of [-EYE_X, EYE_X] as const) {
    ctx.beginPath();
    ctx.ellipse(eyeX, -1.8, EYE_RX, EYE_RY * blink, 0, 0, TAU);
    ctx.fillStyle = COLORS.accent;
    ctx.fill();

    if (blink > 0.5) {
      // Soft catchlight keeps the mascot friendly at any size.
      ctx.beginPath();
      ctx.arc(eyeX - EYE_RX * 0.34, -3.4, 1.35, 0, TAU);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(eyeX + EYE_RX * 0.3, 0.6, 0.7, 0, TAU);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fill();
    }
  }
};

/**
 * Draws the Reddit Snoo mascot procedurally at `snoo.x, snoo.y`:
 * wide white head, round ears, springy antenna and orange eyes.
 * `snoo.rotation` follows vertical velocity, so the body tilts into dives.
 */
export const drawSnoo = (
  ctx: CanvasRenderingContext2D,
  snoo: SnooState,
  time: number
): void => {
  ctx.save();
  ctx.translate(snoo.x, snoo.y);
  ctx.rotate(snoo.rotation);

  // Cheap offset shadow instead of a costly shadowBlur.
  ctx.beginPath();
  ctx.ellipse(2.5, 3.5, HEAD_RX, HEAD_RY, 0, 0, TAU);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.fill();

  drawAntenna(ctx, snoo, time);
  drawEars(ctx);

  // Wide Snoo head.
  ctx.beginPath();
  ctx.ellipse(0, 0, HEAD_RX, HEAD_RY, 0, 0, TAU);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = 'rgba(229, 235, 238, 0.95)';
  ctx.stroke();

  drawEyes(ctx, snoo, time);

  // Smooth smile arc.
  ctx.beginPath();
  ctx.arc(0, 4.4, 5.2, Math.PI * 0.2, Math.PI * 0.8);
  ctx.strokeStyle = 'rgba(11, 20, 22, 0.82)';
  ctx.lineWidth = 1.9;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Tiny cheek glints.
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.arc(side * 12.5, 5.2, 1.5, 0, TAU);
    ctx.fillStyle = 'rgba(255, 69, 0, 0.14)';
    ctx.fill();
  }

  ctx.restore();
};
