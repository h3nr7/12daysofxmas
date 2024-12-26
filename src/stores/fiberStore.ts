import { MathUtils } from 'three'
import { fog } from 'three/webgpu'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'


interface IFiberState {
  data: {
    cam: {
      duration?: number 
      enabled: boolean
      position: Vec3
      lookAt: Vec3
      minMaxDistance: Vec2
      maxPolarAngle?: number
    },
    effect: {
      fog?: boolean
      noise?: boolean
      tiltshift?: boolean
    }
  }
}

interface IFiberReducer {
  setCamera: (props: {
    duration?: number 
    enabled?: boolean, 
    position?: Vec3, 
    lookAt?: Vec3, 
    minMaxDistance?: Vec2,
    maxPolarAngle?: number
  }) => void
  setEffect: (props: {
    fog?: boolean,
    noise?:boolean,
    tiltshift?: boolean
  }) => void
}

export const initialState: IFiberState = {
  data: {
    cam: {
      duration: 1.5,
      enabled: true,
      position: [2, 2, 1],
      lookAt: [0, 0, 0],
      minMaxDistance: [200, 1000]
    },
    effect: {
      fog: true,
      noise: false,
      tiltshift: true
    }
  }
}

export const useFiberStore = create<IFiberState & IFiberReducer>()(immer(set => ({
  data: initialState.data,
  setCamera: ({ 
    duration, enabled, position, lookAt, minMaxDistance, maxPolarAngle
  }) => set(state => {
    if(duration!=undefined) state.data.cam.duration = duration
    if(enabled != undefined) state.data.cam.enabled = enabled
    if(position != undefined) state.data.cam.position = position;
    if(lookAt != undefined) state.data.cam.lookAt = lookAt;
    if(minMaxDistance != undefined) state.data.cam.minMaxDistance = minMaxDistance;
    if(maxPolarAngle != undefined) state.data.cam.maxPolarAngle = maxPolarAngle
  }),
  setEffect: ({
    fog, noise, tiltshift
  }) => set(state => {
    if(fog != undefined) state.data.effect.fog = fog
    if(noise != undefined) state.data.effect.noise = noise
    if(tiltshift != undefined) state.data.effect.tiltshift = tiltshift
  })
})))