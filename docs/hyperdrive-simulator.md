# Hyperdrive training match

Updated 26 October 2026. The official NRL website still links the same 2026 manual used to implement this training model:

- [NRL official site, Resources → Game Manual](https://nrl.theinnovationstory.com/)
- [NRL 2026 Hyperdrive Game Manual](https://drive.google.com/file/d/1Huwjv3W1Nv4YadcgpQLIuMZ6EhevKLcF/view?usp=drive_link)

The official manual and event-specific updates take precedence. The trainer uses the manual's baseline 10-CORE STARBURST threshold; event thresholds and Ranking Points must be checked separately.

## Rule trace

| Source | Implemented behavior |
| --- | --- |
| §§3.1–3.3 | 12 × 12 ft schematic field, six 2 ft tiles per side, two squad-specific stations/vaults, 3 High / 2 Star / 2 Apex poles per squad. Element positions are illustrative, not measured construction coordinates. |
| §§3.4, 4.3 | 23 colored CORE per squad: 3 on the field plus 20 in reserve. Six Golden CORE per squad remain in its own vault until STARBURST. No automatic pickup from driving over a ring. |
| G4.2 | Two controlled scoring elements, counting held PAYLOAD; Drop Zone exception in the action guard. |
| G4.3, G4.10 | Automated Human Player stages up to 3 reserve CORE at a time, below the 6-CORE limit, only while squad robots are clear of the Source Zone. |
| §§3.6, 4.5 | Colored CORE: High 3, Star 5, Apex 9, Drop 1. Golden: Star 7, Drop 3. High/Star/Apex capacities are 4/3/6. Illegal target placements are rejected without consuming inventory. |
| §§3.4.2, 4.5 | Revealed bottom-to-top Star Map has 2 Golden plus 1 squad CORE. Exact order awards 10 per completed Star Pole, once. Incorrect order retains piece points but earns no pattern bonus. |
| §§4.4–4.5.1 | Normal STARBURST activates at 10 scored squad-colored CORE. After a delivered PAYLOAD, 4 scored squad CORE permits the Human Player button. AI drive teams perform that role automatically; the driver may use H. |
| §3.7, R9.1–4 | Q uses a separate virtual rear Cargo Bay. Load only that robot's numbered payload in its own Source, deliver completely in its own Drop. No payload floor release elsewhere, no teammate/opponent payload pickup, no CORE mechanism delivery. |
| Table 4.5.1 | Both distinct squad team payloads delivered award a single +10 squad bonus. The manual table assigns no invented standalone payload points. One delivered payload still enables the reduced STARBURST route. |
| §§3.3.3–4, 4.4–4.5 | Space Station scoring and Apex placements open only at 120 s elapsed. Own-station Engage/Dock/Balance contributes the best current 3/8/15 state per robot, not a cumulative action bonus. Apex permits only squad-colored CORE from a robot supported on its own station. |
| G4.12, G4.17–19 | Driving guards prevent entry onto the opponent station or into opponent Source/Vault zones. Opponent game pieces and payloads are not controllable. Launching/destructive actions are not provided. |
| G5.3 | At 150 s all robot drive speeds are zeroed, scoring actions stop, and a final result is shown. |

## Driving and presentation

The robot intake is local +Z. The chase camera sits behind it, so camera-right is local −X. Positive input means right steer and therefore decreases yaw; A/left increases yaw and D/right decreases it. The same convention drives touch controls and bot steering. Direction stays relative to the robot in overhead cameras.

Drive acceleration, angular response, braking and precision speed are damped. Walls, poles, restricted zones and other robots obstruct movement. Wheel travel includes opposite wheel motion during turns. Pieces must be explicitly handled at low speed; pole placement and pickup require proximity and facing. Virtual pole placement abstracts lift control.

## Training limitations

- One human-controlled robot, one partner AI and two opposing AI robots. Bots use the same scoring/action functions as the player; points are not scripted onto the scoreboard.
- No full rigid-body, motor, grip, force, mechanism reach or friction simulation. Robot and field dimensions are approximate; the real prototype is not certified to perform the virtual lift/Cargo Bay motions.
- Station tilt is an approximate load-position model. A 1.5-second stability filter avoids flickering Balance state; that filter is a simulator choice, not an additional competition rule.
- Score displays are live estimates. Final evaluation occurs at the simulated buzzer. Contact and illegal-action prevention substitute for a full referee and escalating foul/card model.
- The match clock measures active training time and pauses when the game is offscreen, the page is hidden, or the user pauses. Real competition matches do not use this training pause behavior.
- Ranking Points and event-specific threshold changes are not simulated. No competition compliance claim is made.
- Canvas fallback uses a tactical overhead representation while preserving the same game state and controls. WebGL uses a locally bundled Three.js field.

## Verification

```sh
node --test scripts/geometry.test.mjs scripts/arena.test.mjs scripts/arena-runtime.test.mjs
```

Tests cover steering direction, touch/keyboard handlers, timed phases, immutable actions, inventory limits, legal targets, vault unlocks, exact patterns, capacity limits, payload handling/bonuses, endgame gates, match termination, AI participation, fallback initialization, offscreen pause and finite Three.js scene poses. The renderer integration test stubs GPU output; it does not replace live browser visual verification.


## Competition rendering update · 27 October 2026

The playable Three.js scene now uses a shared complete photo-referenced chassis for all four robots. Fixed hardware is batched by material; wheels have instanced rubber tread blocks, and the separate rear Cargo Bay uses steel rails instead of a wireframe box. Squad bumpers and front/rear number plates identify each robot.

Locally generated foam, brushed-metal, rubber and wood maps add surface variation without a network dependency. The field has a soft-shadow key light, cool fill, a local reflection environment, framed vault panels, station fasteners, capped wooden barriers and a competition-hall surround. The chase camera is lower, and CORE/payload transfers interpolate into their new positions. These are presentation changes: rule state, collision bounds, steering, timing and inventory logic are preserved. The existing 18-second studio video remains a separate illustrative visualization; no generated video is substituted for the playable scene.

GPU output and live browser appearance remain unverified in this environment. Automated renderer tests exercise actual Three.js geometry/material construction with a stubbed GPU renderer, including all four detailed robots, textured field surfaces, environment setup, driven poses, reset, and existing controls.
