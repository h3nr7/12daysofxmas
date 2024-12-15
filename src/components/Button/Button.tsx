import { PropsWithChildren, ButtonHTMLAttributes, MouseEventHandler } from "react"
import styled from 'styled-components'
import { HTMLMotionProps, motion } from 'framer-motion'

export function Button({ children, onClick, btnProps }: PropsWithChildren<{
  onClick?: MouseEventHandler<HTMLButtonElement>
  btnProps?: HTMLMotionProps<"button">
}>) {

  return (
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
  )
}
