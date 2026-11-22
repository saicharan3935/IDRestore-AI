import { useRef } from 'react';
import * as THREE from 'three';

/**
 * usePetAnimation
 * High-performance frame-by-frame animation calculation for BYTE.
 * Runs inside useFrame with zero React re-renders.
 */
export function usePetAnimation({
  passwordVisible = false,
  passwordFocused = false,
  isTypingPassword = false,
  loginPending = false,
  loginResult = 'idle', // 'idle' | 'success' | 'error'
  reducedMotion = false,
  cursorRef,
}) {
  const stateRef = useRef({
    // Damped values
    lookX: 0,
    lookY: 0,
    headRotX: 0,
    headRotY: 0,
    headRotZ: 0,
    coverProgress: 0, // 0 = hands down, 1 = covering eyes
    blinkProgress: 0, // 0 = open, 1 = closed
    jumpY: 0,
    celebrateSpin: 0,
    earTwitch: 0,
    eyeIntensity: 2.0,
    eyeColor: new THREE.Color('#00E5FF'),
    targetEyeColor: new THREE.Color('#00E5FF'),
    // Internal timers
    blinkTimer: 2.5,
    isBlinking: false,
    jumpTimer: 0,
    errorTimer: 0,
  });

  const update = (delta, elapsedTime) => {
    const s = stateRef.current;
    const motionScale = reducedMotion ? 0.1 : 1.0;

    // 1. Natural periodic blinking (every 3 to 5 seconds for ~120ms)
    s.blinkTimer -= delta;
    if (s.blinkTimer <= 0) {
      s.isBlinking = true;
      s.blinkTimer = 3.2 + Math.random() * 2.5; // Next blink in 3-5.7s
    }

    if (s.isBlinking) {
      s.blinkProgress = THREE.MathUtils.damp(s.blinkProgress, 1, 35, delta);
      if (s.blinkProgress > 0.92) {
        s.isBlinking = false;
      }
    } else {
      s.blinkProgress = THREE.MathUtils.damp(s.blinkProgress, 0, 25, delta);
    }

    // 2. Ear twitching / wiggling when typing password
    if (isTypingPassword && !reducedMotion) {
      s.earTwitch = Math.sin(elapsedTime * 24) * 0.25;
    } else {
      s.earTwitch = THREE.MathUtils.damp(s.earTwitch, 0, 10, delta);
    }

    // 3. State-based Head, Look, Eye and Arm Target Calculations:
    let targetLookX = 0;
    let targetLookY = 0;
    let targetHeadRotX = 0;
    let targetHeadRotY = 0;
    let targetHeadRotZ = 0;
    let targetCover = 0;
    let targetJumpY = 0;
    let targetIntensity = 2.0;

    const cyanColor = new THREE.Color('#00E5FF');
    const mintColor = new THREE.Color('#00FFA3');
    const amberColor = new THREE.Color('#FFB547');

    if (loginResult === 'success') {
      // STATE 7 — SUCCESSFUL SIGN-IN
      // Celebratory bounce, cute spin/wiggle, laser mint eyes
      s.jumpTimer += delta;
      targetJumpY = Math.max(0, Math.sin(s.jumpTimer * 8) * 0.35) * motionScale;
      s.celebrateSpin += delta * 6 * motionScale;
      targetHeadRotZ = Math.sin(s.jumpTimer * 12) * 0.12 * motionScale;
      s.targetEyeColor = mintColor;
      targetIntensity = 3.5;
      targetCover = 0;
    } else if (loginResult === 'error') {
      // STATE 8 — INVALID PASSWORD
      // Subtle confused head tilt, gentle shake
      s.errorTimer += delta;
      targetHeadRotZ = 0.22 * motionScale; // Inquisitive/confused tilt
      targetHeadRotY = Math.sin(s.errorTimer * 10) * 0.15 * motionScale; // Gentle shake
      targetLookX = 0.2;
      targetLookY = -0.1;
      s.targetEyeColor = amberColor;
      targetIntensity = 2.4;
      targetCover = 0;
    } else if (passwordVisible) {
      // STATE 4 — PASSWORD VISIBLE
      // BYTE covers eyes with hands! Turns head slightly away in bashful peek-a-boo
      targetCover = 1.0;
      targetHeadRotY = -0.22 * motionScale; // Turns head slightly away
      targetHeadRotX = 0.12 * motionScale; // Ducks head slightly
      targetHeadRotZ = -0.08 * motionScale;
      targetLookX = -0.3;
      targetLookY = -0.2;
      s.targetEyeColor = cyanColor;
      targetIntensity = 1.6;
    } else if (passwordFocused) {
      // STATE 3 — PASSWORD FOCUS
      // Looks toward password input (to the right/down), tilts head inquisitively, eyes brighten
      targetCover = 0;
      targetHeadRotY = 0.26 * motionScale; // Looks toward the form
      targetHeadRotX = 0.12 * motionScale; // Tilts down toward input
      targetHeadRotZ = 0.14 * motionScale; // Inquisitive cocked head
      targetLookX = 0.45;
      targetLookY = -0.2;
      s.targetEyeColor = cyanColor;
      targetIntensity = 3.0; // Slightly brighter as requested
    } else {
      // STATE 1 & 2 — IDLE & MOUSE TRACKING
      // Smoothly tracks cursor
      const cx = cursorRef?.current?.x || 0;
      const cy = cursorRef?.current?.y || 0;

      targetCover = 0;
      // Damped smooth rotation, avoiding excessive head angle
      targetHeadRotY = cx * 0.45 * motionScale;
      targetHeadRotX = -cy * 0.35 * motionScale;
      targetHeadRotZ = cx * -0.05 * motionScale;

      targetLookX = cx * 0.6;
      targetLookY = cy * 0.6;
      s.targetEyeColor = cyanColor;
      targetIntensity = 2.0;
    }

    // Dampen all state variables smoothly
    const lerpSpeed = 7.0;
    s.headRotX = THREE.MathUtils.damp(s.headRotX, targetHeadRotX, lerpSpeed, delta);
    s.headRotY = THREE.MathUtils.damp(s.headRotY, targetHeadRotY, lerpSpeed, delta);
    s.headRotZ = THREE.MathUtils.damp(s.headRotZ, targetHeadRotZ, lerpSpeed, delta);

    s.lookX = THREE.MathUtils.damp(s.lookX, targetLookX, lerpSpeed * 1.5, delta);
    s.lookY = THREE.MathUtils.damp(s.lookY, targetLookY, lerpSpeed * 1.5, delta);

    // Arm cover transition is snappy yet smooth
    s.coverProgress = THREE.MathUtils.damp(s.coverProgress, targetCover, 9.0, delta);
    s.jumpY = THREE.MathUtils.damp(s.jumpY, targetJumpY, 10.0, delta);
    s.eyeIntensity = THREE.MathUtils.damp(s.eyeIntensity, targetIntensity, 6.0, delta);
    s.eyeColor.lerp(s.targetEyeColor, delta * 6);

    return s;
  };

  return { stateRef, update };
}
