import { describe, expect, it } from 'vitest';
import {
  ROUND_SECONDS,
  SIZES,
  SPAWN_INTERVAL,
  createState,
  isOnBalloon,
  popAt,
  spawnBalloon,
  step,
  type Balloon,
} from './game';

const balloon: Balloon = { x: 400, y: 250, radius: 26, speed: 110, points: 20, color: 'red' };

describe('balloon pop', () => {
  it('starts with a full timer, no balloons and no score', () => {
    const state = createState();
    expect(state.timeLeft).toBe(ROUND_SECONDS);
    expect(state.balloons).toHaveLength(0);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('playing');
  });

  it('spawns a balloon on the first step and one every interval after', () => {
    const state = createState();
    step(state, 0.01, () => 0);
    expect(state.balloons).toHaveLength(1);
    step(state, SPAWN_INTERVAL, () => 0);
    expect(state.balloons).toHaveLength(2);
  });

  it('spawns balloons below the bottom edge with a size from the table', () => {
    const spawned = spawnBalloon(() => 0);
    expect(spawned.radius).toBe(SIZES[0].radius);
    expect(spawned.points).toBe(SIZES[0].points);
    expect(spawned.y).toBeGreaterThan(500);
  });

  it('floats balloons upwards', () => {
    const state = createState();
    state.nextSpawn = 10;
    state.balloons = [{ ...balloon }];
    step(state, 0.5);
    expect(state.balloons[0].y).toBe(balloon.y - balloon.speed * 0.5);
  });

  it('loses balloons that float off the top', () => {
    const state = createState();
    state.nextSpawn = 10;
    state.balloons = [{ ...balloon, y: -balloon.radius * 3 + 1 }];
    step(state, 0.1);
    expect(state.balloons).toHaveLength(0);
    expect(state.score).toBe(0);
  });

  it('pops a balloon under the click and scores its points', () => {
    const state = createState();
    state.balloons = [{ ...balloon }];
    expect(popAt(state, 405, 255)).toBe(20);
    expect(state.score).toBe(20);
    expect(state.popped).toBe(1);
    expect(state.balloons).toHaveLength(0);
  });

  it('scores nothing for a miss', () => {
    const state = createState();
    state.balloons = [{ ...balloon }];
    expect(popAt(state, 100, 100)).toBe(0);
    expect(state.score).toBe(0);
    expect(state.balloons).toHaveLength(1);
  });

  it('pops only the top balloon when two overlap', () => {
    const state = createState();
    state.balloons = [{ ...balloon }, { ...balloon, points: 30 }];
    expect(popAt(state, 400, 250)).toBe(30);
    expect(state.balloons).toHaveLength(1);
  });

  it('scores smaller balloons higher than bigger ones', () => {
    for (let i = 1; i < SIZES.length; i++) {
      expect(SIZES[i].radius).toBeGreaterThan(SIZES[i - 1].radius);
      expect(SIZES[i].points).toBeLessThan(SIZES[i - 1].points);
    }
  });

  it('ends the round when the timer runs out', () => {
    const state = createState();
    state.balloons = [{ ...balloon }];
    step(state, ROUND_SECONDS);
    expect(state.timeLeft).toBe(0);
    expect(state.phase).toBe('over');
    expect(popAt(state, 400, 250)).toBe(0);
  });

  it('detects a point inside a balloon and outside it', () => {
    expect(isOnBalloon(balloon, 410, 260)).toBe(true);
    expect(isOnBalloon(balloon, 460, 250)).toBe(false);
  });
});
