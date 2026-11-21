import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { RenderPipeline } from "three/webgpu"
import { float, pass } from "three/tsl"
import BloomNode, { bloom } from "three/examples/jsm/tsl/display/BloomNode.js"
import { film } from "three/examples/jsm/tsl/display/FilmNode.js"
import GaussianBlurNode from "three/examples/jsm/tsl/display/GaussianBlurNode.js"
import { useFiberStore } from "../../../stores/fiberStore"
import { useWebGPURenderer } from "../../webgpu-canvas/WebGPUCanvas"
import { tiltShift } from "./tiltShift"

/**
 * The scene through three's node post-processing: bloom always, then the
 * tilt-shift and the grain the store switches on. Tone mapping (ACES, set on
 * the renderer in ThreeView) and the colour space come from the pipeline's
 * default output transform.
 *
 * Rendering at priority 1 tells R3F to stop rendering itself, so the scene
 * is drawn once, by the pipeline.
 */
export function PostFX() {
  const renderer = useWebGPURenderer()
  const scene = useThree(state => state.scene)
  // CamControls swaps the default camera through `set({ camera })`, so the
  // pass is rebuilt when the camera changes.
  const camera = useThree(state => state.camera)
  const noise = useFiberStore(state => state.data.effect.noise)
  const tiltshift = useFiberStore(state => state.data.effect.tiltshift)

  // In a ref, not a memo: the effect chain is written onto it later.
  const pipelineRef = useRef<RenderPipeline | null>(null)
  useEffect(() => {
    const pipeline = new RenderPipeline(renderer)
    pipelineRef.current = pipeline
    return () => {
      pipelineRef.current = null
      pipeline.dispose()
    }
  }, [renderer])

  const scenePass = useMemo(() => pass(scene, camera), [scene, camera])
  useEffect(() => () => scenePass.dispose(), [scenePass])

  useEffect(() => {
    const pipeline = pipelineRef.current
    if (!pipeline) return
    const colour = scenePass.getTextureNode('output')
    let out = colour.add(bloom(colour, 1.5, 0.4, 1))
    if (tiltshift) out = tiltShift(out)
    pipeline.outputNode = noise ? film(out, float(0.15)) : out
    pipeline.needsUpdate = true
    return () => {
      // Bloom and the blur own render targets; free them when the chain changes.
      out.traverse(node => {
        if (node instanceof BloomNode || node instanceof GaussianBlurNode) node.dispose()
      })
    }
  }, [renderer, scenePass, noise, tiltshift])

  useFrame(() => pipelineRef.current?.render(), 1)

  return null
}
