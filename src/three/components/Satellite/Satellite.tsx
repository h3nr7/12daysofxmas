import { PropsWithChildren } from "react";
import { ShaderMaterial, Uniform, Vector2 } from "three";
import orbit_vs from '../../shaders/particles/orbit-vert.glsl'
import orbit_fs from '../../shaders/particles/orbit-frag.glsl'

interface ISatellite {
  visible?: boolean
}

export function Satellite({
  children,
  visible
}: PropsWithChildren<ISatellite>) {

  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

  const material = new ShaderMaterial({
    vertexShader: orbit_vs,
    fragmentShader: orbit_fs,
    uniforms:
    {
        uSize: new Uniform(0.4),
        uResolution: new Uniform(new Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio))
    },
  })

  return visible && (
    <points material={material}>
      {children}
    </points>
  )
}