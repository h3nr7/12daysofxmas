import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

export type TransitionState = 'INIT' | 'EXIT' | 'COMPLETED'
export const TRANSITION_DURATION = 2000

interface ITransitionState {
 state: TransitionState
 timeoutRef?: number
}

interface ITransitionAction {
  init: () => void
  exit: () => void
  abort: () => void
}

export const initialState: ITransitionState = {
  state: 'INIT'
}

export const useTransitionStore = create<ITransitionState & ITransitionAction>()(immer(set => ({
  ...initialState,
  init: () => {
    set({state: 'INIT'})
    const timeoutRef = setTimeout(() => {
      set(states => { 
        states.state = 'COMPLETED' 
        states.timeoutRef = undefined
      })
    }, TRANSITION_DURATION)
    set({timeoutRef})
  },
  exit: () => {
    set({state: 'EXIT'})
    setTimeout(() => {
      set(states => { 
        states.state = 'COMPLETED' 
        states.timeoutRef = undefined
      })
    }, TRANSITION_DURATION)
  },
  abort: () => set(states => {
    if(states.timeoutRef) {
      clearTimeout(states.timeoutRef)
    }
    states.state = 'COMPLETED'
  })
})))