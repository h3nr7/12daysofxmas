import { Bloom, EffectComposer, Noise, ToneMapping } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { Tiltshift } from "./components/Tiltshift";
import { useFiberStore } from "../../../stores/fiberStore";
import { UNIVERSE_BG_COLOR } from "../../../helpers/constants";


export function EffectControls() {

  const { data: {
    effect: {
      fog,
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
      {fog && <fogExp2 attach="fog" color={UNIVERSE_BG_COLOR} density={0.2} />}
    </>
  )
}