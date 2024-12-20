import { Bloom, EffectComposer, Noise, ToneMapping } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";


export function EffectControls() {

  return (
    <>    
      <EffectComposer>
        <Bloom luminanceThreshold={1} intensity={15} levels={9} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Noise premultiply blendFunction={BlendFunction.DARKEN} />
      </EffectComposer>
      <fogExp2 attach="fog" color="#000000" density={0.3} />
    </>
  )
}