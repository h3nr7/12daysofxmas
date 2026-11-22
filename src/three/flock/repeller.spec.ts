/*
 * Taken from h3nr7 `packages/canvas/src/visuals/flock/repeller.spec.ts` on
 * 2026-11-21. The `pointerEngaged` cases are rewritten for `PointerState`
 * (`{ over, down, touch }` from DOM events on the canvas, in place of h3nr7's
 * `FramePointer`); everything else is unchanged but for the import paths.
 */
import { describe, expect, it } from 'vitest';
import { pointerEngaged, stepStrength, toLocalRay, type PointerState, type Repeller } from './repeller';

const repeller = (): Repeller => ({ ox: 0, oy: 0, oz: 0, dx: 0, dy: 0, dz: -1, strength: 0.5 });

/** Column-major 4×4, as three's `Matrix4.elements`. */
const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/**
 * The inverse of "scale by `s`, then move by (tx, ty, tz)": move back, then
 * scale by 1/s. What `group.matrixWorld.invert()` gives for such a group.
 */
function inverseOfScaleThenMove(s: number, tx: number, ty: number, tz: number) {
  const k = 1 / s;
  return [k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, -tx * k, -ty * k, -tz * k, 1];
}

describe('toLocalRay', () => {
  it('leaves a ray alone when boid space is world space', () => {
    const out = toLocalRay(repeller(), { ox: 1, oy: 2, oz: 3, dx: 0, dy: 1, dz: 0 }, IDENTITY);
    expect(out).toMatchObject({ ox: 1, oy: 2, oz: 3, dx: 0, dy: 1, dz: 0 });
  });

  it('undoes the scale on the origin: 0.05 world units is 1 boid unit', () => {
    const out = toLocalRay(
      repeller(),
      { ox: 0.05, oy: 0, oz: 0, dx: 0, dy: 0, dz: -1 },
      inverseOfScaleThenMove(0.05, 0, 0, 0),
    );
    expect(out.ox).toBeCloseTo(1);
  });

  it('moves the origin, but never the direction', () => {
    const out = toLocalRay(
      repeller(),
      { ox: 2, oy: 0, oz: 0, dx: 1, dy: 0, dz: 0 },
      inverseOfScaleThenMove(1, 2, 0, 0),
    );
    expect(out.ox).toBeCloseTo(0);
    expect([out.dx, out.dy, out.dz]).toEqual([1, 0, 0]);
  });

  it('keeps the direction unit length through a scale', () => {
    const out = toLocalRay(
      repeller(),
      { ox: 0, oy: 0, oz: 30, dx: 0.6, dy: 0, dz: -0.8 },
      inverseOfScaleThenMove(0.05, 0, 0, 0),
    );
    expect(Math.hypot(out.dx, out.dy, out.dz)).toBeCloseTo(1);
    expect(out.dx).toBeCloseTo(0.6);
  });

  it('does not touch the strength', () => {
    expect(toLocalRay(repeller(), { ox: 0, oy: 0, oz: 0, dx: 0, dy: 0, dz: -1 }, IDENTITY).strength).toBe(0.5);
  });
});

describe('stepStrength', () => {
  it('rises toward 1 while the pointer is active', () => {
    const next = stepStrength(0, true, 1 / 60);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(1);
  });

  it('falls toward 0 when it is not', () => {
    expect(stepStrength(1, false, 1 / 60)).toBeLessThan(1);
  });

  it('is gone within a second of the pointer leaving', () => {
    let s = 1;
    for (let i = 0; i < 60; i++) s = stepStrength(s, false, 1 / 60);
    expect(s).toBeLessThan(0.01);
  });

  it('does not depend on the frame rate', () => {
    const once = stepStrength(0, true, 1 / 30);
    const twice = stepStrength(stepStrength(0, true, 1 / 60), true, 1 / 60);
    expect(twice).toBeCloseTo(once, 10);
  });
});

describe('pointerEngaged', () => {
  const state = (over: Partial<PointerState>): PointerState => ({
    over: false,
    down: false,
    touch: false,
    ...over,
  });

  it('with a mouse or pen, follows its hover', () => {
    expect(pointerEngaged(state({ over: true }))).toBe(true);
    expect(pointerEngaged(state({ over: false }))).toBe(false);
    // Hovering and pressing is still hovering.
    expect(pointerEngaged(state({ over: true, down: true }))).toBe(true);
  });

  it('with a finger, follows it only while it is down', () => {
    expect(pointerEngaged(state({ touch: true, down: true }))).toBe(true);
    expect(pointerEngaged(state({ touch: true, down: true, over: false }))).toBe(true);
    expect(pointerEngaged(state({ touch: true, down: false, over: true }))).toBe(false);
  });

  it('is off before anything has been seen', () => {
    expect(pointerEngaged(state({}))).toBe(false);
  });
});
