/* ============================================================
   CLAY HOME — 3D MediaPipe Hand Tracking (Full 3D Gestures)
   ============================================================
   Captures webcam, runs MediaPipe Hands with temporal smoothing,
   and computes true 3D wrist twist, pitch, yaw, finger flex,
   anchored at the wrist so twisting does NOT shift hand position.
   ============================================================ */
(function() {
const video = document.getElementById('video');
const skeletonCanvas = document.getElementById('skeleton');
const skCtx = skeletonCanvas.getContext('2d');
const statusEl = document.getElementById('status');
const webcamPreview = document.getElementById('webcam-preview');

// ── Multi-Colored Skeleton Bone Groups ───────────────────────
const BONE_GROUPS = [
  // Thumb (bright orange)
  { conns: [[0,1],[1,2],[2,3],[3,4]], color: '#f97316' },
  // Index (bright cyan)
  { conns: [[0,5],[5,6],[6,7],[7,8]], color: '#06b6d4' },
  // Middle (emerald green)
  { conns: [[0,9],[9,10],[10,11],[11,12]], color: '#10b981' },
  // Ring (amber gold)
  { conns: [[0,13],[13,14],[14,15],[15,16]], color: '#f59e0b' },
  // Pinky (vibrant magenta pink)
  { conns: [[0,17],[17,18],[18,19],[19,20]], color: '#ec4899' },
  // Palm bridges (electric purple)
  { conns: [[5,9],[9,13],[13,17]], color: '#a855f7' }
];

const TIP_INDICES = new Set([4, 8, 12, 16, 20]);

// Temporal smoothing cache for all landmarks
const smoothedLandmarks = [];
const LANDMARK_SMOOTH_FACTOR = 0.75; // Snappy, low-latency smoothing

function smoothLandmarkSet(rawHands) {
  const result = [];

  rawHands.forEach((rawLm, hIdx) => {
    if (!smoothedLandmarks[hIdx]) {
      smoothedLandmarks[hIdx] = rawLm.map(p => ({ x: p.x, y: p.y, z: p.z || 0 }));
    }

    const currentSmooth = smoothedLandmarks[hIdx];
    const handResult = [];

    rawLm.forEach((p, pIdx) => {
      const target = currentSmooth[pIdx];
      const dist = Math.hypot(p.x - target.x, p.y - target.y);
      const alpha = Math.min(0.92, Math.max(LANDMARK_SMOOTH_FACTOR, dist * 6.0));

      target.x += (p.x - target.x) * alpha;
      target.y += (p.y - target.y) * alpha;
      target.z += ((p.z || 0) - target.z) * alpha;

      handResult.push({ x: target.x, y: target.y, z: target.z });
    });

    result.push(handResult);
  });

  smoothedLandmarks.length = rawHands.length;
  return result;
}

// ── Draw Polished Glowing Skeleton Pointers ───────────────────
function drawSkeleton(smoothedHands, handSides = []) {
  skCtx.clearRect(0, 0, skeletonCanvas.width, skeletonCanvas.height);
  if (!smoothedHands || smoothedHands.length === 0) return;

  const W = skeletonCanvas.width;
  const H = skeletonCanvas.height;

  smoothedHands.forEach((lm, hIdx) => {
    skCtx.lineCap = 'round';
    skCtx.lineJoin = 'round';

    BONE_GROUPS.forEach(group => {
      skCtx.strokeStyle = group.color;
      skCtx.lineWidth = 3.6;
      skCtx.shadowColor = group.color;
      skCtx.shadowBlur = 6;

      group.conns.forEach(([a, b]) => {
        const pa = lm[a];
        const pb = lm[b];
        if (!pa || !pb) return;
        skCtx.beginPath();
        skCtx.moveTo(pa.x * W, pa.y * H);
        skCtx.lineTo(pb.x * W, pb.y * H);
        skCtx.stroke();
      });
    });

    skCtx.shadowBlur = 0;

    lm.forEach((p, idx) => {
      const isTip = TIP_INDICES.has(idx);
      const px = p.x * W;
      const py = p.y * H;

      skCtx.fillStyle = isTip ? 'rgba(240, 130, 80, 0.95)' : 'rgba(255, 255, 255, 0.85)';
      skCtx.beginPath();
      skCtx.arc(px, py, isTip ? 5.2 : 3.8, 0, Math.PI * 2);
      skCtx.fill();

      skCtx.fillStyle = isTip ? '#ffffff' : '#fff8f0';
      skCtx.beginPath();
      skCtx.arc(px, py, isTip ? 2.6 : 1.8, 0, Math.PI * 2);
      skCtx.fill();
    });

    // Draw readable L / R badge at wrist (un-mirrored text)
    const wrist = lm[0];
    if (wrist && handSides[hIdx]) {
      const wx = wrist.x * W;
      const wy = Math.min(H - 12, wrist.y * H + 18);
      const label = handSides[hIdx] === 'left' ? 'LEFT' : 'RIGHT';

      skCtx.save();
      // Counteract CSS scaleX(-1) so text reads normally
      skCtx.translate(wx, wy);
      skCtx.scale(-1, 1);

      skCtx.fillStyle = 'rgba(15, 10, 8, 0.75)';
      skCtx.beginPath();
      skCtx.roundRect(-18, -9, 36, 18, 4);
      skCtx.fill();

      skCtx.strokeStyle = handSides[hIdx] === 'left' ? '#06b6d4' : '#f97316';
      skCtx.lineWidth = 1.2;
      skCtx.stroke();

      skCtx.fillStyle = '#ffffff';
      skCtx.font = 'bold 9px Inter, sans-serif';
      skCtx.textAlign = 'center';
      skCtx.textBaseline = 'middle';
      skCtx.fillText(label, 0, 0);

      skCtx.restore();
    }
  });
}

// ── 3D Tracking State ────────────────────────────────────────
const trackedHands = {
  left: {
    active: false,
    screenX: 0.25, screenY: 0.5, screenZ: 0,
    span: 0.25,
    pitch: 0, yaw: 0, twist: 0,
    curls: [0.1, 0.1, 0.1, 0.1, 0.1],
    spread: 0.2,
    contact: false,
    pressure: 0
  },
  right: {
    active: false,
    screenX: 0.75, screenY: 0.5, screenZ: 0,
    span: 0.25,
    pitch: 0, yaw: 0, twist: 0,
    curls: [0.1, 0.1, 0.1, 0.1, 0.1],
    spread: 0.2,
    contact: false,
    pressure: 0
  }
};

const POSITION_SMOOTH = 0.75;
const ROTATION_SMOOTH = 0.70;
let refHandSpan = 0.28;

// Helper: compute curl of fingers (0 = straight open, 1 = curled)
// Uses segment length contraction ratio in 2D image plane — scale-invariant and robust to depth noise
function computeFingerCurl(lm, mcpIdx, pipIdx, dipIdx, tipIdx) {
  const mcp = lm[mcpIdx];
  const pip = lm[pipIdx];
  const dip = lm[dipIdx];
  const tip = lm[tipIdx];
  if (!mcp || !pip || !dip || !tip) return 0.1;

  const d1 = Math.hypot(pip.x - mcp.x, pip.y - mcp.y);
  const d2 = Math.hypot(dip.x - pip.x, dip.y - pip.y);
  const d3 = Math.hypot(tip.x - dip.x, tip.y - dip.y);
  const totalLen = (d1 + d2 + d3) || 1e-4;

  const tipToMcp = Math.hypot(tip.x - mcp.x, tip.y - mcp.y);
  const ratio = tipToMcp / totalLen;

  // Extended straight: ratio >= 0.82 -> curl = 0
  // Curled into fist: ratio <= 0.32 -> curl = 1
  const curl = (0.82 - ratio) / 0.50;
  return Math.max(0, Math.min(1, curl));
}

function computeThumbCurl(lm) {
  const mcp = lm[2];
  const ip = lm[3];
  const tip = lm[4];
  const pinkyMcp = lm[17];
  const indexMcp = lm[5];
  if (!mcp || !ip || !tip || !pinkyMcp || !indexMcp) return 0.1;

  const d1 = Math.hypot(ip.x - mcp.x, ip.y - mcp.y);
  const d2 = Math.hypot(tip.x - ip.x, tip.y - ip.y);
  const thumbLen = (d1 + d2) || 1e-4;

  const tipToMcp = Math.hypot(tip.x - mcp.x, tip.y - mcp.y);
  const ratio = tipToMcp / thumbLen;

  // Check distance to pinky knuckle across palm
  const palmWidth = Math.hypot(pinkyMcp.x - indexMcp.x, pinkyMcp.y - indexMcp.y) || 1e-4;
  const tipToPinky = Math.hypot(tip.x - pinkyMcp.x, tip.y - pinkyMcp.y) / palmWidth;

  const flexCurl = (0.84 - ratio) / 0.44;
  const foldCurl = (1.40 - tipToPinky) / 0.60;
  const curl = Math.max(flexCurl, foldCurl * 0.85);
  return Math.max(0, Math.min(1, curl));
}

// ── MediaPipe Setup (60 FPS Performance Mode) ────────────────
const hands = new Hands({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
});
hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 0, // High-speed 60fps tracking model
  minDetectionConfidence: 0.55,
  minTrackingConfidence: 0.50
});

