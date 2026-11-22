import { PropsWithChildren, useMemo } from "react";
import { SpriteNodeMaterial } from "three/webgpu";
import { uniform, uv, vec4 } from "three/tsl";

interface ISatellite {
  visible?: boolean
}

// Unmounted everywhere, as it was before the move to WebGPU; it is kept so
// no GLSL remains in the project (H3N-96). The old version drew a sized point
// through a ShaderMaterial. WebGPU draws point primitives at one pixel, so it
// is now one sprite, the same way Stars draws: a plane with a
// SpriteNodeMaterial, its size from uSize in world units.
export function Satellite({
  children,
  visible
}: PropsWithChildren<ISatellite>) {

  const material = useMemo(() => {
    const material = new SpriteNodeMaterial()
    const uSize = uniform(0.4)
    material.scaleNode = uSize
    material.colorNode = vec4(uv(), 1, 1)
    return material
  }, [])

  return visible && (
    <mesh>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
      {children}
    </mesh>
  )
}
