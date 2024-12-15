import { CameraControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFiberStore } from "../../../stores/fiberStore"
import { MathUtils } from "three";

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
    if(ref.current) {
      ref.current.setLookAt(...position, ...lookAt, true);
    }
  }, [ref.current, enabled, position, lookAt, minMaxDistance]);


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