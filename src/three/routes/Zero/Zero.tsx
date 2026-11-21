
import Diamond from '../../components/Diamond/Diamond'
import Forest from '../../components/Forest/Forest'
import { useLocation } from 'react-router'
import { useEffect } from 'react'
import { useFiberStore } from '../../../stores/fiberStore'
import { MathUtils } from 'three/webgpu'
import { OrbitalTrails } from '../../components/OrbitalTrails/OrbitalTrails'

const PATH = '/'

export default function Zero() {

  const { pathname } = useLocation()
  const { setCamera, setEffect } = useFiberStore()
  const visible = pathname === PATH

  useEffect(() => {
    if(visible) {
      setCamera({ 
        enabled: true, 
        maxPolarAngle: MathUtils.degToRad(80),
        localPosition: [2.5, 2.5, 2.5],
        worldLookAt: [0, 1.8, 0]
      })
      setEffect({
        tiltshift: true
      })
    }
  }, [visible, setCamera, setEffect])

  return (
      <>
        <Diamond visible={visible} position={[0, 1.8, 0]}/>
        <Forest visible={visible}/>
        <OrbitalTrails visible={visible} center={[0, 1.8, 0]} />
      </>
  )
}