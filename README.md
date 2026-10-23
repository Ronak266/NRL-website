# NRL-website
Titan Forge — National Robotics League team. Interactive robot assembly, team directory and forge experience.

## Interactive experiences

- Wide scroll-driven Hyperdrive component breakdown with 147 independent parts and ten continuous wire meshes, full 360° orbit by dragging or using the rotation slider, exploded view, and wireframe.
- Live perspective 3D rendering runs on Canvas with embedded geometry, including automatic hero rotation, drag orbit, scroll disassembly, subsystem isolation, exploded view and wireframe. It works without WebGL, imports or fetch requests.
- The simulation theatre contains an original silent 18-second, 30 fps, 1280×720 H.264 animation, native playback controls, chapter buttons, and an MP4 download.
- All robot visuals are visualizations based on the supplied prototype photos; dimensions are approximate and motion is illustrative.
- Global pause and reduced-motion support; video never autoplays and pauses when offscreen.

## Editing

Team introductions and image paths are in the `members` and `mentor` data in `index.html`. Robot dimensions and colors are in `assets/robot.json`. No public editor or write endpoint is included.

Regenerate the model and video using Python with Pillow and an installed ffmpeg:

```sh
python scripts/build-hyperdrive-model.py
python scripts/render-simulation.py
```

## View the website

Open `Titan-Forge-Preview.html` in Chrome or Edge. This standalone file embeds the robot, fonts, poster and video; no server or installation is required. If using the ZIP, extract it first.

For the editable source, open `index.html` alongside its `assets` folder. Rebuild the portable renderer and standalone preview after edits:

```sh
python scripts/build-preview.py
```

The site uses a crimson-and-black anime-inspired theme with manga panel borders, halftone textures, speed lines and red arena lighting. Video has a visible play button, native controls and chapter navigation. The simulation is a silent visual study, not a physics simulation.

Public GitHub Pages publication is pending owner authorization.

Hyperdrive source research and modeling limits: [reference notes](docs/hyperdrive-reference-notes.md).

Geometry checks: `node --test scripts/geometry.test.mjs`. Tests cover independent wire routes, assembled positions and clipping at mobile/desktop widths across camera angles.

### Studio-quality rendering
The portable viewer includes Three.js locally and prefers physically based materials, studio reflections and shadow maps. WebGL failures automatically fall back to the Canvas renderer; no server or CDN is required. Open `Titan-Forge-Preview.html` after extracting the ZIP.

To reproduce the CPU-rendered film (Python, C++ compiler with OpenMP, FFmpeg):
```bash
python3 scripts/prepare-raytrace.py
g++ -O3 -fopenmp scripts/studio-raytrace.cpp -o dist/studio-raytrace
dist/studio-raytrace dist/studio-triangles.txt dist/studio-frames 0 144
python3 scripts/encode-studio.py
python3 scripts/build-preview.py
```
The renderer produces 720p keyframes at 8 fps; FFmpeg interpolates the slow camera motion to 30 fps. This is a photo-referenced visualization, not recorded footage or measured CAD.

### Immersive 3D controls
- **Drive it:** playable practice arena with keyboard (WASD/arrows), touch controls, Shift boost, wheel motion, eight collectible CORE rings, a demo route, reset, and chase/top/orbit cameras. Click **Take Control** to focus keyboard input; leaving the arena pauses it.
- **Engineering explorer:** click components to identify them; open **Camera + X-ray** for four camera presets, zoom and X-ray rendering. System isolation, wireframe and progressive scroll disassembly remain available.
- **Hero and team:** spatial orbital graphics, sparks, pointer-responsive directory cards and reading progress. Motion respects the global pause and reduced-motion preference.
- All scenes have a Canvas fallback for WebGL failure. The practice arena is an illustrative mini-game, not an official NRL field or physics simulation.

The supplied `file-navigator-landing (1).zip` informed spatial interaction direction. Its reference bundles depend on missing application/model/media files; they are not loaded or copied into the website. The original upload is unchanged.

Checks: `node --test scripts/geometry.test.mjs scripts/arena.test.mjs`.

### Cinematic visual overhaul
The canonical theme is `assets/cinematic.css`; the build script embeds it into both HTML entry points. The hero now uses a large transparent 3D scene, red studio lighting, an animated scanning plane, spatial orbitals, pointer-responsive camera movement and staggered title reveals. A pinned manifesto fills line by line as the visitor scrolls. Section entrances, directional button highlights, a single slanted marquee, profile hover depth and modal transitions complete the motion system.

Animations respect reduced motion and the page pause control. Team intros and portraits remain explicit placeholders. The existing arena, engineering controls and video remain available.
