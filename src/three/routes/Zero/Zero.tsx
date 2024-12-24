
import { AnimatePresence, motion as reactmo, usePresence } from 'framer-motion'
import Diamond from '../../components/Diamond/Diamond'
import Forest from '../../components/Forest/Forest'
import { useLocation } from 'react-router'
import { useEffect, useState, useTransition } from 'react'
import { useFiberStore } from '../../../stores/fiberStore'
import { CatmullRomCurve3, MathUtils, Vector3 } from 'three'
import { Stars, Trail } from '@react-three/drei'
import { motion } from 'framer-motion-3d'
import { useLoader } from '@react-three/fiber'
import { RGBELoader } from 'three/examples/jsm/Addons.js'
import { OrbitalTrails } from '../../components/OrbitalTrails/OrbitalTrails'

const PATH = '/'

export default function Zero() {

  const { pathname } = useLocation()
  const { setCamera, setEffect } = useFiberStore()
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
      setEffect({ tiltshift: true })
    } else {
      setVisible(false)
    }
  }, [pathname])

  return (
      <>
        <color attach="background" args={["#310000"]} />
        <Diamond visible={visible} position={[0, 1.8, 0]}/>
        <Forest visible={visible}/>
        <Stars radius={200} depth={10} count={1500} factor={4} saturation={10} fade speed={1} />
        {/* If `target` is not defined, Trail will use the first `Object3D` child as the target. */}
        <OrbitalTrails visible={visible} center={[0, 1.8, 0]} />
      </>
  )
}