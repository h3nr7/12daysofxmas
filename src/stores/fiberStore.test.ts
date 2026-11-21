import { beforeEach, describe, expect, it } from 'vitest'
import { initialState, useFiberStore } from './fiberStore'

type Data = typeof initialState.data

const fresh = (): Data => structuredClone(initialState.data)
const data = () => useFiberStore.getState().data

beforeEach(() => {
  useFiberStore.setState({ data: fresh() })
})

describe('fiberStore', () => {
  it('starts from initialState', () => {
    expect(data()).toEqual(initialState.data)
  })

  describe('setCamera changes only the fields it is given', () => {
    const cases: [string, Parameters<ReturnType<typeof useFiberStore.getState>['setCamera']>[0], (d: Data) => void][] = [
      ['isDefault', { isDefault: false }, (d) => { d.cam.isDefault = false }],
      ['duration', { duration: 3 }, (d) => { d.cam.duration = 3 }],
      ['enabled', { enabled: false }, (d) => { d.cam.enabled = false }],
      ['localPosition', { localPosition: [1, 2, 3] }, (d) => { d.cam.localPosition = [1, 2, 3] }],
      ['worldLookAt', { worldLookAt: [4, 5, 6] }, (d) => { d.cam.worldLookAt = [4, 5, 6] }],
      ['minMaxDistance', { minMaxDistance: [1, 9] }, (d) => { d.cam.minMaxDistance = [1, 9] }],
      ['maxPolarAngle', { maxPolarAngle: 1.2 }, (d) => { d.cam.maxPolarAngle = 1.2 }],
    ]
    it.each(cases)('%s', (_name, props, apply) => {
      useFiberStore.getState().setCamera(props)
      const expected = fresh()
      apply(expected)
      expect(data()).toEqual(expected)
    })

    it('several at once', () => {
      useFiberStore.getState().setCamera({ enabled: false, worldLookAt: [0, 1.8, 0] })
      const expected = fresh()
      expected.cam.enabled = false
      expected.cam.worldLookAt = [0, 1.8, 0]
      expect(data()).toEqual(expected)
    })
  })

  it('setEffect changes only the effects it is given', () => {
    useFiberStore.getState().setEffect({ noise: true })
    const expected = fresh()
    expected.effect.noise = true
    expect(data()).toEqual(expected)

    useFiberStore.getState().setEffect({ tiltshift: false })
    expected.effect.tiltshift = false
    expect(data()).toEqual(expected)
  })

  it('setDrag stores the drag position', () => {
    useFiberStore.getState().setDrag({ x: 3, y: -4 })
    const expected = fresh()
    expected.gesture.drag.xy = [3, -4]
    expect(data()).toEqual(expected)
  })
})
