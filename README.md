# NRL-website
Titan Forge — National Robotics League team. Interactive robot assembly, team directory and forge experience.

## Interactive experiences

- Scroll-driven concept robot assembly, full 360° orbit by dragging or using the rotation slider, exploded view, and wireframe.
- Three.js r169 is vendored locally. Browsers without WebGL use a perspective Canvas renderer with the same model geometry.
- The simulation theatre contains an original silent 12-second, 1280×720 H.264 animation, native playback controls, chapter buttons, and an MP4 download.
- All robot visuals are concept illustrations, not the team's actual robot or validated physics simulations.
- Global pause and reduced-motion support; video never autoplays and pauses when offscreen.

## Editing

Team introductions and image paths are in the `members` and `mentor` data in `index.html`. Robot dimensions and colors are in `assets/robot.json`. No public editor or write endpoint is included.

Regenerate the concept video using Python with Pillow and an installed ffmpeg:

```sh
python scripts/render-simulation.py
```

Serve the repository root with a static server to preview ES modules. No build or package installation is required. Public GitHub Pages publication is pending owner authorization.
