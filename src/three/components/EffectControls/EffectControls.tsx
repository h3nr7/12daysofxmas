import { EffectComposer, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";


export function EffectControls() {

  return (
    <>    
      <EffectComposer>
        <Noise premultiply blendFunction={BlendFunction.DARKEN} />
      </EffectComposer>
      <fogExp2 attach="fog" color="#000000" density={1} />
    </>
  )
}