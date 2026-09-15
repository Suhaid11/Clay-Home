/* ============================================================
   CLAY HOME — First-Person 3D Wooden Mannequin Hands
   ============================================================
   First-person perspective extension of user's own hands:
   - Viewer sees dorsal (back) side of hands
   - Palms face forward (-Z) towards the clay pot
   - Forearms emerge from bottom-foreground of the screen
   - Anatomically correct: thumbs on the inner side, pinkies on the outer side
   ============================================================ */
(function() {
const { scene } = window.ClayScene;

// ── Realistic Birch Wood Materials with Procedural Grain ─────
function createWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#dbcaa7';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle linear wood grain fibers
  for (let y = 0; y < 512; y++) {
    const wave = Math.sin(y * 0.05) * 0.4 + Math.sin(y * 0.16) * 0.25;
    const alpha = 0.025 + Math.abs(wave) * 0.04;
    ctx.fillStyle = `rgba(110, 85, 60, ${alpha})`;
    ctx.fillRect(0, y, 512, 1);
  }

  // Soft natural wood growth streaks
  for (let i = 0; i < 30; i++) {
    const y = Math.floor(Math.random() * 512);
    ctx.fillStyle = 'rgba(95, 70, 48, 0.055)';
    ctx.fillRect(0, y, 512, Math.random() * 2.2 + 0.6);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2);
  return tex;
}

const woodTex = createWoodTexture();

const woodMat = new THREE.MeshStandardMaterial({
  color: 0xdec8a7,
  map: woodTex,
  roughness: 0.48,
  metalness: 0.03
});

const jointMat = new THREE.MeshStandardMaterial({
  color: 0xc8a780,
  roughness: 0.42,
  metalness: 0.06
});

// ── Geometry Helpers ─────────────────────────────────────────
function createJoint(radius) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.08, 16, 16),
    jointMat
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createPhalanx(length, radius) {
  const geo = new THREE.CapsuleGeometry(radius, length, 8, 16);
  const mesh = new THREE.Mesh(geo, woodMat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ── Build Articulated Mannequin Hand (First-Person Perspective) ─
function buildMannequinHand(isLeft) {
  const handRoot = new THREE.Group();

  // Forearm entering from bottom-foreground (viewer's side)
  // Reaches backward towards user (+Z) with gentle slope, staying safely above the rotating platter
  const forearmGeo = new THREE.CylinderGeometry(0.13, 0.18, 1.25, 20);
  // Pivot at top end (wrist connection at 0, 0, 0)
  forearmGeo.translate(0, -0.625, 0);
  const forearm = new THREE.Mesh(forearmGeo, woodMat);
  forearm.rotation.x = -1.26;
  forearm.rotation.y = isLeft ? 0.18 : -0.18;
  forearm.rotation.z = isLeft ? 0.12 : -0.12;
  forearm.position.set(isLeft ? -0.04 : 0.04, 0, 0);
  forearm.castShadow = true;
  forearm.receiveShadow = true;
  handRoot.add(forearm);

  // Wrist Joint Sphere
  const wristBall = createJoint(0.13);
  wristBall.position.set(0, 0, 0);
  handRoot.add(wristBall);

  // Palm Group
  const palmGroup = new THREE.Group();
  palmGroup.position.set(0, 0, 0);
  handRoot.add(palmGroup);

  // Tapered Wooden Palm Block
  // In first-person:
  // Back of palm faces +Z (toward user/camera)
  // Front of palm faces -Z (forward toward the clay)
  const palmGeo = new THREE.BoxGeometry(0.38, 0.50, 0.13);
  palmGeo.translate(0, 0.25, -0.02);
  const palm = new THREE.Mesh(palmGeo, woodMat);
  palm.castShadow = true;
  palm.receiveShadow = true;
  palmGroup.add(palm);

  // 5 Fingers Configuration:
  // For LEFT hand (viewer's left):
  // - Thumb is on MEDIAL side (+X toward right hand)
  // - Pinky is on LATERAL side (-X toward outer left)
  // For RIGHT hand (viewer's right):
  // - Thumb is on MEDIAL side (-X toward left hand)
  // - Pinky is on LATERAL side (+X toward outer right)
  const fingerConfigs = [
    { name: 'thumb',  x: isLeft ?  0.20 : -0.20, y: 0.16, z: -0.05, lengths: [0.14, 0.11, 0.09], radius: 0.038, baseRot: [0.30, isLeft ? -0.45 :  0.45, isLeft ? -0.25 :  0.25] },
    { name: 'index',  x: isLeft ?  0.12 : -0.12, y: 0.50, z: -0.02, lengths: [0.16, 0.13, 0.10], radius: 0.034, baseRot: [0.08, isLeft ? -0.04 :  0.04, 0] },
    { name: 'middle', x: isLeft ?  0.03 : -0.03, y: 0.52, z: -0.01, lengths: [0.18, 0.15, 0.11], radius: 0.035, baseRot: [0.06, 0, 0] },
    { name: 'ring',   x: isLeft ? -0.06 :  0.06, y: 0.50, z: -0.02, lengths: [0.16, 0.13, 0.10], radius: 0.033, baseRot: [0.08, isLeft ?  0.04 : -0.04, 0] },
    { name: 'pinky',  x: isLeft ? -0.15 :  0.15, y: 0.44, z: -0.03, lengths: [0.13, 0.10, 0.08], radius: 0.029, baseRot: [0.12, isLeft ?  0.08 : -0.08, 0] },
  ];

  const fingers = [];

  fingerConfigs.forEach(cfg => {
    const fingerRoot = new THREE.Group();
    fingerRoot.position.set(cfg.x, cfg.y, cfg.z);
    fingerRoot.rotation.set(...cfg.baseRot);
    palmGroup.add(fingerRoot);

    const joints = [];
    let currentParent = fingerRoot;

    cfg.lengths.forEach((len, idx) => {
      // Knuckle joint sphere
      const joint = createJoint(cfg.radius);
      currentParent.add(joint);

      // Phalanx segment
      const phalanx = createPhalanx(len, cfg.radius);
      phalanx.position.y = len / 2 + cfg.radius;
      currentParent.add(phalanx);

      // Next sub-joint pivot (bending around X curls finger forward into -Z toward clay)
      if (idx < cfg.lengths.length - 1) {
        const nextPivot = new THREE.Group();
        nextPivot.position.y = len + cfg.radius * 1.6;
        currentParent.add(nextPivot);
        currentParent = nextPivot;
        joints.push(nextPivot);
      }
    });

    fingers.push({
      name: cfg.name,
      root: fingerRoot,
      joints,
      radius: cfg.radius
    });
  });

  return {
    root: handRoot,
    palmGroup,
    fingers,
    isLeft
  };
}

// ── Build Left and Right Hands ───────────────────────────────
const leftHand = buildMannequinHand(true);
const rightHand = buildMannequinHand(false);

const handsGroup = new THREE.Group();
handsGroup.add(leftHand.root);
handsGroup.add(rightHand.root);
scene.add(handsGroup);

// Initial resting positions (First-person perspective extension of arms):
// Hands flank the clay safely outside the pot, hovering cleanly above the platter
const REST_LEFT =  { x: -0.92, y: -0.15, z: 0.85, rotX: -0.18, rotY:  0.26, rotZ:  0.08 };
const REST_RIGHT = { x:  0.92, y: -0.15, z: 0.85, rotX: -0.18, rotY: -0.26, rotZ: -0.08 };

leftHand.root.position.set(REST_LEFT.x, REST_LEFT.y, REST_LEFT.z);
leftHand.root.rotation.set(REST_LEFT.rotX, REST_LEFT.rotY, REST_LEFT.rotZ);

rightHand.root.position.set(REST_RIGHT.x, REST_RIGHT.y, REST_RIGHT.z);
rightHand.root.rotation.set(REST_RIGHT.rotX, REST_RIGHT.rotY, REST_RIGHT.rotZ);

// ── Dynamic 3D Update Loop ───────────────────────────────────
const handMotionState = {
  left: {
    pos: new THREE.Vector3(REST_LEFT.x, REST_LEFT.y, REST_LEFT.z),
    rootRot: new THREE.Vector3(REST_LEFT.rotX, REST_LEFT.rotY, REST_LEFT.rotZ),
    palmRot: new THREE.Vector3(-0.18, 0.26, 0.08),
    contact: false,
    pressure: 0,
    targetRing: 20
  },
  right: {
    pos: new THREE.Vector3(REST_RIGHT.x, REST_RIGHT.y, REST_RIGHT.z),
    rootRot: new THREE.Vector3(REST_RIGHT.rotX, REST_RIGHT.rotY, REST_RIGHT.rotZ),
    palmRot: new THREE.Vector3(-0.18, -0.26, -0.08),
    contact: false,
    pressure: 0,
    targetRing: 20
  }
};

function updateHandPositions(trackedHands, ringRadius, dt) {
  const LERP_POS = 18.0; // Snappy 60fps tracking
  const LERP_ROT = 16.0;
  const CLAY_BASE_Y = -1.35;
  const CLAY_TOP_Y = 1.05;
  const HEIGHT_SEGS = ringRadius.length - 1;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  [
    { side: 'left',  mesh: leftHand,  rest: REST_LEFT,  handData: trackedHands.left,  sign: -1, isLeft: true },
    { side: 'right', mesh: rightHand, rest: REST_RIGHT, handData: trackedHands.right, sign:  1, isLeft: false }
  ].forEach(({ side, mesh, rest, handData, sign, isLeft }) => {
    const st = handMotionState[side];

    if (handData && handData.active) {
      // 1. Natural Vertical Reach (Centered on comfortable chest/desk working zone):
      // screenY = 0.78 (resting low in camera) -> base of pot (targetY = -0.68)
      // screenY = 0.52 (chest/neck height) -> middle of pot (targetY = 0.12)
      // screenY = 0.26 (raised high) -> rim of pot (targetY = +0.95)
      const normY = clamp((0.78 - handData.screenY) / 0.52, 0, 1);
      
      // Platter surface is at Y = -1.10.
      // Clamping MIN_HAND_Y = -0.68 ensures the wrist sphere (r=0.13) stays cleanly 0.29 units above
      // the turntable platter, and the backward-sloping forearm never penetrates the table.
      const MIN_HAND_Y = -0.68;
      const MAX_HAND_Y =  0.95;
      const targetY = clamp(-0.68 + normY * 1.63, MIN_HAND_Y, MAX_HAND_Y);
      
      // Sculpting ring index: rings 4 to HEIGHT_SEGS (rings 0-3 are recessed inside wheel base)
      const ringIdx = clamp(Math.round(4 + normY * (HEIGHT_SEGS - 4)), 0, HEIGHT_SEGS);
      st.targetRing = ringIdx;

      // Calculate multi-ring vertical contour envelope of the hand
      // The hand spans from wrist (Y) through palm to fingertips (Y + 0.65)
      const ringBottom = clamp(Math.round(((targetY - CLAY_BASE_Y) / 2.4) * HEIGHT_SEGS), 0, HEIGHT_SEGS);
      const ringTop = clamp(Math.round(((targetY + 0.65 - CLAY_BASE_Y) / 2.4) * HEIGHT_SEGS), 0, HEIGHT_SEGS);
      let envelopeClayR = 0;
      for (let r = Math.min(ringBottom, ringTop); r <= Math.max(ringBottom, ringTop); r++) {
        if (ringRadius[r] && ringRadius[r] > envelopeClayR) {
          envelopeClayR = ringRadius[r];
        }
      }
      envelopeClayR = Math.max(0.40, envelopeClayR);

      // Radial safety buffer (palm depth + safety margin)
      const handSafetyMargin = 0.16;
      const minDistance = envelopeClayR + handSafetyMargin;
      const minFlankX = minDistance * sign;

      // 2. Natural Pottery Flanking Kinematics:
      // Left hand stays on left flank; Right hand stays on right flank.
      // Bringing hands together in camera cups the pot from both sides.
      let handSpanProgress = 0;
      if (sign > 0) {
        // Right hand: distance from camera center (0.50)
        handSpanProgress = (handData.screenX - 0.50) / 0.26;
      } else {
        // Left hand: distance from camera center (0.50)
        handSpanProgress = (0.50 - handData.screenX) / 0.26;
      }
      handSpanProgress = clamp(handSpanProgress, -0.25, 1.5);

      let targetX = 0;
      let inwardFactor = 0;

      if (handSpanProgress >= 0.40) {
        // Hand is hovering outside clay flank
        targetX = (minDistance + (handSpanProgress - 0.40) * 0.85) * sign;
      } else {
        // Hand is in contact with clay surface
        targetX = minFlankX;
        inwardFactor = clamp((0.40 - handSpanProgress) / 0.40, 0, 1);
      }

      // Depth (Z): naturally cupping slightly forward from pot axis
      let targetZ = clamp(0.58 - (handData.screenZ || 0) * 0.35, 0.42, 0.90);

      // Hard radial barrier against pot penetration in target calculation
      const candDist = Math.hypot(targetX, targetZ * 0.82);
      if (candDist < minDistance) {
        const pushRatio = minDistance / Math.max(0.01, candDist);
        targetX *= pushRatio;
        targetZ *= pushRatio;
      }

      // Contact state & gentle progressive carving
      st.contact = inwardFactor > 0.04;
      st.pressure = Math.pow(inwardFactor, 1.5);
      st.targetCarveR = Math.max(0.12, ringRadius[ringIdx] - inwardFactor * 0.14);

      // Smooth position towards target (60fps responsive lerp)
      st.pos.x += (targetX - st.pos.x) * LERP_POS * dt;
      st.pos.y += (targetY - st.pos.y) * LERP_POS * dt;
      st.pos.z += (targetZ - st.pos.z) * LERP_POS * dt;

      // ── HARD GEOMETRIC COLLISION ENFORCEMENT ON ACTUAL 3D POSITION ──
      // 1. Table floor barrier: never enter rotating platter
      if (st.pos.y < MIN_HAND_Y) st.pos.y = MIN_HAND_Y;

      // 2. Clay surface barrier: re-sample at actual st.pos.y to guarantee 0 penetration
      const actualRingBottom = clamp(Math.round(((st.pos.y - CLAY_BASE_Y) / 2.4) * HEIGHT_SEGS), 0, HEIGHT_SEGS);
      const actualRingTop = clamp(Math.round(((st.pos.y + 0.65 - CLAY_BASE_Y) / 2.4) * HEIGHT_SEGS), 0, HEIGHT_SEGS);
      let actualMaxR = 0;
      for (let r = Math.min(actualRingBottom, actualRingTop); r <= Math.max(actualRingBottom, actualRingTop); r++) {
        if (ringRadius[r] && ringRadius[r] > actualMaxR) {
          actualMaxR = ringRadius[r];
        }
      }
      actualMaxR = Math.max(0.40, actualMaxR);
      const actualSafeR = actualMaxR + handSafetyMargin;
      const actualDist = Math.hypot(st.pos.x, st.pos.z * 0.82);
      if (actualDist < actualSafeR) {
        const push = actualSafeR / Math.max(0.01, actualDist);
        st.pos.x *= push;
        st.pos.z *= push;
      }

      // 3. Side isolation: left hand cannot cross into right flank and vice versa
      if (sign < 0 && st.pos.x > -actualSafeR * 0.35) st.pos.x = -actualSafeR * 0.35;
      if (sign > 0 && st.pos.x < actualSafeR * 0.35) st.pos.x = actualSafeR * 0.35;

      // 3. Forearm Approach Angle (Anchored to bottom corners, reaching up to wrist):
      const targetRootRotX = -0.16 + (st.pos.y - (-0.15)) * 0.08;
      const targetRootRotY = (isLeft ? 0.22 : -0.22);
      const targetRootRotZ = (isLeft ? 0.06 : -0.06);

      st.rootRot.x += (targetRootRotX - st.rootRot.x) * LERP_ROT * dt;
      st.rootRot.y += (targetRootRotY - st.rootRot.y) * LERP_ROT * dt;
      st.rootRot.z += (targetRootRotZ - st.rootRot.z) * LERP_ROT * dt;

      // 4. Anatomically Constrained 3D Wrist Orientation:
      // Clamping to natural human wrist mobility prevents hands from flopping sideways!
      // - Twist (Pronation/Supination): rotation around Y axis (bone length)
      // - Pitch (Flexion/Extension): tilt forward/back
      // - Yaw (Lateral Deviation): slight sideways tilt
      const twistVal = clamp((handData.twist || 0) * 0.75, -0.65, 0.65);
      const pitchVal = clamp((handData.pitch || 0) * 0.65, -0.38, 0.28);
      const yawVal = clamp((handData.yaw || 0) * 0.40, -0.20, 0.20);

      const basePalmY = isLeft ? 0.32 : -0.32;
      const targetPalmRotY = basePalmY + twistVal;
      const targetPalmRotX = -0.18 + pitchVal;
      const targetPalmRotZ = (isLeft ? 0.06 : -0.06) + yawVal;

      st.palmRot.x += (targetPalmRotX - st.palmRot.x) * LERP_ROT * dt;
      st.palmRot.y += (targetPalmRotY - st.palmRot.y) * LERP_ROT * dt;
      st.palmRot.z += (targetPalmRotZ - st.palmRot.z) * LERP_ROT * dt;

      // 6. Full 5-Finger Articulation & Gestures
      const spreadDelta = ((handData.spread || 0.20) - 0.20) * 0.75;
      const surfaceClearance = Math.max(0, actualDist - actualMaxR);
      // Limit curl when touching clay so fingertips do not pierce into the clay mesh
      const maxCurlAllowed = 0.38 + surfaceClearance * 1.5;

      mesh.fingers.forEach((finger, fIdx) => {
        const curlVal = (handData.curls && handData.curls[fIdx] !== undefined) ? handData.curls[fIdx] : 0.12;
        const contactFlex = st.contact ? 0.25 * st.pressure : 0.0;
        const totalFlex = Math.max(0, Math.min(maxCurlAllowed, curlVal * 1.05 + contactFlex));

        // Sub-joint phalanx curling
        finger.joints.forEach((joint, jIdx) => {
          joint.rotation.x = -totalFlex * (0.36 + jIdx * 0.22);
        });

        // Finger spread / fan-out
        if (fIdx === 1) {
          // Index fans outward (medial for left, lateral for right)
          finger.root.rotation.z = (isLeft ? -0.05 : 0.05) + (isLeft ? -spreadDelta : spreadDelta);
        } else if (fIdx === 3) {
          // Ring finger fans outward slightly
          finger.root.rotation.z = (isLeft ? 0.04 : -0.04) + (isLeft ? spreadDelta * 0.5 : -spreadDelta * 0.5);
        } else if (fIdx === 4) {
          // Pinky finger fans outward
          finger.root.rotation.z = (isLeft ? 0.08 : -0.08) + (isLeft ? spreadDelta : -spreadDelta);
        } else if (fIdx === 0) {
          // Thumb curls inward across palm
          finger.root.rotation.y = (isLeft ? -0.45 : 0.45) + (isLeft ? totalFlex * 0.35 : -totalFlex * 0.35);
        }
      });

    } else {
      // Smooth return to resting studio stance
      st.contact = false;
      st.pressure = 0;
      st.pos.x += (rest.x - st.pos.x) * 3.5 * dt;
      st.pos.y += (rest.y - st.pos.y) * 3.5 * dt;
      st.pos.z += (rest.z - st.pos.z) * 3.5 * dt;

      // Table floor barrier for resting pose
      if (st.pos.y < -0.68) st.pos.y = -0.68;

      st.rootRot.x += (rest.rotX - st.rootRot.x) * 3.5 * dt;
      st.rootRot.y += (rest.rotY - st.rootRot.y) * 3.5 * dt;
      st.rootRot.z += (rest.rotZ - st.rootRot.z) * 3.5 * dt;

      const restPalmY = isLeft ? 0.28 : -0.28;
      const restPalmZ = isLeft ? 0.10 : -0.10;
      st.palmRot.x += (-0.18 - st.palmRot.x) * 3.5 * dt;
      st.palmRot.y += (restPalmY - st.palmRot.y) * 3.5 * dt;
      st.palmRot.z += (restPalmZ - st.palmRot.z) * 3.5 * dt;

      mesh.fingers.forEach(finger => {
        finger.joints.forEach(joint => {
          joint.rotation.x += (-0.16 - joint.rotation.x) * 3.0 * dt;
        });
      });
    }

    // Apply smoothed transforms
    mesh.root.position.copy(st.pos);
    mesh.root.rotation.set(st.rootRot.x, st.rootRot.y, st.rootRot.z);
    mesh.palmGroup.rotation.set(st.palmRot.x, st.palmRot.y, st.palmRot.z);
  });
}

// ── Exports ──────────────────────────────────────────────────
window.WoodenHands = {
  handsGroup,
  leftHand,
  rightHand,
  updateHandPositions,
  handMotionState
};

})();
