import { EffectComposer, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";


export function EffectControls() {

  return (
    <>    
      <EffectComposer>
        <Noise premultiply blendFunction={BlendFunction.ADD} />
      </EffectComposer>
      <fogExp2 attach="fog" color="#666666" density={1} />
    </>
  )
}