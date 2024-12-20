
import { AnimatePresence, motion as reactmo, usePresence } from 'framer-motion'
import Diamond from '../../components/Diamond/Diamond'
import Forest from '../../components/Forest/Forest'
import { useLocation } from 'react-router'
import { useEffect, useState, useTransition } from 'react'
import { useFiberStore } from '../../../stores/fiberStore'
import { MathUtils } from 'three'

const PATH = '/'

export default function Zero() {

  const { pathname } = useLocation()
  const { setCamera } = useFiberStore()
  const [visible, setVisible] = useState(pathname === PATH)

  useEffect(() => {
    if(pathname === PATH) {
      setVisible(true)
      setCamera({ enabled: true, maxPolarAngle: MathUtils.degToRad(80) })
    } else {
      setVisible(false)
    }
  }, [pathname])

  return (
      <>
      <Diamond visible={visible}/>
      <Forest visible={visible}/>
      </>
  )
}