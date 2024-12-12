import { create } from 'zustand'
import { produce } from 'immer'

type Vec2 = [number, number]
type Vec3 = [number, number, number]

interface IFiberState {
  data: {
    cam: {
      position: Vec3
      lookAt: Vec3
      minMaxDistance: Vec2
    }
  }
}

interface IFiberReducer {
  setCamera: (props: { position?: Vec3, lookAt?: Vec3, minMaxDistance?: Vec2 }) => void
}

export const initialState: IFiberState = {
  data: {
    cam: {
      position: [2, 2, 1],
      lookAt: [0, 0, 0],
      minMaxDistance: [200, 1000]
    }
  }
}

export const useFiberStore = create<IFiberState & IFiberReducer>(set => ({
  data: initialState.data,
  setCamera: ({ position, lookAt, minMaxDistance }) => set(produce<IFiberState>(state => {
    if(position) state.data.cam.position = position;
    if(lookAt) state.data.cam.lookAt = lookAt;
    if(minMaxDistance) state.data.cam.minMaxDistance = minMaxDistance;
  }))
}))