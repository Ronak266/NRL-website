# TitanForge coordinated build

The viewport is the experience. Existing media, directory data, profile dialogs, robot geometry, mechanical control logic and game remain the source of truth. No mockup, embedded laptop, external cursor service or simulated video replaces them.

## Presentation

Near-black surfaces, one vivid red accent, local Barlow Condensed display type and DM Sans copy. The homepage keeps both original logos, a real interactive prototype, school identity and original event logos. Chapters follow: arrival, video introductions, six people, mentor, machine, rules/game, final Instagram invitation. Existing systems, simulation, mission and reference photographs remain in the machine chapter.

## Runtime

`agentic-build.js` registers actual elements as work items. Three desktop lanes (two on mobile) each own one pointer, selection frame and Web Animations job. A single requestAnimationFrame clock seeks the real-element animations and drives approach, pause, outline drag, content reveal and cleanup. Pointer endpoints are remeasured from target bounds during work. Text keeps its semantic content and accessible name while clipping reveals it in bursts. Frames resolve before their nested images and labels.

Normal browsing uses IntersectionObserver plus guarded visible-node scans. Work finishes when its target leaves view. Future content stays visible until its brief entry build; it never requires tour completion. Guided viewing computes viewport-sized stops from connected targets, travels using the same clock, runs concurrent local jobs, pauses for reading and advances. It restores all six profiles and an open playbook before measuring each replay.

Pause freezes scrolling and all reveal clocks. Explore and user input cancel the tour synchronously, cancel finite animations and restore base styles. A deferred scan after input inhibition prevents entry animations being lost when a visitor lands in a new viewport. Resize discards measured work before rebuilding cursor lanes. Hidden-tab time never advances the clock. The software-rendered hero starts still and offers rotation on demand; both renderers suspend ambient rotation during a guided showcase to leave processing time for selections and input.

## Interaction and fallback

The fixed overlay has `pointer-events:none`, `aria-hidden` and `inert`; it has no event handlers. Real controls remain clickable throughout. Video playback, profile dialogs, model manipulation and active gameplay dismiss decorative activity. The build layer never prevents keyboard defaults or forwards keys. Game keyboard ownership stays in `arena-runtime.js`. Reduced-motion changes cancel work immediately. Without JavaScript, all core content is visible and videos, links and rules disclosures remain usable. The early opening class removes itself after six seconds even if the build script fails.

## Build and validation

No dependency or server is needed in production. `python3 scripts/build-preview.py --site-only` embeds the canonical styles in index.html and regenerates the local viewer from source. The full command also creates the optional standalone export. `npm ci` installs jsdom for development tests only.

`npm run test:build` exercises real HTML and roster data with a DOM emulator and a deterministic clock: all seven chapters complete; navigation, scrolling, media and game handoff cancel work; Pause freezes it; Replay restores required content; Explore restores visibility; mobile and reduced motion behave correctly. Existing arena and mechanism tests remain independent. The baseline fabrication test currently fails on missing printLayerHeight metadata in existing robot.json; the presentation work does not alter that model.
