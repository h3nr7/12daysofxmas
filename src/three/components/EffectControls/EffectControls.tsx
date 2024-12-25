import { Bloom, EffectComposer, Noise, ToneMapping } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { Tiltshift } from "./components/Tiltshift";
import { useFiberStore } from "../../../stores/fiberStore";


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
        {/* {noise ? <Noise premultiply blendFunction={BlendFunction.DARKEN} /> : <></>} */}
        {tiltshift ? <Tiltshift /> : <></>}
      </EffectComposer>
      {fog && <fogExp2 attach="fog" color="#310000" density={0.2} />}
    </>
  )
}