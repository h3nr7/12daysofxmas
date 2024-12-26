import { CameraControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFiberStore } from "../../../stores/fiberStore"
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { LayoutCamera } from "framer-motion-3d";
import { frame, SpringOptions, useAnimationFrame, useMotionValue, useMotionValueEvent, useSpring, useTransform } from "framer-motion";

interface ICamControls {

}

const DEFAULT_SPRING:SpringOptions = {
  // damping: 10,
  // mass: 1,
  // velocity: 1, 
  // restSpeed: 0.1, 
  // stiffness: 1,
  duration: 1.3 * 1000,
  bounce: 0
}

export function CamControls({}: ICamControls) {

  const ref = useRef<CameraControls>(null);
  const { data: { cam }, setCamera } = useFiberStore();
  const [springOpts, setSpringOpts] = useState<SpringOptions>(DEFAULT_SPRING)

  const px = useSpring(cam.position[0], springOpts)
  const py = useSpring(cam.position[1], springOpts)
  const pz = useSpring(cam.position[2], springOpts)

  const lx = useSpring(cam.lookAt[0], springOpts)
  const ly = useSpring(cam.lookAt[1], springOpts)
  const lz = useSpring(cam.lookAt[2], springOpts)

  const pos = useTransform<unknown, [number, number, number, number, number, number]>(() =>[
    px.get(), py.get(), pz.get(),
    lx.get(), ly.get(), lz.get()
  ])

  useMotionValueEvent(pos, 'animationStart', () => {
    setCamera({ enabled: false })
  })

  useMotionValueEvent(pos, 'animationComplete', () => {
    setCamera({ enabled: true })
  })

  useMotionValueEvent(pos, 'animationCancel', () => {
    setCamera({ enabled: true })
  })

  useMotionValueEvent(pos, 'change', latest => {
    if(!ref.current) return
    ref.current.setLookAt(...latest)
  })

  useEffect(() => 
    setSpringOpts({
      ...DEFAULT_SPRING,
      duration: cam.duration ? cam.duration * 1000 : DEFAULT_SPRING.duration
    })
  , [cam.duration])

  useEffect(() => {
    if(!ref.current) return

    frame.read(() => {
      px.set(cam.position[0])
      py.set(cam.position[1])
      pz.set(cam.position[2])

      lx.set(cam.lookAt[0])
      ly.set(cam.lookAt[1])
      lz.set(cam.lookAt[2])
    })

  }, [ref.current, cam.position, cam.lookAt])

  if(ref.current)
  ref.current.addEventListener('control', e => {
    const tmp = new Vector3()
    ref.current?.getTarget(tmp)
    console.log(tmp)
  })

  // useAnimationFrame(() => {
  //   if(!ref.current) return
    
  //   ref.current.setLookAt(
  //     px.get(), py.get(), pz.get(), 
  //     lx.get(), ly.get(), lz.get()
  //   )
  // })

  // const { enabled, position, lookAt, minMaxDistance, maxPolarAngle } = useMemo(() => {
  //   const { cam: {
  //     enabled, position, lookAt, minMaxDistance, maxPolarAngle
  //    }} = data

  //    return { enabled, position, lookAt, minMaxDistance, maxPolarAngle }
  // }, [data])
  

  // useEffect(() => {
  //   if(!ref.current) return

  //   ref.current.setLookAt(...position, ...lookAt, true)

  // }, [ref.current, position, lookAt])



  return (
    <CameraControls
      ref={ref}
      enabled={cam.enabled}
      touches={{ one: 32 /* touch dolly rotate */, two: 0, three: 0  }}
      mouseButtons={{ left: 1, right: 0, middle: 0, wheel: 0 }}
      minDistance={cam.minMaxDistance[0]}
      maxDistance={cam.minMaxDistance[1]}
      maxPolarAngle={cam.maxPolarAngle}
    />
  )
}

