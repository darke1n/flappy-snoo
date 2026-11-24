import { FIELD } from '../../../shared/game/config';

const MAX_SHAKE_OFFSET = 9;
const TRAUMA_DECAY_PER_SECOND = 1.6;
const FLASH_DECAY_PER_SECOND = 5;
const FLASH_MAX_ALPHA = 0.5;

const clamp01 = (value: number): number => {
  return Math.max(0, Math.min(1, value));
};

export type CameraEffects = {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly flashAlpha: number;
  addTrauma: (amount: number) => void;
  flash: (amount: number, rgb?: string) => void;
  update: (dt: number) => void;
  reset: () => void;
  drawFlash: (ctx: CanvasRenderingContext2D) => void;
};

/**
 * Trauma-based camera shake plus a one-frame flash. Offsets are smooth
 * sine mixes instead of white noise, so the camera rumbles instead of
 * strobing. Both values decay automatically every simulation step.
 */
export const createCameraEffects = (): CameraEffects => {
  let trauma = 0;
  let time = 0;
  let offsetX = 0;
  let offsetY = 0;
  let flashAmount = 0;
  let flashRgb = '255, 238, 230';

  const update = (dt: number): void => {
    time += dt;
    trauma = Math.max(0, trauma - TRAUMA_DECAY_PER_SECOND * dt);
    flashAmount = Math.max(0, flashAmount - FLASH_DECAY_PER_SECOND * dt);

    const strength = trauma * trauma * MAX_SHAKE_OFFSET;
    offsetX =
      (Math.sin(time * 37.1) * 0.7 +
        Math.sin(time * 61.7 + 1.3) * 0.3) *
      strength;
    offsetY =
      (Math.cos(time * 43.3) * 0.65 +
        Math.sin(time * 71.9 + 0.4) * 0.35) *
      strength;
  };

  return {
    get offsetX() {
      return offsetX;
    },
    get offsetY() {
      return offsetY;
    },
    get flashAlpha() {
      return flashAmount;
    },
    addTrauma: (amount) => {
      trauma = clamp01(trauma + amount);
    },
    flash: (amount, rgb) => {
      flashAmount = Math.max(flashAmount, clamp01(amount));
      if (rgb) {
        flashRgb = rgb;
      }
    },
    update,
    reset: () => {
      trauma = 0;
      flashAmount = 0;
      offsetX = 0;
      offsetY = 0;
    },
    drawFlash: (ctx) => {
      if (flashAmount <= 0) {
        return;
      }
      const alpha = flashAmount * FLASH_MAX_ALPHA;
      ctx.fillStyle = `rgba(${flashRgb}, ${alpha.toFixed(3)})`;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    },
  };
};
