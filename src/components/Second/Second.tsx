import { Sphere } from "@react-three/drei";
import { r3ftunnel, uitunnel } from "../../helpers/tunnelling";
import { useNavigate } from "react-router";

function UI() {
  return (
    <uitunnel.In>
      <h1>Second</h1>
      </uitunnel.In>
  )
}

function R3F() {

  const navi = useNavigate();

  return (
    <>
      <r3ftunnel.In>
        <Sphere position={[-1.2, 0, 0]} onClick={() => navi("/")} />
      </r3ftunnel.In>
    </>
  )
}


export default function Second() {
  return (
    <>
      <UI />
      <R3F />
    </>
  )
}