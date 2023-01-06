import * as THREE from 'three'
import { useRef } from 'react'
import { Canvas, ThreeElements, useFrame } from '@react-three/fiber'

import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  html,
  body,
  #root {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
`;

const Plane = (props: ThreeElements['planeBufferGeometry']) => {
    const mesh = useRef<THREE.Mesh>(null!)

    return (
        <mesh
            {...props}
            ref={mesh}
        >
            <planeBufferGeometry args={[1, 4, 1]} />
            <meshStandardMaterial color='red' />
        </mesh>
    )
}

export const Map = () => {
    return (
        <>
            <GlobalStyle />
            <Canvas
                camera={{ position: [0, -2, 0.1], rotation: [90 * Math.PI / 180, 0, 0] }}
            >
                <ambientLight />
                <pointLight position={[10, 10, 10]} />
                <Plane position={[0, 0, 0]} />
            </Canvas>
        </>
    )
}