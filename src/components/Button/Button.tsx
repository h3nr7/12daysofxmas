import { PropsWithChildren, ButtonHTMLAttributes, MouseEventHandler } from "react"
import styled from 'styled-components'
import { AnimatePresence, HTMLMotionProps, motion } from 'framer-motion'

export function Button({ visible = true, children, onClick, btnProps }: PropsWithChildren<{
  visible?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  btnProps?: HTMLMotionProps<"button">
}>) {

  return (
    <AnimatePresence>
      {visible && (
        <motion.button 
          onClick={!btnProps?.disabled ? onClick : undefined}
          style={{
            minWidth: "200px",
            height: "auto",
            padding: "15px 2rem",
            borderRadius: 30
          }}
          {...btnProps}
        >
          {children}
        </motion.button>
      )}
    </AnimatePresence>
  )
}
