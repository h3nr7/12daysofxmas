import { CubeCamera, FontData, Text3D } from "@react-three/drei";
import { forwardRef, PropsWithChildren, Ref, useEffect, useImperativeHandle, useRef } from "react";
import { motion } from 'framer-motion-3d'
import { Group, Mesh, Quaternion, Vector3 } from "three";
import { AnimatePresence } from "framer-motion";
import { ThreeEvent, useLoader } from "@react-three/fiber";
import { RGBELoader } from "three/examples/jsm/Addons.js";
import { useNavigate } from "react-router";

const DEFAULT_FONT_URL = 'MrsEaves_Roman.json'

interface IBlockText {
  visible?: boolean
  text: string
  size?: number
  letterSpacing?: number
  height?: number
  curveSegments?: number
  bevelEnabled?: boolean
  fonts?: string | FontData
  quaternion?: Quaternion
  position?: [number, number , number]
  onClick?: (event: ThreeEvent<MouseEvent>) => void
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void
}

export interface IBlockTextRef {
  wrapper: Group | null
  inner: Mesh | null
} 

export const BlockText = forwardRef<IBlockTextRef, IBlockText>(({
  visible,
  text, fonts, 
  size = 2, 
  height = 1.5,
  letterSpacing = -0.15,
  curveSegments = 12,
  bevelEnabled = false,
  position = [0, 0, 0],
  onClick,
  onPointerOver,
  onPointerOut
}, ref) => {

  const textRef = useRef<Mesh>(null)

  const texture = useLoader(RGBELoader, 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr')

  useEffect(() => {
    if(!textRef.current) return
    const geometry = textRef.current.geometry
    geometry.computeBoundingBox();
    const centerVector = new Vector3();
    if(!geometry.boundingBox) return
    geometry.boundingBox.getCenter(centerVector).negate();
    geometry.translate(centerVector.x, 0, centerVector.z);
  })

  const navi = useNavigate()

  return (
    <CubeCamera resolution={256} frames={1} envMap={texture}>
    {tex => (
    <AnimatePresence>
    {visible && (
      <motion.group
        whileHover={{
          rotateX: [-0.1, 0.25],
          transition: {
            type: 'tween',
            repeat: Infinity,
            repeatType: 'mirror'
          }
        }}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
        position={position}
        initial={{x: 0, y: 1.6, z: -20, opacity: 0 }}
        animate={{x:0, y: 1.6, z: 0, opacity: 1, transition: { delay: 3.2, duration: 1.25 }}}
        exit={{x: 0, y: 1.6, z: 20, opacity: 0, transition:{ duration: 1.2 }}}
      >
        <Text3D 
          ref={textRef}
          height={height}
          letterSpacing={letterSpacing}
          curveSegments={curveSegments}
          bevelEnabled={bevelEnabled}
          font={fonts || DEFAULT_FONT_URL}
          size={size}>
          {text}
          <meshBasicMaterial color={'white'} envMap={tex} toneMapped={false} />

        </Text3D> 
      </motion.group>
    )}
    </AnimatePresence>
    )}</CubeCamera>
  )
  
})