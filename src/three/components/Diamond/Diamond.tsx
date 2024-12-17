import { CubeCamera, MeshDistortMaterial, MeshRefractionMaterial, useGLTF } from '@react-three/drei'
import { MeshProps, useLoader } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { motion,  } from 'framer-motion-3d'
import { useMemo, useRef } from 'react'
import { Mesh } from 'three'
import { RGBELoader } from 'three/examples/jsm/Addons.js'
import { degToRad } from 'three/src/math/MathUtils.js'

export default function Diamond() {
  const ref = useRef(null)
  const texture = useLoader(RGBELoader, 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr')
  const { nodes } = useGLTF('/star.glb')
  // const { nodes } = useGLTF('/dflat.glb')
  console.log(nodes)
  const config = useMemo(() => {

    return {
      aberrationStrength: 0.02,
      color: 'rgb(150, 150, 150)'
    }
  }, [])

  return (
    <CubeCamera resolution={256} frames={1} envMap={texture}>
      {(texture) => (
        <>
          <motion.mesh ref={ref} 
            transition={{ duration: 1.75, delay: 2, easings: ['anticipate', 'circIn'] }}
            initial={{ scale: 0, rotateX: degToRad(90), y: 0  }}
            animate={{ scale:0.12, y: 1.3, rotateZ: degToRad(1080) }}
            geometry={(nodes.Cylinder002 as Mesh).geometry}>
            
            <meshBasicMaterial envMap={texture} toneMapped={false} />
            {/* <MeshRefractionMaterial envMap={texture} {...config} toneMapped={false} /> */}
          </motion.mesh>

        </>
      )}
    </CubeCamera>
  )
}