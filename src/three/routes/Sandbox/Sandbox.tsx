import { useEffect } from "react"
import { useLocation } from "react-router"
import { useFiberStore } from "../../../stores/fiberStore"
import { Boids } from "../../components/Boids"
import { BoidsGltf } from "../../components/Boids/BoidsGltf"
const PATH = '/sandbox'

const camPosition :Vec3 = [300, 300, 300]
const sceneCenter:Vec3 = [0, 0, 0]

export function Sandbox() {

  const { pathname } = useLocation()
  const { setCamera, setEffect } = useFiberStore()
  const visible = pathname === PATH


  // useEffect(() => {
  //   if(!ref?.current) return
  //   const gesture = new MoveGesture(ref.current, ({ active, movement: [x, y] }) => {
  //     console.log(active, x, y)
  //     setMovement([x/width * 2 - 1, 0.0, y/height * 2 - 1])
  //   })
    

  //   return () => gesture.destroy()
  // }, [ref?.current])

  // const vec = new Vector3()
  // const p = useMemo(() => {
  //   vec.set(movement[0], 0.0, movement[1])
  //   vec.unproject(activeCam)
  //   console.log(movement)
  //   if(spRef) {
  //     spRef.current?.position.copy(vec)
  //   }
  //   return [vec.x, vec.y, vec.z] as [number, number,  number]
  // },[movement])


  useEffect(() => {
    if(visible) {
      setCamera({
        isDefault: false,
        enabled: false,
        localPosition: camPosition,
        worldLookAt: sceneCenter
      })
      setEffect({
        noise: false,
        tiltshift: false
      })
    }
  }, [visible, setCamera, setEffect])

  return (
    <>
      {visible && (
        <>
          {/* <mesh position={[0,0,0]}>
            <simpleBirdGeometry scale={0.1}/>
            <meshBasicMaterial color='white' />
          </mesh> */}
          <Boids 
          // countSquare={8}
          // predator={p}
          preyRadius={100}
          separationDistance={0.1}
          alignmentDistance={0.1}
          cohesionDistance={0.1}
          freedomFactor={0.1}>
            {/* <BoidsSimple /> */}
            <BoidsGltf url="/Parrot.glb" size={0.1}/>
          </Boids>
        </>
      )}
    </>
  )
}