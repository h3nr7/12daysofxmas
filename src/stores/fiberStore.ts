import { create } from 'zustand'
import { produce } from 'immer'

type Vec2 = [number, number]
type Vec3 = [number, number, number]

interface IFiberState {
  data: {
    cam: {
      enabled: boolean
      position: Vec3
      lookAt: Vec3
      minMaxDistance: Vec2
    }
  }
}

interface IFiberReducer {
  setCamera: (props: { enabled?: boolean, position?: Vec3, lookAt?: Vec3, minMaxDistance?: Vec2 }) => void
}

export const initialState: IFiberState = {
  data: {
    cam: {
      enabled: false,
      position: [2, 2, 1],
      lookAt: [0, 0, 0],
      minMaxDistance: [200, 1000]
    }
  }
}

export const useFiberStore = create<IFiberState & IFiberReducer>(set => ({
  data: initialState.data,
  setCamera: ({ enabled, position, lookAt, minMaxDistance }) => set(produce<IFiberState>(state => {
    if(enabled != undefined) state.data.cam.enabled = enabled
    if(position) state.data.cam.position = position;
    if(lookAt) state.data.cam.lookAt = lookAt;
    if(minMaxDistance) state.data.cam.minMaxDistance = minMaxDistance;
  }))
}))