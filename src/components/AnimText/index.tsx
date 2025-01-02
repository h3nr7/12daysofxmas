import { motion, AnimatePresence, Variants, useInView } from "framer-motion";
import { ReactNode, useMemo, useRef } from "react";

interface IAnimText {
  content: string
  charDelay?: number 
  delay?: number
  duration?: number
}

export function AnimText({ content, charDelay = 2, delay = 0, duration = 0.75 }: IAnimText){

  const lines = useMemo(() => content.split(/\r?\n|\r|\n/g), [content])

  const output = useMemo(() => lines.map((line, i) => {
    let counter = 0
    charDelay = charDelay/content.length

    const words = line.split('').map((c, j) => {
      counter++
      const d = counter*charDelay + delay
      return (
        <Character key={`${i}_${j}`} char={c === ' ' ? '\u00A0' : c === '\n' ? <br /> : c} delay={d} duration={duration} />
      )
    })

    if(i <= lines.length - 1) words.push(<br key={`${i}_br`}/>)

    return words
  }), [lines])

  return (
    <AnimatePresence>
      {...output.flat()}
    </AnimatePresence>
  )
}

function Character({ char, delay, duration }: {char: ReactNode, delay: number, duration: number}) {

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const variants: Variants = {
    initial: {
      opacity: 0,
      y: -20
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        delay,
        duration,
        type: 'spring'
      }
    },
    exit: {
      opacity: 0,
      y: -20
    }
  }

  return (
    <motion.div
      style={{ 
        display: 'inline-block'
      }}
      ref={ref}
      initial="initial"
      animate={isInView ? "animate": undefined}
      exit="exit"
      variants={variants}
    >
      {char}
    </motion.div>
  )

}