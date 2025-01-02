import { useEffect, useState } from "react"
import { useLocation } from "react-router"
import { useFiberStore } from "../../../stores/fiberStore"
import { Bauble } from "../../components/Bauble/Bauble"
import { motion } from 'framer-motion-3d'
import { Physics } from "@react-three/rapier"
import { AnimatePresence } from "framer-motion"
import Diamond from "../../components/Diamond/Diamond"
import { BoidsGltf } from "../../components/Boids/BoidsGltf"
import { Boids, BoidsSimple } from "../../components/Boids"
const PATH = '/sixth'

const camPosition :Vec3 = [28, 0, 28]
const sceneCenter:Vec3 = [15, 0, 15]

export function Sixth() {

  const { pathname } = useLocation()
  const { setCamera } = useFiberStore()
  const [visible, setVisible] = useState(pathname === PATH)




  useEffect(() => {
    if(pathname === PATH) {
      setVisible(true)
      setCamera({
        enabled: true,
        localPosition: camPosition,
        worldLookAt: sceneCenter
      })
    } else {
      setVisible(false)
    }
  }, [pathname])

  return (
    <AnimatePresence>
    {visible && (
      <motion.group 
        initial={{ opacity: 0}}
        animate={{ opacity: 1, transition: { duration: 3.5 }}}
        exit={{ opacity: 0, transition: { duration: 3.25 }}}
        position={sceneCenter}
      >
        <Boids 
          // countSquare={8}
          separationDistance={0.1}
          alignmentDistance={0.1}
          cohesionDistance={0.1}
          freedomFactor={0.1}>
            <BoidsSimple />
        </Boids>
      </motion.group>
    )}
    </AnimatePresence>

)
}