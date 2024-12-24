import { PropsWithChildren, useMemo } from "react";
import { CatmullRomCurve3, Vector3 } from "three";
import { motion } from 'framer-motion-3d'
import { Trail } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { RGBELoader } from "three/examples/jsm/Addons.js";
interface IProps {
  visible?: boolean
  numParticles?: number
  numCurvePoints?: number
}

export function OrbitalTrails({
  visible = false,
  numParticles = 20,
  numCurvePoints = 50
}: IProps) {

  const [curves, curvePoints] = useMemo(() => {

    const curves = [], curvePoints = []
    for(let i=0; i<numParticles; i++) {

      const c = new CatmullRomCurve3([
        new Vector3(
          Math.random() * -7.5,
          Math.random() * 0.5, 
          Math.random() * 0 
        )
      ], true)

      curves.push(c)
      curvePoints.push(c.getPoints(numCurvePoints))
    }

    return [curves, curvePoints]

  }, [numParticles])

  const texture = useLoader(RGBELoader, 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr')

  return (
    <motion.group>
      {curvePoints.map(c => (
        <Trail
          width={0.05} // Width of the line
          color={'white'} // Color of the line
          length={5} // Length of the line
          decay={1} // How fast the line fades away
          local={false} // Wether to use the target's world or local positions
          stride={0} // Min distance between previous and current point
          interval={1} // Number of frames to wait before next calculation
          target={undefined} // Optional target. This object will produce the trail.
          attenuation={(width) => width} // A function to define the width in each point along it.
        >
          <motion.mesh
            transition={{ duration: 5, repeat: Infinity }}
            initial={{ x: 0, y: 0, z: 0 }}
            animate={{ x: c.map(p => p.x), y: c.map(p => p.y), z: c.map(p => p.z) }}
          >
            <sphereGeometry args={[0.01]} />
            <meshBasicMaterial envMap={texture} color={'white'}/>
          </motion.mesh>
        </Trail>
      ))}
    </motion.group>
  )
}