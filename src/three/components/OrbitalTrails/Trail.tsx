import { useFrame } from '@react-three/fiber'
import { ReactNode, useEffect, useMemo, useRef } from 'react'
import { Color, Group, InterleavedBufferAttribute, Line2NodeMaterial, Vector3 } from 'three/webgpu'
import { Line2 } from 'three/examples/jsm/lines/webgpu/Line2.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import { UNIVERSE_BG_COLOR } from '../../../helpers/constants'
import { createRing, push, toArray, toSegments } from './ring'

interface IProps {
  /** Line width, in world units. */
  width: number
  colour: string
  /** Points kept: the trail is this many frames long. */
  length: number
  children: ReactNode
}

const _position = new Vector3()

/**
 * A fat line following whatever is rendered inside it. Each frame the first
 * child's world position goes into a ring of the last `length` points, and
 * the line is redrawn through them, fading from `colour` at the newest point
 * to the scene background at the oldest. drei's Trail did this on meshline,
 * which is GLSL; this is three's Line2 on a node material.
 */
export function Trail({ width, colour, length, children }: IProps) {
  const anchor = useRef<Group>(null)
  const ring = useMemo(() => createRing(length), [length])
  // Oldest first, like the ring, so the newest point is the full colour.
  const ramp = useMemo(() => colourRamp(UNIVERSE_BG_COLOR, colour, length), [colour, length])

  const line = useMemo(() => {
    const material = new Line2NodeMaterial({ color: 0xffffff, linewidth: width, vertexColors: true })
    material.worldUnits = true
    const line = new Line2(new LineGeometry(), material)
    // Hidden until it has a segment: a Line2 drawn with an empty geometry
    // compiles its shader without the instanceStart attribute, and fails.
    line.visible = false
    // The bounds are stale by design: positions are written straight into
    // the buffer each frame, and the trail is never far from its particle.
    line.frustumCulled = false
    return line
  }, [width])

  useEffect(() => () => {
    line.geometry.dispose()
    line.material.dispose()
  }, [line])

  // eslint-disable-next-line react-hooks/immutability -- the frame loop writes the line's buffers by design
  useFrame(() => {
    const target = anchor.current?.children[0] ?? anchor.current
    if (!target) return
    target.getWorldPosition(_position)
    push(ring, _position.x, _position.y, _position.z)
    // A segment needs two points.
    if (ring.filled < 2) return

    /* eslint-disable react-hooks/immutability -- the line's geometry is written every frame by design */
    const geometry = line.geometry
    const start = geometry.attributes.instanceStart as InterleavedBufferAttribute | undefined
    if (start === undefined || geometry.instanceCount !== ring.filled - 1) {
      // The ring is still filling: the segment count changes, so the buffers
      // are rebuilt. Once it is full this never runs again.
      geometry.setPositions(toArray(ring))
      geometry.setColors(ramp.subarray(3 * (length - ring.filled)))
      line.visible = true
    } else {
      const pairs = start.data.array as Float32Array
      toSegments(toArray(ring), pairs)
      start.data.needsUpdate = true
    }
    /* eslint-enable react-hooks/immutability */
  })

  return (
    <>
      <group ref={anchor}>{children}</group>
      {/* A sibling, not a child: the line's points are world positions. */}
      <primitive object={line} />
    </>
  )
}

/** `n` colours from `from` to `to`, as rgb triples. */
function colourRamp(from: string, to: string, n: number): Float32Array {
  const a = new Color(from)
  const b = new Color(to)
  const c = new Color()
  const ramp = new Float32Array(3 * n)
  for (let i = 0; i < n; i++) {
    c.lerpColors(a, b, n === 1 ? 1 : i / (n - 1))
    ramp[3 * i] = c.r
    ramp[3 * i + 1] = c.g
    ramp[3 * i + 2] = c.b
  }
  return ramp
}
