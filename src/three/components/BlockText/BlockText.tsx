import { useEnvTexture } from '../../utils/assets'
import { FontData, Text3D } from "@react-three/drei";
import { forwardRef, useEffect, useRef } from "react";
import { animated, useSpring } from '@react-spring/three'
import { Group, Mesh, Quaternion, Vector3 } from "three/webgpu";
import { ThreeEvent } from "@react-three/fiber";
import { toSpring, useEnterExit } from '../../utils/useEnterExit'

const DEFAULT_FONT_URL = 'MrsEaves_Roman.json'

// While hovered the text rocks about x between these angles, 0.3 s each way.
// Moving off stops it wherever it is, as framer-motion did: it had no resting
// angle to return to, so the text stays tilted until the next hover.
const HOVER_ROCK: [number, number] = [-0.1, 0.25]
const HOVER_TWEEN = toSpring({ duration: 0.3 })

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
  onClick,
  onPointerOver,
  onPointerOut
}, _ref) => {

  const textRef = useRef<Mesh>(null)

  const texture = useEnvTexture()

  useEffect(() => {
    if(!textRef.current) return
    const geometry = textRef.current.geometry
    geometry.computeBoundingBox();
    const centerVector = new Vector3();
    if(!geometry.boundingBox) return
    geometry.boundingBox.getCenter(centerVector).negate();
    geometry.translate(centerVector.x, 0, centerVector.z);
  })

  // Flies in from z = -20 after 3.2 s, and out to z = 20. It always sits at
  // x = 0, y = 1.6: the old `position` prop was overridden by the animated
  // x and y, and no caller passed it, so it is gone.
  const transitions = useEnterExit(visible, {
    initial: { z: -20 },
    animate: { z: 0 },
    exit: { z: 20 },
    enter: { duration: 1.25, delay: 3.2 },
    leave: { duration: 1.2 },
  })

  const [hover, hoverApi] = useSpring(() => ({ rotateX: 0 }))

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    hoverApi.start({
      from: { rotateX: HOVER_ROCK[0] },
      to: { rotateX: HOVER_ROCK[1] },
      loop: { reverse: true },
      ...HOVER_TWEEN,
    })
    onPointerOver?.(event)
  }

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    hoverApi.stop()
    onPointerOut?.(event)
  }

  // The environment map reflects as it is: no CubeCamera pass (drei has no
  // WebGPU version, and the reflection it added could not be told apart).
  return transitions((style) => (
    <animated.group
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={onClick}
      position-x={0}
      position-y={1.6}
      position-z={style.z}
      rotation-x={hover.rotateX}
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
        <meshBasicMaterial color={'white'} envMap={texture} toneMapped={false} />
      </Text3D>
    </animated.group>
  ))

})
