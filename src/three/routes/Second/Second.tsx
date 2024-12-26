import { useEffect, useState } from "react"
import { useLocation } from "react-router"
import { useFiberStore } from "../../../stores/fiberStore"

const PATH = '/second'

const sceneCenter = [10, -1.8, 10]

export function Second() {

  const { pathname } = useLocation()
  const { setCamera } = useFiberStore()
  const [visible, setVisible] = useState(pathname === PATH)




  useEffect(() => {
    if(pathname === PATH) {
      setVisible(true)
      setCamera({
        position: [-2.5, 1.8, -2.5],
        lookAt: [-5, 0, -5]
      })
    } else {
      setVisible(false)
    }
  }, [pathname])

  return (
    <>
    </>
  )
}