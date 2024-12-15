import { CubeCamera, MeshRefractionMaterial, useGLTF } from '@react-three/drei'
import { MeshProps, useLoader } from '@react-three/fiber'
import { motion,  } from 'framer-motion-3d'
import { useMemo, useRef } from 'react'
import { Mesh } from 'three'
import { RGBELoader } from 'three/examples/jsm/Addons.js'

export default function Diamond() {
  const ref = useRef(null)
  const texture = useLoader(RGBELoader, 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr')
  const { nodes } = useGLTF('/dflat.glb')
  console.log(nodes)
  const config = useMemo(() => {

    return {
      bounces: 3,
      aberrationStrength: 0.01,
      ior: 2.75,
      fresnel: 1,
      color: 'white'
    }
  }, [])

  return (
    <CubeCamera resolution={256} frames={1} envMap={texture}>
      {(texture) => (
        <motion.mesh ref={ref} 
          initial={{ scale: 0 }}
          animate={{ scale:0.25 }}
          geometry={(nodes.Diamond_1_0 as Mesh).geometry}>
          <MeshRefractionMaterial envMap={texture} {...config} toneMapped={false} />
        </motion.mesh>
      )}
    </CubeCamera>
  )
}