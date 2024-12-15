import { MathUtils } from 'three'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type Vec2 = [number, number]
type Vec3 = [number, number, number]

interface IFiberState {
  data: {
    cam: {
      enabled: boolean
      position: Vec3
      lookAt: Vec3
      minMaxDistance: Vec2
      maxPolarAngle?: number
    }
  }
}

interface IFiberReducer {
  setCamera: (props: { 
    enabled?: boolean, position?: Vec3, lookAt?: Vec3, minMaxDistance?: Vec2,
    maxPolarAngle?: number
  }) => void
}

export const initialState: IFiberState = {
  data: {
    cam: {
      enabled: true,
      position: [2, 2, 1],
      lookAt: [0, 0, 0],
      minMaxDistance: [200, 1000]
    }
  }
}

export const useFiberStore = create<IFiberState & IFiberReducer>()(immer(set => ({
  data: initialState.data,
  setCamera: ({ enabled, position, lookAt, minMaxDistance, maxPolarAngle }) => set(state => {
    console.log('setcamera: ', enabled)
    if(enabled != undefined) state.data.cam.enabled = enabled
    if(position) state.data.cam.position = position;
    if(lookAt) state.data.cam.lookAt = lookAt;
    if(minMaxDistance) state.data.cam.minMaxDistance = minMaxDistance;
    if(maxPolarAngle) state.data.cam.maxPolarAngle = maxPolarAngle
  })
})))