# Titan Forge / NRL Hyperdrive

The Titan Forge team website: a red, black and white futuristic comic experience built around a photo-referenced Hyperdrive robot. Six member introductions and one mentor profile have reserved image and text slots.

## Open it

Open `Titan-Forge-Preview.html` in Chrome or Edge. It includes the fonts, local Three.js renderer, geometry, prototype photo, poster and video in one file. Extract the ZIP before opening it.

For the editable source, open `index.html` with its `assets` directory alongside it. No installation, API key, paid generation service or CDN is required.

## Experiences

- **Initialization:** a skippable comic opening advances with page/model readiness, bypasses itself for reduced motion, and has a five-second fallback.
- **Robot game:** the playable practice arena appears immediately after the hero. Choose **Take Control**, then use WASD/arrows and Shift to boost. Touch controls, reset, auto demo, fullscreen and three cameras are included. Eight CORE rings can be collected.
- **Engineering explorer:** scrolling separates 147 components and ten individual wire meshes. Drag to orbit, isolate systems, identify a component, choose camera presets, zoom, enable X-ray or switch to wireframe. Manual sliders remain available.
- **System dossiers:** four animated panels select the corresponding frame, drive, CORE mechanism or electronics view in the explorer.
- **Motion study:** an original silent 18-second, 1280×720 H.264 visualization has native controls, chapter selection and a download link. It never autoplays and pauses offscreen.
- **Team directory:** six member slots and a mentor slot open native profile dialogs.
- **Prototype files:** the supplied two-view photograph and a rendered studio view open in a larger image dialog.
- **Mission Index:** searchable navigation is available from the header, including on mobile. Ctrl/Cmd+K opens it; Enter opens the first result and Escape closes it. The shortcut does not override the driving controls.
- **Motion controls:** the header and footer pause buttons stay synchronized. Reduced motion is respected, decorative loops stop offscreen, and the game panel never depends on an entrance animation to become visible.

Three.js is included locally. Physically based materials, reflections and shadows are preferred when WebGL is available; a Canvas renderer provides a fallback.

The visual model uses the supplied prototype photos and NRL references. Its hidden details and dimensions are approximate. The film is rendered visualization, not recorded footage or measured CAD. The game is an illustrative practice mini-game, not the official NRL field, rules or scoring implementation.

## Edit and rebuild

- Team introductions and photo paths: `members` and `mentor` in `index.html`.
- Canonical styling: `assets/cinematic.css`.
- Geometry: `assets/robot.json` and `scripts/build-hyperdrive-model.py`.
- Boot, navigation and motion: their corresponding files in `assets`.

After editing source files:

```sh
python3 scripts/build-preview.py
```

This regenerates the portable JavaScript, embeds the stylesheet into `index.html`, and rebuilds the standalone HTML. Do not edit `assets/portable-viewer.js` directly.

Checks:

```sh
node --check assets/portable-viewer.js
node --test scripts/geometry.test.mjs scripts/arena.test.mjs
```

To reproduce the CPU-rendered film, install Python/Pillow, a C++ compiler with OpenMP and FFmpeg:

```sh
python3 scripts/prepare-raytrace.py
g++ -O3 -fopenmp scripts/studio-raytrace.cpp -o dist/studio-raytrace
dist/studio-raytrace dist/studio-triangles.txt dist/studio-frames 0 144
python3 scripts/encode-studio.py
python3 scripts/build-preview.py
```

The film uses 720p keyframes at 8 fps, interpolated to 30 fps.

## Ownership and publication

The website includes no public editing UI, backend write endpoint or authentication prompt. Content is changed through repository access. Keep GitHub write permissions restricted to the owner and explicitly trusted collaborators.

The GitHub repository contains the full site. GitHub Pages publication remains pending owner authorization.

[Hyperdrive reference research and model limits](docs/hyperdrive-reference-notes.md).
