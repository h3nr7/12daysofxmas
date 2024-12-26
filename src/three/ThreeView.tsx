import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react"
import { CamControls } from "./components/CamControl/CamControl"
import { EffectControls } from "./components/EffectControls/EffectControls"
import { Lightings } from "./components/Lightings/Lightings"
import { Canvas } from "@react-three/fiber"
import Zero from "./routes/Zero/Zero"
import { First } from "./routes/First/First"
import { Stars } from "@react-three/drei"
import { BufferGeometry, CircleGeometry, Color, MathUtils, Mesh, PlaneGeometry, Vector3 } from "three"
import { useWindowSize } from "../hooks/windowSize"
import { Ground } from "./components/Ground/Ground"
import { useLocation } from "react-router"
import { BlockText } from "./components/BlockText/BlockText"
import { Physics } from "@react-three/rapier"
import { Second } from "./routes/Second/Second"


export interface ThreeViewProps {
  eventSource?: HTMLElement | MutableRefObject<HTMLElement>
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
        <color attach="background" args={["#310000"]} />
        <Zero />
        <First />
        <Second />
        <Ground visible={groundVisible}/>
        <Stars radius={200} depth={10} count={1500} factor={4} saturation={10} fade speed={1} />
        <Lightings />
        <CamControls />
        <EffectControls />
    </Canvas>
  )
}