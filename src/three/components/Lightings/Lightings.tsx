import { useEffect, useMemo } from "react"
import { useFiberStore } from "../../../stores/fiberStore"
import { AnimatePresence, frame, useMotionValueEvent, useSpring, useTransform } from "framer-motion"
import { motion } from "framer-motion-3d"


export function Lightings() {

  const { data: { cam } } = useFiberStore()

  // move lights to the right places
  const {x, y, z} = useMemo(() => ({
    x: cam.worldLookAt[0], 
    y: cam.worldLookAt[1], 
    z: cam.worldLookAt[2]
  }), [cam.worldLookAt])

  return (
    <AnimatePresence>
      <motion.group
        initial={{ opacity: 0, x: 0, y: 0, z: 0 }}
        animate={{ opacity: 1, x, y, z, transition: { duration: 1000 } }}
        exit={{ opacity: 0, x: 0, y: 0, z: 0 }}
      >
        <ambientLight intensity={Math.PI / 2} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
        <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
        <pointLight position={[-5, 0, -5]} decay={0} intensity={Math.PI} />

      </motion.group>
    </AnimatePresence>
  )
}