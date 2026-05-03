/**
 * UoH3DLogo — React Three Fiber emblem scene.
 *
 * Composition (centred, balanced):
 *   • Circular emblem disc behind everything (soft radial gradient + ring)
 *   • Atom  — top-centre, maroon orbit rings, gold nucleus, animated electrons
 *   • Bolt  — right-centre, high-metalness gold
 *   • Book  — bottom-centre, open pages with maroon spine
 *
 * Motion:
 *   • Master group: slow Y-axis rotation + gentle sin-wave Y float
 *   • Electrons: per-frame orbital animation
 *   • No Float wrapper (manual control keeps it cleaner)
 */

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Palette ──────────────────────────────────────────────────── */
const MAROON   = '#7A0019';
const MAROON_D = '#5A0012';
const GOLD     = '#C9A227';
const GOLD_LT  = '#E8C94A';
const IVORY    = '#FAF7F2';
const IVORY_D  = '#EDE8DE';

/* ─── Circular emblem backdrop (flat, always faces camera) ─────── */
function EmblemDisc() {
  const ringRef = useRef();

  // Pulse the ring opacity subtly
  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.getElapsedTime();
    ringRef.current.material.opacity = 0.28 + Math.sin(t * 0.7) * 0.06;
  });

  return (
    <group position={[0, 0, -0.3]}>
      {/* Filled radial gradient disc — baked via vertex colors */}
      <mesh>
        <circleGeometry args={[2.05, 128]} />
        <meshBasicMaterial
          color="#F5EFE4"
          transparent
          opacity={0.18}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer ring */}
      <mesh>
        <torusGeometry args={[2.0, 0.018, 16, 128]} />
        <meshBasicMaterial color={MAROON} transparent opacity={0.22} depthWrite={false} />
      </mesh>

      {/* Inner ring (dashed feel via opacity) */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.75, 0.008, 12, 96]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.28} depthWrite={false} />
      </mesh>

      {/* Very subtle fill glow (maroon wash) */}
      <mesh>
        <circleGeometry args={[1.72, 64]} />
        <meshBasicMaterial
          color={MAROON}
          transparent
          opacity={0.04}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ─── Atom ──────────────────────────────────────────────────────── */
function Atom({ position = [0, 0, 0] }) {
  const e1 = useRef();
  const e2 = useRef();
  const e3 = useRef();
  const electrons = [e1, e2, e3];
  const speeds    = [0.85, 0.6, 0.42];
  const radius    = 0.62;

  // Three orbit tilts: horizontal, 60°, −60°
  const orbitAngles = [0, Math.PI / 3, -Math.PI / 3];

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    electrons.forEach((ref, i) => {
      if (!ref.current) return;
      const angle = t * speeds[i] + (i * Math.PI * 2) / 3;
      const tilt  = orbitAngles[i];
      const rx = Math.cos(angle) * radius;
      const rz = Math.sin(angle) * radius;
      ref.current.position.set(
        rx * Math.cos(tilt),
        rz * Math.sin(tilt) * 0.38,
        rx * -Math.sin(tilt) + rz * Math.cos(tilt) * 0.38
      );
    });
  });

  return (
    <group position={position}>
      {/* Nucleus with subtle glow */}
      <mesh>
        <sphereGeometry args={[0.16, 32, 32]} />
        <meshStandardMaterial
          color={GOLD}
          metalness={0.88}
          roughness={0.12}
          emissive={GOLD}
          emissiveIntensity={0.35}
        />
      </mesh>
      {/* Outer glow halo (slightly larger, transparent) */}
      <mesh>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshBasicMaterial color={GOLD_LT} transparent opacity={0.08} depthWrite={false} />
      </mesh>

      {/* Orbit rings */}
      {orbitAngles.map((angle, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, angle]}>
          <torusGeometry args={[radius, 0.022, 16, 80]} />
          <meshStandardMaterial
            color={MAROON}
            metalness={0.55}
            roughness={0.35}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}

      {/* Electrons */}
      {electrons.map((ref, i) => (
        <mesh key={i} ref={ref}>
          <sphereGeometry args={[0.058, 16, 16]} />
          <meshStandardMaterial
            color={i === 1 ? GOLD_LT : MAROON}
            metalness={0.5}
            roughness={0.22}
            emissive={i === 1 ? GOLD : MAROON}
            emissiveIntensity={0.45}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Lightning bolt ─────────────────────────────────────────────── */
function Bolt({ position = [0, 0, 0] }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    // Compact, well-proportioned bolt
    s.moveTo( 0.22,  0.72);
    s.lineTo(-0.04,  0.06);
    s.lineTo( 0.14,  0.06);
    s.lineTo(-0.22, -0.72);
    s.lineTo( 0.04, -0.06);
    s.lineTo(-0.14, -0.06);
    s.closePath();
    return s;
  }, []);

  const ext = useMemo(() => ({
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    bevelSegments: 4,
  }), []);

  return (
    <group position={position}>
      <mesh castShadow>
        <extrudeGeometry args={[shape, ext]} />
        <meshStandardMaterial
          color={GOLD}
          metalness={0.95}
          roughness={0.06}
          emissive={GOLD}
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}

/* ─── Open book ──────────────────────────────────────────────────── */
function Book({ position = [0, 0, 0] }) {
  const leftPage = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0,    -0.52);
    s.quadraticCurveTo(-0.42, -0.48, -0.60, -0.52);
    s.lineTo(-0.60,  0.52);
    s.quadraticCurveTo(-0.42,  0.48,  0,    0.52);
    s.closePath();
    return s;
  }, []);

  const rightPage = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0,    -0.52);
    s.quadraticCurveTo( 0.42, -0.48,  0.60, -0.52);
    s.lineTo( 0.60,  0.52);
    s.quadraticCurveTo( 0.42,  0.48,  0,    0.52);
    s.closePath();
    return s;
  }, []);

  const spineShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.035, -0.52);
    s.lineTo( 0.035, -0.52);
    s.lineTo( 0.035,  0.52);
    s.lineTo(-0.035,  0.52);
    s.closePath();
    return s;
  }, []);

  const pageExt  = useMemo(() => ({ depth: 0.055, bevelEnabled: true,  bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3 }), []);
  const spineExt = useMemo(() => ({ depth: 0.072, bevelEnabled: false }), []);

  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <mesh position={[-0.018, 0, 0]} rotation={[0, 0.07, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[leftPage, pageExt]} />
        <meshStandardMaterial color={IVORY} metalness={0.04} roughness={0.78} />
      </mesh>
      <mesh position={[0.018, 0, 0]} rotation={[0, -0.07, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[rightPage, pageExt]} />
        <meshStandardMaterial color={IVORY_D} metalness={0.04} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0, 0.008]} castShadow>
        <extrudeGeometry args={[spineShape, spineExt]} />
        <meshStandardMaterial color={MAROON_D} metalness={0.28} roughness={0.52} />
      </mesh>
      {/* Rule lines — left page */}
      {[-0.22, -0.04, 0.14].map((y, i) => (
        <mesh key={`l${i}`} position={[-0.31, y, 0.064]}>
          <boxGeometry args={[0.22, 0.010, 0.004]} />
          <meshBasicMaterial color={MAROON} transparent opacity={0.18} />
        </mesh>
      ))}
      {/* Rule lines — right page */}
      {[-0.22, -0.04, 0.14].map((y, i) => (
        <mesh key={`r${i}`} position={[0.31, y, 0.064]}>
          <boxGeometry args={[0.22, 0.010, 0.004]} />
          <meshBasicMaterial color={MAROON} transparent opacity={0.18} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Ground shadow disc ─────────────────────────────────────────── */
function ShadowDisc() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.72, 0]}>
      <circleGeometry args={[2.4, 64]} />
      <shadowMaterial transparent opacity={0.14} />
    </mesh>
  );
}

