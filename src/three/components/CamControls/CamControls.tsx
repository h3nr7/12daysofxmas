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
  const { data: { cam } } = useFiberStore()
  const { setPosition, setRotationY, setRotationX } = useRigControl(ref, camRef)
  const { drag } = useGestureControls()

  useEffect(() => {
    if(!camRef.current) return
    camRef.current.aspect = viewport.width/viewport.height
    camRef.current.updateProjectionMatrix()
  }, [])

  useEffect(() => {
    if(!camRef.current) return
    if(isDefault) setThree({ camera: camRef.current })
  }, [camRef.current, isDefault])

  useEffect(() => {
    console.log('cam look at changed', cam.lookAt)
    setPosition(cam.lookAt)
  }, [cam.lookAt])

  // useEffect(() => {
  //   if(!camRef.current || !ref.current?.rotateY) return
  //   console.log('meme: ', drag)
  //   setRotationY(drag[0] * Math.PI)
  //   setRotationX(drag[1] * Math.PI)
  // }, [drag])


  return (
    <motion.group ref={ref}>
      {/* <mesh>
        <sphereGeometry args={[1]} />
        <Wireframe />
      </mesh> */}
      {/* <perspectiveCamera ref={camRef} position={[2, 2, 2]} >
        <Helper type={CameraHelper} />
      </perspectiveCamera> */}
      {/* {debug && <CameraControls enabled={true} />} */}
      <CameraControls />
    </motion.group>
  )
}

function useRigControl(ref: RefObject<GroupProps>, camRef:RefObject<PerspectiveCamera>) {

  const [position, setPosition] = useState<Vec3>([0,0,0])
  const [rotationY, setRotationY] = useState<number>(0)
  const [rotationX, setRotationX] = useState<number>(0)

  const px = useSpring(position[0], DEFAULT_SPRING)
  const py = useSpring(position[1], DEFAULT_SPRING)
  const pz = useSpring(position[2], DEFAULT_SPRING)

  const rotY = useSpring(rotationY)
  const rotX = useSpring(rotationX)

  const pos = useTransform(() => new Vector3(px.get(), py.get(), pz.get()))

  useEffect(() => {

    frame.read(() =>{
      px.set(position[0])
      py.set(position[1])
      pz.set(position[2])
    })

  }, [position])

  useEffect(() => { frame.read(() => rotY.set(rotationY)) }, [rotationY])
  useEffect(() => { frame.read(() => rotX.set(rotationX)) }, [rotationX])

  useMotionValueEvent(pos, 'change', latest => {
    if(!ref.current?.position) return
    (ref.current.position as Vector3).set(latest.x, latest.y, latest.z)
    ref.current.updateMatrix()
    console.log('update latest: ', latest)
  })

  useMotionValueEvent(rotY, 'change', latest => {
    if(!ref.current?.rotateY) return
    console.log('roty: ', latest)
    ref.current.rotateY(latest)
  })

  useMotionValueEvent(rotX, 'change', latest => {
    if(!camRef.current || !ref.current?.rotateZ) return
    console.log('rotx: ', latest)
    // ref.current.rotateX(latest)
    camRef.current.rotateX(latest)
  })



  return { setPosition, setRotationY, setRotationX }
}
