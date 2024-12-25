import { useGLTF } from "@react-three/drei"
import { RigidBody, CuboidCollider} from "@react-three/rapier"
import { useEffect, useMemo } from "react"
import { DoubleSide, Euler, FrontSide, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, Scene } from "three"

interface IGift {
  visible?: boolean
  scale?: number,
  position?: Vec3
}

export function Gift({
  visible,
  scale = 0.1,
  position
}:IGift) {

  const { nodes } = useGLTF("giftbox.glb")

  const scene = useMemo(() => {
    const s = nodes['Scene'] as Scene

    const meshes = (s.children as Mesh[]).map(m => {
      if(m.name !== 'box') {
        m.material = new MeshStandardMaterial({ 
          color: 'rgb(167, 9, 9)',
          side: DoubleSide,
          roughness: 0
        })
      } else {
        m.material = new MeshStandardMaterial({ 
          color: 'rgb(206, 206, 206)',
          side: FrontSide,
          roughness: 1
        })
      }
      return m
    })

    s.children = meshes
    return s
  }, [nodes])

  return visible && nodes && (
    <RigidBody scale={scale} type="dynamic" colliders="hull" position={position} rotation={new Euler(.2, 1.2, 0)}>
      {/* <CuboidCollider key={`collider_0`} args={[scale, scale, scale]}/> */}
      {/* <CuboidCollider key={`collider_1`} args={[0.5, 0.5, 0.5]} position={[0,0,0]}/> */}
      <mesh 
        key={`primitive_0`}
        position={(scene.children[0] as Mesh).position}
        rotation={(scene.children[0] as Mesh).rotation}
        geometry={(scene.children[0] as Mesh).geometry} 
        material={(scene.children[0] as Mesh).material} 
      />
      <mesh 
        key={`primitive_1`}
        scale={(scene.children[1] as Mesh).scale}
        position={(scene.children[1] as Mesh).position}
        rotation={(scene.children[1] as Mesh).rotation}
        geometry={(scene.children[1] as Mesh).geometry} 
        material={(scene.children[1] as Mesh).material} 
      />
      <mesh 
        key={`primitive_2`}
        scale={(scene.children[2] as Mesh).scale}
        position={(scene.children[2] as Mesh).position}
        rotation={(scene.children[2] as Mesh).rotation}
        geometry={(scene.children[2] as Mesh).geometry} 
        material={(scene.children[2] as Mesh).material} 
      />
      <mesh 
        key={`primitive_3`}
        scale={(scene.children[3] as Mesh).scale}
        position={(scene.children[3] as Mesh).position}
        rotation={(scene.children[3] as Mesh).rotation}
        geometry={(scene.children[3] as Mesh).geometry} 
        material={(scene.children[3] as Mesh).material} 
      />
      <mesh 
        key={`primitive_4`}
        scale={(scene.children[4] as Mesh).scale}
        position={(scene.children[4] as Mesh).position}
        geometry={(scene.children[4] as Mesh).geometry} 
        material={(scene.children[4] as Mesh).material} 
      />
    </RigidBody>
  )
}