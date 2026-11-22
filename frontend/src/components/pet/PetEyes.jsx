import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * PetEyes
 * Expressive glowing digital eyes with cursor tracking, dynamic blinking,
 * peek-a-boo eyelid closing, and victory smile crescents.
 */
export default function PetEyes({ animState, isSuccess = false, isCovered = false }) {
  const leftEyeGroup = useRef();
  const rightEyeGroup = useRef();
  const leftPupil = useRef();
  const rightPupil = useRef();
  const leftSmile = useRef();
  const rightSmile = useRef();
  const eyeMaterialRef = useRef();

  useFrame(() => {
    if (!animState?.current) return;
    const s = animState.current;

    // Blink or cover eyes (flatten height)
    // If password is visible, eyes are shut (scaleY = 0.05)
    let eyeScaleY = 1.0 - s.blinkProgress * 0.92;
    if (s.coverProgress > 0.4) {
      eyeScaleY = Math.max(0.06, 1.0 - s.coverProgress * 0.94);
    }

    if (leftEyeGroup.current) {
      leftEyeGroup.current.scale.y = eyeScaleY;
    }
    if (rightEyeGroup.current) {
      rightEyeGroup.current.scale.y = eyeScaleY;
    }

    // Pupil position offset within visor bounds
    const maxLook = 0.045;
    const px = Math.max(-maxLook, Math.min(maxLook, s.lookX * maxLook));
    const py = Math.max(-maxLook, Math.min(maxLook, s.lookY * maxLook));

    if (leftPupil.current) {
      leftPupil.current.position.x = px;
      leftPupil.current.position.y = py;
    }
    if (rightPupil.current) {
      rightPupil.current.position.x = px;
      rightPupil.current.position.y = py;
    }

    // Material emissive color and intensity updates
    if (eyeMaterialRef.current) {
      eyeMaterialRef.current.color.copy(s.eyeColor);
      eyeMaterialRef.current.emissive.copy(s.eyeColor);
      eyeMaterialRef.current.emissiveIntensity = s.eyeIntensity;
    }

    // Success smile mode (^ ^) vs normal eye mode
    const showSmile = isSuccess;
    if (leftPupil.current && leftSmile.current) {
      leftPupil.current.visible = !showSmile;
      leftSmile.current.visible = showSmile;
    }
    if (rightPupil.current && rightSmile.current) {
      rightPupil.current.visible = !showSmile;
      rightSmile.current.visible = showSmile;
    }
  });

  return (
    <group position={[0, 0.02, 0.51]}>
      {/* Shared Emissive Eye Material */}
      <meshStandardMaterial
        ref={eyeMaterialRef}
        color="#00E5FF"
        emissive="#00E5FF"
        emissiveIntensity={2.2}
        roughness={0.2}
        metalness={0.8}
        toneMapped={false}
      />

      {/* LEFT EYE ASSEMBLY */}
      <group ref={leftEyeGroup} position={[-0.18, 0, 0]}>
        {/* Subtle Eye Socket Glow Ring */}
        <mesh position={[0, 0, 0.002]}>
          <ringGeometry args={[0.075, 0.088, 24]} />
          <meshBasicMaterial color="#00E5FF" transparent opacity={0.35} />
        </mesh>

        {/* Normal Eye / Pupil (Rounded capsule) */}
        <mesh ref={leftPupil} position={[0, 0, 0.008]}>
          <capsuleGeometry args={[0.045, 0.05, 12, 12]} />
          <meshStandardMaterial
            color="#00E5FF"
            emissive="#00E5FF"
            emissiveIntensity={2.2}
            roughness={0.1}
          />
        </mesh>

        {/* Celebratory Smile Crescent (^ shape) */}
        <mesh ref={leftSmile} visible={false} position={[0, 0, 0.008]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.05, 0.014, 12, 24, Math.PI]} />
          <meshStandardMaterial
            color="#00FFA3"
            emissive="#00FFA3"
            emissiveIntensity={3.5}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* RIGHT EYE ASSEMBLY */}
      <group ref={rightEyeGroup} position={[0.18, 0, 0]}>
        {/* Subtle Eye Socket Glow Ring */}
        <mesh position={[0, 0, 0.002]}>
          <ringGeometry args={[0.075, 0.088, 24]} />
          <meshBasicMaterial color="#00E5FF" transparent opacity={0.35} />
        </mesh>

        {/* Normal Eye / Pupil (Rounded capsule) */}
        <mesh ref={rightPupil} position={[0, 0, 0.008]}>
          <capsuleGeometry args={[0.045, 0.05, 12, 12]} />
          <meshStandardMaterial
            color="#00E5FF"
            emissive="#00E5FF"
            emissiveIntensity={2.2}
            roughness={0.1}
          />
        </mesh>

        {/* Celebratory Smile Crescent (^ shape) */}
        <mesh ref={rightSmile} visible={false} position={[0, 0, 0.008]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.05, 0.014, 12, 24, Math.PI]} />
          <meshStandardMaterial
            color="#00FFA3"
            emissive="#00FFA3"
            emissiveIntensity={3.5}
            roughness={0.1}
          />
        </mesh>
      </group>
    </group>
  );
}
