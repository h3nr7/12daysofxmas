import { Bloom, EffectComposer, Noise, ToneMapping } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { Tiltshift } from "./components/Tiltshift";
import { useFiberStore } from "../../../stores/fiberStore";
import { UNIVERSE_BG_COLOR } from "../../../helpers/constants";
import { useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";


export function EffectControls() {

  const { data: {
    effect: {
      fogDensity,
      bloomIntensity,
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
      <fogExp2 attach="fog" color={UNIVERSE_BG_COLOR} density={0.15} />
    </>
  )
}