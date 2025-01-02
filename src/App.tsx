import './App.scss'
import { MutableRefObject, PropsWithChildren, Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Route, Routes, useLocation } from 'react-router'
import { Navi } from './components/Navi/Navi'
import { DAYS } from './helpers/constants'
import { DateTimeProvider } from './hooks/dateTime'
import { useFiberStore } from './stores/fiberStore'
import { DeviceOrientationControls, Stats } from '@react-three/drei'
import { AnimatePresence } from 'framer-motion'
import Forest from './three/components/Forest/Forest'
import Diamond from './three/components/Diamond/Diamond'
import { ThreeView } from './three/ThreeView'
import ZeroUI from './routes/Zero/ZeroUI'
import { useWindowSize } from './hooks/windowSize'
import styled from 'styled-components'
import { FullscreenDiv } from './components/FullscreenDiv/FullscreenDiv'
import { GestureControls } from './hooks/gestureControls'
import SandboxUI from './routes/Sandbox/Sandbox'

function App() {
  const main = useRef<HTMLDivElement>(null)
  const evtSrc = useMemo(() => main as MutableRefObject<HTMLDivElement>, [main])
  const { data: { debug } } = useFiberStore()
  return (
    <Suspense>
      <DateTimeProvider>
        <div className='main' ref={main}>
          <GestureControls>
            {evtSrc && <ThreeView eventSource={evtSrc} />}
            <UI />
            {debug && <Stats/>}
            <Navi />
          </GestureControls>
        </div>
      </DateTimeProvider>
    </Suspense>
  )
}


function UI() {
  const location = useLocation();

  return (
    <FullscreenDiv className="ui">
      <Routes location={location} key={location.key}>
        <Route index element={<ZeroUI />} />
        <Route path='/sandbox' element={<SandboxUI />} />
        {DAYS.map((d, i) => <Route key={i} path={d.day} element={d.element} />)}
      </Routes>
    </FullscreenDiv>
  );
}


export default App
