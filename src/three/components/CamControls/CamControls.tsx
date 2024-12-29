import { CameraControls, Helper } from "@react-three/drei"
import { GroupProps, useThree } from "@react-three/fiber"
import { SpringOptions } from "framer-motion"
import { motion } from "framer-motion-3d"
import { RefObject, useEffect, useRef } from "react"
import { CameraHelper, PerspectiveCamera } from "three"
import { useFiberStore } from "../../../stores/fiberStore"
import { useRigControl } from "./rigControl"
import CControl from 'camera-controls'

interface ICamControl {
  ref?: RefObject<GroupProps>
}

export function CamControls({
  ref = useRef(null)
}: ICamControl) {

  const { set: setThree, viewport }= useThree()
  const camRef = useRef<PerspectiveCamera>(null)
  const controlRef = useRef<CameraControls>(null)
  const { data: { debug, cam } } = useFiberStore()
  const { setCamPosition, setRigPosition } = useRigControl(ref, controlRef, camRef, cam.worldLookAt)

  // update camera aspect ratio when initialised
  useEffect(() => {
    if(!camRef.current) return
    camRef.current.aspect = viewport.width/viewport.height
    camRef.current.updateProjectionMatrix()
  }, [camRef.current])
  // set camera to default if specified
  useEffect(() => {
    if(!camRef.current) return
    if(cam.isDefault) setThree({ camera: camRef.current })
  }, [camRef.current, cam.isDefault])

  // setting the camera position and rig position
  useEffect(() => {
    setCamPosition(cam.localPosition)
    setRigPosition(cam.worldLookAt)
  }, [cam.worldLookAt])

  return (
    <motion.group ref={ref}>
      <perspectiveCamera ref={camRef} position={[2.5, 4, 2.5]} >
        {debug && <Helper type={CameraHelper} />}
      </perspectiveCamera>
      {/* 
        for some strange reason when placing the perspective
        camera inside the camera controls would have some weird 
        side effect and motion.  Hence placing them in a group separately
      */}
      <CameraControls 
        // mouseButtons={{ left: CControl.ACTION.ROTATE, middle: CControl.ACTION., right: CControl.ACTION.NONE, wheel: CControl.ACTION.NONE }}
        // touches={{ one: CControl.ACTION.TOUCH_ROTATE, two: CControl.ACTION.NONE, three: CControl.ACTION.NONE }}
        minDistance={cam.minMaxDistance[0]}
        maxDistance={cam.minMaxDistance[1]}
        maxPolarAngle={cam.maxPolarAngle} 
        ref={controlRef}>
      </CameraControls>
    </motion.group>
  )
}
