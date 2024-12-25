import { PropsWithChildren, useMemo } from "react";
import { CatmullRomCurve3, Vector3 } from "three";
import { motion } from 'framer-motion-3d'
import { Trail } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { RGBELoader } from "three/examples/jsm/Addons.js";
import { AnimatePresence } from "framer-motion";
import { randomOrbit } from "../../utils/vecs";
interface IProps {
  visible?: boolean
  center?: Vector3 | [number, number, number]
  maxRadius?: number
  numParticles?: number
  numCurvePoints?: number
}

export function OrbitalTrails({
  visible = false,
  center = new Vector3(),
  maxRadius = 5,
  numParticles = 20,
  numCurvePoints = 50
}: IProps) {

  const [curves, curvePoints] = useMemo(() => {

    if(!(center instanceof Vector3)) center = new Vector3(...center)

    const curves = [], curvePoints = []
    for(let i=0; i<numParticles; i++) {

      const c = randomOrbit(center, maxRadius)

      curves.push(c)
      curvePoints.push(c.getPoints(numCurvePoints))
    }

    return [curves, curvePoints]

  }, [numParticles])

  const texture = useLoader(RGBELoader, 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr')

  return (
    <>
      {curvePoints.map((c, i) => (
        <AnimatePresence key={`orbital_trail_group_${i}`}>
        {visible && (
          <motion.group
            transition={{duration: 1.25, delay: 1}}
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0, transition: { duration: 1.05 }}}
          >
            <Trail
              width={0.05} // Width of the line
              color={'rgb(198, 198, 198)'} // Color of the line
              length={5} // Length of the line
              decay={2} // How fast the line fades away
              local={false} // Wether to use the target's world or local positions
              stride={0} // Min distance between previous and current point
              interval={1} // Number of frames to wait before next calculation
              target={undefined} // Optional target. This object will produce the trail.
              attenuation={(width) => width} // A function to define the width in each point along it.
            >
              <motion.mesh
                initial={{ x: 0, y: -10, z: 0 }}
                animate={{ 
                  x: c.map(p => p.x), y: c.map(p => p.y), z: c.map(p => p.z),
                  transition: {
                    duration: 8,
                    repeat: Infinity
                  } 
                }}
                exit={{ 
                  x: 0, y: 1.8, z: 0, 
                  transition: {
                    duration: 1.2
                  }  
                }}
              >
                <sphereGeometry args={[0.01]} />
                <meshBasicMaterial envMap={texture} color={'white'}/>
              </motion.mesh>
            </Trail>
          </motion.group>
        )}
        </AnimatePresence>
      ))}
    </>
  )
}