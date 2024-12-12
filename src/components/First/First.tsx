import { Sphere } from "@react-three/drei";
import { useNavigate } from "react-router";
import { uitunnel, r3ftunnel } from '../../helpers/tunnelling'

function UI() {
  return (
    <uitunnel.In>
      <h1>First</h1>
      </uitunnel.In>
  )
}

function R3F() {

  const navi = useNavigate();

  return (
    <>
      <r3ftunnel.In>
        <Sphere position={[1.2, 0, 0]} onClick={() => navi('/second')}/>
      </r3ftunnel.In>
    </>
  )
}


export default function First() {
  return (
    <>
      <UI />
      <R3F />
    </>
  )
}