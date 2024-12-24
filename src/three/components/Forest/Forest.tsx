import { CubeCamera, MeshRefractionMaterial, useGLTF } from '@react-three/drei'
import { MeshProps, useLoader } from '@react-three/fiber'
import { motion,  } from 'framer-motion-3d'
import { PropsWithChildren, Suspense, useEffect, useMemo, useRef } from 'react'
import { Mesh, MeshBasicMaterial } from 'three'
import { RGBELoader } from 'three/examples/jsm/Addons.js'
import { useMobile } from '../../../hooks/isMobile'
import { Tree } from './Tree'
import { lerp, mapLinear } from 'three/src/math/MathUtils.js'
import { AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router'

interface IForest {
  visible?: boolean
}

function randomDistance(diameter: number) {
  return {
    x: diameter * lerp(-.5, .5, Math.random()),
    z: diameter * lerp(-.5, .5, Math.random())
  }
}

function randomTiming(maxTime: number = 3.3, maxDelay: number = 1.2) {
  return {
    duration: maxTime * lerp(0, 1, Math.random()),
    delay: maxDelay * lerp(0, 1, Math.random())
  }
}

export default function Forest({ visible }: PropsWithChildren<IForest>) {

  const isMobile = useMobile()
  const { maxTree, maxFatTree, maxTinyTree, maxTrunk, distance } = useMemo(() => isMobile === true || isMobile === undefined ? {
    maxTree: 40, 
    maxFatTree: 25, 
    maxTinyTree: 30, 
    maxTrunk: 15, 
    distance: 5.0
  } : {
    maxTree: 250, 
    maxFatTree: 100, 
    maxTinyTree: 50, 
    maxTrunk: 50, 
    distance: 9.0
  }, [isMobile])

  const {trees, fatTrees, tinyTrees, trunks} = useMemo(() => {
    const trees:Record<string, any>[] = []
    const fatTrees:Record<string, any>[] = []
    const tinyTrees:Record<string, any>[] = []
    const trunks:Record<string, any>[] = []

    for (let i=0; i<maxTree; i++) {
      const {x, z} = randomDistance(distance)
      trees.push({
        x,
        y: 0,
        z,
        rotateY: 2 * Math.PI * Math.random(),
        scale: 0.05 + Math.random() * .2,
        transition: randomTiming()
      })
    }

    for (let i=0; i<maxFatTree; i++) {
      const {x, z} = randomDistance(distance)
      fatTrees.push({
        x,
        y: 0,
        z,
        rotateY: 2 * Math.PI * Math.random(),
        scale: 0.1 + Math.random() * .2,
        transition: randomTiming()
      })
    }

    for (let i=0; i<maxTinyTree; i++) {
      const {x, z} = randomDistance(distance)
      tinyTrees.push({
        x,
        y: 0,
        z,
        rotateY: 2 * Math.PI * Math.random(),
        scale: 0.05 + Math.random() * .2,
        transition: randomTiming()
      })
    }

    for (let i=0; i<maxTrunk; i++) {
      const {x, z} = randomDistance(distance)
      trunks.push({
        x,
        y: 0,
        z,
        rotateY: 2 * Math.PI * Math.random(),
        scale: 0.1 + Math.random() * .1,
        transition: randomTiming()
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
    <>
      {trees.map((t, i) => (
        <Tree 
          visible={visible}
          type="normal"
          key={`normal_${i}`}
          position={[t.x, t.y, t.z]}
          transition={{duration: t.duration}}
          initial={{ scale: 0, rotateY: t.rotateY }}
          animate={{ scale: t.scale }}
        />
      ))}

      {fatTrees.map((t, i) => (
        <Tree 
          visible={visible}
          type="fat"
          key={`fat_${i}`}
          position={[t.x, t.y, t.z]}
          transition={t.transition}
          initial={{ scale: 0, rotateY: t.rotateY }}
          animate={{ scale: t.scale }}
        />
      ))}

      {tinyTrees.map((t, i) => (
        <Tree 
          visible={visible}
          type="tiny"
          key={`tiny_${i}`}
          position={[t.x, t.y, t.z]}
          transition={t.transition}
          initial={{ scale: 0, rotateY: t.rotateY }}
          animate={{ scale: t.scale }}
        />
      ))}

      {trunks.map((t, i) => (
        <Tree 
          visible={visible}
          type="trunk"
          key={`trunk_${i}`}
          position={[t.x, t.y, t.z]}
          transition={t.transition}
          initial={{ scale: 0, rotateY: t.rotateY }}
          animate={{ scale: t.scale }}
        />
      ))}
    </>
  )
}