/* ============================================================
   CLAY HOME — Three.js Scene Setup
   ============================================================
   Creates the renderer, camera, lighting, and environment.
   Exports scene objects for use by other modules.
   ============================================================ */
(function() {
// Scene
const scene = new THREE.Scene();

// Camera — positioned to look naturally at the potter's wheel on the workbench
const camera = new THREE.PerspectiveCamera(
  40, window.innerWidth / window.innerHeight, 0.1, 100
);
camera.position.set(0, 0.95, 6.8);
camera.lookAt(0, 0.25, 0);

// Renderer — transparent so CSS studio background photo shows through cleanly
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Mount to DOM
const sceneEl = document.getElementById('scene');
sceneEl.appendChild(renderer.domElement);

// ── Lighting ─────────────────────────────────────────────────
// Primary sunbeam / key light matching the sunlight in studio_bg.jpg (upper-left)
const sunLight = new THREE.DirectionalLight(0xffeedd, 3.2);
sunLight.position.set(-3.2, 5.5, 3.5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 15;
sunLight.shadow.camera.left = -3;
sunLight.shadow.camera.right = 3;
sunLight.shadow.camera.top = 3;
sunLight.shadow.camera.bottom = -3;
sunLight.shadow.bias = -0.0008;
scene.add(sunLight);

// Warm bounce / fill light from the right wall
const fillLight = new THREE.SpotLight(0xffdfc4, 2.0, 18, Math.PI / 3.2, 0.5);
fillLight.position.set(3.5, 3.2, 4);
scene.add(fillLight);

// Soft backlight / rim light for sculptural edge definition
const rimLight = new THREE.PointLight(0xffebd6, 1.4, 12);
rimLight.position.set(0, 3.0, -2.5);
scene.add(rimLight);

// Ambient light matching warm room plaster tones
const hemiLight = new THREE.HemisphereLight(0xfff3e5, 0x5a4232, 1.6);
scene.add(hemiLight);

const ambientLight = new THREE.AmbientLight(0x73523c, 0.8);
scene.add(ambientLight);

// ── Potter's Wheel Assembly ───────────────────────────────────
// Central turntable group
const wheelGroup = new THREE.Group();
wheelGroup.position.y = -1.25;
scene.add(wheelGroup);

// Wheel Base Stand / Pedestal
const standMat = new THREE.MeshStandardMaterial({
  color: 0x2b211a,
  roughness: 0.85,
  metalness: 0.12
});
const stand = new THREE.Mesh(
  new THREE.CylinderGeometry(0.35, 0.45, 0.35, 36),
  standMat
);
stand.position.y = -0.18;
stand.castShadow = true;
stand.receiveShadow = true;
wheelGroup.add(stand);

// Lower turntable support platter
const wheelBaseMat = new THREE.MeshStandardMaterial({
  color: 0x3d281a,
  roughness: 0.65,
  metalness: 0.20
});
const wheelBase = new THREE.Mesh(
  new THREE.CylinderGeometry(1.75, 1.85, 0.14, 64),
  wheelBaseMat
);
wheelBase.position.y = 0.02;
wheelBase.receiveShadow = true;
wheelBase.castShadow = true;
wheelGroup.add(wheelBase);

// Rotating top disc (wooden platter with bevel & bronze outer rim)
const platterMat = new THREE.MeshStandardMaterial({
  color: 0x4a3020,
  roughness: 0.52,
  metalness: 0.15
});
const platter = new THREE.Mesh(
  new THREE.CylinderGeometry(1.68, 1.72, 0.08, 64),
  platterMat
);
platter.position.y = 0.11;
platter.receiveShadow = true;
platter.castShadow = true;
wheelGroup.add(platter);

// Outer decorative metallic brass rim
const rimMat = new THREE.MeshStandardMaterial({
  color: 0x8a623c,
  roughness: 0.38,
  metalness: 0.65
});
const rim = new THREE.Mesh(
  new THREE.TorusGeometry(1.70, 0.022, 16, 64),
  rimMat
);
rim.rotation.x = Math.PI / 2;
rim.position.y = 0.14;
wheelGroup.add(rim);

// Concentric concentric groove ring on turntable for authentic pottery wheel look
const innerRing = new THREE.Mesh(
  new THREE.TorusGeometry(1.1, 0.008, 12, 48),
  new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.7 })
);
innerRing.rotation.x = Math.PI / 2;
innerRing.position.y = 0.151;
wheelGroup.add(innerRing);

// Transparent Floor Shadow Catcher (lets workbench table photo show through perfectly!)
const floorGeo = new THREE.PlaneGeometry(16, 12);
const floorMat = new THREE.ShadowMaterial({ opacity: 0.32 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.45;
floor.receiveShadow = true;
scene.add(floor);

// ── Resize Handler ───────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Exports ──────────────────────────────────────────────────
window.ClayScene = {
  scene,
  camera,
  renderer,
  wheelBase,
  platter,
  wheelGroup
};

})();
