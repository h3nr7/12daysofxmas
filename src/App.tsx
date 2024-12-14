import './App.scss'
import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Route, Routes } from 'react-router'
import First from './components/First/First'
import Second from './components/Second/Second'
import Third from './components/Third/Third'
import { uitunnel, r3ftunnel } from './helpers/tunnelling'
import { CamControls } from './three/components/CamControl/CamControl'
import { EffectComposer, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Lightings } from './three/components/Lightings/Lightings'
import Zero from './components/Zero/Zero'
import { EffectControls } from './three/components/EffectControls/EffectControls'
import { Navi } from './components/Navi/Navi'
import { DAYS } from './helpers/constants'
import { DateTimeProvider } from './hooks/dateTime'

function App() {

  const main = useRef<HTMLDivElement>(null)

  return (
    <DateTimeProvider>
      <div className='main' ref={main || null}>
        <Routes>
          <Route index element={<Zero />} />
          {DAYS.map((d, i) => <Route key={i} path={d.day} element={d.element} />)}
        </Routes>
        <Canvas className='canvas' eventSource={main?.current || undefined}>
            <CamControls />
            <EffectControls />
            <Lightings />
            <r3ftunnel.Out />
        </Canvas>
        <section className="ui">
          <uitunnel.Out />
        </section>
        <Navi />
      </div>
    </DateTimeProvider>
  )
}

export default App
