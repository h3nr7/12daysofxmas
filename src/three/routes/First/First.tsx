import { useLocation, useNavigate } from "react-router";
import { useFiberStore } from "../../../stores/fiberStore";
import { useEffect, useState } from "react";
import { motion } from 'framer-motion-3d'
import { CatmullRomCurve3, Color, QuadraticBezierCurve3, Vector3 } from "three";
import { AnimatePresence } from "framer-motion";
import { Sphere, Trail } from "@react-three/drei";
import { Satellite } from "../../components/Satellite/Satellite";

const PATH = '/first'

export function First() {

  const { pathname } = useLocation()
  const navi = useNavigate();
  const { setCamera, setEffect } = useFiberStore()
  const [visible, setVisible] = useState(pathname === PATH)
  PATH
  useEffect(() => {
    if(pathname === PATH) {
      setVisible(true)
      setCamera({ enabled: false })
      setEffect({ tiltshift: false })
    } else {
      setVisible(false)
    }
  }, [pathname])

  return (
    <AnimatePresence>
      <color attach="background" args={["#310000"]} />
      {visible && (
        <motion.mesh
          initial={{ scale: 0, x: 2.2 }}
          animate={{ scale: 0.1 }}
          exit={{ scale: 0 }}
          position={[1.2, 1.5, 0.0]}
          whileHover={{ scale: 0.2 }}
          whileTap={{ scale: 0.2 }}
          onHoverStart={() => console.log('hover start')}
          onAnimationComplete={() => console.log('anim complete')}
          onTap={() => navi('/')}
        >
          <sphereGeometry />
          <meshBasicMaterial color={new Color(0xff00ff)} />
        </motion.mesh>
      )}
      <Satellite>
        <sphereGeometry />
      </Satellite>
    </AnimatePresence>
  )
}