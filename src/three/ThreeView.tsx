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
        <Zero />
        <First />
        <Ground visible={groundVisible}/>
        <Lightings />
        <CamControls />
        <EffectControls />
    </Canvas>
  )
}