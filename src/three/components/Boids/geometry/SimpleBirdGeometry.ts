import * as THREE from "three";
import { extend, Object3DNode } from '@react-three/fiber'

const WIDTH = 32;
const BIRDS = WIDTH * WIDTH;

export default class SimpleBirdGeometry extends THREE.BufferGeometry {

  constructor() {
    super()

    const trianglesPerBird = 3;
    const triangles = BIRDS * trianglesPerBird;
    const points = triangles * 3;

    const vertices = new THREE.BufferAttribute( new Float32Array( points * 3 ), 3 );
    const birdColors = new THREE.BufferAttribute( new Float32Array( points * 3 ), 3 );
    const references = new THREE.BufferAttribute( new Float32Array( points * 2 ), 2 );
    const birdVertex = new THREE.BufferAttribute( new Float32Array( points ), 1 );

    this.setAttribute( 'position', vertices );
    this.setAttribute( 'birdColor', birdColors );
    this.setAttribute( 'reference', references );
    this.setAttribute( 'birdVertex', birdVertex );

    let v = 0;

    function verts_push(vertices: THREE.BufferAttribute, args:number[]) {

      for ( let i = 0; i < args.length; i ++ ) {

        vertices.array[ v ++ ] = args[ i ];

      }
    }

    const wingsSpan = 20;

    for ( let f = 0; f < BIRDS; f ++ ) {

      // Body

      verts_push(vertices, [
        0, - 0, - 20,
        0, 4, - 20,
        0, 0, 30
      ]);

      // Wings

      verts_push(vertices, [
        0, 0, - 15,
        - wingsSpan, 0, 0,
        0, 0, 15
      ]);

      verts_push(vertices, [
        0, 0, 15,
        wingsSpan, 0, 0,
        0, 0, - 15
      ]);

    }

    for ( let v = 0; v < triangles * 3; v ++ ) {

      const triangleIndex = ~ ~ ( v / 3 );
      const birdIndex = ~ ~ ( triangleIndex / trianglesPerBird );
      const x = ( birdIndex % WIDTH ) / WIDTH;
      const y = ~ ~ ( birdIndex / WIDTH ) / WIDTH;

      // the double tilde symbol below "~~" is 
      // a faster operation for Math.floor however
      // it works slightly differently with negative 
      // number
      const c = new THREE.Color(
        0xff0000 +
        ~ ~ ( v / 9 ) / BIRDS * 0x00ff00
      );

      birdColors.array[ v * 3 + 0 ] = c.r;
      birdColors.array[ v * 3 + 1 ] = c.g;
      birdColors.array[ v * 3 + 2 ] = c.b;

      references.array[ v * 2 ] = x;
      references.array[ v * 2 + 1 ] = y;

      birdVertex.array[ v ] = v % 9;

    }

    this.scale( 0.2, 0.2, 0.2 );

  }



}

// extends
extend({ SimpleBirdGeometry })

// declaration
declare module '@react-three/fiber' {
  interface ThreeElements {
    simpleBirdGeometry: Object3DNode<SimpleBirdGeometry, typeof SimpleBirdGeometry>
  }
}

