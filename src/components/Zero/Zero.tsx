import { Html, Sphere } from "@react-three/drei";
import { r3ftunnel, uitunnel } from "../../helpers/tunnelling";
import { Link, useNavigate } from "react-router";
import { useDateTime } from "../../hooks/dateTime";
import Diamond from "../../three/components/Diamond/Diamond";
import './Zero.scss'
import { Button } from "../Button/Button";
import { motion } from 'framer-motion-3d'
import { motion as reactmo } from 'framer-motion'
import { Suspense, useEffect, useMemo } from "react";
import { WAITING_PHRASE } from "../../helpers/constants";
import { useFiberStore } from "../../stores/fiberStore";
import Forest from "../../three/components/Forest/Forest";
import { MathUtils } from "three";

function UI() {

  const { isNearXmas, timeLeft, isXmas } = useDateTime()
  const navi = useNavigate();

  const phrase = useMemo(() => WAITING_PHRASE[Math.round(Math.random()*(WAITING_PHRASE.length - 1))], [isXmas])

  const { setCamera } = useFiberStore()

  useEffect(() => setCamera({ enabled: true, maxPolarAngle: MathUtils.degToRad(80) }), [])
  
  return (
    <uitunnel.In>
      <div className="zero__ui">
        <h1>
          Twelve days
          <br />of Xmas
        </h1>
        {isNearXmas ? (
          
          <h3>
            {timeLeft.days > 0 && `${timeLeft.days}d`} {timeLeft.hours}H {timeLeft.mins}M {timeLeft.secs}s
          </h3>
        ): (
          <h1>
            12 days
            <br />of Xmas
          </h1>
        )}
        <Button
          onClick={() => navi("/first")}
          btnProps={{
            disabled: !isXmas,
            initial: {
              opacity: 0,
              y: "-15px" 
            },
            animate: {
              opacity: 1,
              y: "0px"
            },
            transition: { delay: 0.35, ease: "easeOut", duration: 0.5 }} 
          }  
        >{isXmas ? 'Begin experience' : phrase}</Button>
        {!isNearXmas && <reactmo.h6
          initial={{
            opacity: 0,
            y: -15
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{ delay: 3 }}
        >
          Well... Can't wait? <Link to={'/first'}>Begin here...</Link>
        </reactmo.h6>}
      </div>
    </uitunnel.In>
  )
}

function R3F() {

  return (
    <r3ftunnel.In>
      {/* <Diamond /> */}
      <Forest />
      {/* // <Sphere position={[-1.2, 0, 0]} onClick={() => navi('/first')} /> */}
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