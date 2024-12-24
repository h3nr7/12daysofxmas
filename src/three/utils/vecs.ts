import { CatmullRomCurve3, Vector3, CurveType } from "three";
import { lerp } from "three/src/math/MathUtils.js";

export function randomDistance(diameter: number) {
  return {
    x: diameter * lerp(-.5, .5, Math.random()),
    z: diameter * lerp(-.5, .5, Math.random())
  }
}

export function randomOrbit(
  center: Vector3 = new Vector3(),
  radius: number = 1
):CatmullRomCurve3 {
  // Create a unit plane with two vectors
  const a0 = center.clone().randomDirection()
  const b0 = center.clone().randomDirection()
  // calculate normal of plane
  const norm = new Vector3().crossVectors(a0, b0)
  // rotate in 4 to create control points for curve

  const a1 = a0.clone().applyAxisAngle(norm, Math.PI/2)
  const a2 = a0.clone().negate()
  const a3 = a0.clone().applyAxisAngle(norm, -Math.PI/2)

  a0.setLength(radius * Math.random()).add(center)
  a1.setLength(radius * Math.random()).add(center)
  a2.setLength(radius * Math.random()).add(center)
  a3.setLength(radius * Math.random()).add(center)

  return new CatmullRomCurve3([
    a0, a1, a2, a3
  ], true, 'catmullrom')
  
}