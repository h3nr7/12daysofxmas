import { useEffect } from "react"
import { useLocation } from "react-router"
import { useFiberStore } from "../../../stores/fiberStore"
import { Boids, BoidsSimple } from "../../components/Boids"
import { useEnterExit } from "../../utils/useEnterExit"
const PATH = '/sixth'

const camPosition :Vec3 = [28, 0, 28]
const sceneCenter:Vec3 = [15, 0, 15]

export function Sixth() {

  const { pathname } = useLocation()
  const { setCamera } = useFiberStore()
  const visible = pathname === PATH

  useEffect(() => {
    if(visible) {
      setCamera({
        enabled: true,
        localPosition: camPosition,
        worldLookAt: sceneCenter
      })
    }
  }, [visible, setCamera])

  // Stays as it was for 3.25 s after leaving: the old group only faded an
  // opacity three.js ignores.
  const transitions = useEnterExit(visible, {
    initial: { hold: 0 },
    animate: { hold: 1 },
    enter: { duration: 3.5 },
    leave: { duration: 3.25 },
  })

  return transitions(() => (
    <group position={sceneCenter}>
      <Boids
        // countSquare={8}
        separationDistance={0.1}
        alignmentDistance={0.1}
        cohesionDistance={0.1}
        freedomFactor={0.1}>
          <BoidsSimple />
      </Boids>
    </group>
  ))
}
