import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation } from "react-router"
import { useFiberStore } from "../../../stores/fiberStore"
import { motion } from 'framer-motion-3d'
import { AnimatePresence, useAnimate } from "framer-motion"
import { BoidsGltf } from "../../components/Boids/BoidsGltf"
import { Boids, BoidsSimple } from "../../components/Boids"
import { Mesh, Vector3 } from "three"
import { useFrame, useThree } from "@react-three/fiber"

const PATH = ['/eighth', '/ninth', '/tenth']
const CAM_POSITIONS:Vec3[] = [[5, 0, 5], [50, 0, 50], [188, 0, 188]]
const SCENE_CENTERES:Vec3[] = [[0, 0, 0], [-5, 0, -5], [65, 0, 65]]

export function Eighth() {

  const { pathname } = useLocation()
  const { setCamera, setEffect, setDebug } = useFiberStore()
  const [visible, setVisible] = useState(PATH.includes(pathname))
  const activeCam = useThree(state => state.camera)

  const spRef = useRef<Mesh>(null)
  setDebug(false)
  const [camPosition, sceneCenter] = useMemo(() => [
    CAM_POSITIONS[PATH.findIndex(p => p === pathname)],
    SCENE_CENTERES[PATH.findIndex(p => p === pathname)]
  ], [pathname])

  useEffect(() => {
    if(PATH.includes(pathname)) {
      setVisible(true)
      setCamera({
        enabled: true,
        localPosition: camPosition,
        worldLookAt: sceneCenter
      })
    } else {
      setVisible(false)
    }
  }, [pathname])

  // const { movement } = useGestureControls()
  const vec = new Vector3()

  // useFrame(() => {
  //   vec.set(movement.x, movement.y, 0.8)
  //   vec.unproject(activeCam)
  //   console.log(movement, vec)
  //   if(spRef) {
  //     spRef.current?.position.copy(vec)
  //   }
  // })

  return (
    <AnimatePresence>
    {visible && (
      <motion.group 
        initial={{ opacity: 0}}
        animate={{ opacity: 1, transition: { duration: 3.5 }}}
        exit={{ opacity: 0, transition: { duration: 3.25 }}}
        position={sceneCenter}
      >
        <Boids 
          // countSquare={8}
          predator={sceneCenter}
          separationDistance={0.1}
          alignmentDistance={0.1}
          cohesionDistance={0.1}
          freedomFactor={0.1}>
            {/* <BoidsSimple /> */}
            <BoidsGltf url="/Parrot.glb" size={0.05}/>
        </Boids>
      </motion.group>
    )}
    </AnimatePresence>

)
}