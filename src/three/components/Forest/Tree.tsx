import { useGLTF } from '@react-three/drei'
import { animated } from '@react-spring/three'
import { PropsWithChildren, useMemo } from 'react'
import { Material, Mesh } from 'three'
import { Timing, useEnterExit } from '../../utils/useEnterExit'

interface ITree {
  visible?: boolean
  type?: 'fat' | 'normal' |'tiny' | 'trunk'
  material?: Material
  position?: Vec3
  // Rotation about y, fixed for the tree's life.
  rotateY?: number
  // Scale the tree grows to from 0 when shown, and shrinks back from.
  scale?: number
  timing?: Timing
}


export function Tree({
  position,
  timing = {}, visible, type, rotateY = 0, scale = 1, material
}: PropsWithChildren<ITree>) {

  const {glbSrc, meshName} = useMemo(() => {
    const glbSrc = type === 'fat' ? '/fat_tree.glb' : type === 'tiny' ? '/tiny_tree.glb' :
    type === 'trunk' ? '/trunk.glb' : '/tree.glb'

    const meshName = type === 'fat' ? 'Cylinder' : type === 'tiny' ? 'Cylinder006' :
    type === 'trunk' ? 'Tree_5' : 'Cylinder001'

    return {glbSrc, meshName}
  }, [type])


  const { nodes } = useGLTF(glbSrc)
  const geom = nodes[meshName] as Mesh
  const baseGeom = nodes[`${meshName}_1`] as Mesh

  const transitions = useEnterExit(visible && nodes, {
    initial: { scale: 0 },
    animate: { scale },
    enter: timing,
  })

  return transitions((style) => (
    <animated.group
      position={position}
      rotation-y={rotateY}
      scale={style.scale}
    >
      <mesh
        geometry={geom.geometry}
        material={material || geom.material}
      />
      {type !== 'trunk' && <mesh
        geometry={baseGeom.geometry}
        material={baseGeom.material}
      />}
    </animated.group>
  ))
}
