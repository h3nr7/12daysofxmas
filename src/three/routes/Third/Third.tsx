import { useEffect, useState } from "react"
import { useLocation } from "react-router"
import { useFiberStore } from "../../../stores/fiberStore"

const PATH = '/third'

const sceneCenter:Vec3 = [-5, 0, -5]

export function Third() {

  const { pathname } = useLocation()
  const { setCamera } = useFiberStore()
  const [visible, setVisible] = useState(pathname === PATH)




  useEffect(() => {
    if(pathname === PATH) {
      setVisible(true)
      setCamera({
        position: [-2.5, 1.8, -2.5],
        lookAt: sceneCenter
      })
    } else {
      setVisible(false)
    }
  }, [pathname])

  return (
    <scene>
    </scene>
  )
}