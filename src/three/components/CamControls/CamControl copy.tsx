import { CameraControls, Helper, Sphere, useHelper, Wireframe } from "@react-three/drei";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { useFiberStore } from "../../../stores/fiberStore"
import { Camera, CameraHelper, MathUtils, Object3D, Object3DEventMap, PerspectiveCamera, Quaternion, SphereGeometry, Spherical, Vector3 } from "three";
import { motion } from "framer-motion-3d";
import { frame, SpringOptions, useAnimationFrame, useMotionValue, useMotionValueEvent, useSpring, useTransform } from "framer-motion";
import { useThree } from "@react-three/fiber";
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

  // ----------------------------
  // effects
  //  ---------------------------
  // update camera aspect when viewport is updated
  useEffect(() => {
    if(!camRef.current) return
    camRef.current.aspect = viewport.width/viewport.height
    camRef.current.updateProjectionMatrix()
  }, [])
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
    frame.read(() => {
      console.log('me called?', targetPos)
      px.set(targetPos.x)
      py.set(targetPos.y)
      pz.set(targetPos.z)

      lx.set(targetLook.x)
      ly.set(targetLook.y)
      lz.set(targetLook.z)
    })

  }, [targetPos, targetLook])
  // dragging update 
  useEffect(() => {
    if(!camRef.current) return
    const axis = new Vector3(0, 1, 0)
    const na = angle + drag[0] > 2*Math.PI ? 0 : angle + drag[0]
    setAngle(na)
    console.log('drag: ', drag, na)
    const nPos = camRef.current.position.clone()
    nPos.sub(targetLook)
    nPos.applyAxisAngle(axis, na)
    nPos.add(targetLook)
    

    px.set(nPos.x)
    py.set(nPos.y)
    pz.set(nPos.z)

    // camRef.current.position.set(px.get(), py.get(), pz.get()) 
    // camRef.current.updateProjectionMatrix()

  }, [drag])

  // animation frame to update three camera position per frame
  useAnimationFrame(() => {
    if(!camRef.current) return
    camRef.current.position.set(px.get(), py.get(), pz.get()) 
    camRef.current.lookAt(lx.get(), ly.get(), lz.get())
    camRef.current.updateProjectionMatrix()
  })
  
  return (
    <>
      <perspectiveCamera ref={camRef} >
        {debug && <Helper type={CameraHelper} />}
      </perspectiveCamera>
      {/* {!isDefault && debug && <CameraControls />} */}
    </>
  )
}


// export function CamControls({}: ICamControls) {

//   const curPos = new Vector3()
//   const curLook = new Vector3()

//   const ref = useRef<CameraControls>(null);
//   const { data: { cam }, setCamera } = useFiberStore();
//   const [springOpts, setSpringOpts] = useState<SpringOptions>(DEFAULT_SPRING)

//   const px = useSpring(cam.position[0], springOpts)
//   const py = useSpring(cam.position[1], springOpts)
//   const pz = useSpring(cam.position[2], springOpts)

//   const lx = useSpring(cam.lookAt[0], springOpts)
//   const ly = useSpring(cam.lookAt[1], springOpts)
//   const lz = useSpring(cam.lookAt[2], springOpts)

//   const target = useTransform<unknown, [number, number, number, number, number, number]>(() =>[
//     px.get(), py.get(), pz.get(),
//     lx.get(), ly.get(), lz.get()
//   ])

//   useMotionValueEvent(target, 'animationStart', () => {
//     setCamera({ enabled: false })
//   })

//   useMotionValueEvent(target, 'animationComplete', () => {
//     setCamera({ enabled: true })
//   })

//   useMotionValueEvent(target, 'animationCancel', () => {
//     setCamera({ enabled: true })
//   })

//   useMotionValueEvent(target, 'change', latest => {
//     if(!ref.current) return
//     ref.current.setLookAt(...latest)
//   })

//   useEffect(() => 
//     setSpringOpts({
//       ...DEFAULT_SPRING,
//       duration: cam.duration ? cam.duration * 1000 : DEFAULT_SPRING.duration
//     })
//   , [cam.duration])

//   useEffect(() => {
//     if(!ref.current) return
  
//     frame.read(() => {


//       px.set(cam.position[0])
//       py.set(cam.position[1])
//       pz.set(cam.position[2])

//       lx.set(cam.lookAt[0])
//       ly.set(cam.lookAt[1])
//       lz.set(cam.lookAt[2])
//     })

//   }, [ref.current, cam.position, cam.lookAt])


//   useEffect(() => {
//   if(!ref.current) return 
//   function controlHandler() {
//     if(!ref.current) return
//     ref.current.getPosition(curPos)
//     ref.current.camera.getWorldDirection(curLook)
//     // ref.current.camera.getWorldDirection(curLook)
//     // const quad = new Quaternion()
//     // ref.current.camera.quaternion
//     // curLook.copy(curPos)
//     // curLook.applyQuaternion(quad)
//     // curLook.multiplyScalar(50)
//     // ref.current.camera

//     px.set(curPos.x, false)
//     py.set(curPos.y, false)
//     pz.set(curPos.z, false)

//     // lx.set(curLook.x, false)
//     // ly.set(curLook.y, false)
//     // lz.set(curLook.z, false)

//     console.log(curPos, curLook, ref.current.camera.quaternion )
//   }
//   ref.current.addEventListener('update', controlHandler)
//   // ref.current.addEventListener('controlend', controlHandler)
//   // ref.current.addEventListener('control', controlHandler)

//   return () => {
//     ref.current?.removeEventListener('update', controlHandler)
//     // ref.current?.removeEventListener('controlend', controlHandler)
//   }

//   }, [ref.current])

//   // useAnimationFrame(() => {
//   //   if(!ref.current) return
    
//   //   ref.current.setLookAt(
//   //     px.get(), py.get(), pz.get(), 
//   //     lx.get(), ly.get(), lz.get()
//   //   )
//   // })

//   // const { enabled, position, lookAt, minMaxDistance, maxPolarAngle } = useMemo(() => {
//   //   const { cam: {
//   //     enabled, position, lookAt, minMaxDistance, maxPolarAngle
//   //    }} = data

//   //    return { enabled, position, lookAt, minMaxDistance, maxPolarAngle }
//   // }, [data])
  


//   // useEffect(() => {
//   //   if(!ref.current) return

//   //   ref.current.setLookAt(...position, ...lookAt, true)

//   // }, [ref.current, position, lookAt])



//   return (
//     <CameraControls
//       ref={ref}
//       enabled={cam.enabled}
//       touches={{ one: 32 /* touch dolly rotate */, two: 0, three: 0  }}
//       mouseButtons={{ left: 1, right: 0, middle: 0, wheel: 0 }}
//       minDistance={cam.minMaxDistance[0]}
//       maxDistance={cam.minMaxDistance[1]}
//       maxPolarAngle={cam.maxPolarAngle}
//     />
//   )
// }

