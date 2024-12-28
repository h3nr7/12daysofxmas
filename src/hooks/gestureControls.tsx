import { useGesture as useGest } from "@use-gesture/react";
import { createContext, forwardRef, PropsWithChildren, useContext, useMemo, useState } from "react";
import { useFiberStore } from "../stores/fiberStore";
import { useWindowSize } from "./windowSize";


interface IGestureControls {
  className?: string

}

const initials = {
  drag: [0,0]
}

const gestureCtx = createContext(initials)

export const GestureControls = forwardRef<
  HTMLDivElement, 
  PropsWithChildren<IGestureControls>
>(({
  children,
  className
}, ref) => {

  const [drag, setDrag] = useState([0,0])
  const [width, height] = useWindowSize()
  const minDistance = useMemo(() => Math.min(width, height), [width, height])
  const bind = useGest({
    onDrag: ({ delta: [x, y] }) => setDrag([x/minDistance, -y/minDistance]),
  })



  return (
    <div 
      style={{ touchAction: 'none' }}
      {...bind()} 
      className={className} 
      ref={ref}>
      <gestureCtx.Provider 
        value={{ drag }}
      >
          {children}
      </gestureCtx.Provider>
    </div>
  )
})

export const useGestureControls = () => useContext(gestureCtx)