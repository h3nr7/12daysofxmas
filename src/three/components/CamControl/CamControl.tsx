import { CameraControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFiberStore } from "../../../stores/fiberStore"
import { MathUtils, Vector3 } from "three";

interface ICamControls {

}

export function CamControls({}: ICamControls) {

  const ref = useRef<CameraControls>(null);
  const { data } = useFiberStore();
  
  const { enabled, position, lookAt, minMaxDistance, maxPolarAngle } = useMemo(() => {
    const { cam: {
      enabled, position, lookAt, minMaxDistance, maxPolarAngle
     }} = data

     return { enabled, position, lookAt, minMaxDistance, maxPolarAngle }
  }, [data])
  
  useEffect(() => {
    if(!ref.current) return
    console.log('reset lookat and position', position, lookAt)
    ref.current.setLookAt(...position, ...lookAt, true)
  }, [ref.current, lookAt]);

  useEffect(() => {
    if(!ref.current) return
    const tmp = new Vector3()
    ref.current.getPosition(tmp)
    console.log('reset position', position, lookAt, tmp)
    ref.current.setLookAt(...position, ...lookAt, true)
    ref.current.getPosition(tmp)
    console.log('new reset position', tmp)
  }, [ref.current, position])



  return (
    <CameraControls
      ref={ref}
      enabled={enabled}
      touches={{ one: 32 /* touch dolly rotate */, two: 0, three: 0  }}
      mouseButtons={{ left: 1, right: 0, middle: 0, wheel: 0 }}
      minDistance={minMaxDistance[0]}
      maxDistance={minMaxDistance[1]}
      maxPolarAngle={maxPolarAngle}
    />
  )
}