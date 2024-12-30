import { useEffect, useState } from "react"
import { useLocation } from "react-router"
import { useFiberStore } from "../../../stores/fiberStore"
import { Bauble } from "../../components/Bauble/Bauble"
import { motion } from 'framer-motion-3d'
import { Physics } from "@react-three/rapier"
import { AnimatePresence } from "framer-motion"
import Diamond from "../../components/Diamond/Diamond"
import { BoidsGltf } from "../../components/Boids/BoidsGltf"
const PATH = '/sixth'

const sceneCenter:Vec3 = [0, 0, 0]

export function Sixth() {

  const { pathname } = useLocation()
  const { setCamera } = useFiberStore()
  const [visible, setVisible] = useState(pathname === PATH)




  useEffect(() => {
    if(pathname === PATH) {
      setVisible(true)
      setCamera({
        enabled: true,
        localPosition: [200, 200, 200],
        worldLookAt: sceneCenter
      })
    } else {
      setVisible(false)
    }
  }, [pathname])

  return (
    <AnimatePresence>
      <Diamond visible={visible} position={sceneCenter} />
    {visible && (
      <motion.group position={sceneCenter}>
        
        <hemisphereLight position={[0, 50, 0]}/>
    <directionalLight 
      intensity={2}
      position={[-30, 57, 30]}
      castShadow={true} />
      color={'#ffcc33'}
      position={[100, -30, -10]}
    <ambientLight intensity={1}/>
        <BoidsGltf url="Flamingo.glb"/>
      </motion.group>
    )}
    </AnimatePresence>

)
}