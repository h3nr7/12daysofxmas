import { Bloom, EffectComposer, Noise, ToneMapping } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { Tiltshift } from "./components/Tiltshift";
import { useFiberStore } from "../../../stores/fiberStore";
import { UNIVERSE_BG_COLOR } from "../../../helpers/constants";


export function EffectControls() {

  const { data: {
    effect: {
      noise,
      tiltshift
    }
  } } = useFiberStore()


  return (
    <>    
      <EffectComposer>
        <Bloom luminanceThreshold={1} intensity={15} levels={9} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        {noise ? <Noise premultiply blendFunction={BlendFunction.DARKEN} /> : <></>}
        {tiltshift ? <Tiltshift /> : <></>}
      </EffectComposer>
      <fogExp2 attach="fog" args={[UNIVERSE_BG_COLOR, 0.15]} />
    </>
  )
}