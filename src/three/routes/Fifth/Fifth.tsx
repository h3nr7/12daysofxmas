import { useEffect } from "react"
import { useLocation } from "react-router"
import { useFiberStore } from "../../../stores/fiberStore"
import { Bauble } from "../../components/Bauble/Bauble"
import { Physics } from "@react-three/rapier"
const PATH = '/fifth'

const sceneCenter:Vec3 = [12, 2.0, 12]

export function Fifth() {

  const { pathname } = useLocation()
  const { setCamera } = useFiberStore()
  const visible = pathname === PATH

  useEffect(() => {
    if(visible) {
      setCamera({
        enabled: true,
        localPosition: [2.5, 3.8, 2.5],
        worldLookAt: sceneCenter
      })
    }
  }, [visible, setCamera])

  return visible && (
    <group position={sceneCenter}>
      <Physics gravity={[0,0,0]}>
        <Bauble />
        <Bauble position={[1,4,1]}/>
        <Bauble />
        <Bauble position={[4,2,1]}/>
        <Bauble />
      </Physics>
    </group>
  )
}
