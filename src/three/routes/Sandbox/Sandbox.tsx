import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation } from "react-router"
import { useFiberStore } from "../../../stores/fiberStore"
import { AnimatePresence } from "framer-motion"
import { Boids, BoidsSimple } from "../../components/Boids"
import Diamond from "../../components/Diamond/Diamond"
import { Mesh, Vector2, Vector3 } from "three"
import { OrbitControls, Wireframe } from "@react-three/drei"
// import { useGestureControls } from "../../../hooks/gestureControls"
import { useThree } from "@react-three/fiber"
import { MoveGesture } from '@use-gesture/vanilla'
import { useGestureControls } from "../../../hooks/gestureControls"
import { useWindowSize } from "../../../hooks/windowSize"
import { BoidsGltf } from "../../components/Boids/BoidsGltf"
const PATH = '/sandbox'

const camPosition :Vec3 = [300, 300, 300]
const sceneCenter:Vec3 = [0, 0, 0]

export function Sandbox() {

  const activeCam = useThree(({ camera }) => camera)
  const { pathname } = useLocation()
  const { setCamera, setEffect } = useFiberStore()
  const [visible, setVisible] = useState(pathname === PATH)

  const spRef = useRef<Mesh>(null)
  const [width, height] = useWindowSize()

  const { ref } = useGestureControls()
  const [movement, setMovement] = useState([0, 0, 0])

  // useEffect(() => {
  //   if(!ref?.current) return
  //   const gesture = new MoveGesture(ref.current, ({ active, movement: [x, y] }) => {
  //     console.log(active, x, y)
  //     setMovement([x/width * 2 - 1, 0.0, y/height * 2 - 1])
  //   })
    

  //   return () => gesture.destroy()
  // }, [ref?.current])

  // const vec = new Vector3()
  // const p = useMemo(() => {
  //   vec.set(movement[0], 0.0, movement[1])
  //   vec.unproject(activeCam)
  //   console.log(movement)
  //   if(spRef) {
  //     spRef.current?.position.copy(vec)
  //   }
  //   return [vec.x, vec.y, vec.z] as [number, number,  number]
  // },[movement])


  useEffect(() => {
    if(pathname === PATH) {
      setVisible(true)
      setCamera({
        isDefault: false,
        enabled: false,
        localPosition: camPosition,
        worldLookAt: sceneCenter
      })
      setEffect({
        noise: false,
        tiltshift: false
      })
    } else {
      setVisible(false)
    }
  }, [pathname])

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* <mesh position={[0,0,0]}>
            <simpleBirdGeometry scale={0.1}/>
            <meshBasicMaterial color='white' />
          </mesh> */}
          <Boids 
          // countSquare={8}
          // predator={p}
          preyRadius={100}
          separationDistance={0.1}
          alignmentDistance={0.1}
          cohesionDistance={0.1}
          freedomFactor={0.1}>
            {/* <BoidsSimple /> */}
            <BoidsGltf url="/Parrot.glb" size={0.1}/>
          </Boids>
        </>
      )}
    </AnimatePresence>
  )
}