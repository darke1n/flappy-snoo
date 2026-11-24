import { FIELD } from '../../../shared/game/config';
import type { ParticleSystem } from '../effects/particles';
import type { CameraEffects } from '../effects/shake';
import type { RunState } from '../state';
import { createBackground } from './background';
import { drawPickups } from './pickups';
import { drawPipes } from './pipes';
import { drawSnoo } from './snoo';

export type Renderer = {
  resize: (cssWidth: number, cssHeight: number) => void;
  draw: (
    state: RunState,
    particles?: ParticleSystem,
    camera?: CameraEffects
  ) => void;
};

/**
 * Owns the canvas backing store, DPR handling and letterboxing of the
 * 360x640 virtual field. All drawing below this module uses virtual units.
 */
export const createRenderer = (canvas: HTMLCanvasElement): Renderer => {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not available');
  }

  const background = createBackground();
  let dpr = 1;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let cssWidth = 0;
  let cssHeight = 0;

  const resize = (nextWidth: number, nextHeight: number): void => {
    if (nextWidth <= 0 || nextHeight <= 0) {
      return;
    }

    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const backingWidth = Math.max(1, Math.round(nextWidth * dpr));
    const backingHeight = Math.max(1, Math.round(nextHeight * dpr));

    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
      canvas.width = backingWidth;
      canvas.height = backingHeight;
    }

    cssWidth = nextWidth;
    cssHeight = nextHeight;
    scale = Math.min(nextWidth / FIELD.width, nextHeight / FIELD.height);
    offsetX = (nextWidth - FIELD.width * scale) / 2;
    offsetY = (nextHeight - FIELD.height * scale) / 2;
  };

  const draw = (
    state: RunState,
    particles?: ParticleSystem,
    camera?: CameraEffects
  ): void => {
    if (cssWidth === 0 || cssHeight === 0) {
      return;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#05090A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(
      dpr * scale,
      0,
      0,
      dpr * scale,
      dpr * offsetX,
      dpr * offsetY
    );

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, FIELD.width, FIELD.height);
    ctx.clip();

    if (camera) {
      ctx.translate(camera.offsetX, camera.offsetY);
    }

    background.draw(ctx, state.worldTime);
    drawPipes(ctx, state.pipes);
    drawPickups(ctx, state.pickups);
    drawSnoo(ctx, state.snoo, state.worldTime);
    particles?.draw(ctx);

    ctx.restore();

    camera?.drawFlash(ctx);
  };

  return { resize, draw };
};
