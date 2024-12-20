
import { AnimatePresence, motion as reactmo, usePresence } from 'framer-motion'
import Diamond from '../../components/Diamond/Diamond'
import Forest from '../../components/Forest/Forest'
import { useLocation } from 'react-router'
import { useEffect, useState, useTransition } from 'react'
import { useFiberStore } from '../../../stores/fiberStore'
import { MathUtils } from 'three'
import { Stars } from '@react-three/drei'
import { motion } from 'framer-motion-3d'

const PATH = '/'

export default function Zero() {

  const { pathname } = useLocation()
  const { setCamera } = useFiberStore()
  const [visible, setVisible] = useState(pathname === PATH)

  useEffect(() => {
    if(pathname === PATH) {
      setVisible(true)
      setCamera({ 
        enabled: true, 
        maxPolarAngle: MathUtils.degToRad(80),
        position: [2.5, 2.5, 2.5],
        lookAt: [0, 1.8, 0]
      })
    } else {
      setVisible(false)
    }
  }, [pathname])

  return (
      <>
        <color attach="background" args={["#310000"]} />
        <Diamond visible={visible} position={[0, 1.8, 0]}/>
        <Forest visible={visible}/>
        <AnimatePresence>
          {visible && (
            <motion.mesh 
              transition={{ delay: 2, duration: 1.5 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[5,16]}/>
              <meshBasicMaterial color={'#310000'}/>
            </motion.mesh>
          )}
        </AnimatePresence>
        <Stars radius={200} depth={10} count={1500} factor={4} saturation={10} fade speed={1} />
      </>
  )
}