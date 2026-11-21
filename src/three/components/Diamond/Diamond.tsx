import { ENV_MAP_URL } from '../../utils/assets'
import { CubeCamera, useGLTF } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { animated } from '@react-spring/three'
import { useEffect } from 'react'
import { MathUtils, Mesh } from 'three/webgpu'
import { RGBELoader } from 'three/examples/jsm/Addons.js'
import { useEnterExit } from '../../utils/useEnterExit'

const { degToRad } = MathUtils

interface IDiamond {
  visible?: boolean
  position?: Vec3
  scale?: number
}

const URL = 'star.glb'

export default function Diamond({
  visible,
  position = [0, 0, 0],
  scale = 0.12
}: IDiamond) {
  const texture = useLoader(RGBELoader, ENV_MAP_URL)
  const { nodes } = useGLTF(URL)

  useEffect(() => {
    // destroy when done
    return () => useGLTF.clear(URL)
  }, [])

  // Rises to `position` spinning about z, then on exit spins about x and
  // drops back to y = 0, keeping its x, z and z-spin.
  const transitions = useEnterExit(visible, {
    initial: { scale: 0, rotateX: degToRad(90), rotateZ: 0, x: 0, y: 0, z: 0 },
    animate: {
      scale,
      x: position[0],
      y: position[1],
      z: position[2],
      rotateZ: degToRad(1080),
    },
    exit: { scale: 0, rotateX: degToRad(-1080), y: 0 },
    enter: { duration: 1.75, delay: 2 },
    leave: { duration: 1.15, delay: 1.7 },
  })

  return (
    <CubeCamera resolution={256} frames={1} envMap={texture}>
      {(texture) => transitions((style) => (
        <animated.mesh
          scale={style.scale}
          rotation-x={style.rotateX}
          rotation-z={style.rotateZ}
          position-x={style.x}
          position-y={style.y}
          position-z={style.z}
          geometry={(nodes.Cylinder002 as Mesh).geometry}>

          <meshBasicMaterial envMap={texture} toneMapped={false} />
          {/* <MeshRefractionMaterial envMap={texture} {...config} toneMapped={false} /> */}
        </animated.mesh>
      ))}
    </CubeCamera>
  )
}
