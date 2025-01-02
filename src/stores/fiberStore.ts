import { MathUtils } from 'three'
import { fog } from 'three/webgpu'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'


interface IFiberState {
  data: {
    debug?: boolean
    cam: {
      isDefault?: boolean
      duration: number 
      enabled: boolean
      localPosition: Vec3
      worldLookAt: Vec3
      minMaxDistance: Vec2
      maxPolarAngle?: number
    },
    effect: {
      fogDensity?: number
      bloomIntensity?: number
      noise?: boolean
      tiltshift?: boolean
    },
    gesture: {
      drag: {
        xy: [number, number]
      }
    }
  }
}

interface IFiberReducer {
  setCamera: (props: {
    isDefault?: boolean
    duration?: number 
    enabled?: boolean, 
    localPosition?: Vec3, 
    worldLookAt?: Vec3, 
    minMaxDistance?: Vec2,
    maxPolarAngle?: number
  }) => void
  setEffect: (props: {
    fogDensity?: number,
    bloomIntensity?: number,
    noise?:boolean,
    tiltshift?: boolean
  }) => void
  setDrag: (props: {
    x: number, y: number
  }) => void
  setDebug: (state: boolean) => void
}

export const initialState: IFiberState = {
  data: {
    debug: true,
    cam: {
      isDefault: true,
      duration: 1.5,
      enabled: true,
      localPosition: [2, 2, 1],
      worldLookAt: [0, 0, 0],
      minMaxDistance: [0.5, 4]
    },
    effect: {
      fogDensity: 0.2,
      bloomIntensity: 15,
      noise: false,
      tiltshift: true
    },
    gesture: {
      drag: {
        xy: [0, 0]
      }
    }
  }
}

export const useFiberStore = create<IFiberState & IFiberReducer>()(immer(set => ({
  data: initialState.data,
  setDebug: isDebug => set(state => { state.data.debug = isDebug }),
  setCamera: ({ 
    isDefault, duration, enabled, localPosition: position, worldLookAt: lookAt, minMaxDistance, maxPolarAngle
  }) => set(state => {
    if(isDefault!=undefined) state.data.cam.isDefault = isDefault
    if(duration!=undefined) state.data.cam.duration = duration
    if(enabled != undefined) state.data.cam.enabled = enabled
    if(position != undefined) state.data.cam.localPosition = position;
    if(lookAt != undefined) state.data.cam.worldLookAt = lookAt;
    if(minMaxDistance != undefined) state.data.cam.minMaxDistance = minMaxDistance;
    if(maxPolarAngle != undefined) state.data.cam.maxPolarAngle = maxPolarAngle
  }),
  setEffect: ({
    noise, tiltshift,
    fogDensity,
    bloomIntensity
  }) => set(state => {
    if(fogDensity != undefined) state.data.effect.fogDensity = fogDensity
    if(bloomIntensity != undefined) state.data.effect.bloomIntensity = bloomIntensity
    if(noise != undefined) state.data.effect.noise = noise
    if(tiltshift != undefined) state.data.effect.tiltshift = tiltshift
  }),
  setDrag: ({ x, y }) => set(state => {
    state.data.gesture.drag.xy = [x, y]
  })
})))