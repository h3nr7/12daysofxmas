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
  position?: Vec3
}

const URL = 'star.glb'

export default function Diamond({ visible, position = [0, 0, 0] }: IDiamond) {
  const texture = useLoader(RGBELoader, 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr')
  const { nodes } = useGLTF(URL)

  useEffect(() => {
    // destroy when done
    return () => useGLTF.clear(URL)
  }, [])

  return (
    <CubeCamera resolution={256} frames={1} envMap={texture}>
      {(texture) => (
          <AnimatePresence>
            {
              visible && <motion.mesh
                initial={{ scale: 0, rotateX: degToRad(90), y: 0  }}
                exit={{
                  scale: 0, rotateX: degToRad(-1080), y: 0,
                  transition: {
                    duration: 1.15,
                    delay: 1.7
                  }
                }}
                animate={{ 
                  scale: 0.12, 
                  x: position[0],
                  y: position[1], 
                  z: position[2],
                  rotateZ: degToRad(1080),
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