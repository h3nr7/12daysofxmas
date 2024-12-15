import { CubeCamera, MeshRefractionMaterial, useGLTF } from '@react-three/drei'
import { MeshProps, useLoader } from '@react-three/fiber'
import { motion,  } from 'framer-motion-3d'
import { Suspense, useMemo, useRef } from 'react'
import { Mesh } from 'three'
import { RGBELoader } from 'three/examples/jsm/Addons.js'
import { useMobile } from '../../../hooks/isMobile'

export default function Forest() {
  // const ref = useRef(null)

  const texture = useLoader(RGBELoader, 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr')
  const { nodes } = useGLTF('/tree.glb')
  const { nodes: fat_nodes } = useGLTF('/fat_tree.glb')
  const { nodes: trunk_nodes } = useGLTF('/trunk.glb')
  const { nodes: tiny_nodes } = useGLTF('/tiny_tree.glb')

  const isMobile = useMobile()

  const { maxTree, maxFatTree, maxTinyTree, maxTrunk, distance } = useMemo(() => isMobile === true || isMobile === undefined ? {
    maxTree: 50, maxFatTree: 50, maxTinyTree: 10, maxTrunk: 20, distance: 5
  } : {
    maxTree: 350, maxFatTree: 300, maxTinyTree: 150, maxTrunk: 150, distance: 30
  }, [isMobile])

  const config = useMemo(() => {

    return {
      bounces: 10,
      aberrationStrength: 0.15,
      ior: 1.05,
      fresnel: 0.25,
      color: 'rgba(1, 1, 1, 1)'
    }
  }, [])

  const {trees, fatTrees, tinyTrees, trunks} = useMemo(() => {
    const trees:Record<string, any>[] = []
    const fatTrees:Record<string, any>[] = []
    const tinyTrees:Record<string, any>[] = []
    const trunks:Record<string, any>[] = []

    for (let i=0; i<maxTree; i++) {
      trees.push({
        x: -distance/3 + Math.random() * distance*2/3,
        y: 0,
        z: -distance/3 + Math.random() * distance*2/3,
        rotateY: 2 * Math.PI * Math.random(),
        scale: 0.05 + Math.random() * .2,
        fresnel: Math.random() * 0.25,
        ior: 1 + Math.random() * 0.1
      })
    }

    for (let i=0; i<maxFatTree; i++) {
      fatTrees.push({
        x: -distance/3 + Math.random() * distance*2/3,
        y: 0,
        z: -distance/3 + Math.random() * distance*2/3,
        rotateY: 2 * Math.PI * Math.random(),
        scale: 0.1 + Math.random() * .2,
        fresnel: Math.random() * 0.25,
        ior: 1 + Math.random() * 0.1
      })
    }

    for (let i=0; i<maxTinyTree; i++) {
      tinyTrees.push({
        x: -distance/3 + Math.random() * distance*2/3,
        y: 0,
        z: -distance/3 + Math.random() * distance*2/3,
        rotateY: 2 * Math.PI * Math.random(),
        scale: 0.05 + Math.random() * .2,
        fresnel: Math.random() * 0.25,
        ior: 1 + Math.random() * .1
      })
    }

    for (let i=0; i<maxTrunk; i++) {
      trunks.push({
        x: -distance/3 + Math.random() * distance*2/3,
        y: 0,
        z: -distance/3 + Math.random() * distance*2/3,
        rotateY: 2 * Math.PI * Math.random(),
        scale: 0.1 + Math.random() * .1
      })
    }

    return {
      trees,
      fatTrees,
      tinyTrees,
      trunks
    }
  }, [isMobile])

  return (
    <CubeCamera resolution={256} frames={1} envMap={texture}>
      {(texture) => {

        return (
          <Suspense>
            {trees.map((t, i) => (
              <group key={i} >
                <motion.mesh
                  initial={{ scale: 0, x: t.x, y: t.y, z: t.z, rotateY: t.rotateY }}
                  animate={{ scale: t.scale }}
                  geometry={(nodes.Cylinder001 as Mesh).geometry}>
                  <MeshRefractionMaterial envMap={texture} {...config} fresnel={t.fresnel} ior={t.ior} toneMapped={false} />
                </motion.mesh>
                <motion.mesh 
                  initial={{ scale: 0}}
                  animate={{ scale: t.scale }}
                  position={[t.x, t.y, t.z]}
                  material={(nodes.Cylinder001_1 as Mesh).material}
                  geometry={(nodes.Cylinder001_1 as Mesh).geometry} />
              </group>
            ))}

            {fatTrees.map((t, i) => (
              <group key={i} >
                <motion.mesh
                  initial={{ scale: 0, x: t.x, y: t.y, z: t.z, rotateY: t.rotateY }}
                  animate={{ scale: t.scale }}
                  geometry={(fat_nodes.Cylinder as Mesh).geometry}>
                  <MeshRefractionMaterial envMap={texture} {...config} fresnel={t.fresnel} ior={t.ior} toneMapped={false} />
                </motion.mesh>
                <motion.mesh 
                  initial={{ scale: 0}}
                  animate={{ scale: t.scale }}
                  position={[t.x, t.y, t.z]}
                  material={(fat_nodes.Cylinder_1 as Mesh).material}
                  geometry={(fat_nodes.Cylinder_1 as Mesh).geometry} />
              </group>
            ))}

            {tinyTrees.map((t, i) => (
              <group key={i} >
                <motion.mesh
                  initial={{ scale: 0, x: t.x, y: t.y, z: t.z, rotateY: t.rotateY }}
                  animate={{ scale: t.scale }}
                  geometry={(tiny_nodes.Cylinder006 as Mesh).geometry}>
                  <MeshRefractionMaterial envMap={texture} {...config} fresnel={t.fresnel} ior={t.ior} toneMapped={false} />
                </motion.mesh>
                <motion.mesh 
                  initial={{ scale: 0}}
                  animate={{ scale: t.scale }}
                  position={[t.x, t.y, t.z]}
                  material={(tiny_nodes.Cylinder006_1 as Mesh).material}
                  geometry={(tiny_nodes.Cylinder006_1 as Mesh).geometry} />
              </group>
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
          </Suspense>
        )
      }}
    </CubeCamera>
  )
}