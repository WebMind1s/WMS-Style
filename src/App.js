// Import necessary modules and components
import * as THREE from 'three'
import { useLayoutEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Mask, useMask, OrthographicCamera, Clone, Float as FloatImpl } from '@react-three/drei'
import useSpline from '@splinetool/r3f-spline'
import Embed from './Embed'
  
export const App = () => {
  // Make a reference to the container and the domContent
  const container = useRef();
  const domContent = useRef();
  
  return (
    <div ref={container} className="content-container">
      {/* Container for the HTML view */}
      {/* Set the height, width, position, overflow, top, and left */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
        ref={domContent}
      >
        {/* Container for THREE.JS */}
        <Canvas
          shadows
          flat
          linear
          // Since the Canvas will receive events from the out-most container,
          // it must ignore those events. This allows the HTML view to receive events too.
          style={{ pointerEvents: 'none' }} // Now you've rejected the events
          // So, you need to do something to get events for both the Canvas and the HTML.
          // You achieve this by connecting r3f to a shared container, allowing both HTML and Canvas to receive events.
          eventSource={container}
          // Re-define the event-compute function which now uses pageX/Y instead of offsetX/Y
          // This is important because without it, the right hand would reset to client 0/0 when hovering over any HTML element.
          eventPrefix="page"
        >
          {/* Set the directional light */}
          <directionalLight
            castShadow
            intensity={0.4}
            position={[-10, 50, 300]}
            shadow-mapSize={[512, 512]}
            shadow-bias={-0.002}
          >
            {/* Set the orthographic camera for shadow rendering */}
            <orthographicCamera
              attach="shadow-camera"
              args={[-2000, 2000, 2000, -2000, -10000, 10000]}
            />
          </directionalLight>
          {/* Set the default Orthographic Camera */}
          <OrthographicCamera
            makeDefault={true}
            far={100000}
            near={-100000}
            position={[0, 0, 1000]}
          />
          <hemisphereLight
            intensity={0.5}
            color="#eaeaea"
            position={[0, 1, 0]}
          />
          {/* Render the Scene and connect it to the HTML content */}
          <Scene portal={domContent} position={[0, -50, 0]} />
        </Canvas>
      </div>
    </div>
  );
};


function Scene({ portal, ...props }) {
  // Initialize variables and hooks
  let timeout = null; // Used for controlling a timeout
  const v = new THREE.Vector3(); // A vector to hold 3D coordinates
  const wheel = useRef(0); // A reference to control wheel movement
  const hand = useRef(); // A reference to control hand movement
  const [clicked, click] = useState(false); // A state to track clicking state
  const { nodes } = useSpline('/scroll.splinecode'); // Load spline data
  const stencil = useMask(1, true); // Create a mask for specific objects

  // Apply stencil mask to specific objects during initial render
  useLayoutEffect(() => {
    Object.values(nodes).forEach((node) => {
      // Check conditions for applying the stencil mask
      if (
        node.material &&
        node.parent.name !== 'hand-r' &&
        node.name !== 'Cube3' &&
        node.name !== 'Cube 8' &&
        node.name !== 'Cube 17' &&
        node.name !== 'Cube 24'
      ) {
        // Assign the stencil mask to the object's material
        Object.assign(node.material, stencil);
      }
    });
  }, []);

  // Update the scene in each frame
  useFrame((state) => {
    // Update vector position based on pointer movement
    v.copy({ x: state.pointer.x, y: state.pointer.y, z: 0 });
    v.unproject(state.camera);

    // Animate hand rotation and position
    hand.current.rotation.x = THREE.MathUtils.lerp(
      hand.current.rotation.x,
      clicked ? -0.7 : -0.5,
      0.2
    );
    hand.current.position.lerp(
      { x: v.x - 100, y: wheel.current + v.y, z: v.z },
      0.4
    );

    // Control camera zoom and position based on interactions
    state.camera.zoom = THREE.MathUtils.lerp(
      state.camera.zoom,
      clicked ? 0.9 : 0.7,
      clicked ? 0.025 : 0.15
    );
    state.camera.position.lerp(
      { x: -state.pointer.x * 400, y: -state.pointer.y * 200, z: 1000 },
      0.1
    );
    state.camera.lookAt(0, 0, 0);
    state.camera.updateProjectionMatrix();
  });

  return (
    <group {...props} dispose={null}>
      {/* Rendering the floating objects using the Float component */}
      <Float object={nodes['Bg-stuff']} />
      <Float object={nodes['Emoji-4']} />
      <Float object={nodes['Emoji-2']} />
      <Float object={nodes['Emoji-3']} />
      <Float object={nodes['Emoji-1']} />
      <Float object={nodes['Icon-text-2']} />
      <Float object={nodes['Icon-like']} />
      <Float object={nodes['Icon-star']} />
      <Float object={nodes['Icon-play']} />
      <Float object={nodes['Icon-text-1']} />
      {/* ... Other floating objects ... */}
      {/* Render the hand */}
      <group ref={hand}>
        <Clone object={nodes['hand-r']} rotation-y={0.35} />
      </group>
      <Clone object={nodes['Bubble-BG']} scale={1.25} />
      <FloatImpl floatIntensity={100} rotationIntensity={0.5} speed={1}>
        <Float intensity={100} rotation={0.5} object={nodes['Bubble-LOGO']} position={[0, -0, 0]} scale={1.5} />
        <group position={[0, -50, 0]} rotation={[-0.15, 0, 0]}>
          <Clone object={nodes['hand-l']} position={[80, 100, -150]} />
          <group name="phone" position={[-50, 0, -68]}>
            <Clone object={[nodes['Rectangle 4'], nodes['Rectangle 3'], nodes['Boolean 2']]} />
            {/* Mask is a drei component that generates a stencil, we use the phone-screen as a mask, punching a hole into the canvas */}
            <Mask id={1} colorWrite={false} depthWrite={false} geometry={nodes.screen.geometry} castShadow receiveShadow position={[0, 0, 9.89]}>
              {/* We can drop the HTML inside, make it a 3d-transform and portal it to the dom container above */}
              <Html className="content-embed" portal={portal} scale={40} transform zIndexRange={[-1, 0]}>
                <Embed />
              </Html>
            </Mask>
            <mesh
              onWheel={(e) => {
                wheel.current = -e.deltaY / 2
                // Simple defer to reset wheel offset since the browser will never let delta be zero
                clearTimeout(timeout)
                timeout = setTimeout(() => (wheel.current = 0), 100)
              }}
              onPointerDown={(e) => {
                e.target.setPointerCapture(e.pointerId)
                click(true)
              }}
              onPointerUp={(e) => {
                e.target.releasePointerCapture(e.pointerId)
                click(false)
              }}
              receiveShadow
              geometry={nodes.screen.geometry}>
              <meshStandardMaterial transparent opacity={0.1} />
            </mesh>
          </group>
        </group>
      </FloatImpl>
    </group>
  );
}

// Float component: Creates a floating effect for objects
const Float = ({ object, intensity = 300, rotation = 1, ...props }) => {
  return (
    <FloatImpl floatIntensity={intensity} rotationIntensity={rotation} speed={2}>
      {/* Clone the object to create the floating effect */}
      <Clone object={object} {...props} />
    </FloatImpl>
  );
};
