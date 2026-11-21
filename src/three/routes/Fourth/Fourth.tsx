import { useEffect } from "react"
import { useLocation } from "react-router"
import { useFiberStore } from "../../../stores/fiberStore"
import { Bauble } from "../../components/Bauble/Bauble"
import { Physics } from "@react-three/rapier"
const PATH = '/fourth'

const sceneCenter:Vec3 = [12, 2.0, 12]

export function Fourth() {

  const { pathname } = useLocation()
  const { setCamera } = useFiberStore()
  const visible = pathname === PATH

  useEffect(() => {
    if(visible) {
      setCamera({
        // position: [-2.5, 1.8, -2.5],
        worldLookAt: sceneCenter
      })
    }
  }, [visible, setCamera])

  return visible && (
    <group position={sceneCenter}>
      <Physics gravity={[0,0,0]}>
        <Bauble />
      </Physics>
    </group>
  )
}
