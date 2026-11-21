import { RefObject, Suspense, useMemo } from "react"
import { CamControls } from "./components/CamControls/CamControls"
import { EffectControls } from "./components/EffectControls/EffectControls"
import { Lightings } from "./components/Lightings/Lightings"
import { Canvas } from "@react-three/fiber"
import Zero from "./routes/Zero/Zero"
import { First } from "./routes/First/First"
import { Stars } from "@react-three/drei"
import { useWindowSize } from "../hooks/windowSize"
import { Ground } from "./components/Ground/Ground"
import { useLocation } from "react-router"
import { Fifth } from "./routes/Fifth/Fifth"
import { UNIVERSE_BG_COLOR } from "../helpers/constants"
import { Sandbox } from "./routes/Sandbox/Sandbox"
import { Eighth } from "./routes/Eighth/Eighth"


export interface ThreeViewProps {
  eventSource?: HTMLElement | RefObject<HTMLElement>
}

export function ThreeView({ eventSource }: ThreeViewProps) {

  const { pathname } = useLocation()
  const [width, height] = useWindowSize()

  const groundVisible = useMemo(() => {
    const included = ['/', '/first']
    if(included.includes(pathname)) return true
    return false
  }, [pathname])



  return eventSource && (
    <Canvas className='canvas' eventSource={eventSource} style={{ width, height }}>
        {/* colour matching the rerendering colour background */}
        <color attach="background" args={[UNIVERSE_BG_COLOR]} />
        {/* routing each day, not using react-router directly as I can effectively manage the exit cycle */}
        {/*
          Each scene waits on its own for models it loads on first visit.
          Without these, React 19 hides the whole canvas while one loads.
        */}
        <Suspense fallback={null}><Zero /></Suspense>
        <Suspense fallback={null}><First /></Suspense>
        {/* <Second /> */}
        {/* <Third /> */}
        {/* <Fourth /> */}
        <Suspense fallback={null}><Fifth /></Suspense>
        <Suspense fallback={null}><Eighth /></Suspense>
        <Suspense fallback={null}><Sandbox /></Suspense>
        {/* default element that can appear and disappear in each scene */}
        <Ground visible={groundVisible}/>
        <Stars radius={200} depth={10} count={1500} factor={4} saturation={10} fade speed={1} />
        {/* ligthing and controls */}
        <Lightings />
        <CamControls />
        <EffectControls />
    </Canvas>
  )
}