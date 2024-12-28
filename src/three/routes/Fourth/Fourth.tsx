import { useEffect, useState } from "react"
import { useLocation } from "react-router"
import { useFiberStore } from "../../../stores/fiberStore"

const PATH = '/fourth'

const sceneCenter:Vec3 = [7, 2.0, 7]

export function Fourth() {

  const { pathname } = useLocation()
  const { setCamera } = useFiberStore()
  const [visible, setVisible] = useState(pathname === PATH)




  useEffect(() => {
    if(pathname === PATH) {
      setVisible(true)
      setCamera({
        // position: [-2.5, 1.8, -2.5],
        lookAt: sceneCenter
      })
    } else {
      setVisible(false)
    }
  }, [pathname])

  return (
    <mesh>
    </mesh>
  )
}