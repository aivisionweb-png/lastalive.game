# LAST ALIVE — modular browser battle royale

This version splits the game into focused modules while keeping the current dark tactical visual direction.

## Structure
- `index.html` — shell, HUD, mobile controls
- `style.css` — responsive UI
- `js/config.js` — game constants and weapon definitions
- `js/input.js` — keyboard, mouse and touch input
- `js/map.js` — procedural world and collision volumes
- `js/player.js` — first-person controller, gravity, sprint, crouch, jump, HP/armor
- `js/weapons.js` — AR, pistol, shotgun, ammo, reload, ray hits, tracers
- `js/bots.js` — bot spawning, chase and shooting
- `js/loot.js` — ammo, medkits, armor pickups
- `js/zone.js` — multi-phase shrinking safe zone
- `js/minimap.js` — minimap renderer
- `js/audio.js` — WebAudio placeholder sound system
- `js/ui.js` — HUD, result screen, kill feed, damage feedback
- `js/network.js` — multiplayer client interface
- `js/match.js` — match lifecycle/timer
- `js/debug.js` — production-disabled debug hooks
- `js/main.js` — composition/root game loop
- `backend/` — Socket.IO server foundation for authoritative multiplayer work

## Run
Deploy the folder as a static site on Vercel, or serve it from a local HTTP server. ES modules should not be opened with `file://`.

Three.js and Socket.IO are loaded from stable public CDNs in `index.html`.
