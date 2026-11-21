import { PropsWithChildren, useMemo } from 'react'
import { useMobile } from '../../../hooks/isMobile'
import { Tree } from './Tree'
import { randomDistance } from '../../utils/vecs'
import { randomTiming } from '../../utils/time'
import { Timing } from '../../utils/useEnterExit'

interface IForest {
  visible?: boolean
}

interface TreeSpec {
  x: number
  y: number
  z: number
  rotateY: number
  scale: number
  timing: Timing
}

// Normal trees grow with a plain 0.3 s tween and no delay. They used to be
// given `{ duration: t.duration }`, a field that was never set, which
// framer-motion treated as its 0.3 s default. Kept as it was.
const NORMAL_TREE_TIMING: Timing = {}

/**
 * A randomly placed group of trees. The layout is random on purpose and is
 * made once per forest size (see the useMemo below).
 */
function plantTrees(count: number, distance: number, minScale: number, scaleRange: number): TreeSpec[] {
  const trees: TreeSpec[] = []
  for (let i = 0; i < count; i++) {
    const { x, z } = randomDistance(distance)
    trees.push({
      x,
      y: 0,
      z,
      rotateY: 2 * Math.PI * Math.random(),
      scale: minScale + Math.random() * scaleRange,
      timing: randomTiming(),
    })
  }
  return trees
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

  const {trees, fatTrees, tinyTrees, trunks} = useMemo(() => ({
    trees: plantTrees(maxTree, distance, 0.05, 0.2),
    fatTrees: plantTrees(maxFatTree, distance, 0.1, 0.2),
    tinyTrees: plantTrees(maxTinyTree, distance, 0.05, 0.2),
    trunks: plantTrees(maxTrunk, distance, 0.1, 0.1),
  }), [maxTree, maxFatTree, maxTinyTree, maxTrunk, distance])

  return (
    <>
      {trees.map((t, i) => (
        <Tree
          visible={visible}
          type="normal"
          key={`normal_${i}`}
          position={[t.x, t.y, t.z]}
          rotateY={t.rotateY}
          scale={t.scale}
          timing={NORMAL_TREE_TIMING}
        />
      ))}

      {fatTrees.map((t, i) => (
        <Tree
          visible={visible}
          type="fat"
          key={`fat_${i}`}
          position={[t.x, t.y, t.z]}
          rotateY={t.rotateY}
          scale={t.scale}
          timing={t.timing}
        />
      ))}

      {tinyTrees.map((t, i) => (
        <Tree
          visible={visible}
          type="tiny"
          key={`tiny_${i}`}
          position={[t.x, t.y, t.z]}
          rotateY={t.rotateY}
          scale={t.scale}
          timing={t.timing}
        />
      ))}

      {trunks.map((t, i) => (
        <Tree
          visible={visible}
          type="trunk"
          key={`trunk_${i}`}
          position={[t.x, t.y, t.z]}
          rotateY={t.rotateY}
          scale={t.scale}
          timing={t.timing}
        />
      ))}
    </>
  )
}
