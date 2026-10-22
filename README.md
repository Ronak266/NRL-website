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
