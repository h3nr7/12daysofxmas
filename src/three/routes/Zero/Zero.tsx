
import { AnimatePresence, motion as reactmo, usePresence } from 'framer-motion'
import Diamond from '../../components/Diamond/Diamond'
import Forest from '../../components/Forest/Forest'
import { useLocation } from 'react-router'
import { useEffect, useState, useTransition } from 'react'
import { useFiberStore } from '../../../stores/fiberStore'
import { CatmullRomCurve3, MathUtils, Vector3 } from 'three'
import { Stars, Trail } from '@react-three/drei'
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
        localPosition: [2.5, 2.5, 2.5],
        worldLookAt: [0, 1.8, 0]
      })
      setEffect({ tiltshift: true })
    } else {
      setVisible(false)
    }
  }, [pathname])

  return (
      <>
        <Diamond visible={visible} position={[0, 1.8, 0]}/>
        <Forest visible={visible}/>
        <OrbitalTrails visible={visible} center={[0, 1.8, 0]} />
      </>
  )
}