let activeSingleSide = null;

hands.onResults(results => {
  const rawHands = results.multiHandLandmarks || [];
  const multiHandedness = results.multiHandedness || [];
  const smoothedHands = smoothLandmarkSet(rawHands);

  if (webcamPreview) {
    webcamPreview.classList.toggle('tracking', smoothedHands.length > 0);
  }

  // Reset active flags
  trackedHands.left.active = false;
  trackedHands.right.active = false;

  if (smoothedHands.length === 0) {
    activeSingleSide = null;
    drawSkeleton([], []);
    if (statusEl && video.dataset.ready) {
      statusEl.textContent = 'show your hands to the camera';
    }
    return;
  }

  // Parse smoothed hand detections
  const detected = smoothedHands.map((lm, idx) => {
    const wrist = lm[0];
    const indexMcp = lm[5];
    const middleMcp = lm[9];
    const ringMcp = lm[13];
    const pinkyMcp = lm[17];

    // Palm center position in mirrored screen space
    const screenX = 1 - (wrist.x * 0.6 + middleMcp.x * 0.4);
    const screenY = wrist.y * 0.4 + middleMcp.y * 0.6;

    // MediaPipe handedness in un-mirrored camera feed:
    // Camera's "Left" = user's physical RIGHT hand!
    // Camera's "Right" = user's physical LEFT hand!
    const rawLabel = (multiHandedness[idx] && multiHandedness[idx].label) ? multiHandedness[idx].label : null;
    const anatomicalSide = rawLabel ? (rawLabel === 'Left' ? 'right' : 'left') : null;

    // Hand scale / span (depth proxy)
    const spanA = Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y);
    const spanB = Math.hypot(indexMcp.x - pinkyMcp.x, indexMcp.y - pinkyMcp.y);
    const currentSpan = spanA + spanB;

    if (currentSpan > 0.10) {
      refHandSpan += (currentSpan - refHandSpan) * 0.015;
    }
    const depthRatio = Math.max(0.4, Math.min(2.0, currentSpan / (refHandSpan || 0.28)));
    const screenZ = (depthRatio - 1.0) * 1.2;

    // ── 3D Direction Vectors for Full 3D Orientation ─────────────
    // In mirrored screen space:
    // +X is right, +Y is UP, +Z is towards user/camera
    const p0 = wrist;
    const p5 = indexMcp;
    const p9 = middleMcp;
    const p17 = pinkyMcp;

    // Wrist to Middle MCP (Pointing UP along palm)
    const fwdX = (1 - p9.x) - (1 - p0.x);
    const fwdY = (1 - p9.y) - (1 - p0.y); // pointing up
    const fwdZ = -((p9.z || 0) - (p0.z || 0)); // pointing towards camera

    const fwdLen = Math.hypot(fwdX, fwdY, fwdZ) || 1e-4;
    const nFwdX = fwdX / fwdLen;
    const nFwdY = fwdY / fwdLen;
    const nFwdZ = fwdZ / fwdLen;

    // Lateral knuckle axis across palm (Medial -> Lateral)
    // In mirrored selfie space:
    // User's Left hand: Index is medial (inner, +X side), Pinky is lateral (outer, -X side)
    // User's Right hand: Index is medial (inner, -X side), Pinky is lateral (outer, +X side)
    const isAnatLeft = anatomicalSide === 'left' || (!anatomicalSide && screenX < 0.5);
    
    // Transverse axis pointing laterally across hand
    const rawSideX = (1 - p17.x) - (1 - p5.x);
    const rawSideY = (1 - p17.y) - (1 - p5.y);
    const rawSideZ = -((p17.z || 0) - (p5.z || 0));
    const sideLen = Math.hypot(rawSideX, rawSideY, rawSideZ) || 1e-4;
    
    const latX = rawSideX / sideLen;
    const latY = rawSideY / sideLen;
    const latZ = rawSideZ / sideLen;

    // Anatomical Palm Normal (consistently pointing OUT of palm toward camera):
    let normX, normY, normZ;
    if (isAnatLeft) {
      // Left hand: knuckles go +X to -X (lat points left) -> Fwd x Lat points OUT towards camera (+Z)
      normX = nFwdY * latZ - nFwdZ * latY;
      normY = nFwdZ * latX - nFwdX * latZ;
      normZ = nFwdX * latY - nFwdY * latX;
    } else {
      // Right hand: knuckles go -X to +X (lat points right) -> Lat x Fwd points OUT towards camera (+Z)
      normX = latY * nFwdZ - latZ * nFwdY;
      normY = latZ * nFwdX - latX * nFwdZ;
      normZ = latX * nFwdY - latY * nFwdX;
    }

    // Pitch: Hand tilting forward into screen (towards clay) vs backward towards user
    // Folding backward tilts backward (+X rotation), folding forward tilts forward (-X rotation)
    const pitch = Math.atan2(-nFwdZ * 2.8, Math.max(0.08, Math.hypot(nFwdX, nFwdY)));

    // Yaw: Hand turning left vs right across screen plane
    const yaw = Math.atan2(nFwdX * 1.3, Math.max(0.08, nFwdY));

    // Wrist Twist (Pronation / Supination):
    // Amplified horizontal tilt of palm normal vector
    const twist = Math.atan2(normX * 2.6, Math.max(0.05, normZ));

    // Robust 5-Finger curls (flexion) from 0 (open) to 1 (closed fist)
    const curls = [
      computeThumbCurl(lm),
      computeFingerCurl(lm, 5, 6, 7, 8),    // Index
      computeFingerCurl(lm, 9, 10, 11, 12),  // Middle
      computeFingerCurl(lm, 13, 14, 15, 16), // Ring
      computeFingerCurl(lm, 17, 18, 19, 20)  // Pinky
    ];

    // Finger spread (fan-out)
    const spread = Math.hypot(p5.x - p17.x, p5.y - p17.y);

    return {
      origIdx: idx,
      anatomicalSide,
      screenX, screenY, screenZ,
      currentSpan,
      pitch, yaw, twist,
      roll: twist,
      normal: { x: normX, y: normY, z: normZ },
      curls,
      spread
    };
  });

  const handSides = [];

  // Assign to left/right hands correctly
  if (detected.length === 1) {
    const h = detected[0];
    let side;
    if (activeSingleSide) {
      // Hysteresis: keep active side unless hand crosses far across the screen
      if (activeSingleSide === 'right' && h.screenX < 0.35) {
        side = 'left';
      } else if (activeSingleSide === 'left' && h.screenX > 0.65) {
        side = 'right';
      } else {
        side = activeSingleSide;
      }
    } else {
      // In mirrored selfie space: screenX >= 0.50 is user's physical right hand
      side = h.screenX >= 0.50 ? 'right' : 'left';
    }
    activeSingleSide = side;

    handSides[h.origIdx] = side;
    applyDetection(trackedHands[side], h);
  } else if (detected.length >= 2) {
    activeSingleSide = null;
    // Leftmost hand on mirrored screen is user's physical LEFT hand
    // Rightmost hand on mirrored screen is user's physical RIGHT hand
    detected.sort((a, b) => a.screenX - b.screenX);
    detected[0].assignedSide = 'left';
    detected[1].assignedSide = 'right';

    handSides[detected[0].origIdx] = 'left';
    handSides[detected[1].origIdx] = 'right';

    applyDetection(trackedHands.left, detected[0]);
    applyDetection(trackedHands.right, detected[1]);
  }

  // Draw skeleton pointers with confirmed handedness badges
  drawSkeleton(smoothedHands, handSides);

  function applyDetection(target, data) {
    target.active = true;
    target.screenX += (data.screenX - target.screenX) * POSITION_SMOOTH;
    target.screenY += (data.screenY - target.screenY) * POSITION_SMOOTH;
    target.screenZ += (data.screenZ - target.screenZ) * POSITION_SMOOTH;
    target.span += (data.currentSpan - target.span) * POSITION_SMOOTH;

    target.pitch += (data.pitch - target.pitch) * ROTATION_SMOOTH;
    target.yaw += (data.yaw - target.yaw) * ROTATION_SMOOTH;
    target.twist += (data.twist - target.twist) * ROTATION_SMOOTH;
    target.roll = target.twist;
    target.spread += (data.spread - target.spread) * ROTATION_SMOOTH;

    for (let c = 0; c < 5; c++) {
      target.curls[c] += (data.curls[c] - target.curls[c]) * 0.45;
    }
  }

  // Update status UI
  if (statusEl && video.dataset.ready) {
    const activeCount = (trackedHands.left.active ? 1 : 0) + (trackedHands.right.active ? 1 : 0);
    if (activeCount === 2) {
      const dist = Math.hypot(
        trackedHands.right.screenX - trackedHands.left.screenX,
        trackedHands.right.screenY - trackedHands.left.screenY
      );
      if (dist < 0.36) {
        statusEl.textContent = 'cupping clay — shaping together';
      } else {
        statusEl.textContent = 'both hands active — bring closer to shape';
      }
    } else if (activeCount === 1) {
      statusEl.textContent = 'hand active — touch clay to shape';
    }
  }
});

