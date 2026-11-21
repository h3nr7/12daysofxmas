import { createContext, PropsWithChildren, RefObject, useContext, useRef } from "react";

const initials: {
  ref: RefObject<HTMLDivElement | null> | null
  // movement: [number ,number]
} = {
  ref: null,
  // movement: [0,0]
}

const gestureCtx = createContext(initials)

export function GestureControls({ children }: PropsWithChildren) {

  const divRef = useRef<HTMLDivElement>(null)

  // const bind = useGest({
  //   // onDrag: ({ delta: [x, y] }) => setDrag([x/minDistance, -y/minDistance]),
  //   onMove: ({ xy: [x ,y] }) => {
  //     setMovement([x/width * 2 - 1, y/height * 2 - 1])
  //   }
  // })

  // useEffect(() => {
  //   if(!divRef.current) return
  //   const gesture = new MoveGesture(divRef.current, ({ active, movement: [x, y] }) => {
  //     console.log(active, x, y)
  //     setMovement([x/width * 2 - 1, y/height * 2 - 1])
  //   })
    

  //   return () => gesture.destroy()
  // }, [divRef.current])


  return (
    <div 
      style={{ 
        display: "block",
        margin: "none",
        padding: "none",
        width: "100%",
        height: "100%",
        touchAction: 'none' 
      }}
      ref={divRef}>
      <gestureCtx.Provider 
        value={{ ref: divRef }}
      >
          {children}
      </gestureCtx.Provider>
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook lives beside its provider
export const useGestureControls = () => useContext(gestureCtx)