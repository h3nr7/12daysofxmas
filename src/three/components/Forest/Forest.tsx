import { PropsWithChildren, useMemo } from 'react'
import { useMobile } from '../../../hooks/isMobile'
import { Tree } from './Tree'
import { randomDistance } from '../../utils/vecs'
import { randomTiming } from '../../utils/time'

interface IForest {
  visible?: boolean
}

interface TreeSpec {
  x: number
  y: number
  z: number
  rotateY: number
  scale: number
  transition: { duration: number, delay: number }
  // Never set: normal trees read `duration` here and so get the default
  // duration. Kept as it is today.
  duration?: number
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
    const trees: TreeSpec[] = []
    const fatTrees: TreeSpec[] = []
    const tinyTrees: TreeSpec[] = []
    const trunks: TreeSpec[] = []

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
  }, [maxTree, maxFatTree, maxTinyTree, maxTrunk, distance])

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