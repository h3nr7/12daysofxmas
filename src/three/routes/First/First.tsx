import { useLocation, useNavigate } from "react-router";
import { useFiberStore } from "../../../stores/fiberStore";
import { useEffect, useState } from "react";
import { motion } from 'framer-motion-3d'
import { CatmullRomCurve3, Color, MathUtils, QuadraticBezierCurve3, Vector3 } from "three";
import { AnimatePresence } from "framer-motion";
import { Sphere, Trail } from "@react-three/drei";
import { Satellite } from "../../components/Satellite/Satellite";
import { BlockText } from "../../components/BlockText/BlockText";

const PATH = '/first'

export function First() {

  const { pathname } = useLocation()
  const navi = useNavigate();
  const { setCamera, setEffect } = useFiberStore()
  const [visible, setVisible] = useState(pathname === PATH)

  useEffect(() => {
    if(pathname === PATH) {
      setVisible(true)
      setCamera({ 
        enabled: true, 
        position: [0, 2.5, 2.5],
        lookAt: [0, 1.8, 0]
      })
      setEffect({ tiltshift: true })
    } else {
      setVisible(false)
    }
  }, [pathname])

  return (
    <AnimatePresence>
      <BlockText visible={visible} text="Merry Christmas" size={0.3} height={0.2} letterSpacing={-0.05}/>
      <Satellite key={'test_satellite'}/>
    </AnimatePresence>
  )
}