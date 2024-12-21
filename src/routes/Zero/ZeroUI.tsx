import { Html, Sphere } from "@react-three/drei";
import { r3ftunnel, uitunnel } from "../../helpers/tunnelling";
import { Link, useLocation, useNavigate, useRoutes } from "react-router";
import { useDateTime } from "../../hooks/dateTime";
import Diamond from "../../three/components/Diamond/Diamond";
import './Zero.scss'
import { Button } from "../../components/Button/Button"
import { AnimatePresence, motion, usePresence, Variants } from 'framer-motion'
import { useEffect, useMemo } from "react";
import { WAITING_PHRASE } from "../../helpers/constants";
import { useFiberStore } from "../../stores/fiberStore";
import { MathUtils } from "three";
import { AnimText } from "../../components/AnimText";
import { AnimCounter } from "../../components/AnimCounter/AnimCounter";

const DEBUGGING = false

const variants: Variants = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 1.2
    }
  },
  exit: {
    opacity: 0
  }
}


export default function Zero() {

  const { isNearXmas, timeLeft, isXmas } = useDateTime()
  const navi = useNavigate();
  const phrase = useMemo(() => WAITING_PHRASE[Math.round(Math.random()*(WAITING_PHRASE.length - 1))], [isXmas])

  return (
    <div className="zero__ui">
      <h1>
        <AnimText content={`Twelve days\nof Xmas`} />
      </h1>
      {isNearXmas ? (
        
        <motion.h3
          initial={'initial'}
          animate={{
            opacity: 1,
            transition: {
              delay: 1.8,
              duration: 1.2
            }
          }}
          exit={'exit'}
          variants={variants}
        >
          {timeLeft.days > 0 && <AnimCounter value={timeLeft.days} duration={1.5}>D</AnimCounter>}&nbsp;
          {timeLeft.hours > 0 && <AnimCounter value={timeLeft.hours} duration={1}>H</AnimCounter>}&nbsp;
          {timeLeft.mins > 0 && <AnimCounter value={timeLeft.mins} duration={0.5}>M</AnimCounter>}&nbsp;
          {timeLeft.secs > 0 && <AnimCounter value={timeLeft.secs} duration={0.1}>S</AnimCounter>}
        </motion.h3>
      ): (
        <motion.h1
          initial={'initial'}
          animate={'animate'}
          exit={'exit'}
          variants={variants}
        >
          12 days
          <br />of Xmas
        </motion.h1>
      )}
      <Button
        onClick={() => navi("/first")}
        btnProps={{
          disabled: !isXmas,
          initial: {
            opacity: 0,
            y: -15 
          },
          animate: {
            opacity: 1,
            y: 0
          },
          exit: {
            opacity: 0,
            y: -15 
          },
          transition: { delay: 2.35, ease: "easeOut", duration: 0.35 }} 
        }  
      >{isXmas ? 'Begin experience' : phrase}</Button>
      {!isNearXmas || DEBUGGING && <motion.h6
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
      </motion.h6>}
    </div>
  )
}