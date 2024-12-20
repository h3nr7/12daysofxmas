import { useMotionValue, motion, animate, useTransform } from "framer-motion"
import { PropsWithChildren, useEffect } from "react"

export function AnimCounter({ children, value, duration = 2, delay = 0.5 }:PropsWithChildren<{
  value: number
  duration?: number
  delay?: number
}>) {
  const count = useMotionValue(0)
  const intCount = useTransform(() => Math.floor(count.get()))

  useEffect(() => {
    const controls = animate(count, value, { duration, delay })
    return () => controls.stop()
  }, [value])

  return <><motion.span>{intCount}</motion.span>{children}</>
}