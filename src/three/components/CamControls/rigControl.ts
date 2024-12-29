import { CameraControls, useMotion } from "@react-three/drei"
import { GroupProps } from "@react-three/fiber"
import { frame, SpringOptions, useMotionValueEvent, useSpring, useTransform } from "framer-motion"
import { RefObject, useEffect, useState } from "react"
import { PerspectiveCamera, Vector3 } from "three"

const DEFAULT_SPRING:SpringOptions = {
  // damping: 10,
  // mass: 1,
  // velocity: 1, 
  // restSpeed: 0.1, 
  // stiffness: 1,
  duration: 3.3 * 1000,
  bounce: 0
}

/**
 * Rig Control looked used by the CamControl only
 * @param ref 
 * @param controlRef 
 * @param camRef 
 * @param initialRigPosition 
 * @param isDefault 
 * @returns 
 */
export function useRigControl(
  ref: RefObject<GroupProps>, 
  controlRef:RefObject<CameraControls>, 
  camRef: RefObject<PerspectiveCamera>,
  initialRigPosition: Vec3 = [0, 0, 0],
  initialCamPosition: Vec3 = [0, 0, 0]
) {

  const [rigPosition, setRigPosition] = useState<Vec3>(initialRigPosition)
  const [camPosition, setCamPosition] = useState<Vec3>(initialCamPosition)

  const cx = useSpring(camPosition[0], DEFAULT_SPRING)
  const cy = useSpring(camPosition[1], DEFAULT_SPRING)
  const cz = useSpring(camPosition[2], DEFAULT_SPRING)

  const px = useSpring(rigPosition[0], DEFAULT_SPRING)
  const py = useSpring(rigPosition[1], DEFAULT_SPRING)
  const pz = useSpring(rigPosition[2], DEFAULT_SPRING)


  const pos = useTransform(() => [
    new Vector3(cx.get(), cy.get(), cz.get()),
    new Vector3(px.get(), py.get(), pz.get())
  ])

  useEffect(() => {

    frame.read(() =>{
      px.set(rigPosition[0])
      py.set(rigPosition[1])
      pz.set(rigPosition[2])

      cx.set(camPosition[0])
      cy.set(camPosition[1])
      cz.set(camPosition[2])
    })

  }, [rigPosition, camPosition]) 

  // this is to save the camera position after dolly
  controlRef.current?.addEventListener('controlend', (e: any) => {
    frame.read(() =>{
      cx.set(e.target.camera.position.x, false)
      cy.set(e.target.camera.position.y, false)
      cz.set(e.target.camera.position.z, false)
    })
  })

  useMotionValueEvent(pos, 'change', ([latestCam, latest]) => {
    if(!ref.current?.position || !controlRef.current || !camRef.current) return;
    // set the position to the look at as the rig is centered at the look at position
    (ref.current.position as Vector3).set(latest.x, latest.y, latest.z)
    // when it is default CameraControls took over so it needs to be set there
    // when there is no camera control we need to update the lookat directly
    // to the perspective camera.

    controlRef.current.setLookAt(latestCam.x, latestCam.y, latestCam.z, latest.x, latest.y, latest.z)
    camRef.current.updateProjectionMatrix()
  })

  return { setRigPosition, setCamPosition }
}
