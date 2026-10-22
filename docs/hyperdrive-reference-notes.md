# Hyperdrive robot visual reference

The user's supplied image contains two views of the same low four-wheel prototype. The model now follows that photographed robot rather than the earlier generic humanoid.

## Sources checked on 22 October 2026

- NRL official 2026 website: https://nrl.theinnovationstory.com/ — identifies the season game as HYPERDRIVE.
- Game Manual 2026, linked from the official site's Resources → Game Manual: https://drive.google.com/file/d/1Huwjv3W1Nv4YadcgpQLIuMZ6EhevKLcF/view
  - §3.4.1: CORE outer diameter 95 mm, inner diameter 55 mm, thickness 30 mm; Red, Blue, Golden. The model keeps these proportions; its yellow ring is a carried game piece, not a structural component.
  - R1.10: traction or omni wheels permitted; holonomic drives prohibited. The photographed wheels are modeled as conventional treaded traction wheels, not mecanum wheels.
  - R7.1: HEXA Command Hub requirement. Electronics in the mesh are a visual approximation of the board visible in the supplied photos, not a pin-accurate HEXA CAD model.
- User-provided screenshot, received 22 October 2026: two prototype views showing four rubber wheels with silver hubs, clear chassis plates, silver cross members, exposed board and wiring, and a front black mechanism with a yellow ring.

## Modeling decisions and limits

- Match visible proportions, silhouette and component placement from the photograph: low rectangular open frame, four wheels, silver motors and hubs, clear sides, front fork/linkage rails, control board, battery, orange/red/dark wiring and yellow CORE.
- No humanoid torso, arms, legs, head, fictional sensors, scoring tower or invented launcher.
- Chassis dimensions are relative estimates. Exact wheelbase, material thickness, transmission, hidden hardware and mechanism travel cannot be recovered from two photographs.
- The 12-second clip shows assembly, inspection and a brief wheel-driven movement study. It does not claim validated physics, autonomous gameplay, legal scoring or competition compliance.
- The hero SVG, WebGL scene, Canvas fallback and video all derive from `assets/robot.json`.

Regenerate:

```sh
python scripts/build-hyperdrive-model.py
python scripts/render-simulation.py
```
