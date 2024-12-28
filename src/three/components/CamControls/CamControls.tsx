import { CameraControls, Helper, Wireframe } from "@react-three/drei"
import { GroupProps, useThree } from "@react-three/fiber"
import { frame, SpringOptions, useAnimationFrame, useMotionValueEvent, useSpring, useTransform } from "framer-motion"
import { motion } from "framer-motion-3d"
import { RefObject, useEffect, useRef, useState } from "react"
import { CameraHelper, PerspectiveCamera, Vector3 } from "three"
import { useFiberStore } from "../../../stores/fiberStore"
import { useGestureControls } from "../../../hooks/gestureControls"

interface ICamControl {
  ref?: RefObject<GroupProps>
  isDefault?: boolean
  debug?: boolean
  dragOpts?: SpringOptions
}

const PI_2 = Math.PI * 2
const DEFAULT_SPRING:SpringOptions = {
  // damping: 10,
  // mass: 1,
  // velocity: 1, 
  // restSpeed: 0.1, 
  // stiffness: 1,
  duration: 3.3 * 1000,
  bounce: 0
}

export function CamControls({
  ref = useRef(null),
  isDefault = true,
  debug = true,
  dragOpts = {},
}: ICamControl) {
  const { set: setThree, viewport }= useThree()
  const camRef = useRef<PerspectiveCamera>(null)
  const controlRef = useRef<CameraControls>(null)
  const { data: { cam } } = useFiberStore()
  const { setPosition } = useRigControl(ref, controlRef, camRef)

  useEffect(() => {
    if(!camRef.current) return
    camRef.current.aspect = viewport.width/viewport.height
    camRef.current.updateProjectionMatrix()
  }, [camRef.current])

  useEffect(() => {
    if(!camRef.current) return
    if(isDefault) setThree({ camera: camRef.current })
  }, [camRef.current, isDefault])

  useEffect(() => {
    controlRef.current?.setTarget(...cam.lookAt)
  }, [controlRef.current])

  useEffect(() => {
    console.log(cam.lookAt)
    setPosition(cam.lookAt)
  }, [cam.lookAt])


  return (
    <motion.group ref={ref}>
      <perspectiveCamera ref={camRef} position={[2.5, 4, 2.5]} >
        {debug && <Helper type={CameraHelper} />}
      </perspectiveCamera>
      <CameraControls maxPolarAngle={Math.PI/2} ref={controlRef}/>
    </motion.group>
  )
}

function useRigControl(ref: RefObject<GroupProps>, controlRef:RefObject<CameraControls>, camRef: RefObject<PerspectiveCamera>) {

  const [position, setPosition] = useState<Vec3>([0,0,0])

  const px = useSpring(position[0], DEFAULT_SPRING)
  const py = useSpring(position[1], DEFAULT_SPRING)
  const pz = useSpring(position[2], DEFAULT_SPRING)


  const pos = useTransform(() => new Vector3(px.get(), py.get(), pz.get()))

  useEffect(() => {

    frame.read(() =>{
      px.set(position[0])
      py.set(position[1])
      pz.set(position[2])
    })

  }, [position])


  useMotionValueEvent(pos, 'change', latest => {
    if(!ref.current?.position || !controlRef.current) return
    (ref.current.position as Vector3).set(latest.x, latest.y, latest.z)
  })

  return { setPosition }
}
