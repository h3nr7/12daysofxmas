import { CameraControls, Helper, Sphere, useHelper, Wireframe } from "@react-three/drei";
import { MutableRefObject, RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useFiberStore } from "../../../stores/fiberStore"
import { 
  Camera, CameraHelper, Group, MathUtils, Object3D, Object3DEventMap, PerspectiveCamera, 
  Quaternion, SphereGeometry, Spherical, Vector3,
} from "three";
import { motion } from "framer-motion-3d";
import { frame, SpringOptions, useAnimationFrame, useMotionValue, useMotionValueEvent, useSpring, useTransform } from "framer-motion";
import { GroupProps, PerspectiveCameraProps, useThree } from "@react-three/fiber";
import { useGestureControls } from "../../../hooks/gestureControls";
import { useWindowSize } from "../../../hooks/windowSize";
import { clamp } from "three/src/math/MathUtils.js";

interface ICamControls {
  debug?: boolean
  isDefault?: boolean
  azimuthRotateSpeed?: number
  polarRotateSpeed?: number
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
  debug = true,
  isDefault = false,
  azimuthRotateSpeed = 1.0,
  polarRotateSpeed = 1.0
}: ICamControls) {

  // ----------------------------
  // setters, vars and hooks
  //  ---------------------------
  // setter from R3F
  const { set: setThree, viewport } = useThree()
  // ref to three camera
  const groupRef = useRef<GroupProps>(null)
  const camRef = useRef<PerspectiveCamera>(null)
  // fiber store of cam position
  const { data: { cam } } = useFiberStore();
  // recalculate duration for framer motion
  const duration = useMemo(() => cam.duration * 1000, [cam.duration])
  const targetPos = useMemo(() => new Vector3(...cam.position), [cam.position])
  const targetLook = useMemo(() => new Vector3(...cam.lookAt), [cam.lookAt])
  const [targetDistance, setTargetDistance] = useState(0)
  // drag hook
  const { drag } = useGestureControls()
  // framer motion spring option updater
  const springOpts = useMemo(() => ({
    ...DEFAULT_SPRING,
    duration
  }), [duration])
  // spring positions
  const px = useSpring(0, springOpts)
  const py = useSpring(0, springOpts)
  const pz = useSpring(0, springOpts)
  // spring lookat
  const lx = useSpring(0, springOpts)
  const ly = useSpring(0, springOpts)
  const lz = useSpring(0, springOpts)


  const [angle, setAngle] = useState(0)

  const { setPosition } = useRigControl(groupRef)

  // ----------------------------
  // effects
  //  ---------------------------
  // update camera aspect when viewport is updated
  // useEffect(() => {
  //   if(!camRef.current) return
  //   camRef.current.aspect = viewport.width/viewport.height
  //   camRef.current.updateProjectionMatrix()
  // }, [])
  // setting three camera ref
  useEffect(() => {
    if(!camRef.current || !isDefault) return
    setThree({ camera: camRef.current })
  }, [camRef.current])
  // update spring position and lookat when fiber store updates
  useEffect(() => {
    if(!camRef.current) return
    // set new target distance
    setTargetDistance(targetPos.distanceTo(targetLook))
    // set new position and lookat for spring to tween to
    console.log('target changed? ', targetPos)
    // frame.read(() => {
    //   console.log('me called?', targetPos)
    //   px.set(targetPos.x)
    //   py.set(targetPos.y)
    //   pz.set(targetPos.z)

    //   lx.set(targetLook.x)
    //   ly.set(targetLook.y)
    //   lz.set(targetLook.z)
    // })

    setPosition(cam.position)

  }, [cam.position, targetLook])
  // dragging update 
  // useEffect(() => {
  //   if(!camRef.current) return
  //   const axis = new Vector3(0, 1, 0)
  //   const na = angle + drag[0] > 2*Math.PI ? 0 : angle + drag[0]
  //   setAngle(na)
  //   console.log('drag: ', drag, na)
  //   const nPos = camRef.current.position.clone()
  //   nPos.sub(targetLook)
  //   nPos.applyAxisAngle(axis, na)
  //   nPos.add(targetLook)
    

  //   px.set(nPos.x)
  //   py.set(nPos.y)
  //   pz.set(nPos.z)

  //   // camRef.current.position.set(px.get(), py.get(), pz.get()) 
  //   // camRef.current.updateProjectionMatrix()

  // }, [drag])

  // animation frame to update three camera position per frame
  // useAnimationFrame(() => {
  //   if(!camRef.current) return
  //   camRef.current.position.set(px.get(), py.get(), pz.get()) 
  //   camRef.current.lookAt(lx.get(), ly.get(), lz.get())
  //   camRef.current.updateProjectionMatrix()
  // })
  
  return (
    <motion.group 
      ref={groupRef}
      position={[5,5,5]}
      >
      <perspectiveCamera ref={camRef} position={[1, -1, 1]}>
        <Helper type={CameraHelper} />
      </perspectiveCamera>
      {!isDefault && debug && <CameraControls />}
    </motion.group>
  )
}

function useRigControl(ref: RefObject<GroupProps>) {

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
    if(!ref.current?.position) return
    (ref.current.position as Vector3).set(latest.x, latest.y, latest.z)
  })



  return { setPosition }
}


