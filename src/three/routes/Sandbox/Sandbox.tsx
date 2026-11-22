import { useEffect } from "react"
import { useLocation } from "react-router"
import { useFiberStore } from "../../../stores/fiberStore"
import { BOID_SCALE, Boids, BoidsParrot } from "../../components/Boids"
const PATH = '/sandbox'

// Close enough to see a flock a few world units across (BOID_SCALE); the
// old 300-unit stand-off was for the old boid space.
const camPosition :Vec3 = [5, 0, 5]
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
        <group position={sceneCenter} scale={BOID_SCALE}>
          <Boids count={256} preyRadius={100}>
            <BoidsParrot url="/Parrot.glb" size={0.15} />
          </Boids>
        </group>
      )}
    </>
  )
}
