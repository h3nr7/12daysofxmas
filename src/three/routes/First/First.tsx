import { useLocation, useNavigate } from "react-router";
import { useFiberStore } from "../../../stores/fiberStore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from 'framer-motion-3d'
import { CatmullRomCurve3, Color, MathUtils, QuadraticBezierCurve3, Vector3 } from "three";
import { AnimatePresence } from "framer-motion";
import { Sphere, Trail } from "@react-three/drei";
import { Satellite } from "../../components/Satellite/Satellite";
import { BlockText } from "../../components/BlockText/BlockText";
import { Gift } from "../../components/Gift/Gift";
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import { generateUUID, lerp } from "three/src/math/MathUtils.js";
import { Bauble } from "../../components/Bauble/Bauble";

const PATH = '/first'
const MAX_ITEMS = 50
export function First() {

  const { pathname } = useLocation()
  const navi = useNavigate();
  const { setCamera, setEffect } = useFiberStore()
  const [visible, setVisible] = useState(pathname === PATH)
  const [gravity, setGravity] = useState<Vec3>()
  const [keyId, setKeyId] = useState(generateUUID())
  const [hovered, setHovered] = useState(false)


  const clickHandler = () => setKeyId(generateUUID())
  
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
  }, [hovered])

  useEffect(() => {
    if(pathname === PATH) {
      setGravity([0, -9.81,0])
      setVisible(true)
      setCamera({ 
        enabled: true, 
        localPosition: [1.5, 0.8, 2.5],
        worldLookAt: [0, 1.8, 0],
        maxPolarAngle: Math.PI
      })
    } else {
      setGravity(undefined)
      setVisible(false)
    }
  }, [pathname])


  const [baubles, gifts] = useMemo(() => {
    const b = [...Array(Math.ceil(MAX_ITEMS*Math.random()))].map((g, i) => ({
      key: `${i}`,
      position: [lerp(-1, 1, Math.random()), lerp(5, 10, Math.random()), lerp(-1, 1, Math.random())] as Vec3,
      scale: lerp(0.07, 0.1, Math.random())
    }))
    const g = [...Array(Math.ceil(MAX_ITEMS*Math.random()))].map((g, i) => ({
      key: `${i}`,
      position: [lerp(-1, 1, Math.random()), lerp(5, 10, Math.random()), lerp(-1, 1, Math.random())] as Vec3
    }))

    return [b, g]

  }, [visible])


  return (
    <>    
      <BlockText 
        onPointerOut={() => setHovered(false)}
        onPointerOver={() => setHovered(true)}
        onClick={clickHandler}
        visible={visible} 
        text="Eat, drink, and be merry!" 
        size={0.25} 
        height={0.2} 
        letterSpacing={-0.05} />
        <Physics gravity={gravity} key={keyId}>
          {visible && baubles.map(b => <Bauble key={b.key} position={b.position} scale={b.scale}/>)}
          {visible && gifts.map(b => <Gift key={b.key} position={b.position} />)}
          <RigidBody position={[0, 0, 0]} type="fixed" colliders={false}>
            <CuboidCollider friction={2} restitution={0.5} args={[7, 0, 7]} />
          </RigidBody>
        </Physics>
      {/* )} */}
    </>
  )
}