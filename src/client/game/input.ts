export type InputHandlers = {
  primary: () => void;
};

const isPrimaryKey = (event: KeyboardEvent): boolean => {
  return event.code === 'Space' || event.code === 'ArrowUp';
};

/**
 * Binds pointer taps on the canvas and Space/ArrowUp on the window.
 * Returns an idempotent unbind function for cleanup.
 */
export const bindInput = (
  canvas: HTMLCanvasElement,
  handlers: InputHandlers
): (() => void) => {
  let bound = true;

  const onPointerDown = (event: PointerEvent): void => {
    event.preventDefault();
    handlers.primary();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!isPrimaryKey(event) || event.repeat) {
      return;
    }
    event.preventDefault();
    handlers.primary();
  };

  const onContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('keydown', onKeyDown);

  return () => {
    if (!bound) {
      return;
    }
    bound = false;
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('contextmenu', onContextMenu);
    window.removeEventListener('keydown', onKeyDown);
  };
};
