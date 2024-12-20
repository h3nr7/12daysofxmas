import { motion, AnimatePresence, Variants, useInView } from "framer-motion";
import { ReactNode, useRef } from "react";

interface IAnimText {
  content: string
  delay?: number 
  duration?: number
}

export function AnimText({ content, delay = 2, duration = 0.75 }: IAnimText){

  const charDelay = delay/content.length

  const lines = content.split(/\r?\n|\r|\n/g)

  let counter = 0
  const output = lines.map((line, i) => {

    const words = line.split('').map((c, j) => {
      counter++
      return (
        <Character key={`${i}_${j}`} char={c === ' ' ? '\u00A0' : c === '\n' ? <br /> : c} delay={counter*charDelay} duration={duration} />
      )
    })

    if(i <= lines.length - 1) words.push(<br key={`${i}_br`}/>)

    return words
  })

  return (
    <AnimatePresence>
      !!content && {...output.flat()}
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