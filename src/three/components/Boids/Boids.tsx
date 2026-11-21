import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";
import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef } from 'react'
import { BoidsProps, IBoidsCtx } from "./Boids.interface";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, RepeatWrapping } from 'three'
import { velocityFrag } from "./shaders/velocityFrag";
import { positionFrag } from "./shaders/positionFrag";
import { fillPositionTexture, fillVelocityTexture } from "./helpers/initialisers";
import { BOUNDS, WIDTH } from ".";

/**
 * Boids Context
 */
const BoidsCtx = createContext<IBoidsCtx>({})

/**
 * Boids context hook
 * @returns 
 */
// eslint-disable-next-line react-refresh/only-export-components -- context hook lives beside its provider
export const useBoids = () => useContext(BoidsCtx)


/**
 * Boids Wrapper
 * @param param0 
 * @returns 
 */
export function Boids({ 
  separationDistance = 10.0,
  alignmentDistance = 10.0,
  cohesionDistance = 10.0,
  freedomFactor = 0.75,
  preyRadius = 50.0,
  predator = [0, 0, 0],
  pause = false,
  children,
  countSquare = WIDTH
}:PropsWithChildren<BoidsProps>) {

  // const [pauseAnim, setPauseAnim] = useState(pause)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- one vector, created once and updated in place below
  const vPredator = useMemo(() => new Vector3(...predator), [])
  useEffect(() => { vPredator.set(...predator) }, [predator, vPredator])
  
  const [sDistance, aDistance, cDistance] = useMemo(() => [
    separationDistance, 
    alignmentDistance, 
    cohesionDistance
  ], [separationDistance, alignmentDistance, cohesionDistance])
  const { gl } = useThree()

  // memoised computation renderer, variables and uniforms
  const { 
    computationRenderer, 
    velocityVariable,
    positionVariable,
    velocityUniform, 
    positionUniform 
  } = useMemo(() => {

    const gpu = new GPUComputationRenderer(countSquare, countSquare, gl)

    const dtVelocity = gpu.createTexture()
    const dtPosition = gpu.createTexture()
    fillVelocityTexture(dtVelocity)
    fillPositionTexture(dtPosition)
  
    const velocityVariable = gpu.addVariable('textureVelocity', velocityFrag, dtVelocity)
    const positionVariable = gpu.addVariable('texturePosition', positionFrag, dtPosition)
  
    gpu.setVariableDependencies( velocityVariable, [ positionVariable, velocityVariable ] );
    gpu.setVariableDependencies( positionVariable, [ positionVariable, velocityVariable ] );


    const { uniforms: velocityUniform, defines: velocityDefines } = velocityVariable.material
    const { uniforms: positionUniform } = positionVariable.material
  
    velocityUniform['time'] = { value: 1.0 }
    velocityUniform['delta'] = { value: 0.0 }
    velocityUniform['testing'] = { value: 1.0 }
    velocityUniform['preyRadius'] = { value: preyRadius }
    velocityUniform['separationDistance'] = { value: sDistance }
    velocityUniform['alignmentDistance'] = { value: aDistance }
    velocityUniform['cohesionDistance'] = { value: cDistance }
    velocityUniform['freedomFactor'] = { value: freedomFactor }
    velocityUniform['predator'] = { value: vPredator }

    positionUniform['time'] = { value: 0.0 }
    positionUniform['delta'] = { value: 0.0 }
  
  
    velocityVariable.wrapS = RepeatWrapping
    velocityVariable.wrapT = RepeatWrapping
    velocityDefines.BOUNDS = BOUNDS.toFixed( 2 );
  
    positionVariable.wrapS = RepeatWrapping
    positionVariable.wrapT = RepeatWrapping

    try {
      gpu.init()
    } catch(e) {
      console.error('BoidComputation Error:' + (e as Error)?.message)
    }
  
    gpu.compute()

    return { computationRenderer: gpu, velocityVariable, positionVariable, velocityUniform, positionUniform }
  }, [gl, countSquare, preyRadius, sDistance, aDistance, cDistance, freedomFactor, vPredator])


  // Time of the previous frame. A ref, so a re-render doesn't reset it.
  const last = useRef<number | null>(null)
  // use frame for rendered frames
  // eslint-disable-next-line react-hooks/immutability -- the frame loop writes three.js uniforms by design
  useFrame(f => {
    if(!computationRenderer || !velocityUniform || !positionUniform || pause) return
    const now = f.clock.oldTime
    let delta = last.current === null ? 0 : ( now - last.current ) / 1000;

    if ( delta > 1 ) delta = 1; // safety cap on large deltas
    last.current = now;

    /* eslint-disable react-hooks/immutability -- three.js uniforms are written every frame by design */
    velocityUniform[ 'time' ].value = now;
    velocityUniform[ 'delta' ].value = delta;
    positionUniform[ 'time' ].value = now;
    positionUniform[ 'delta' ].value = delta;
    /* eslint-enable react-hooks/immutability */

    computationRenderer.compute()
  })



  return (
    <BoidsCtx.Provider 
      value={{ 
        computationRenderer, 
        velocityVariable,
        positionVariable,
        velocityUniform,
        positionUniform 
      }}>
        {children}
      </BoidsCtx.Provider>
  )

}

