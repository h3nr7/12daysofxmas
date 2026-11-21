import { CameraControls, Helper } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { RefObject, useEffect, useRef } from "react"
import { CameraHelper, Group, PerspectiveCamera } from "three"
import { useFiberStore } from "../../../stores/fiberStore"
import { useRigControl } from "./rigControl"

interface ICamControl {
  ref?: RefObject<Group>
}

export function CamControls({ ref }: ICamControl) {

  const ownRef = useRef<Group>(null)
  const rigRef = ref ?? ownRef
  const { set: setThree, viewport }= useThree()
  const camRef = useRef<PerspectiveCamera>(null)
  const controlRef = useRef<CameraControls>(null)
  const { data: { debug, cam } } = useFiberStore()
  const { setCamPosition, setRigPosition } = useRigControl(rigRef, controlRef, camRef, cam.worldLookAt)

  // update camera aspect ratio when initialised
  useEffect(() => {
    if(!camRef.current) return
    camRef.current.aspect = viewport.width/viewport.height
    camRef.current.updateProjectionMatrix()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- set once when the camera mounts, as before; not re-run on resize
  }, [])
  // set camera to default if specified
  useEffect(() => {
    if(!camRef.current) return
    if(cam.isDefault) setThree({ camera: camRef.current })
  }, [cam.isDefault, setThree])

  // setting the camera position and rig position
  useEffect(() => {
    setCamPosition(cam.localPosition)
    setRigPosition(cam.worldLookAt)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the camera moves when the look-at target changes, as before, not on a position change alone
  }, [cam.worldLookAt])

  return (
    <group ref={rigRef}>
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
    </group>
  )
}
