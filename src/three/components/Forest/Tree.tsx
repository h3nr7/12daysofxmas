import { useGLTF } from '@react-three/drei'
import { AnimatePresence, AnimationControls, Target, TargetAndTransition, Transition, VariantLabels } from 'framer-motion'
import { motion } from 'framer-motion-3d'
import { PropsWithChildren, useMemo } from 'react'
import { Material, Mesh } from 'three'
import { generateUUID } from 'three/src/math/MathUtils.js'

interface ITree {
  visible?: boolean
  type?: 'fat' | 'normal' |'tiny' | 'trunk'
  material?: Material
  initial?: Target | VariantLabels
  animate?: AnimationControls | TargetAndTransition | VariantLabels
  transition?: Transition
}

export function Tree({ transition, visible, type, initial = {}, animate, material }: PropsWithChildren<ITree>) {

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

  return (
    <AnimatePresence>
      { visible && nodes && <motion.group
        transition={transition}
        initial={initial}
        exit={initial}
        animate={animate}
      >
        <motion.mesh 
          geometry={geom.geometry}
          material={material || geom.material}
        />
        {type !== 'trunk' && <motion.mesh 
          geometry={baseGeom.geometry}
          material={baseGeom.material}
        />}
      </motion.group>}
    </AnimatePresence>
  )
}