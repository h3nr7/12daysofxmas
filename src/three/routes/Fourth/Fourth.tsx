import { useEffect, useState } from "react"
import { useLocation } from "react-router"
import { useFiberStore } from "../../../stores/fiberStore"
import { Bauble } from "../../components/Bauble/Bauble"
import { motion } from 'framer-motion-3d'
import { Physics } from "@react-three/rapier"
const PATH = '/fourth'

const sceneCenter:Vec3 = [12, 2.0, 12]

export function Fourth() {

  const { pathname } = useLocation()
  const { setCamera } = useFiberStore()
  const [visible, setVisible] = useState(pathname === PATH)




  useEffect(() => {
    if(pathname === PATH) {
      setVisible(true)
      setCamera({
        // position: [-2.5, 1.8, -2.5],
        worldLookAt: sceneCenter
      })
    } else {
      setVisible(false)
    }
  }, [pathname])

  return visible && (
    <motion.group position={sceneCenter}>
      <Physics gravity={[0,0,0]}>
        <Bauble />
      </Physics>
    </motion.group>
  )
}