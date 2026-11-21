import './App.scss'
import { RefObject, Suspense, useMemo, useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { Navi } from './components/Navi/Navi'
import { DAYS } from './helpers/constants'
import { DateTimeProvider } from './hooks/dateTime'
import { useFiberStore } from './stores/fiberStore'
import { Stats } from '@react-three/drei'
import { ThreeView } from './three/ThreeView'
import ZeroUI from './routes/Zero/ZeroUI'
import { FullscreenDiv } from './components/FullscreenDiv/FullscreenDiv'
import { GestureControls } from './hooks/gestureControls'
import SandboxUI from './routes/Sandbox/Sandbox'
import { AssetsLoader } from './hooks/AssetsLoader/AssetsLoader'
import { Loading } from './components/Loading/Loading'

function App() {
  const main = useRef<HTMLDivElement>(null)
  const evtSrc = useMemo(() => main as RefObject<HTMLDivElement>, [main])
  const { data: { debug } } = useFiberStore()
  return (
    <Suspense>
      <DateTimeProvider>
        <div className='main' ref={main}>
          <AssetsLoader>
            <GestureControls>
              {evtSrc && <ThreeView eventSource={evtSrc} />}
              <UI />
              {debug && <Stats/>}
              <Navi />
            </GestureControls>
            <Loading />
          </AssetsLoader>
        </div>
      </DateTimeProvider>
    </Suspense>
  )
}


function UI() {
  const location = useLocation();
  return (
    <FullscreenDiv className="ui">
      <Routes key={location.key}>
        <Route index element={<ZeroUI />} />
        <Route path='/sandbox' element={<SandboxUI />} />
        {DAYS.map((d, i) => <Route key={i} path={d.day} element={d.element} />)}
      </Routes>
    </FullscreenDiv>
  );
}


export default App
