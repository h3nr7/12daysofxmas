import { useEffect } from "react"
import { useLocation } from "react-router"
import { useFiberStore } from "../../../stores/fiberStore"

const PATH = '/second'

const sceneCenter: Vec3 = [10, -1.8, 10]

export function Second() {

  const { pathname } = useLocation()
  const { setCamera } = useFiberStore()
  const visible = pathname === PATH




  useEffect(() => {
    if(visible) {
      setCamera({
        localPosition: [-2.5, 1.8, -2.5],
        worldLookAt: sceneCenter
      })
    }
  }, [visible, setCamera])

  return (
    <>
    </>
  )
}