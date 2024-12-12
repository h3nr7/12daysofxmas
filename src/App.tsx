import './App.css'
import { Canvas } from '@react-three/fiber'
import { Route, Routes } from 'react-router'
import First from './components/First/First'
import Second from './components/Second/Second'
import { uitunnel, r3ftunnel } from './helpers/tunnelling'
import { CamControls } from './three/components/CamControl/CamControl'

function App() {

  return (
    <>
      <Routes>
        <Route path="/first" element={<First />} />
        <Route path="/second" element={<Second />} />
      </Routes>
      <Canvas>
          <CamControls />
          <ambientLight intensity={Math.PI / 2} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
          <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
          <r3ftunnel.Out />
      </Canvas>
      <uitunnel.Out />
    </>
  )
}

export default App