/* ─── Master scene with rotation ────────────────────────────────── */
function Scene() {
  const masterRef = useRef();

  useFrame(({ clock }) => {
    if (!masterRef.current) return;
    const t = clock.getElapsedTime();
    // Very slow elegant Y rotation
    masterRef.current.rotation.y = t * 0.18;
    // Gentle sin-wave float on Y
    masterRef.current.position.y = Math.sin(t * 0.55) * 0.09;
  });

  return (
    <group ref={masterRef}>
      {/* Emblem disc — always behind, positioned at z=-0.3 relative to group */}
      <EmblemDisc />

      {/*
        Centred composition:
          Atom  → top-centre
          Bolt  → right-centre
          Book  → bottom-centre, rotated to sit flat
      */}
      <Atom position={[0,    0.82, 0]} />
      <Bolt position={[0.72, -0.2, 0]} />
      <Book position={[0,   -1.1,  0]} />
    </group>
  );
}

/* ─── Public component ───────────────────────────────────────────── */
export default function UoH3DLogo({ className = '' }) {
  return (
    <div className={className} aria-label="University of Hyderabad 3D emblem" role="img">
      <Canvas
        shadows
        dpr={[1, 1.8]}
        camera={{ position: [0, 0.05, 5.2], fov: 44 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        {/* Ambient — warm ivory tone */}
        <ambientLight intensity={0.6} color="#FFF8F0" />

        {/* Key light — top-right, warm */}
        <directionalLight
          position={[3.5, 5.5, 3]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-near={0.1}
          shadow-camera-far={20}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          color="#FFF4E8"
        />

        {/* Fill light — left, cooler */}
        <directionalLight position={[-3.5, 1.5, -1]} intensity={0.4} color="#E8EEF5" />

        {/* Gold accent point light for bolt */}
        <pointLight position={[1.5, 0.5, 2]} intensity={0.9} color={GOLD} distance={7} decay={2} />

        {/* Maroon rim light */}
        <pointLight position={[-2, 2, -1]} intensity={0.3} color={MAROON} distance={6} decay={2} />

        {/* HDRI environment for realistic reflections on metallic bolt */}
        <Environment preset="sunset" />

        <Scene />
        <ShadowDisc />
      </Canvas>
    </div>
  );
}
