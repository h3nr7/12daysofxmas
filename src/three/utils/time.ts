import { MathUtils } from "three/webgpu";

const { lerp } = MathUtils

export function randomTiming(maxTime: number = 3.3, maxDelay: number = 1.2) {
  return {
    duration: maxTime * lerp(0, 1, Math.random()),
    delay: maxDelay * lerp(0, 1, Math.random())
  }
}