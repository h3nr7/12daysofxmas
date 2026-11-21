import { useLocation } from "react-router";
import { useFiberStore } from "../../../stores/fiberStore";
import { useEffect, useMemo, useState } from "react";
import { BlockText } from "../../components/BlockText/BlockText";
import { Gift } from "../../components/Gift/Gift";
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import { generateUUID, lerp } from "three/src/math/MathUtils.js";
import { Bauble } from "../../components/Bauble/Bauble";

const PATH = '/first'
const MAX_ITEMS = 50
const GRAVITY: Vec3 = [0, -9.81, 0]

// Random drop positions above the ground. The scene is random on purpose and
// is re-made each time it is shown (see the useMemo below).
const dropPosition = (): Vec3 => [lerp(-1, 1, Math.random()), lerp(5, 10, Math.random()), lerp(-1, 1, Math.random())]

const makeBaubles = () => [...Array(Math.ceil(MAX_ITEMS*Math.random()))].map((_, i) => ({
  key: `${i}`,
  position: dropPosition(),
  scale: lerp(0.07, 0.1, Math.random())
}))

const makeGifts = () => [...Array(Math.ceil(MAX_ITEMS*Math.random()))].map((_, i) => ({
  key: `${i}`,
  position: dropPosition()
}))

export function First() {

  const { pathname } = useLocation()
  const { setCamera } = useFiberStore()
  const visible = pathname === PATH
  // Rapier's default gravity is the same, so this only says it out loud.
  const gravity = visible ? GRAVITY : undefined
  const [keyId, setKeyId] = useState(generateUUID())
  const [hovered, setHovered] = useState(false)


  const clickHandler = () => setKeyId(generateUUID())

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
  }, [hovered])

  useEffect(() => {
    if(visible) {
      setCamera({
        enabled: true,
        localPosition: [1.5, 0.8, 2.5],
        worldLookAt: [0, 1.8, 0],
        maxPolarAngle: Math.PI
      })
    }
  }, [visible, setCamera])


  const [baubles, gifts] = useMemo(() => [makeBaubles(), makeGifts()],
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-randomise the gifts and baubles each time the scene is shown
  [visible])


  return (
    <>
      <BlockText
        onPointerOut={() => setHovered(false)}
        onPointerOver={() => setHovered(true)}
        onClick={clickHandler}
        visible={visible}
        text="Eat, drink, and be merry!"
        size={0.25}
        height={0.2}
        letterSpacing={-0.05} />
        <Physics gravity={gravity} key={keyId}>
          {visible && baubles.map(b => <Bauble key={b.key} position={b.position} scale={b.scale}/>)}
          {visible && gifts.map(b => <Gift key={b.key} position={b.position} />)}
          <RigidBody position={[0, 0, 0]} type="fixed" colliders={false}>
            <CuboidCollider friction={2} restitution={0.5} args={[7, 0, 7]} />
          </RigidBody>
        </Physics>
      {/* )} */}
    </>
  )
}
