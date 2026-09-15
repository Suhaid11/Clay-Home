/* ============================================================
   CLAY HOME — Clay Mesh (Ring-Radius Model)
   ============================================================ */
(function() {
/* The clay is modelled as a lathe surface: N height "rings",
   each with a single shared radius. Sculpting == changing a
   ring's radius. The wheel spins the geometry, so the result
   is always rotationally symmetric — just like real pottery.
   ============================================================ */

const RADIAL_SEGMENTS = 56;
const HEIGHT_SEGMENTS = 44;
const POT_HEIGHT = 2.4;

// ── Shape Profiles ───────────────────────────────────────────
const PROFILES = {
  bell: (j) => {
    const t = j / HEIGHT_SEGMENTS;
    return 0.55 + 0.5 * Math.sin(t * Math.PI * 0.85) - 0.15 * t * t;
  },
  cylinder: (j) => {
    const t = j / HEIGHT_SEGMENTS;
    const base = 0.65;
    return base - 0.05 * t;
  },
  square: (j) => {
    return 0.6;
  }
};

let currentProfile = 'bell';
let ringRadius = new Float32Array(HEIGHT_SEGMENTS + 1);

function resetProfile(profileName) {
  currentProfile = profileName || currentProfile;
  const fn = PROFILES[currentProfile] || PROFILES.bell;
  for (let j = 0; j <= HEIGHT_SEGMENTS; j++) {
    ringRadius[j] = fn(j);
  }
}
resetProfile('bell');

// ── Geometry ─────────────────────────────────────────────────
const clayGeo = new THREE.CylinderGeometry(
  1, 1, POT_HEIGHT, RADIAL_SEGMENTS, HEIGHT_SEGMENTS, true
);
const posAttr = clayGeo.attributes.position;
const vertexRing = new Int32Array(posAttr.count);
const vertexAngle = new Float32Array(posAttr.count);

for (let i = 0; i < posAttr.count; i++) {
  const y = posAttr.getY(i);
  const t = (y + POT_HEIGHT / 2) / POT_HEIGHT;
  const ring = Math.round(t * HEIGHT_SEGMENTS);
  vertexRing[i] = ring;
  vertexAngle[i] = Math.atan2(posAttr.getZ(i), posAttr.getX(i));
}

function rebuildClayGeometry() {
  for (let i = 0; i < posAttr.count; i++) {
    const r = ringRadius[vertexRing[i]];
    posAttr.setX(i, r * Math.cos(vertexAngle[i]));
    posAttr.setZ(i, r * Math.sin(vertexAngle[i]));
  }
  posAttr.needsUpdate = true;
  clayGeo.computeVertexNormals();
}
rebuildClayGeometry();

// ── Material ─────────────────────────────────────────────────
const clayMat = new THREE.MeshStandardMaterial({
  color: 0xa8562b,
  roughness: 0.58,
  metalness: 0.04,
  side: THREE.DoubleSide
});

const clay = new THREE.Mesh(clayGeo, clayMat);
clay.position.y = -0.15;
clay.castShadow = true;
clay.receiveShadow = true;

// Bottom cap
const cap = new THREE.Mesh(
  new THREE.CircleGeometry(1, RADIAL_SEGMENTS),
  clayMat
);
cap.rotation.x = -Math.PI / 2;
cap.position.y = clay.position.y - POT_HEIGHT / 2;

function syncCap() {
  cap.scale.set(ringRadius[0], ringRadius[0], 1);
}

// Add to scene
const { scene } = window.ClayScene;
scene.add(clay);
scene.add(cap);

// ── Set Clay Color ───────────────────────────────────────────
function setClayColor(hex) {
  clayMat.color.set(hex);
}

// ── Set Shape ────────────────────────────────────────────────
function setShape(opts) {
  if (opts.shape && PROFILES[opts.shape]) {
    currentProfile = opts.shape;
  }
  resetProfile(currentProfile);
  rebuildClayGeometry();
  syncCap();
}

// ── Smooth Pass ──────────────────────────────────────────────
function smoothPass(k) {
  for (let iter = 0; iter < 5; iter++) {
    const tmp = new Float32Array(ringRadius);
    for (let j = 1; j < HEIGHT_SEGMENTS; j++) {
      const avg = (tmp[j - 1] + tmp[j + 1]) / 2;
      ringRadius[j] += (avg - ringRadius[j]) * k;
    }
  }
  rebuildClayGeometry();
  syncCap();
}

// ── Exports ──────────────────────────────────────────────────
window.ClayMesh = {
  clay,
  cap,
  clayMat,
  clayGeo,
  ringRadius,
  vertexRing,
  vertexAngle,
  posAttr,
  rebuildClayGeometry,
  syncCap,
  resetProfile,
  setClayColor,
  setShape,
  smoothPass,
  RADIAL_SEGMENTS,
  HEIGHT_SEGMENTS,
  POT_HEIGHT,
  PROFILES
};

})();

