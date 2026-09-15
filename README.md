# 🏺 Clay Home — Interactive Virtual Pottery Studio

<div align="center">

```
           .~~~.
        .-'     `-.
       /  .-"""-.  \
      |  /       \  |
      | |    🏺   | |     "Channel your inner Patrick Swayze,
      |  \       /  |      without scrubbing wet mud out of
       \  `.___.'  /       your keyboard."
        `-._____.-'
         /       \
        |=========|   <--- Wheel spinning at 24 RPM
       /___________\
```

### *Shape 3D pottery in real-time using nothing but your hands and a webcam.*

[![Three.js](https://img.shields.io/badge/Three.js-r160-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands_v0.4-00A98F?style=for-the-badge&logo=google)](https://developers.google.com/mediapipe)
[![WebGL](https://img.shields.io/badge/WebGL-2.0-990000?style=for-the-badge&logo=webgl)](https://www.khronos.org/webgl/)
[![Zero-Build](https://img.shields.io/badge/Build_Step-Zero_%2F_Pure_Vanilla-orange?style=for-the-badge)](https://developer.mozilla.org/)
[![Status](https://img.shields.io/badge/Vibe-100%25_Zen-6c5ce7?style=for-the-badge)](#)

[Features](#-features-that-slap) • [Quick Start](#-quick-start) • [How to Sculpt](#-how-to-sculpt-the-gestures) • [The Physics](#-the-engineering-under-the-wheel) • [Glaze Palette](#-artisan-glazes)

</div>

---

## 🌿 The Lore

Ever wanted to sit at a pottery wheel, close your eyes, cue *Unchained Melody*, and create a breathtaking ceramic vase? 

**Clay Home** turns your browser into a tranquil pottery studio. By combining **MediaPipe AI Hand Tracking** with **Three.js WebGL physics**, your real-world finger motions directly deform and shape a spinning block of virtual clay in 3D space.

- 🪵 **No VR headset required.**
- 🧼 **No messy clay under your fingernails.**
- 🤖 **Articulated wooden mannequin hands** that mirror your exact anatomical movements.

---

## ✨ Features That Slap

| Feature | Description |
| :--- | :--- |
| 🖐️ **Webcam Hand Tracking** | Uses MediaPipe to track 21 3D landmarks per hand at 30+ FPS directly in the browser. |
| 🪵 **3D Wooden Hands** | Fully articulated wooden artist mannequin hands that follow your actual fingers in the 3D scene. |
| 🔄 **Rotational Lathe Physics** | Ring-Radius surface model: every deformation is naturally distributed around the wheel for authentic rotational symmetry. |
| 🎨 **Artisan Glaze Studio** | 8 hand-picked studio finishes (Terracotta, Dark Clay, Sand, Stone, Rust, Porcelain, Slate Blue, Plum) + full custom color hex picker. |
| 🏺 **Classic Silhouette Presets** | Jumpstart your creations with iconic forms: **Bell**, **Cylinder**, or **Square**. |
| 🎛️ **Frosted Glass Studio UI** | Sleek glassmorphism overlay to dial in base diameter, rim flare, wheel speed, and surface smoothing. |
| 🖱️ **Zero-Webcam Fallback** | Camera shy or on desktop without a webcam? Smooth mouse dragging & slider sculpting mode keeps you creating. |

---

## 🎮 How to Sculpt (The Gestures)

```
       LEFT HAND                         RIGHT HAND
     (Inner / Outer)                   (Outer / Rim)
        \  ||  /                          \  ||  /
       (  🖐️  )                          (  🖐️  )
           ||                                ||
           vv                                vv
    [ Compress Inward ]              [ Flare Outward ]
```

### 👐 On the Wheel
1. **Allow Camera Access**: Grant permission when prompted (handled 100% locally in your browser—no video ever leaves your machine).
2. **Bring Hands into Frame**: Watch the 3D wooden hands awaken and follow your fingers.
3. **Shape the Clay**:
   - Move hands closer to the clay to apply pressure.
   - Move up and down to shape different height rings (neck, belly, base).
   - Pinch or spread your hands to narrow or widen the vessel.
4. **Smooth & Polish**: Open the **Smooth** tool panel on the right and hit *Smooth* to buff out tool marks and achieve silky ceramic curves.
5. **Tweak Wheel Speed**: Speed up to 40 RPM for swift trimming or slow it down to 5 RPM for delicate neck shaping.

---

## 🚀 Quick Start

**Zero build tools, zero bundlers, zero npm installs required.** It's pure vanilla web goodness.

### Option 1: Python Simple Server (Recommended)
```bash
# Clone the repository
git clone https://github.com/Suhaid11/Clay-Home.git

# Enter the studio
cd Clay-Home

# Launch a local server (needed for webcam & Three.js textures)
python -m http.server 8000
```
Then open your browser to **`http://localhost:8000`**.

### Option 2: Node / npx
```bash
npx serve .
```

### Option 3: VS Code Live Server
Simply click **"Go Live"** from VS Code's Live Server extension with `index.html` open.

> **⚠️ Note on Camera Permissions:** Modern web browsers require either `http://localhost` or HTTPS (`https://`) to access the webcam via `getUserMedia()`.

---

## 📐 The Engineering Under The Wheel

How does 2D camera footage turn into realistic 3D pottery?

```
 [ Webcam Feed ]
       │
       ▼
 [ MediaPipe Hands ] ──► Extracts 21 3D Joint Landmarks (wrist, knuckles, tips)
       │
       ▼
 [ Wooden Hand Rigs ] ──► Interpolates transforms to anatomical wooden fingers
       │
       ▼
 [ Ring-Radius Lathe Engine ]
       │   • 44 Height Segments (rings)
       │   • 56 Radial Segments
       │   • Collision detection between fingertips & ring perimeters
       │   • Rotational conservation: r'(h) = r(h) + delta * pressure
       ▼
 [ Three.js Renderer ] ──► PBR material shader, studio spotlights & backdrop
```

### Key Modules:
- [`js/clay.js`](js/clay.js): Ring-radius parametric cylinder geometry, mesh deformers, silhouette presets.
- [`js/wooden-hands.js`](js/wooden-hands.js): Procedural generation of joints, palms, and articulated fingers with natural wood shader.
- [`js/hands.js`](js/hands.js): MediaPipe hand detection pipeline, smoothing filters, and world-space coordinate mapping.
- [`js/sculpt.js`](js/sculpt.js): Collision solver between hands/mouse and rotating clay vertices.
- [`js/scene.js`](js/scene.js): Ambient occlusion, studio lighting, spinning turntable, camera controls.
- [`styles/ui-overlay.css`](styles/ui-overlay.css): Frosted glassmorphism HUD with responsive tool docks.

---

## 🎨 Artisan Glazes

Mix and match curated earthen tones to set the mood:

| Color | Hex | Tone |
| :--- | :---: | :--- |
| **Terracotta** | `#A8562B` | Classic Mediterranean warm bisque |
| **Dark Clay** | `#3A2A20` | Rich volcanic dark stoneware |
| **Sand** | `#C9A47A` | Warm beach dune stoneware |
| **Stone** | `#5A4A3A` | Earthy riverbank ceramic |
| **Rust** | `#A85C3A` | Oxidized iron pottery finish |
| **Porcelain** | `#E8DCC4` | Delicate imperial bone china |
| **Slate Blue** | `#2D3A4A` | Moody midnight studio glaze |
| **Plum** | `#4A3A5A` | Deep amethyst artisan slip |

---

## 💡 Pro Potter Tips

- 💡 **Good Lighting**: Ensure your hands are well-lit against a relatively uncluttered background for optimal tracking.
- 🧘 **Slow & Steady**: Real clay responds to gentle pressure. Smooth, deliberate movements yield the most elegant amphoras and urns.
- 🪞 **Reset Anytime**: Messed up your vase? Hit the **Reset** button in the bottom dock or pick a silhouette preset to start fresh.

---

## 🤝 Contributing

Got ideas for new pottery shapes, clay textures, particle water splashes, or kiln firing modes? PRs and ideas are warmly welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/CoolNewGlaze`)
3. Commit your Changes (`git commit -m 'Add crackle glaze effect'`)
4. Push to the Branch (`git push origin feature/CoolNewGlaze`)
5. Open a Pull Request

---

## 📜 License

Distributed under the **MIT License**. Feel free to use, modify, and shape it however you like!

---

<div align="center">
  <sub>Crafted with ❤️, clay, and code by <a href="https://github.com/Suhaid11">Suhaid11</a>. Keep spinning! 🏺</sub>
</div>
