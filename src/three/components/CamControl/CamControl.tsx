import { CameraControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useFiberStore } from "../../../stores/fiberStore"

interface ICamControls {

}

export function CamControls({}: ICamControls) {

  const ref = useRef<CameraControls>(null);
  const { data:{ 
    cam: {
      lookAt, position,
      minMaxDistance
    }
  }} = useFiberStore();
  
  useEffect(() => {
    if(ref.current) {
      ref.current.setLookAt(...position, ...lookAt, true);
    }
  }, [ref.current, position]);

  return (
    <CameraControls
      ref={ref}
      touches={{ one: 0, two: 0, three: 0  }}
      mouseButtons={{ left: 0, right: 0, middle: 0, wheel: 0 }}
      minDistance={minMaxDistance[0]}
      maxDistance={minMaxDistance[1]}
    />
  )
}