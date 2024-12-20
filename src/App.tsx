import './App.scss'
import { MutableRefObject, PropsWithChildren, Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Route, Routes, useLocation } from 'react-router'
import { Navi } from './components/Navi/Navi'
import { DAYS } from './helpers/constants'
import { DateTimeProvider } from './hooks/dateTime'
import { useFiberStore } from './stores/fiberStore'
import { DeviceOrientationControls } from '@react-three/drei'
import { AnimatePresence } from 'framer-motion'
import Forest from './three/components/Forest/Forest'
import Diamond from './three/components/Diamond/Diamond'
import { ThreeView } from './three/ThreeView'
import Zero from './routes/Zero/ZeroUI'

function App() {
  const main = useRef<HTMLDivElement>(null)
  const evtSrc = useMemo(() => main as MutableRefObject<HTMLDivElement>, [main])

  return (
    <Suspense>
      <DateTimeProvider>
        <div className='main' ref={main || null}>
          {evtSrc && <ThreeView eventSource={evtSrc} />}
          <UI />
          <Navi />
        </div>
      </DateTimeProvider>
    </Suspense>
  )
}

function UI() {
  const location = useLocation();

  return (
    <section className="ui">
      <Routes location={location} key={location.key}>
        <Route index element={<Zero />} />
        {DAYS.map((d, i) => <Route key={i} path={d.day} element={d.element} />)}
      </Routes>
    </section>
  );
}

export default App
