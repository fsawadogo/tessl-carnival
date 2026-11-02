import { canvasFont, recordScore, theme, type CarnivalGame } from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const ROUND_SECONDS = 30;
export const SPAWN_INTERVAL = 0.6;
export const SIZES = [
  { radius: 18, speed: 150, points: 30 },
  { radius: 26, speed: 110, points: 20 },
  { radius: 34, speed: 80, points: 10 },
] as const;
const BALLOON_COLORS = [
  theme.colors.stripeA,
  theme.colors.accent,
  theme.colors.water,
  theme.colors.danger,
];

export interface Balloon {
  x: number;
  y: number;
  radius: number;
  /** Pixels per second upwards. */
  speed: number;
  points: number;
  color: string;
}

export interface Pop {
  x: number;
  y: number;
  age: number;
}

export interface BalloonPopState {
  balloons: Balloon[];
  pops: Pop[];
  timeLeft: number;
  /** Seconds until the next balloon floats up. */
  nextSpawn: number;
  score: number;
  popped: number;
  phase: 'playing' | 'over';
}

export function createState(): BalloonPopState {
  return {
    balloons: [],
    pops: [],
    timeLeft: ROUND_SECONDS,
    nextSpawn: 0,
    score: 0,
    popped: 0,
    phase: 'playing',
  };
}

/** A new balloon just below the bottom edge. `random` returns numbers in [0, 1). */
export function spawnBalloon(random: () => number = Math.random): Balloon {
  const size = SIZES[Math.floor(random() * SIZES.length)];
  const color = BALLOON_COLORS[Math.floor(random() * BALLOON_COLORS.length)];
  const x = size.radius + random() * (WIDTH - size.radius * 2);
  return { x, y: HEIGHT + size.radius, ...size, color };
}

export function isOnBalloon(balloon: Balloon, x: number, y: number): boolean {
  return Math.hypot(x - balloon.x, y - balloon.y) <= balloon.radius;
}

/** Pops the front-most balloon under the point. Returns the points scored, or 0 for a miss. */
export function popAt(state: BalloonPopState, x: number, y: number): number {
  if (state.phase !== 'playing') return 0;
  // Later balloons are drawn on top, so check them first.
  for (let i = state.balloons.length - 1; i >= 0; i--) {
    const balloon = state.balloons[i];
    if (isOnBalloon(balloon, x, y)) {
      state.balloons.splice(i, 1);
      state.pops.push({ x: balloon.x, y: balloon.y, age: 0 });
      state.score += balloon.points;
      state.popped += 1;
      return balloon.points;
    }
  }
  return 0;
}

/** Advances the game by `dt` seconds. */
export function step(state: BalloonPopState, dt: number, random: () => number = Math.random) {
  for (const pop of state.pops) pop.age += dt;
  state.pops = state.pops.filter((p) => p.age < 0.3);
  if (state.phase !== 'playing') return;

  state.timeLeft = Math.max(0, state.timeLeft - dt);
  if (state.timeLeft === 0) {
    state.phase = 'over';
    state.balloons = [];
    return;
  }

  for (const balloon of state.balloons) balloon.y -= balloon.speed * dt;
  // Balloons that float off the top are gone for good.
  state.balloons = state.balloons.filter((b) => b.y > -b.radius * 3);

  state.nextSpawn -= dt;
  while (state.nextSpawn <= 0) {
    state.balloons.push(spawnBalloon(random));
    state.nextSpawn += SPAWN_INTERVAL;
  }
}

function draw(ctx: CanvasRenderingContext2D, state: BalloonPopState) {
  const { colors } = theme;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Booth awning.
  const stripe = WIDTH / 16;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? colors.stripeA : colors.stripeB;
    ctx.fillRect(i * stripe, 0, stripe, 40);
  }

  for (const balloon of state.balloons) {
    ctx.strokeStyle = colors.muted;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(balloon.x, balloon.y + balloon.radius);
    ctx.lineTo(balloon.x, balloon.y + balloon.radius * 2.5);
    ctx.stroke();
    ctx.fillStyle = balloon.color;
    ctx.beginPath();
    ctx.ellipse(balloon.x, balloon.y, balloon.radius * 0.85, balloon.radius, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.stripeB;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(
      balloon.x - balloon.radius * 0.35,
      balloon.y - balloon.radius * 0.4,
      balloon.radius * 0.2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 3;
  for (const pop of state.pops) {
    ctx.globalAlpha = 1 - pop.age / 0.3;
    ctx.beginPath();
    ctx.arc(pop.x, pop.y, 10 + pop.age * 120, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 16, HEIGHT - 20);
  ctx.textAlign = 'right';
  ctx.fillText(`Time ${Math.ceil(state.timeLeft)}s`, WIDTH - 16, HEIGHT - 20);

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`Time's up! You scored ${state.score}`, WIDTH / 2, HEIGHT / 2);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText(
      `${state.popped} balloons popped. Click to play again`,
      WIDTH / 2,
      HEIGHT / 2 + 40,
    );
  }
}

export const balloonPop: CarnivalGame = {
  id: 'balloon-pop',
  name: 'Balloon Pop',
  description: 'Pop the balloons before they float away. Smaller balloons score more.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let state = createState();
    let scoreRecorded = false;

    const onDown = (event: PointerEvent) => {
      if (state.phase === 'over') {
        state = createState();
        scoreRecorded = false;
        return;
      }
      const rect = canvas.getBoundingClientRect();
      popAt(
        state,
        ((event.clientX - rect.left) / rect.width) * WIDTH,
        ((event.clientY - rect.top) / rect.height) * HEIGHT,
      );
    };
    canvas.addEventListener('pointerdown', onDown);

    let frame = 0;
    let last = performance.now();
    const loop = (time: number) => {
      // Cap the step so a background tab doesn't teleport everything.
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      step(state, dt);
      if (state.phase === 'over' && !scoreRecorded) {
        recordScore(balloonPop.id, state.score);
        scoreRecorded = true;
      }
      draw(ctx, state);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointerdown', onDown);
    };
  },
};

export default balloonPop;
