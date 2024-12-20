import { MutableRefObject, useEffect, useRef } from "react"
import { CamControls } from "./components/CamControl/CamControl"
import { EffectControls } from "./components/EffectControls/EffectControls"
import { Lightings } from "./components/Lightings/Lightings"
import { Canvas } from "@react-three/fiber"
import Zero from "./routes/Zero/Zero"
import { First } from "./routes/First/First"
import { Stars } from "@react-three/drei"
import { BufferGeometry, CircleGeometry, Color, MathUtils, Mesh, PlaneGeometry, Vector3 } from "three"


export interface ThreeViewProps {
  eventSource?: HTMLElement | MutableRefObject<HTMLElement>
}

export function ThreeView({ eventSource }: ThreeViewProps) {

  return eventSource && (
    <Canvas className='canvas' eventSource={eventSource}>
        <Zero />
        <First />
        <Lightings />
        <CamControls />
        <EffectControls />
    </Canvas>
  )
}