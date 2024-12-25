import { useGLTF } from "@react-three/drei";
import { BallCollider, CylinderCollider, RigidBody } from "@react-three/rapier";
import { MathUtils, Mesh, MeshLambertMaterial, MeshStandardMaterial, SphereGeometry } from "three";

interface IBauble {
  scale?: number
  position?: Vec3
}

export function Bauble({
  scale = 1,
  position = [0,0,0]
}: IBauble) {

  const { nodes } = useGLTF("cap.glb")
  const node_mesh = nodes.Mesh_1 as Mesh
  
  const baubleMaterial = new MeshLambertMaterial({ color: "#c0a0a0", emissive: "red" })
  const capMaterial = new MeshStandardMaterial({ metalness: 0.75, roughness: 0.15, color: "#8a492f", emissive: "#600000", envMapIntensity: 20 })
  const sphereGeometry = new SphereGeometry(1, 28, 28)

  const r = MathUtils.randFloatSpread

  return (
    <RigidBody position={position} colliders={false}>
      <BallCollider args={[scale]} />
      <CylinderCollider rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1.2 * scale]} args={[0.15 * scale, 0.275 * scale]} />
      <mesh castShadow receiveShadow scale={scale} geometry={sphereGeometry} material={baubleMaterial} />
      <mesh castShadow scale={2.5 * scale} position={[0, 0, -1.8 * scale]} geometry={node_mesh.geometry} material={capMaterial} />
    </RigidBody>
  )
}