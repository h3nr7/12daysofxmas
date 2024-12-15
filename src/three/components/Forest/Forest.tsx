import { CubeCamera, MeshRefractionMaterial, useGLTF } from '@react-three/drei'
import { MeshProps, useLoader } from '@react-three/fiber'
import { motion,  } from 'framer-motion-3d'
import { useMemo, useRef } from 'react'
import { Mesh } from 'three'
import { RGBELoader } from 'three/examples/jsm/Addons.js'

export default function Forest() {
  // const ref = useRef(null)
  const texture = useLoader(RGBELoader, 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr')
  const { nodes } = useGLTF('/tree.glb')
  const { nodes: trunk_nodes } = useGLTF('/trunk.glb')
  console.log(nodes)
  const config = useMemo(() => {

    return {
      bounces: 10,
      aberrationStrength: 0.15,
      ior: 1.05,
      fresnel: 0.25,
      color: 'rgba(1, 1, 1, 1)'
    }
  }, [])

  const trees:Record<string, any>[] = []
  const trunks:Record<string, any>[] = []

  for (let i=0; i<500; i++) {
    trees.push({
      x: -10 + Math.random() * 20,
      y: 0,
      z: -10 + Math.random() * 20,
      rotateY: 2 * Math.PI * Math.random(),
      scale: 0.1 + Math.random() * .2
    })

    trunks.push({
      x: -10 + Math.random() * 20,
      y: 0,
      z: -10 + Math.random() * 20,
      rotateY: 2 * Math.PI * Math.random(),
      scale: 0.1 + Math.random() * .2
    })
  }

  return (
    <CubeCamera resolution={256} frames={1} envMap={texture}>
      {(texture) => {

        return (
          <>
            {trees.map((t, i) => (
              <motion.mesh key={i} 
              initial={{ scale: 0, x: t.x, y: t.y, z: t.z, rotateY: t.rotateY }}
              animate={{ scale: t.scale }}
              geometry={(nodes.Cylinder001 as Mesh).geometry}>
              <MeshRefractionMaterial envMap={texture} {...config} toneMapped={false} />
            </motion.mesh>
            ))}

            {trunks.map((t, i) => (
              <motion.mesh key={i} 
              initial={{ scale: 0, x: t.x, y: t.y, z: t.z, rotateY: t.rotateY }}
              animate={{ scale: t.scale }}
              // geometry={(nodes.Cylinder001 as Mesh).geometry}>
              material={(trunk_nodes.Tree_5 as Mesh).material}
              geometry={(trunk_nodes.Tree_5 as Mesh).geometry}>
              {/* <MeshRefractionMaterial envMap={texture} {...config} toneMapped={false} /> */}
            </motion.mesh>
            ))}
          </>
        )
      }}
    </CubeCamera>
  )
}