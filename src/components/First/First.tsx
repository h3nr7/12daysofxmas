import { useNavigate } from "react-router";
import { uitunnel, r3ftunnel } from '../../helpers/tunnelling'
import { motion } from 'framer-motion-3d'
import { Color } from "three";
import { useDateTime } from "../../hooks/dateTime";
import { useEffect } from "react";
import { useFiberStore } from "../../stores/fiberStore";
function UI() {
  return (
    <uitunnel.In>
      <h1>First</h1>
      </uitunnel.In>
  )
}

function R3F() {

  const navi = useNavigate();
  const { setCamera } = useFiberStore()

  useEffect(() => setCamera({enabled: false}), [])

  return (
    <>
      <r3ftunnel.In>
        <motion.mesh
          position={[1.2, 0, 0]}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onHoverStart={() => console.log('hover start')}
          onAnimationComplete={() => console.log('anim complete')}
          onTap={() => navi('/second')}
        >
          <sphereGeometry />
          <meshBasicMaterial color={new Color(0xff00ff)} />
        </motion.mesh>
      </r3ftunnel.In>
    </>
  )
}


export default function First() {
  return (
    <>
      <UI />
      <R3F />
    </>
  )
}