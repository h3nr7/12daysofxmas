import { useEffect } from "react"
import { useLocation } from "react-router"
import { useFiberStore } from "../../../stores/fiberStore"

const PATH = '/third'

const sceneCenter:Vec3 = [-5, 0, -5]

export function Third() {

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
    <scene>
    </scene>
  )
}