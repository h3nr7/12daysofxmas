import { useEffect, useState } from "react"
import { useLocation } from "react-router"
import { useFiberStore } from "../../../stores/fiberStore"
import { Bauble } from "../../components/Bauble/Bauble"
import { motion } from 'framer-motion-3d'
import { Physics } from "@react-three/rapier"
import { AnimatePresence } from "framer-motion"
import Diamond from "../../components/Diamond/Diamond"
const PATH = '/fifth'

const sceneCenter:Vec3 = [12, 2.0, 12]

export function Fifth() {

  const { pathname } = useLocation()
  const { setCamera } = useFiberStore()
  const [visible, setVisible] = useState(pathname === PATH)




  useEffect(() => {
    if(pathname === PATH) {
      setVisible(true)
      setCamera({
        enabled: true,
        localPosition: [2.5, 3.8, 2.5],
        worldLookAt: sceneCenter
      })
    } else {
      setVisible(false)
    }
  }, [pathname])

  return (
    <AnimatePresence>
    {visible && (
      <motion.group position={sceneCenter}>
        <Physics gravity={[0,0,0]}>
          <Bauble />
          <Bauble position={[1,4,1]}/>
          <Bauble />
          <Bauble position={[4,2,1]}/>
          <Bauble />
        </Physics>
      </motion.group>
    )}
    </AnimatePresence>

)
}