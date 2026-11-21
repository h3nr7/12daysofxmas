import { useDateTime } from "../../hooks/dateTime";
import { DebugLink, useDebugNavigate } from "../../hooks/debugNavigation";
import { useDebug } from "../../hooks/debug";
import './Zero.scss'
import { Button } from "../../components/Button/Button"
import { motion, Variants } from 'motion/react'
import { useMemo } from "react";
import { DAYS, WAITING_PHRASE } from "../../helpers/constants";
import { AnimText } from "../../components/AnimText";
import { AnimCounter } from "../../components/AnimCounter/AnimCounter";

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


// A random waiting phrase. Picked again when Christmas starts or ends (see below).
const pickPhrase = () => WAITING_PHRASE[Math.round(Math.random()*(WAITING_PHRASE.length - 1))]

export default function ZeroUI() {

  const { isNearXmas, timeLeft, isXmas, xmasDayCount } = useDateTime()
  const navi = useDebugNavigate();
  const { on: debug } = useDebug();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- pick a new phrase when Christmas starts or ends
  const phrase = useMemo(() => pickPhrase(), [isXmas])

  return (
    <div className="zero__ui">
      <h1>
        <AnimText content={`12 days\nof Xmas`} />
      </h1>
      {isNearXmas && (
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
      )}
      <Button
        onClick={() => navi(`/${DAYS[xmasDayCount - 1].day}`)}
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
      >{isXmas ? DAYS[xmasDayCount - 1].text : phrase}</Button>
      {/* A shortcut into the days for testing; visitors never see it. */}
      {debug && <motion.h6
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
        Well... Can't wait? <DebugLink to={'/first'}>Begin here...</DebugLink>
      </motion.h6>}
    </div>
  )
}