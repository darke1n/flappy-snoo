import { COLORS, FIELD, PIPE } from '../../../shared/game/config';

const TAU = Math.PI * 2;

const wrap = (value: number, size: number): number => {
  return ((value % size) + size) % size;
};

const drawGhostArrow = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  alpha: number
): void => {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.85, size * 0.15);
  ctx.lineTo(size * 0.32, size * 0.15);
  ctx.lineTo(size * 0.32, size);
  ctx.lineTo(-size * 0.32, size);
  ctx.lineTo(-size * 0.32, size * 0.15);
  ctx.lineTo(-size * 0.85, size * 0.15);
  ctx.closePath();
  ctx.fillStyle = COLORS.accent;
  ctx.fill();
  ctx.restore();
};

export type BackgroundLayer = {
  draw: (ctx: CanvasRenderingContext2D, time: number) => void;
};

/**
 * Caches the dark Reddit gradient once and draws cheap parallax shapes on top.
 * Everything is procedural and allocation-free per frame.
 */
export const createBackground = (): BackgroundLayer => {
  let gradient: CanvasGradient | null = null;
  let glow: CanvasGradient | null = null;

  const ensureGradients = (ctx: CanvasRenderingContext2D): void => {
    if (gradient && glow) {
      return;
    }
    gradient = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    gradient.addColorStop(0, '#0B1416');
    gradient.addColorStop(0.55, '#0C171A');
    gradient.addColorStop(1, '#101F23');

    glow = ctx.createRadialGradient(
      FIELD.width * 0.5,
      FIELD.height * 0.42,
      20,
      FIELD.width * 0.5,
      FIELD.height * 0.42,
      FIELD.width * 0.9
    );
    glow.addColorStop(0, 'rgba(255, 69, 0, 0.10)');
    glow.addColorStop(1, 'rgba(255, 69, 0, 0)');
  };

  return {
    draw(ctx, time) {
      ensureGradients(ctx);
      if (!gradient || !glow) {
        return;
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);

      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);

      // Far parallax layer: faint upvote ghosts drifting left.
      for (let index = 0; index < 9; index += 1) {
        const speed = 7 + (index % 3) * 5;
        const x = wrap(index * 83 - time * speed, FIELD.width + 120) - 60;
        const y = 52 + ((index * 97) % 380);
        const size = 5 + (index % 4) * 2.5;
        drawGhostArrow(ctx, x, y, size, 0.05);
      }

      // Near parallax layer: soft comment bubbles.
      for (let index = 0; index < 7; index += 1) {
        const speed = 18 + (index % 3) * 7;
        const x = wrap(index * 117 - time * speed, FIELD.width + 140) - 70;
        const y = 100 + ((index * 131) % 330);
        const radius = 10 + (index % 3) * 5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.fillStyle = 'rgba(139, 161, 168, 0.05)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - radius * 0.3, y - radius * 0.35, radius * 0.18, 0, TAU);
        ctx.fillStyle = 'rgba(229, 235, 238, 0.05)';
        ctx.fill();
      }

      const groundTop = FIELD.height - FIELD.groundHeight;

      // Horizon accent.
      ctx.fillStyle = 'rgba(255, 69, 0, 0.18)';
      ctx.fillRect(0, groundTop - 1, FIELD.width, 1);

      // Ground card.
      ctx.fillStyle = COLORS.surface;
      ctx.fillRect(0, groundTop, FIELD.width, FIELD.groundHeight);
      ctx.fillStyle = COLORS.accent;
      ctx.fillRect(0, groundTop, FIELD.width, 2.5);

      // Scrolling dashes give a sense of speed without any assets.
      for (let index = 0; index < 10; index += 1) {
        const x = wrap(index * 48 - time * PIPE.speed, FIELD.width + 48) - 24;
        ctx.beginPath();
        ctx.roundRect(x, groundTop + 18, 26, 8, 4);
        ctx.fillStyle = 'rgba(139, 161, 168, 0.18)';
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(x + 40, groundTop + 40, 16, 5, 2.5);
        ctx.fillStyle = 'rgba(255, 69, 0, 0.12)';
        ctx.fill();
      }
    },
  };
};
