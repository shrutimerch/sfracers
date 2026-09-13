# Bay City Kart

A browser-based Three.js racing game on mapped San Francisco streets. The waterfront circuit uses two laps. React handles the interface; a standalone simulation handles gameplay.

## Develop and verify

Requires Node.js 22.13 or later. Run from this directory; paths are relative, so the repository can be moved.

```sh
npm install
npm run dev -- --port 3001
npm test
npm run typecheck
npm run lint -- app tests
npm run format:check
npm run build
```

Use `npm run format -- app tests` after editing. Large generated geometry datasets are excluded by `.oxfmtrc.json`; their generation scripts own their formatting. Dependencies and the lockfile are intentionally preserved.

Development-only `/?inspect=395` positions a stationary camera 395 meters along the selected route. It is ignored in production.

## Where changes belong

| Concern                                                           | File                                              |
| ----------------------------------------------------------------- | ------------------------------------------------- |
| Browser lifecycle and renderer/simulation coordination            | `app/engine.ts`                                   |
| Map, HUD and texture types                                        | `app/game/types.ts`                               |
| Racing state, movement, boost, collisions, checkpoints            | `app/game/simulation.ts`                          |
| Route distances, position sampling and nearest segment            | `app/game/route-math.ts`                          |
| Entrance width adjustments to imported maps                       | `app/game/course.ts`                              |
| Lap count and kart scale                                          | `app/race-laps.ts`                                |
| Acceleration and drivable surface rules                           | `app/driving.ts`                                  |
| World, lighting and base street/building assembly                 | `app/game/world.ts`                               |
| Karts, finish banner, route arrows and boost pads                 | `app/game/race-visuals.ts`                        |
| Keyboard lifecycle, camera, minimap                               | `app/game/input.ts`, `camera.ts`, `minimap.ts`    |
| Texture loading and shared GPU-resource disposal                  | `app/game/facades.ts`, `dispose.ts`               |
| Main race interface                                               | `app/race-game.tsx`                               |
| South Park and waterfront modeled scenery                         | `app/south-park.ts`, `route-scenery.ts`           |
| Building-specific facade appearance                               | `app/south-park-profiles.ts`, `route-profiles.ts` |
| Photo-based courtyard, shelter, lamp and lane placement overrides | `app/scenery-locations.ts`                        |
| Crosswalks and bike lanes                                         | `app/road-markings.ts`, `road-marking-rules.ts`   |
| Public map source and reference provenance                        | `reference/README.md`                             |

## Data flow

1. The page loads `public/race-course.json`, traffic controls and facade textures.
2. `prepareCourse` copies the map's road records and applies the existing park entrance widths. It does not mutate the imported JSON.
3. `createWorld` builds static scenery once. `createRaceVisuals` adds dynamic race objects.
4. `createRaceSimulation` owns racing state and exposes controls plus a read-only state snapshot. It has no DOM or Three.js dependency.
5. Each animation frame advances the simulation, updates mesh positions, and draws the camera. The HUD and minimap refresh at their existing lower cadence.
6. Teardown cancels animation, removes listeners and disposes scene geometry, materials and owned textures. Shared geometry is disposed once.

Map points use local meter coordinates. Model angles are radians in the X/Z plane; speeds are meters/second internally and converted to mph for the HUD. Simulation laps are zero-based; the HUD displays one-based lap numbers.

## Regression coverage

`tests/full-race.test.mjs` drives both real courses using throttle, braking and steering at a fixed timestep. It checks every checkpoint on both laps, pause stability, second-lap recovery, finish, rival completion and restart. It does not teleport the kart or change checkpoint state directly. These are simulation integration tests, not browser end-to-end or visual tests.

Other tests cover map provenance, geometry, acceleration, alternative park branches, lane classifications and coordinate conversions. Static map files, facade image assets and existing gameplay tuning were retained during the cleanup.

## Legacy imagery code

The main `/` route uses modeled scenery. The existing `/kart` route and optional photographic adapter remain compatible; `google-scenery.ts` stays outside the simulation. `street-camera.ts` and the small geometry helpers in `street-challenge.ts` remain for the earlier experiment and its tests. The unused Maps script loader was removed. No new imagery requests were introduced.

## Formatting and lint choices

The repository's formatter handles application code and tests. Narrow lint overrides preserve deliberate existing behavior: full-document game navigation (to release the WebGL scene), direct route-map images, custom accessible HUD status/meter elements, and a generated geometry export. Other correctness and typing rules remain enabled.

## Publishing

`.openai/hosting.json` identifies the existing Sites project. Publishing requires a validated build, a pushed source commit and the Sites packaging/deployment workflow. Keep that file and `.git` when moving the project. Local source changes do not modify production until deployed; preserve the site's existing access policy.
