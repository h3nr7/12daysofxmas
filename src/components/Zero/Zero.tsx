import { Sphere } from "@react-three/drei";
import { r3ftunnel, uitunnel } from "../../helpers/tunnelling";
import { useNavigate } from "react-router";
import { useDateTime } from "../../hooks/dateTime";

function UI() {

  const { isNearXmas, timeLeft } = useDateTime()

  return (
    <uitunnel.In>
      <h1>Zero</h1>
      <p>{isNearXmas ? <>Hey it is xmas time {`${JSON.stringify(timeLeft)}`}</> : <>Too early for xmas</>}</p>
    </uitunnel.In>
  )
}

function R3F() {

  const navi = useNavigate();

  return (
    <r3ftunnel.In>
      <Sphere position={[-1.2, 0, 0]} onClick={() => navi('/first')} />
    </r3ftunnel.In>
  )
}


export default function Zero() {
  return (
    <>
      <UI />
      <R3F />
    </>
  )
}