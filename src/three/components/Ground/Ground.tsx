import { AnimatePresence } from "framer-motion";
import { motion } from 'framer-motion-3d'

export function Ground({ visible }:{ visible?: boolean }) {

  return (
    <AnimatePresence>
      {visible && (
        <motion.mesh 
          scale={1}
          transition={{ duration: .75 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[7,16]}/>
          <meshBasicMaterial color={'#310000'}/>
        </motion.mesh>
      )}
    </AnimatePresence>
  )
}