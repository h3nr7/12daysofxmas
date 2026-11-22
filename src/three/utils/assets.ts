import { useLoader } from '@react-three/fiber'
import { DataTexture, DataTextureLoaderTexData, EquirectangularReflectionMapping, Texture } from 'three/webgpu'
import { HDRLoader } from 'three/examples/jsm/Addons.js'

// Environment map shared by the reflective materials. Served from public/
// so the scenes don't depend on a third-party download at runtime.
// Source: Poly Haven "Aerodynamics Workshop" 1k HDRI (CC0).
export const ENV_MAP_URL = '/aerodynamics_workshop_1k.hdr'

/**
 * An HDR (RGBE) loader whose textures come out ready to be an `envMap`: the
 * mapping is set in the load callback, before anyone renders with the
 * texture, rather than on the cached result during a render.
 */
class EnvMapLoader extends HDRLoader {
  load(
    url: string,
    onLoad?: (data: DataTexture, texData: DataTextureLoaderTexData) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (err: unknown) => void,
  ): DataTexture {
    return super.load(url, (texture, texData) => {
      texture.mapping = EquirectangularReflectionMapping
      onLoad?.(texture, texData)
    }, onProgress, onError)
  }
}

/**
 * The environment map, mapped as an equirectangular reflection. The loader
 * caches by URL, so every caller shares one texture, and no `CubeCamera`
 * pass is needed: the map reflects as it is.
 */
export function useEnvTexture(): Texture {
  return useLoader(EnvMapLoader, ENV_MAP_URL)
}
