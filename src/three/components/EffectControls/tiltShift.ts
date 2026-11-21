import { abs, mix, screenUV, smoothstep, uniform, vec2 } from 'three/tsl'
import { gaussianBlur } from 'three/examples/jsm/tsl/display/GaussianBlurNode.js'
import type { Node } from 'three/webgpu'
import { lineNormalAndOffset, type UvPoint } from './tiltShiftMath'

export interface TiltShiftOptions {
  /** One end of the sharp line, in uv space. */
  start?: UvPoint
  /** The other end of the sharp line, in uv space. */
  end?: UvPoint
  /** Distance from the line, in uv units, over which the blur fades in. */
  taper?: number
  /** The gaussian kernel; wider is blurrier. */
  sigma?: number
}

/**
 * Tilt-shift as a TSL effect: `node` sharp along the line through `start`
 * and `end` (uv space, origin bottom-left), blending into its gaussian blur
 * with distance from that line.
 */
export function tiltShift(
  node: Node<'vec4'>,
  { start = [0.01, 0.01], end = [1, 1], taper = 0.1, sigma = 3 }: TiltShiftOptions = {},
): Node<'vec4'> {
  // gaussianBlur renders `node` to a texture itself (convertToTexture).
  const blurred = gaussianBlur(node, vec2(1, 1), sigma)
  const { nx, ny, c } = lineNormalAndOffset(start, end)
  // `start` and `end` are in texture uv space (origin bottom-left, as the old
  // effect took them); screenUV's origin is top-left, so y is flipped here.
  const y = screenUV.y.oneMinus()
  const distance = abs(screenUV.x.mul(uniform(nx)).add(y.mul(uniform(ny))).add(uniform(c)))
  const mask = smoothstep(0, taper, distance)
  return mix(node, blurred, mask)
}
