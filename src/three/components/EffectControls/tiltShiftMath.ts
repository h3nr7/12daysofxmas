/** A point in uv space, 0 to 1 on each axis. */
export type UvPoint = [number, number]

/** A line as `nx * x + ny * y + c = 0`, with `(nx, ny)` a unit normal. */
export interface UvLine {
  nx: number
  ny: number
  c: number
}

/**
 * The unit normal and offset of the line through `start` and `end`, so that
 * `nx * x + ny * y + c` is the signed distance of `(x, y)` from the line.
 * Pure: the shader takes the three numbers as uniforms.
 */
export function lineNormalAndOffset(start: UvPoint, end: UvPoint): UvLine {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  const length = Math.hypot(dx, dy)
  if (length === 0) throw new Error('tiltShift: start and end are the same point')
  const nx = -dy / length
  const ny = dx / length
  return { nx, ny, c: -(nx * start[0] + ny * start[1]) }
}

/** Signed distance of `point` from `line`; what the shader computes per pixel. */
export function signedDistance({ nx, ny, c }: UvLine, [x, y]: UvPoint): number {
  return nx * x + ny * y + c
}
