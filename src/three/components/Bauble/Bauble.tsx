import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { BallCollider, CylinderCollider, RigidBody } from "@react-three/rapier";
import { useEffect, useRef } from "react";
import { MathUtils, Mesh, MeshLambertMaterial, MeshStandardMaterial, SphereGeometry, Vector3 } from "three";

interface IBauble {
  visible?: boolean
  scale?: number
  position?: Vec3
}

const URL = "cap.glb"

export function Bauble({
  visible = true,
  scale = 1,
  position = [0,0,0]
}: IBauble) {

  const { nodes } = useGLTF("cap.glb")
  const node_mesh = nodes.Mesh_1 as Mesh
  
  const baubleMaterial = new MeshLambertMaterial({ color: "#c0a0a0", emissive: "red" })
  const capMaterial = new MeshStandardMaterial({ metalness: 0.75, roughness: 0.15, color: "#8a492f", emissive: "#600000", envMapIntensity: 20 })
  const sphereGeometry = new SphereGeometry(1, 28, 28)

  const vec = new Vector3()

  const api = useRef<any>(null)
  useFrame((state, delta) => {
    if(!api.current) return
    delta = Math.min(0.1, delta)

    api.current.applyImpulse(
      vec
        .copy(api.current.translation())
        .normalize()
        .multiply({ x: -5 * delta * scale, y: -15 * delta * scale, z: -5 * delta * scale }),
    )
  })

  const r = MathUtils.randFloatSpread

  return visible && nodes && (
    <RigidBody position={position} colliders={false} ref={api}>
      <BallCollider args={[scale]} />
      <CylinderCollider rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1.2 * scale]} args={[0.15 * scale, 0.275 * scale]} />
      <mesh castShadow receiveShadow scale={scale} geometry={sphereGeometry} material={baubleMaterial} />
      <mesh castShadow scale={2.5 * scale} position={[0, 0, -1.8 * scale]} geometry={node_mesh.geometry} material={capMaterial} />
    </RigidBody>
  )
}