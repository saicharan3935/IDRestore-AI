import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * PetArms
 * Mechanical articulated arms with cyber joints and mitten paws.
 * Transitions smoothly from gentle idle floating to raising hands to cover eyes when password is visible.
 */
export default function PetArms({ animState }) {
  const leftShoulderRef = useRef();
  const rightShoulderRef = useRef();

  useFrame((state) => {
    if (!animState?.current) return;
    const s = animState.current;
    const time = state.clock.getElapsedTime();

    // Breathing / idle arm float
    const idleFloat = Math.sin(time * 2.2) * 0.035;

    // Interpolate shoulder rotation & arm positions based on coverProgress (0 to 1)
    const p = s.coverProgress; // 0 = idle down, 1 = covering eyes

    // LEFT ARM INTERPOLATION:
    // Idle: rotX ~ 0.2, rotY ~ 0.1, rotZ ~ -0.25, posX ~ -0.38, posY ~ -0.05, posZ ~ 0
    // Cover Eyes: rotX ~ -1.5, rotY ~ -0.5, rotZ ~ 0.8, posX ~ -0.28, posY ~ 0.22, posZ ~ 0.38
    if (leftShoulderRef.current) {
      leftShoulderRef.current.position.x = THREE.MathUtils.lerp(-0.38, -0.26, p);
      leftShoulderRef.current.position.y = THREE.MathUtils.lerp(-0.06 + idleFloat, 0.22, p);
      leftShoulderRef.current.position.z = THREE.MathUtils.lerp(0.04, 0.38, p);

      leftShoulderRef.current.rotation.x = THREE.MathUtils.lerp(0.18, -1.35, p);
      leftShoulderRef.current.rotation.y = THREE.MathUtils.lerp(0.08, -0.45, p);
      leftShoulderRef.current.rotation.z = THREE.MathUtils.lerp(-0.25, 0.85, p);
    }

    // RIGHT ARM INTERPOLATION:
    // Idle: rotX ~ 0.2, rotY ~ -0.1, rotZ ~ 0.25, posX ~ 0.38, posY ~ -0.05, posZ ~ 0
    // Cover Eyes: rotX ~ -1.5, rotY ~ 0.5, rotZ ~ -0.8, posX ~ 0.28, posY ~ 0.22, posZ ~ 0.38
    if (rightShoulderRef.current) {
      rightShoulderRef.current.position.x = THREE.MathUtils.lerp(0.38, 0.26, p);
      rightShoulderRef.current.position.y = THREE.MathUtils.lerp(-0.06 + idleFloat, 0.22, p);
      rightShoulderRef.current.position.z = THREE.MathUtils.lerp(0.04, 0.38, p);

      rightShoulderRef.current.rotation.x = THREE.MathUtils.lerp(0.18, -1.35, p);
      rightShoulderRef.current.rotation.y = THREE.MathUtils.lerp(-0.08, 0.45, p);
      rightShoulderRef.current.rotation.z = THREE.MathUtils.lerp(0.25, -0.85, p);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ============================================================== */}
      {/* LEFT MECHANICAL ARM ASSEMBLY                                   */}
      {/* ============================================================== */}
      <group ref={leftShoulderRef} position={[-0.38, -0.06, 0.04]}>
        {/* Shoulder Joint Sphere */}
        <mesh>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshStandardMaterial color="#101820" roughness={0.3} metalness={0.85} />
        </mesh>

        {/* Upper Arm Segment */}
        <mesh position={[0, -0.13, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.04, 0.16, 16]} />
          <meshStandardMaterial color="#0B1117" roughness={0.2} metalness={0.9} />
        </mesh>

        {/* Elbow Joint */}
        <mesh position={[0, -0.22, 0.02]}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshStandardMaterial color="#101820" roughness={0.3} metalness={0.85} />
        </mesh>

        {/* Forearm & Cute Mechanical Mitten / Hand */}
        <group position={[0, -0.22, 0.02]} rotation={[0.4, 0, 0]}>
          <mesh position={[0, -0.12, 0.02]}>
            <capsuleGeometry args={[0.042, 0.12, 12, 12]} />
            <meshStandardMaterial color="#0B1117" roughness={0.2} metalness={0.9} />
          </mesh>

          {/* Mitten Hand / Palm */}
          <group position={[0, -0.22, 0.04]}>
            <mesh>
              <sphereGeometry args={[0.075, 16, 16]} />
              <meshStandardMaterial color="#17232C" roughness={0.35} metalness={0.8} />
            </mesh>
            {/* Cyan Palm Indicator Pad */}
            <mesh position={[0, 0, 0.06]}>
              <circleGeometry args={[0.035, 16]} />
              <meshBasicMaterial color="#00E5FF" transparent opacity={0.8} />
            </mesh>
            {/* Mechanical Finger Pods */}
            {[-0.035, 0, 0.035].map((fx, i) => (
              <mesh key={`l-finger-${i}`} position={[fx, -0.065, 0.02]} rotation={[0.2, 0, 0]}>
                <capsuleGeometry args={[0.018, 0.045, 8, 8]} />
                <meshStandardMaterial color="#0B1117" roughness={0.25} metalness={0.85} />
              </mesh>
            ))}
          </group>
        </group>
      </group>

      {/* ============================================================== */}
      {/* RIGHT MECHANICAL ARM ASSEMBLY                                  */}
      {/* ============================================================== */}
      <group ref={rightShoulderRef} position={[0.38, -0.06, 0.04]}>
        {/* Shoulder Joint Sphere */}
        <mesh>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshStandardMaterial color="#101820" roughness={0.3} metalness={0.85} />
        </mesh>

        {/* Upper Arm Segment */}
        <mesh position={[0, -0.13, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.04, 0.16, 16]} />
          <meshStandardMaterial color="#0B1117" roughness={0.2} metalness={0.9} />
        </mesh>

        {/* Elbow Joint */}
        <mesh position={[0, -0.22, 0.02]}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshStandardMaterial color="#101820" roughness={0.3} metalness={0.85} />
        </mesh>

        {/* Forearm & Cute Mechanical Mitten / Hand */}
        <group position={[0, -0.22, 0.02]} rotation={[0.4, 0, 0]}>
          <mesh position={[0, -0.12, 0.02]}>
            <capsuleGeometry args={[0.042, 0.12, 12, 12]} />
            <meshStandardMaterial color="#0B1117" roughness={0.2} metalness={0.9} />
          </mesh>

          {/* Mitten Hand / Palm */}
          <group position={[0, -0.22, 0.04]}>
            <mesh>
              <sphereGeometry args={[0.075, 16, 16]} />
              <meshStandardMaterial color="#17232C" roughness={0.35} metalness={0.8} />
            </mesh>
            {/* Cyan Palm Indicator Pad */}
            <mesh position={[0, 0, 0.06]}>
              <circleGeometry args={[0.035, 16]} />
              <meshBasicMaterial color="#00E5FF" transparent opacity={0.8} />
            </mesh>
            {/* Mechanical Finger Pods */}
            {[-0.035, 0, 0.035].map((fx, i) => (
              <mesh key={`r-finger-${i}`} position={[fx, -0.065, 0.02]} rotation={[0.2, 0, 0]}>
                <capsuleGeometry args={[0.018, 0.045, 8, 8]} />
                <meshStandardMaterial color="#0B1117" roughness={0.25} metalness={0.85} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}