// ── Start Camera ─────────────────────────────────────────────
async function startCamera() {
  const loadingBar = document.getElementById('ls-bar');
  const loadingStatus = document.getElementById('ls-status');

  try {
    if (loadingStatus) loadingStatus.textContent = 'Requesting camera…';
    if (loadingBar) loadingBar.style.width = '40%';

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 60, min: 30 },
        facingMode: 'user'
      },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
    video.dataset.ready = '1';

    skeletonCanvas.width = video.videoWidth || 320;
    skeletonCanvas.height = video.videoHeight || 240;

    if (loadingStatus) loadingStatus.textContent = 'Loading hand tracking…';
    if (loadingBar) loadingBar.style.width = '70%';

    const mpCam = new Camera(video, {
      onFrame: async () => { await hands.send({ image: video }); },
      width: 640,
      height: 480
    });
    mpCam.start();

    if (loadingStatus) loadingStatus.textContent = 'READY';
    if (loadingBar) loadingBar.style.width = '100%';

    statusEl.textContent = 'bring hands near the clay to shape';
    return true;
  } catch (e) {
    statusEl.textContent = 'click and drag on clay to sculpt';
    if (loadingStatus) loadingStatus.textContent = 'Camera not available — use mouse/touch';
    if (loadingBar) loadingBar.style.width = '100%';
    return false;
  }
}

// ── Exports ──────────────────────────────────────────────────
window.HandTracking = {
  startCamera,
  getTrackedHands: () => trackedHands
};

})();
