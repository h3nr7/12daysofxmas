import { animated } from "@react-spring/three";
import { UNIVERSE_BG_COLOR } from "../../../helpers/constants";
import { useEnterExit } from "../../utils/useEnterExit";

export function Ground({ visible }:{ visible?: boolean }) {

  const transitions = useEnterExit(visible, {
    initial: { scale: 0 },
    animate: { scale: 1 },
    enter: { duration: .75 },
  })

  return transitions((style) => (
    <animated.mesh
      scale={style.scale}
      rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[7,16]}/>
      <meshBasicMaterial color={UNIVERSE_BG_COLOR}/>
    </animated.mesh>
  ))
}
