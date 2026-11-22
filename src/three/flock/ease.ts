/*
 * Taken from h3nr7 `packages/canvas/src/lib/pointer.ts` on 2026-11-21: only
 * `damp`, which is all the flock needs of that module. Nothing here imports
 * three or React.
 */

/**
 * Frame-rate independent easing toward a target.
 *
 * A plain `current += (target - current) * 0.1` moves twice as fast at 120fps
 * as at 60, so the same code feels different on different hardware. This one is
 * defined in terms of elapsed time, so `smoothing` means the same thing
 * everywhere: roughly the fraction of the remaining distance closed per second.
 *
 * Exported because every consumer that follows the pointer needs it and the
 * exponential is easy to get subtly wrong.
 */
export function damp(
  current: number,
  target: number,
  smoothing: number,
  delta: number,
): number {
  return current + (target - current) * (1 - Math.exp(-smoothing * delta));
}
