import { useLocation, useNavigate } from "react-router";
import { useFiberStore } from "../../../stores/fiberStore";
import { useEffect, useState } from "react";
import { motion } from 'framer-motion-3d'
import { Color } from "three";
import { AnimatePresence } from "framer-motion";

const PATH = '/first'

export function First() {

  const { pathname } = useLocation()
  const navi = useNavigate();
  const { setCamera } = useFiberStore()
  const [visible, setVisible] = useState(pathname === PATH)
  PATH
  useEffect(() => {
    if(pathname === PATH) {
      setVisible(true)
      setCamera({ enabled: false })
    } else {
      setVisible(false)
    }
  }, [pathname])

  return (
    <AnimatePresence>
    {visible && (
      <motion.mesh
        initial={{ scale: 0, x: 1.2 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        position={[1.2, 0, 0]}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onHoverStart={() => console.log('hover start')}
        onAnimationComplete={() => console.log('anim complete')}
        onTap={() => navi('/')}
      >
        <sphereGeometry />
        <meshBasicMaterial color={new Color(0xff00ff)} />
      </motion.mesh>
    )}
    </AnimatePresence>
  )
}