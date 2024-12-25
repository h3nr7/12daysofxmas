import { useLocation, useNavigate } from "react-router";
import { useFiberStore } from "../../../stores/fiberStore";
import { useEffect, useState } from "react";
import { motion } from 'framer-motion-3d'
import { CatmullRomCurve3, Color, MathUtils, QuadraticBezierCurve3, Vector3 } from "three";
import { AnimatePresence } from "framer-motion";
import { Sphere, Trail } from "@react-three/drei";
import { Satellite } from "../../components/Satellite/Satellite";
import { BlockText } from "../../components/BlockText/BlockText";
import { Gift } from "../../components/Gift/Gift";
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import { lerp } from "three/src/math/MathUtils.js";
import { Bauble } from "../../components/Bauble/Bauble";

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
    } else {
      setVisible(false)
    }
  }, [pathname])

  let gifts = []
  for (let i = 0; i< 100; i++) {
    gifts.push(<Gift visible={true}/>)
  }

  return (
    <>    
      <AnimatePresence>
        <BlockText visible={visible} text="Eat, drink, and be merry!" size={0.25} height={0.2} letterSpacing={-0.05}/>
        {/* <Satellite key={'test_satellite'}/> */}
      </AnimatePresence>
      <Physics>
      {[...Array(100)].map((g, i) => <Bauble key={i} scale={0.088} position={[lerp(-1, 1, Math.random()), lerp(5, 10, Math.random()), lerp(-1, 1, Math.random())]}/>)}
        {[...Array(100)].map((g, i) => <Gift key={i} visible={visible} position={[lerp(-1, 1, Math.random()), lerp(5, 10, Math.random()), lerp(-1, 1, Math.random())]}/>)}
        <RigidBody position={[0, 0, 0]} type="fixed" colliders={false}>
          <CuboidCollider friction={2} restitution={0.5} args={[7, 0, 7]} />
        </RigidBody>

      </Physics>
    </>
  )
}