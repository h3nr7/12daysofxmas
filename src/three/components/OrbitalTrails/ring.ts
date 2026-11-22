// A ring of the last n points, for a trail. Pure, so it can be unit tested:
// the three.js side lives in Trail.tsx.

export interface Ring {
  /** xyz per slot, `capacity` slots. */
  readonly data: Float32Array
  readonly capacity: number
  /** The slot the next push writes. */
  head: number
  /** How many slots hold a point, up to `capacity`. */
  filled: number
}

export function createRing(capacity: number): Ring {
  return { data: new Float32Array(3 * capacity), capacity, head: 0, filled: 0 }
}

/** Adds a point, dropping the oldest once the ring is full. */
export function push(ring: Ring, x: number, y: number, z: number): void {
  const i = 3 * ring.head
  ring.data[i] = x
  ring.data[i + 1] = y
  ring.data[i + 2] = z
  ring.head = (ring.head + 1) % ring.capacity
  if (ring.filled < ring.capacity) ring.filled++
}

/** The points held, oldest first, as xyz triples: length `3 * filled`. */
export function toArray(ring: Ring): Float32Array {
  const out = new Float32Array(3 * ring.filled)
  const oldest = ring.filled < ring.capacity ? 0 : ring.head
  for (let n = 0; n < ring.filled; n++) {
    const from = 3 * ((oldest + n) % ring.capacity)
    out.set(ring.data.subarray(from, from + 3), 3 * n)
  }
  return out
}

/**
 * Writes consecutive points as start-end pairs, the layout
 * `LineGeometry.setPositions` builds, into `out` (length `6 * (points - 1)`),
 * so a line can be updated in place instead of rebuilding its buffers.
 */
export function toSegments(points: Float32Array, out: Float32Array): void {
  const last = points.length - 3
  for (let i = 0; i < last; i += 3) {
    out[2 * i] = points[i]
    out[2 * i + 1] = points[i + 1]
    out[2 * i + 2] = points[i + 2]
    out[2 * i + 3] = points[i + 3]
    out[2 * i + 4] = points[i + 4]
    out[2 * i + 5] = points[i + 5]
  }
}
