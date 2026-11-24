const TAU = Math.PI * 2;
const POOL_SIZE = 140;

type Particle = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  gravity: number;
  drag: number;
  color: string;
};

type BurstConfig = {
  speedMin: number;
  speedMax: number;
  angleMin: number;
  angleMax: number;
  lifeMin: number;
  lifeMax: number;
  sizeMin: number;
  sizeMax: number;
  gravity: number;
  drag: number;
  colors?: readonly string[];
};

export type ParticleSystem = {
  reset: () => void;
  update: (dt: number) => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
  emitFlap: (x: number, y: number) => void;
  emitUpvote: (x: number, y: number) => void;
  emitCrash: (x: number, y: number) => void;
};

const SPARK_COLORS = [
  '#FF4500',
  '#FF6534',
  '#FFA170',
  '#FFFFFF',
] as const;

const createParticle = (): Particle => {
  return {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 1,
    size: 1,
    gravity: 0,
    drag: 0,
    color: SPARK_COLORS[0] ?? '#FF4500',
  };
};

const randomBetween = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

const pickColor = (colors: readonly string[]): string => {
  const index = Math.floor(Math.random() * colors.length);
  return colors[index] ?? '#FF4500';
};

/**
 * Fixed-size particle pool shared by the whole run. Emitting never allocates
 * and old sparks are recycled instead of growing the pool.
 */
export const createParticleSystem = (): ParticleSystem => {
  const pool: Particle[] = [];
  for (let index = 0; index < POOL_SIZE; index += 1) {
    pool.push(createParticle());
  }

  let cursor = 0;

  const acquire = (): Particle => {
    for (const particle of pool) {
      if (!particle.active) {
        return particle;
      }
    }
    const recycled = pool[cursor % pool.length];
    cursor = (cursor + 1) % pool.length;
    return recycled ?? createParticle();
  };

  const emit = (
    count: number,
    x: number,
    y: number,
    config: BurstConfig
  ): void => {
    const colors = config.colors ?? SPARK_COLORS;

    for (let index = 0; index < count; index += 1) {
      const particle = acquire();
      const angle = randomBetween(config.angleMin, config.angleMax);
      const speed = randomBetween(config.speedMin, config.speedMax);

      particle.active = true;
      particle.x = x + randomBetween(-4, 4);
      particle.y = y + randomBetween(-3, 3);
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.maxLife = randomBetween(config.lifeMin, config.lifeMax);
      particle.life = particle.maxLife;
      particle.size = randomBetween(config.sizeMin, config.sizeMax);
      particle.gravity = config.gravity;
      particle.drag = config.drag;
      particle.color = pickColor(colors);
    }
  };

  const reset = (): void => {
    for (const particle of pool) {
      particle.active = false;
      particle.life = 0;
    }
    cursor = 0;
  };

  const update = (dt: number): void => {
    for (const particle of pool) {
      if (!particle.active) {
        continue;
      }

      particle.life -= dt;
      if (particle.life <= 0) {
        particle.active = false;
        continue;
      }

      particle.vx -= particle.vx * particle.drag * dt;
      particle.vy += particle.gravity * dt;
      particle.vy -= particle.vy * particle.drag * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
    }
  };

  const draw = (ctx: CanvasRenderingContext2D): void => {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const particle of pool) {
      if (!particle.active || particle.life <= 0) {
        continue;
      }

      const fade = particle.life / particle.maxLife;
      ctx.globalAlpha = fade;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(
        particle.x,
        particle.y,
        particle.size * (0.35 + fade * 0.65),
        0,
        TAU
      );
      ctx.fill();
    }

    ctx.restore();
  };

  return {
    reset,
    update,
    draw,
    emitFlap: (x, y) => {
      emit(9, x, y, {
        speedMin: 40,
        speedMax: 130,
        angleMin: Math.PI * 0.28,
        angleMax: Math.PI * 0.72,
        lifeMin: 0.22,
        lifeMax: 0.42,
        sizeMin: 1.1,
        sizeMax: 2.6,
        gravity: 320,
        drag: 2.4,
        colors: SPARK_COLORS,
      });
    },
    emitUpvote: (x, y) => {
      emit(20, x, y, {
        speedMin: 70,
        speedMax: 220,
        angleMin: 0,
        angleMax: TAU,
        lifeMin: 0.32,
        lifeMax: 0.6,
        sizeMin: 1.4,
        sizeMax: 3.2,
        gravity: 120,
        drag: 1.6,
        colors: SPARK_COLORS,
      });
    },
    emitCrash: (x, y) => {
      emit(30, x, y, {
        speedMin: 110,
        speedMax: 320,
        angleMin: 0,
        angleMax: TAU,
        lifeMin: 0.45,
        lifeMax: 0.9,
        sizeMin: 1.6,
        sizeMax: 4,
        gravity: 720,
        drag: 1.1,
        colors: SPARK_COLORS,
      });
    },
  };
};
