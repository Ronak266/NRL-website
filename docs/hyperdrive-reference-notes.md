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

## Detailed explorer update
The shared mesh now contains 147 independent components and ten continuous wire routes. Tyre tread is integral to each tyre. Additional visible hub bolts, axles, endcaps and terminal details support inspection; exact hidden wiring and hardware are illustrative. Each wire disconnects as one curved object, rather than scattering its tube segments. Both the interactive renderer and the 18-second studio video use the same staggered part offsets.

## Studio renderer revision
The interactive viewer uses locally bundled Three.js physical materials, a generated softbox environment and shadow maps. Canvas remains available when WebGL cannot initialize. Video is rendered deterministically from the same geometry using the repository's CPU ray tracer, not a paid video service. The film uses slow camera orbit, disassembly and reassembly; it does not depict measured robot performance. Two photos cannot establish hidden geometry or exact wire routing.

Visual references consulted for lighting and choreography (no third-party footage copied):
- https://voyager.so/blog/cad-model-to-product-animation
- https://www.nodeconnector.com/case-studies/procedural-assembly

## Interactive practice arena
The new scene reuses the photo-referenced prototype mesh. Driving, ring pickup and the rectangular arena are deliberately simplified for an interactive website experience, and are not presented as the Hyperdrive field, scoring rules or tested physical robot capabilities. The user's supplied landing ZIP was inspected as a visual/interaction reference; its missing-asset reference bundles are not executed.

## Rule-based match revision, 26 October 2026
The earlier eight-ring collection exercise has been replaced with a timed Hyperdrive training match. The source linked by the official NRL Resources page was checked again and remains the same manual ID. [Rule trace and simulator limitations](hyperdrive-simulator.md) describe scoring, Starburst/Golden CORE, payload Cargo Bay, Space Station/Apex gates, corrected steering, automated opponents and the distinction between this training approximation and an official event.
