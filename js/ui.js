/* ============================================================
   CLAY HOME — UI Wiring
   ============================================================
   Connects all frosted-glass panel elements to the engine
   modules: tool switching, sliders, color pickers, reset, etc.
   ============================================================ */

(function () {
  // ── Tool Dock ────────────────────────────────────────────────
  const tools = document.querySelectorAll('#cs-tooldock .cs-tool');
  const panels = {
    sculpt:    document.getElementById('panel-sculpt'),
    shape:     document.getElementById('panel-shape'),
    smooth:    document.getElementById('panel-smooth'),
    materials: document.getElementById('panel-materials')
  };

  function closeAllPanels() {
    Object.values(panels).forEach(p => p && p.classList.remove('open'));
  }

  function openPanelForTool(toolName) {
    closeAllPanels();
    if (panels[toolName]) {
      panels[toolName].classList.add('open');
    }
  }

  tools.forEach(t => t.addEventListener('click', () => {
    const wasActive = t.classList.contains('active');
    tools.forEach(x => x.classList.remove('active'));

    if (wasActive) {
      closeAllPanels();
    } else {
      t.classList.add('active');
      openPanelForTool(t.dataset.tool);

      // Update sculpt mode
      if (t.dataset.tool === 'sculpt' || t.dataset.tool === 'shape') {
        window.SculptLoop.setMode('sculpt');
      } else if (t.dataset.tool === 'smooth') {
        window.SculptLoop.setMode('smooth');
      }
    }
  }));

  // Default: open Sculpt
  const sculptTool = document.querySelector('[data-tool="sculpt"]');
  if (sculptTool) {
    sculptTool.classList.add('active');
    openPanelForTool('sculpt');
  }

  // Close buttons on each panel
  document.querySelectorAll('.cs-panel-close').forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllPanels();
      tools.forEach(x => x.classList.remove('active'));
    });
  });

  // ── Helper: Wire a slider ────────────────────────────────────
  function wireSlider(id, format, onChange) {
    const el = document.getElementById(id);
    const vl = document.getElementById(id + '-v');
    if (!el || !vl) return;
    const apply = () => {
      const v = parseFloat(el.value);
      vl.textContent = format(v);
      if (onChange) onChange(v);
    };
    el.addEventListener('input', apply);
    apply(); // initial
  }

  // ── Sculpt Panel (Adjust) ────────────────────────────────────
  wireSlider('cs-shape', v => v.toFixed(0) + '%', v => {
    const t = v / 100;
    const tool = 0.02 + t * (0.14 - 0.02);
    window.SculptLoop.setToolSize(tool);
  });

  wireSlider('cs-pressure', v => v.toFixed(0) + '%', v => {
    const t = v / 100;
    const force = 0.005 + t * (0.20 - 0.005);
    window.SculptLoop.setForce(force);
  });

  // ── Smooth Panel ─────────────────────────────────────────────
  wireSlider('cs-smooth-strength', v => v.toFixed(0) + '%');

  const smoothApply = document.getElementById('cs-smooth-apply');
  if (smoothApply) {
    smoothApply.addEventListener('click', () => {
      const slider = document.getElementById('cs-smooth-strength');
      const pct = slider ? parseFloat(slider.value) : 35;
      const k = 0.02 + (pct / 100) * (0.45 - 0.02);
      window.ClayMesh.smoothPass(k);
    });
  }

  // ── Shape Panel ──────────────────────────────────────────────
  const shapePresets = document.querySelectorAll('.cs-shape-preset');
  let currentShape = 'bell';

  shapePresets.forEach(p => {
    p.addEventListener('click', () => {
      shapePresets.forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      currentShape = p.dataset.shape || 'bell';
      window.ClayMesh.setShape({ shape: currentShape });
    });
  });

  wireSlider('cs-shape-base', v => v.toFixed(2));
  wireSlider('cs-shape-top', v => v.toFixed(2));

  const shapeApply = document.getElementById('cs-shape-apply');
  if (shapeApply) {
    shapeApply.addEventListener('click', () => {
      window.ClayMesh.setShape({ shape: currentShape });
    });
  }

  // ── Materials Panel ──────────────────────────────────────────
  const matColor = document.getElementById('cs-mat-color');
  const matHex = document.getElementById('cs-mat-hex');
  const colorPresets = document.querySelectorAll('.cs-mat-preset[data-color]');

  function setClayColor(hex) {
    if (!hex) return;
    const norm = hex.toUpperCase();
    if (matColor) matColor.value = norm.toLowerCase();
    if (matHex) matHex.textContent = norm;
    colorPresets.forEach(p => p.classList.toggle('active',
      (p.dataset.color || '').toUpperCase() === norm));
    window.ClayMesh.setClayColor(hex);
  }

  if (matColor) {
    matColor.addEventListener('input', e => setClayColor(e.target.value));
  }

  colorPresets.forEach(p => {
    p.addEventListener('click', () => setClayColor(p.dataset.color));
  });

  // ── Speed Slider ─────────────────────────────────────────────
  wireSlider('cs-speed', v => v.toFixed(2), v => {
    window.SculptLoop.setWheelSpeed(v);
  });

  // ── Reset Button ─────────────────────────────────────────────
  const resetBtn = document.getElementById('cs-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      window.ClayMesh.resetProfile();
      window.ClayMesh.rebuildClayGeometry();
      window.ClayMesh.syncCap();
    });
  }
})();
