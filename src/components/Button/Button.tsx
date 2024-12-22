import { PropsWithChildren, ButtonHTMLAttributes, MouseEventHandler } from "react"
import styled from 'styled-components'
import { AnimatePresence, HTMLMotionProps, motion } from 'framer-motion'
import { useMobile } from "../../hooks/isMobile"

export function Button({ visible = true, children, onClick, btnProps }: PropsWithChildren<{
  visible?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  btnProps?: HTMLMotionProps<"button">
}>) {

  const isMobile = useMobile()

  return (
    <AnimatePresence>
      {visible && (
        <motion.button 
          onClick={!btnProps?.disabled ? onClick : undefined}
          style={isMobile ? {
              position: 'fixed',
              left: '30px',
              bottom: '30px',
              width: "calc(100vw - 60px)",
              height: "auto",
              padding: "15px 2rem",
              borderRadius: 30
            } : {
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
