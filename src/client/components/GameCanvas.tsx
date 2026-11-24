import type { RefObject } from 'react';

export type GameCanvasProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

export const GameCanvas = ({ containerRef, canvasRef }: GameCanvasProps) => {
  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-reddit-bg"
    >
      <canvas
        ref={canvasRef}
        aria-label="Flappy Snoo game field"
        className="absolute inset-0 block h-full w-full touch-none select-none"
      >
        Your browser does not support HTML5 Canvas.
      </canvas>
    </div>
  );
};
