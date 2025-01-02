import { glsl } from "typed-glsl";

export const frag = glsl`
  varying vec4 vColor;
  varying float z;

  uniform vec3 color;

  void main() {
    // Fake colors for now
    float x2 = 0.2 + ( 1000. - z ) / 1000. * vColor.x;
    float y2 = 0.2 + ( 1000. - z ) / 1000. * vColor.y;
    float z2 = 0.2 + ( 1000. - z ) / 1000. * vColor.z;
    gl_FragColor = vec4( x2, y2, z2, 1. );

  }
`