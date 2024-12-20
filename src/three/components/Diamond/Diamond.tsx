import { CubeCamera, useGLTF } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { AnimatePresence } from 'framer-motion'
import { motion,  } from 'framer-motion-3d'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Mesh } from 'three'
import { RGBELoader } from 'three/examples/jsm/Addons.js'
import { degToRad } from 'three/src/math/MathUtils.js'

interface IDiamond {
  visible?: boolean
}

export default function Diamond({ visible }: IDiamond) {
  const texture = useLoader(RGBELoader, 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr')
  const { nodes } = useGLTF('/star.glb')

  return (
    <CubeCamera resolution={256} frames={1} envMap={texture}>
      {(texture) => (
          <AnimatePresence mode="wait">
            {
              visible && <motion.mesh
                initial={{ scale: 0, rotateX: degToRad(90), y: 0  }}
                exit={{
                  scale: 0, rotateX: degToRad(-1080), y: 0,
                  transition: {
                    duration: 0.75
                  }
                }}
                animate={{ 
                  scale:0.12, y: 1.3, rotateZ: degToRad(1080),
                  transition: {
                    easings: ['anticipate', 'circIn'],
                    duration: 1.75,
                    delay: 2
                  }
                }}
                geometry={(nodes.Cylinder002 as Mesh).geometry}>
                
                <meshBasicMaterial envMap={texture} toneMapped={false} />
                {/* <MeshRefractionMaterial envMap={texture} {...config} toneMapped={false} /> */}
              </motion.mesh>
            }
          </AnimatePresence>
      )}
    </CubeCamera>
  )
}