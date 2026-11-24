import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createGameEngine,
  type GameEngine,
  type GameEvent,
  type GamePhase,
} from '../game/engine';

export type UseGameEngineOptions = {
  seed: number;
  onEvent: (event: GameEvent) => void;
};

export const useGameEngine = ({ seed, onEvent }: UseGameEngineOptions) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const onEventRef = useRef(onEvent);
  const [phase, setPhase] = useState<GamePhase>('attract');
  const [score, setScore] = useState(0);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    setPhase('attract');
    setScore(0);

    const engine = createGameEngine({
      canvas,
      seed,
      onEvent: (event) => {
        switch (event.type) {
          case 'start':
            setPhase('running');
            setScore(0);
            break;
          case 'score':
            setScore(event.total);
            break;
          case 'hit':
            setPhase('dying');
            break;
          case 'over':
            setPhase('over');
            setScore(event.score);
            break;
          case 'flap':
            break;
        }
        onEventRef.current(event);
      },
    });

    engineRef.current = engine;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        engine.resize(width, height);
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      engine.destroy();
      if (engineRef.current === engine) {
        engineRef.current = null;
      }
    };
  }, [seed]);

  const start = useCallback(() => {
    engineRef.current?.start();
  }, []);

  const restart = useCallback(() => {
    engineRef.current?.restart();
  }, []);

  return {
    canvasRef,
    containerRef,
    phase,
    score,
    start,
    restart,
  } as const;
};
