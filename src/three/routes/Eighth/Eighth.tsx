import { useEffect } from "react"
import { useLocation } from "react-router"
import { useFiberStore } from "../../../stores/fiberStore"
import { BoidsGltf } from "../../components/Boids/BoidsGltf"
import { Boids } from "../../components/Boids"
import { useEnterExit } from "../../utils/useEnterExit"

const PATH = ['/eighth', '/ninth', '/tenth']
const CAM_POSITIONS:Vec3[] = [[5, 0, 5], [50, 0, 50], [188, 0, 188]]
const SCENE_CENTERES:Vec3[] = [[0, 0, 0], [-5, 0, -5], [65, 0, 65]]

export function Eighth() {

  const { pathname } = useLocation()
  const { setCamera } = useFiberStore()
  const index = PATH.indexOf(pathname)
  const visible = index >= 0
  const camPosition = CAM_POSITIONS[index]
  const sceneCenter = SCENE_CENTERES[index]

  useEffect(() => console.log('Eighth path: ', pathname), [pathname])

  useEffect(() => {
    if(visible) {
      setCamera({
        enabled: true,
        localPosition: camPosition,
        worldLookAt: sceneCenter
      })
    }
  }, [visible, camPosition, sceneCenter, setCamera])

  // const { movement } = useGestureControls()
  // const vec = new Vector3()

  // useFrame(() => {
  //   vec.set(movement.x, movement.y, 0.8)
  //   vec.unproject(activeCam)
  //   console.log(movement, vec)
  //   if(spRef) {
  //     spRef.current?.position.copy(vec)
  //   }
  // })

  // The scene stays as it was for 3.25 s after leaving: the old group only
  // faded an opacity three.js ignores. The item is the scene centre, so the
  // flock keeps its place while leaving.
  const transitions = useEnterExit(visible ? sceneCenter : null, {
    initial: { hold: 0 },
    animate: { hold: 1 },
    enter: { duration: 3.5 },
    leave: { duration: 3.25 },
  })

  return transitions((_style, center) => (
    <group position={center}>
      <Boids
        // countSquare={8}
        predator={center}
        separationDistance={0.1}
        alignmentDistance={0.1}
        cohesionDistance={0.1}
        freedomFactor={0.1}>
          {/* <BoidsSimple /> */}
          <BoidsGltf url="/Parrot.glb" size={0.05}/>
      </Boids>
    </group>
  ))
}
