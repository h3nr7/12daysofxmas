// Not in the WebGPU build; this file goes with the old boids (H3N-94).
import type { IUniform } from "three/src/renderers/shaders/UniformsLib.js";
import { GPUComputationRenderer, Variable } from "three/examples/jsm/misc/GPUComputationRenderer.js";

export interface BoidsProps {
  separationDistance?: number
  alignmentDistance?: number
  cohesionDistance?: number
  freedomFactor?: number
  preyRadius?: number
  predator?: [number, number, number]
  pause?: boolean
  countSquare?: number
}

export interface BoidsGltfProps {
  size?: number
  pause?:boolean
  rotation?: [number, number, number]
  url: string
}

export type BoidsUniform = { [uniform: string]: IUniform }

export interface IBoidsCtx {
  computationRenderer?: GPUComputationRenderer
  velocityVariable?: Variable
  positionVariable?: Variable
  velocityUniform?: BoidsUniform
  positionUniform?: BoidsUniform
}