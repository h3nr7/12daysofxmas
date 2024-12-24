
import { AnimatePresence, motion as reactmo, usePresence } from 'framer-motion'
import Diamond from '../../components/Diamond/Diamond'
import Forest from '../../components/Forest/Forest'
import { useLocation } from 'react-router'
import { useEffect, useState, useTransition } from 'react'
import { useFiberStore } from '../../../stores/fiberStore'
import { CatmullRomCurve3, MathUtils, Vector3 } from 'three'
import { Stars, Trail } from '@react-three/drei'
import { motion } from 'framer-motion-3d'
import { useLoader } from '@react-three/fiber'
import { RGBELoader } from 'three/examples/jsm/Addons.js'

const PATH = '/'

export default function Zero() {

  const { pathname } = useLocation()
  const { setCamera, setEffect } = useFiberStore()
  const [visible, setVisible] = useState(pathname === PATH)

  useEffect(() => {
    if(pathname === PATH) {
      setVisible(true)
      setCamera({ 
        enabled: true, 
        maxPolarAngle: MathUtils.degToRad(80),
        position: [2.5, 2.5, 2.5],
        lookAt: [0, 1.8, 0]
      })
      setEffect({ tiltshift: true })
    } else {
      setVisible(false)
    }
  }, [pathname])

  const curve = [
    new CatmullRomCurve3([
      new Vector3( -7.5, 0.5, 0 ),
      new Vector3( 0, 2.0, -7.5 ),
      new Vector3( .7, 0.5, 0 ),
      new Vector3( 0, 0.67, .5 ),
    ], true),
    new CatmullRomCurve3([
      new Vector3( -.5, 1.8, 0 ),
      new Vector3( 0, 1.8, -.5 ),
      new Vector3( .7, 1.8, 0 ),
      new Vector3( 0, 2.0, .5 ),
    ], true),
    new CatmullRomCurve3([
      new Vector3( .5, 1.8, 0 ),
      new Vector3( 0, 2.0, .5 ),
      new Vector3( -.7, 1.8, 0 ),
      new Vector3( 0, 1.8, -.5 ),
    ], true),
  ]

  const curvePoints = curve.map(c => c.getPoints(50))

  const texture = useLoader(RGBELoader, 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr')

  return (
      <>
        <color attach="background" args={["#310000"]} />
        <Diamond visible={visible} position={[0, 1.8, 0]}/>
        <Forest visible={visible}/>
        <Stars radius={200} depth={10} count={1500} factor={4} saturation={10} fade speed={1} />
        {/* If `target` is not defined, Trail will use the first `Object3D` child as the target. */}
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
      </>
  )
}