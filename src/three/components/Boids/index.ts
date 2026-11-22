export { Boids, useBoids } from '../../flock'
export { BoidsParrot } from './BoidsParrot'

/**
 * Boid units to world units, for the group a scene puts `Boids` in. The
 * reference scatters its birds within ±250 boid units and pulls them to the
 * centre; at this scale the flock settles a few world units across, which
 * fills the view from a camera about seven units off the scene centre
 * (Eighth's). Tuned by eye.
 */
export const BOID_SCALE = 0.01
