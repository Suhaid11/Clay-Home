/* ============================================================
   CLAY HOME — Sculpt / Render Loop
   ============================================================
   Main loop: spins the wheel, tracks 3D wooden hands, applies
   organic physical contact sculpting, handles mouse/touch drag,
   and renders the scene.
   ============================================================ */
(function() {
const { renderer, camera, scene, wheelBase, platter, wheelGroup } = window.ClayScene;
const {
  clay, ringRadius, rebuildClayGeometry, syncCap,
  HEIGHT_SEGMENTS
} = window.ClayMesh;
const { updateHandPositions, handMotionState, leftHand, rightHand } = window.WoodenHands;

// ── Sculpting Parameters ─────────────────────────────────────
let mode = 'sculpt'; // 'sculpt' | 'smooth'
let wheelSpeed = 24.0;

let toolRadius = 0.06;     // "Shape" slider mapped value
let toolForce = 0.055;     // "Pressure" slider mapped value

// ── API ──────────────────────────────────────────────────────
function setMode(m) { mode = m; }
function setWheelSpeed(s) { wheelSpeed = s; }
function setToolSize(s) { toolRadius = s; }
function setForce(f) { toolForce = f; }
function setFingerRadius(r) { /* scaled via toolRadius */ }
function setFingerForce(f) { /* scaled via toolForce */ }

// ── Mouse / Touch Direct Interaction ─────────────────────────
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isPointerDown = false;
let pointerRing = -1;
let pointerTargetRadius = 0.5;
let pointerIsSmooth = false;

const canvasEl = renderer.domElement;

function getCanvasCoords(e) {
  const rect = canvasEl.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: ((clientX - rect.left) / rect.width) * 2 - 1,
    y: -((clientY - rect.top) / rect.height) * 2 + 1
  };
}

function handlePointerMove(e) {
  if (!isPointerDown) return;
  const coords = getCanvasCoords(e);
  mouse.set(coords.x, coords.y);
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(clay);
  if (hits.length > 0) {
    const hit = hits[0];
    const hitY = hit.point.y;
    // Map hit Y to ring index (clay is from -1.35 to 1.05)
    const normY = Math.max(0, Math.min(1, (hitY - (-1.35)) / 2.4));
    pointerRing = Math.round(normY * HEIGHT_SEGMENTS);
    const hitDist = Math.hypot(hit.point.x, hit.point.z);
    pointerTargetRadius = Math.max(0.10, hitDist - 0.04);
  }
}

canvasEl.addEventListener('pointerdown', (e) => {
  // Only trigger on canvas or if not clicking UI buttons
  if (e.target.closest && e.target.closest('.cs-ux')) return;
  isPointerDown = true;
  handlePointerMove(e);
});

window.addEventListener('pointermove', handlePointerMove);
window.addEventListener('pointerup', () => {
  isPointerDown = false;
  pointerRing = -1;
});

// ── Animation Loop ───────────────────────────────────────────
let lastTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  // Spin the wheel platter and base
  const spinDelta = wheelSpeed * dt * 0.085;
  clay.rotation.y += spinDelta;
  if (wheelBase) wheelBase.rotation.y += spinDelta;
  if (platter) platter.rotation.y += spinDelta;

  // 1. Get 3D tracked hands from webcam
  const trackedHands = window.HandTracking.getTrackedHands();

  // 2. Update 3D wooden mannequin hands position & orientation
  updateHandPositions(trackedHands, ringRadius, dt);

  // 3. Apply Physical Contact-Based Sculpting (NO PINCH NEEDED!)
  let dirty = false;
  const sigma = 3.4 * (toolRadius / 0.06);
  const forceMult = (toolForce / 0.055);

  // Check left and right wooden mannequin hands for clay contact
  ['left', 'right'].forEach(side => {
    const st = handMotionState[side];
    if (!st.contact && st.pressure <= 0) return;

    dirty = true;
    const targetRing = st.targetRing;
    const handDistToAxis = Math.hypot(st.pos.x, st.pos.z);
    const targetR = (st.targetCarveR !== undefined) ? st.targetCarveR : Math.max(0.08, handDistToAxis - 0.08);
    const sculptSpeed = (0.75 + st.pressure * 1.35) * forceMult;

    for (let j = 0; j <= HEIGHT_SEGMENTS; j++) {
      const d = j - targetRing;
      const w = Math.exp(-(d * d) / (2 * sigma * sigma));
      if (w < 0.01) continue;

      if (mode === 'sculpt') {
        // Carve gently towards where the wooden hand is pressing
        ringRadius[j] += (targetR - ringRadius[j]) * w * sculptSpeed * dt;
      } else {
        // Smooth relaxation
        const prev = ringRadius[Math.max(0, j - 1)];
        const next = ringRadius[Math.min(HEIGHT_SEGMENTS, j + 1)];
        const avg = (prev + next) / 2;
        ringRadius[j] += (avg - ringRadius[j]) * w * 2.8 * dt;
      }
      ringRadius[j] = Math.max(0.08, Math.min(2.1, ringRadius[j]));
    }
  });

  // Direct pointer (mouse/touch) sculpting
  if (isPointerDown && pointerRing >= 0) {
    dirty = true;
    for (let j = 0; j <= HEIGHT_SEGMENTS; j++) {
      const d = j - pointerRing;
      const w = Math.exp(-(d * d) / (2 * sigma * sigma));
      if (w < 0.01) continue;

      if (mode === 'sculpt') {
        ringRadius[j] += (pointerTargetRadius - ringRadius[j]) * w * 1.8 * forceMult * dt;
      } else {
        const prev = ringRadius[Math.max(0, j - 1)];
        const next = ringRadius[Math.min(HEIGHT_SEGMENTS, j + 1)];
        const avg = (prev + next) / 2;
        ringRadius[j] += (avg - ringRadius[j]) * w * 4.5 * dt;
      }
      ringRadius[j] = Math.max(0.08, Math.min(2.1, ringRadius[j]));
    }
  }

  // Rebuild mesh when sculpted
  if (dirty) {
    rebuildClayGeometry();
    syncCap();
  }

  // Render 3D Scene
  renderer.render(scene, camera);
}

// Start loop
requestAnimationFrame(animate);

// ── Exports ──────────────────────────────────────────────────
window.SculptLoop = {
  setMode,
  setWheelSpeed,
  setToolSize,
  setForce,
  setFingerRadius,
  setFingerForce
};

})();
