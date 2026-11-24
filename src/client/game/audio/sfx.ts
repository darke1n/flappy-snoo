const STORAGE_KEY = 'flappy-snoo:muted';
const MASTER_VOLUME = 0.55;

type ToneOptions = {
  frequency: number;
  endFrequency?: number;
  type: OscillatorType;
  startDelay: number;
  duration: number;
  volume: number;
};

export type Sfx = {
  isMuted: () => boolean;
  setMuted: (muted: boolean) => void;
  unlock: () => void;
  flap: () => void;
  pipe: () => void;
  upvote: () => void;
  hit: () => void;
  best: () => void;
};

const readStoredMute = (): boolean => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const writeStoredMute = (muted: boolean): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  } catch {
    // Private mode or blocked storage: sound still works for this session.
  }
};

/**
 * Tiny procedural sound engine: every effect is synthesised with Web Audio,
 * so the game ships zero audio files. The AudioContext is created lazily on
 * the first user gesture to satisfy mobile autoplay policies.
 */
export const createSfx = (): Sfx => {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let muted = readStoredMute();

  const ready = (): boolean => {
    return context !== null && master !== null && !muted;
  };

  const playTone = (options: ToneOptions): void => {
    if (!context || !master || !ready()) {
      return;
    }

    const start = context.currentTime + options.startDelay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = options.type;
    oscillator.frequency.setValueAtTime(
      Math.max(1, options.frequency),
      start
    );
    if (options.endFrequency !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(1, options.endFrequency),
        start + options.duration
      );
    }

    const attack = Math.min(0.012, options.duration * 0.3);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, options.volume),
      start + attack
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      start + options.duration
    );

    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + options.duration + 0.03);
  };

  const playNoise = (
    startDelay: number,
    duration: number,
    volume: number,
    cutoff: number
  ): void => {
    if (!context || !master || !ready()) {
      return;
    }

    const frameCount = Math.max(
      1,
      Math.floor(context.sampleRate * duration)
    );
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < frameCount; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;

    const gain = context.createGain();
    const start = context.currentTime + startDelay;
    gain.gain.setValueAtTime(Math.max(0.0002, volume), start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(start);
    source.stop(start + duration + 0.02);
  };

  const unlock = (): void => {
    if (!context) {
      try {
        context = new AudioContext();
      } catch {
        return;
      }
      master = context.createGain();
      master.gain.value = muted ? 0 : MASTER_VOLUME;
      master.connect(context.destination);
    }

    if (context.state === 'suspended') {
      void context.resume().catch(() => {
        // Resume is retried on the next gesture by the caller.
      });
    }
  };

  const setMuted = (nextMuted: boolean): void => {
    muted = nextMuted;
    if (context && master) {
      master.gain.setTargetAtTime(
        muted ? 0 : MASTER_VOLUME,
        context.currentTime,
        0.02
      );
    }
    writeStoredMute(muted);
  };

  return {
    isMuted: () => muted,
    setMuted,
    unlock,
    flap: () => {
      playTone({
        frequency: 620,
        endFrequency: 300,
        type: 'triangle',
        startDelay: 0,
        duration: 0.1,
        volume: 0.16,
      });
      playNoise(0, 0.07, 0.05, 1800);
    },
    pipe: () => {
      playTone({
        frequency: 880,
        endFrequency: 1040,
        type: 'sine',
        startDelay: 0,
        duration: 0.06,
        volume: 0.08,
      });
      playTone({
        frequency: 1320,
        type: 'triangle',
        startDelay: 0.015,
        duration: 0.05,
        volume: 0.05,
      });
    },
    upvote: () => {
      const notes = [659.25, 880, 1108.73, 1318.51];
      notes.forEach((frequency, index) => {
        playTone({
          frequency,
          type: 'triangle',
          startDelay: index * 0.055,
          duration: 0.13,
          volume: 0.11,
        });
      });
      playTone({
        frequency: 1760,
        type: 'sine',
        startDelay: 0.2,
        duration: 0.1,
        volume: 0.05,
      });
    },
    hit: () => {
      playTone({
        frequency: 180,
        endFrequency: 55,
        type: 'sine',
        startDelay: 0,
        duration: 0.32,
        volume: 0.3,
      });
      playTone({
        frequency: 92,
        endFrequency: 40,
        type: 'triangle',
        startDelay: 0,
        duration: 0.36,
        volume: 0.16,
      });
      playNoise(0, 0.22, 0.22, 520);
    },
    best: () => {
      const chord = [523.25, 659.25, 783.99];
      chord.forEach((frequency, index) => {
        playTone({
          frequency,
          type: 'triangle',
          startDelay: index * 0.035,
          duration: 0.6,
          volume: 0.1,
        });
      });
      playTone({
        frequency: 1046.5,
        type: 'sine',
        startDelay: 0.18,
        duration: 0.5,
        volume: 0.1,
      });
    },
  };
};
