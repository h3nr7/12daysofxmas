import { useTransition, type SpringConfig } from '@react-spring/three'
import { easeInOut } from 'framer-motion'

/**
 * Timing for one phase, written the way framer-motion wrote it (seconds).
 *
 * - A tween: `duration` and/or `delay`. Eased with framer-motion's default
 *   `easeInOut`. A tween with no duration lasts 0.3 s, as framer-motion did.
 * - A spring: `spring` with tension/friction, which match framer-motion's
 *   stiffness/damping.
 */
export type Timing =
  | { duration?: number; delay?: number; spring?: undefined }
  | { spring: { tension: number; friction: number }; delay?: number }

/** framer-motion's default spring for x, y, z and rotations. */
export const TRANSFORM_SPRING = { tension: 500, friction: 25 }

const DEFAULT_TWEEN_SECONDS = 0.3

/** Converts a framer-motion style timing into react-spring `config` and `delay`. */
export function toSpring(timing: Timing): { config: SpringConfig; delay: number } {
  const delay = (timing.delay ?? 0) * 1000
  if (timing.spring) return { config: { ...timing.spring }, delay }
  const seconds = timing.duration ?? DEFAULT_TWEEN_SECONDS
  // react-spring treats a duration of 0 as "no duration" and falls back to
  // a spring, so an instant tween becomes 1 ms.
  return { config: { duration: Math.max(seconds * 1000, 1), easing: easeInOut }, delay }
}

type Values = Record<string, number>

export interface EnterExitOptions<V extends Values> {
  /** Values on mount, before entering. */
  initial: V
  /** Values once entered. Keys left out keep their initial value. */
  animate: Partial<V>
  /** Values to leave to before unmounting. Keys left out keep their current value. Defaults to `initial`. */
  exit?: Partial<V>
  /** Timing of the enter. */
  enter: Timing
  /** Timing of the leave. Defaults to `enter`. */
  leave?: Timing
}

/**
 * Mounts an element with an enter animation and keeps it mounted through its
 * exit animation, the way framer-motion's AnimatePresence did.
 *
 * `show` is the element's data while it should be shown, and false, null or
 * undefined when it should leave. While leaving, the render function still
 * receives the last data shown, so the element doesn't change mid-exit.
 * Showing it again during the exit re-enters from the current values.
 *
 *   const transitions = useEnterExit(visible, { initial, animate, enter })
 *   return transitions((style, item) => <animated.mesh scale={style.scale} />)
 */
export function useEnterExit<V extends Values, T>(
  show: T | false | null | undefined,
  { initial, animate, exit = initial, enter, leave = enter }: EnterExitOptions<V>,
) {
  const items = show === false || show === null || show === undefined ? [] : [show]
  return useTransition(items, {
    // One key, so a re-show reuses the same element instead of mounting a second.
    keys: () => 'item',
    from: initial,
    enter: { ...animate, ...toSpring(enter) },
    leave: { ...exit, ...toSpring(leave) },
  })
}
