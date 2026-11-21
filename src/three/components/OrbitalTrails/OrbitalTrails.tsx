import { ENV_MAP_URL } from '../../utils/assets'
import { useEffect, useMemo, useRef } from "react";
import { Texture, Vector3 } from "three";
import { Trail } from "@react-three/drei";
import { useFrame, useLoader } from "@react-three/fiber";
import { animated, useSpring } from '@react-spring/three'
import { easeInOut } from 'motion/react'
import { RGBELoader } from "three/examples/jsm/Addons.js";
import { randomOrbit } from "../../utils/vecs";
import { toSpring, useEnterExit } from '../../utils/useEnterExit'

interface IProps {
  visible?: boolean
  center?: Vector3 | Vec3
  maxRadius?: number
  numParticles?: number
  numCurvePoints?: number
}

// One lap of an orbit, in seconds.
const LAP_SECONDS = 8
// Where a particle starts, for its first frame, and where it falls to on exit.
const START = { x: 0, y: -10, z: 0 }
const EXIT_TO = { x: 0, y: 1.8, z: 0 }
const EXIT = toSpring({ duration: 1.2 })

export function OrbitalTrails({
  visible = false,
  center = new Vector3(),
  maxRadius = 5,
  numParticles = 20,
  numCurvePoints = 50
}: IProps) {

  const curvePoints = useMemo(() => {

    const origin = center instanceof Vector3 ? center : new Vector3(...center)

    const curvePoints = []
    for(let i=0; i<numParticles; i++) {

      const c = randomOrbit(origin, maxRadius)

      curvePoints.push(c.getPoints(numCurvePoints))
    }

    return curvePoints

  // eslint-disable-next-line react-hooks/exhaustive-deps -- orbits are randomised once per particle count; callers pass a new center array each render
  }, [numParticles])

  const texture = useLoader(RGBELoader, ENV_MAP_URL)

  // The trails group's enter (1.25 s after 1 s) only ever faded an opacity
  // three.js ignores; what showed was the particles. It stays mounted for
  // the particles' 1.2 s exit.
  const transitions = useEnterExit(visible, {
    initial: { hold: 0 },
    animate: { hold: 1 },
    enter: { duration: 1.25, delay: 1 },
    leave: { duration: 1.2 },
  })

  // The particles are told they're leaving from `visible`: react-spring only
  // marks a transition as leaving after it has rendered.
  return transitions(() => (
    <>
      {curvePoints.map((points, i) => (
        <Trail
          key={`orbital_trail_${i}`}
          width={0.05} // Width of the line
          color={'rgb(198, 198, 198)'} // Color of the line
          length={5} // Length of the line
          decay={2} // How fast the line fades away
          local={false} // Wether to use the target's world or local positions
          stride={0} // Min distance between previous and current point
          interval={1} // Number of frames to wait before next calculation
          target={undefined} // Optional target. This object will produce the trail.
          attenuation={(width) => width} // A function to define the width in each point along it.
        >
          <OrbitParticle points={points} leaving={!visible} texture={texture} />
        </Trail>
      ))}
    </>
  ))
}

/**
 * A particle that laps its orbit every 8 s, easing in and out between each
 * pair of points as framer-motion's keyframes did, and on exit falls to
 * (0, 1.8, 0) over 1.2 s from wherever it is.
 */
function OrbitParticle({ points, leaving, texture }: { points: Vector3[], leaving: boolean, texture: Texture }) {
  const [style, api] = useSpring(() => START)
  const startedAt = useRef<number | null>(null)

  useFrame(({ clock }) => {
    if (leaving) return
    // The first frame shows the start position, then the lap begins.
    if (startedAt.current === null) {
      startedAt.current = clock.elapsedTime
      return
    }
    const segments = points.length - 1
    const lap = ((clock.elapsedTime - startedAt.current) % LAP_SECONDS) / LAP_SECONDS
    const at = lap * segments
    const i = Math.min(Math.floor(at), segments - 1)
    const t = easeInOut(at - i)
    const a = points[i], b = points[i + 1]
    api.set({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t })
  })

  useEffect(() => {
    if (leaving) api.start({ ...EXIT_TO, ...EXIT })
  }, [leaving, api])

  return (
    <animated.mesh position-x={style.x} position-y={style.y} position-z={style.z}>
      <sphereGeometry args={[0.01]} />
      <meshBasicMaterial envMap={texture} color={'white'}/>
    </animated.mesh>
  )
}
