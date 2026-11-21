import { animated, useSpring } from "@react-spring/three"
import { useFiberStore } from "../../../stores/fiberStore"
import { toSpring } from "../../utils/useEnterExit"

// The lights glide towards the camera's look-at point over 1000 seconds, so
// in practice they barely move. Kept as it was; it may have been meant as
// 1000 ms.
const LIGHTS_GLIDE = toSpring({ duration: 1000 })

export function Lightings() {

  const { data: { cam } } = useFiberStore()

  // move lights to the right places
  const [x, y, z] = cam.worldLookAt
  const style = useSpring({
    from: { x: 0, y: 0, z: 0 },
    to: { x, y, z },
    config: LIGHTS_GLIDE.config,
  })

  return (
    <animated.group position-x={style.x} position-y={style.y} position-z={style.z}>
      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      <pointLight position={[-5, 0, -5]} decay={0} intensity={Math.PI} />
    </animated.group>
  )
}
