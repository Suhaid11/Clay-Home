/* ============================================================
   CLAY HOME — App Orchestrator
   ============================================================
   Manages the loading sequence, progress bar, and the
   transition from loading screen to the live app.
   Always dismisses the loading screen, even if camera fails.
   ============================================================ */

(async function () {
  const loadingScreen = document.getElementById('loading-screen');
  const loadingBar = document.getElementById('ls-bar');
  const loadingStatus = document.getElementById('ls-status');

  function setProgress(pct, msg) {
    if (loadingBar) loadingBar.style.width = pct + '%';
    if (loadingStatus) loadingStatus.textContent = msg;
  }

  // Phase 1: Scene is already created by scene.js
  setProgress(15, 'Building scene…');
  await new Promise(r => setTimeout(r, 300));

  // Phase 2: Clay mesh created by clay.js
  setProgress(30, 'Shaping clay…');
  await new Promise(r => setTimeout(r, 300));

  // Phase 3: Wooden hands created by wooden-hands.js
  setProgress(45, 'Positioning hands…');
  await new Promise(r => setTimeout(r, 200));

  // Phase 4: Start camera & hand tracking (don't block if camera fails)
  setProgress(55, 'Requesting camera…');

  // Use a timeout so the app loads even if camera permission hangs
  const cameraPromise = window.HandTracking.startCamera();
  const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(false), 5000));
  const cameraOk = await Promise.race([cameraPromise, timeoutPromise]);

  if (cameraOk) {
    setProgress(90, 'Almost ready…');
  } else {
    setProgress(90, 'No camera — mouse sculpting available');
  }
  await new Promise(r => setTimeout(r, 400));

  // Phase 5: All ready — remove loading screen
  setProgress(100, 'READY');
  await new Promise(r => setTimeout(r, 600));

  loadingScreen.classList.add('hidden');
  document.body.classList.remove('app-loading');

  // Clean up loading screen after CSS transition
  setTimeout(() => {
    loadingScreen.style.display = 'none';
  }, 1000);
})();
