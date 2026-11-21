# Implementation Plan: Revival

Design: [2026-11-21-revival-design.md](./2026-11-21-revival-design.md)
Linear: [H3N-63](https://linear.app/h3nr7/issue/H3N-63)

## Overview

Bring the January 2025 code up to date so the remaining days can be built
for Christmas 2026: every package current, unit tests for the logic, a
browser smoke test of every route, lint clean, CI on every push, React 19
with react-three-fiber 9, and `framer-motion-3d` replaced by
`@react-spring/three`. The Christmas countdown is fixed on the way. No
other behaviour changes.

One change from the design's order: `@react-spring/three` supports React
18 and fiber 8, so the 3D animation swap (task 8) lands before the React 19
jump (task 9), not inside it. The design's step 5 becomes two tasks that
can each be checked on their own.

## Global constraints

- Branch `feature/revival` off `develop`. One commit per task. Never
  commit `.continue/`.
- Package manager: pnpm, pinned with `"packageManager": "pnpm@10.30.3"`.
  `"engines": { "node": ">=22.12.0" }`. `.nvmrc` holds `26`.
- No behaviour change except the countdown fixes in task 3.
- Each 3D animation keeps its trigger, start state and end state. Written
  durations and delays stay durations and delays.
- No new code tied to WebGL-only APIs.
- A package that cannot reach its latest version is held at the newest
  version that works and recorded in a comment on the feature issue, with
  the reason. No stopping to ask.
- Every task ends with every check that exists by then passing:
  `pnpm build`, and from the task that adds each, `pnpm typecheck`,
  `pnpm test`, `pnpm test:e2e`, `pnpm lint`.
- The five mounted scenes: `/`, `/first`, `/fifth`, `/eighth`, `/sandbox`.
  The 14 routes: `/`, the 12 `day` values in `DAYS`
  (`src/helpers/constants.tsx`), and `/sandbox`.

## Tasks

### 1. Before-captures of the mounted scenes

**Linear:** H3N-64

**Goal:** Recordings of each mounted scene on today's code exist, made by a
script that can be run again for the sign-off in task 11.

**Files affected:**
- `package.json`, `pnpm-lock.yaml` (adds `@playwright/test`)
- `e2e/capture.ts` (new)
- `playwright.config.ts` (new)
- `.gitignore` (adds `captures/`, `test-results/`, `playwright-report/`)

**Interfaces:**
- Produces: script `capture` in `package.json`, taking an output label:
  `pnpm capture before` writes to `captures/before/`, `pnpm capture after`
  to `captures/after/`. `playwright.config.ts` with a `webServer` running
  `vite preview` on the production build, reused by task 5.

**What it does:**
- For each of the five scenes: open the route, record video through the
  enter animation, then click the in-app back control (or navigate to `/`)
  and keep recording through the exit. One `.webm` per scene, named after
  the route (`root`, `first`, `fifth`, `eighth`, `sandbox`).
- Chromium, viewport 1280×800, clock left alone so the home page shows
  today's countdown state.
- No other package changes in this task.

**Acceptance criteria:**
- [ ] `pnpm capture before` exits 0 on today's code and leaves five
      non-empty `.webm` files in `captures/before/`.
- [ ] Each recording shows its scene entering and then exiting (checked by
      watching them).
- [ ] `git status` shows nothing under `captures/`, `test-results/` or
      `playwright-report/`.
- [ ] `pnpm build` still exits 0, and no application file under `src/`
      changed.

### 2. Safe updates and build tooling

**Linear:** H3N-65

**Goal:** Every package outside the React 19 group is on its latest
version, the lockfile is regenerated under pnpm 10, and the toolchain
versions are pinned.

**Files affected:**
- `package.json`, `pnpm-lock.yaml`, `.nvmrc` (new)
- `vite.config.ts`
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` (only if
  TypeScript 6 needs it)

**Interfaces:**
- Produces: script `typecheck` = `tsc -b --noEmit` (or the equivalent
  that type-checks both tsconfigs).

**What it does:**
- Latest: `vite` 8, `@vitejs/plugin-react-swc` 4, `vite-plugin-restart` 2,
  `vite-plugin-glsl` 1.6, `sass`, `luxon`, `@types/luxon`, `zustand`,
  `styled-components`, `gl-matrix`, `postprocessing` 6.x.
- `typescript`: the newest version `typescript-eslint` accepts (at
  planning time `<6.1.0`, so 6.0.x).
- Not in this task: `three`, `@types/three`, anything in the React 19
  group, `react-router`, `immer`, `camera-controls`, ESLint and its
  plugins.
- Adds `packageManager`, `engines` and `.nvmrc` from the global
  constraints.

**Acceptance criteria:**
- [ ] `pnpm install --frozen-lockfile` succeeds on a clean checkout, and
      `pnpm-lock.yaml` is lockfile version 9.
- [ ] `pnpm outdated` runs without crashing. It lists only packages
      reserved for later tasks, or holds recorded on the feature issue.
- [ ] `pnpm build` and `pnpm typecheck` exit 0.
- [ ] Editing a `.glsl` file under `pnpm dev` still restarts the dev
      server (the restart plugin works on Vite 8).
- [ ] `pnpm capture after` runs; all five scenes still enter and exit
      (checked by watching the recordings).

**Depends on:** task 1

**Risk:** Vite 8 may break `vite-plugin-glsl` or `vite-plugin-restart`. If
so, hold Vite at 7 and record it. TypeScript 6 may reject old tsconfig
options. Fix the option; if the code cannot be made to pass, hold at 5.9
and record it.

### 3. Countdown: pure function, fixes and Vitest

**Linear:** H3N-66

**Goal:** The countdown is a tested pure function, Christmas starts at the
visitor's local midnight, and day 12 runs through 5 January.

**Files affected:**
- `package.json`, `pnpm-lock.yaml` (adds `vitest`)
- `vitest.config.ts` (new) or a `test` block in `vite.config.ts`
- `src/hooks/xmasCountdown.ts` (new)
- `src/hooks/xmasCountdown.test.ts` (new)
- `src/hooks/dateTime.tsx`

**Interfaces:**
- Produces: script `test` = `vitest run`, environment `node`.
- Produces: `computeXmasState(now: DateTime): XmasState`, exported from
  `src/hooks/xmasCountdown.ts`, with
  `XmasState = { curIso: string; curDay: number; isNearXmas: boolean;
  isXmas: boolean; xmasDayCount: number; timeLeft: { days: number;
  hours: number; mins: number; secs: number } }`.

**What it does:**
- Everything is computed in the zone of `now`. The provider passes
  `DateTime.now()`, which is the visitor's local zone.
- The Christmas period runs from 25 December 00:00 to 6 January 00:00 in
  that zone. From 1 to 5 January it belongs to the previous year's
  Christmas.
- `xmasDayCount` is 1 on 25 December through 12 on 5 January, and −1
  outside the period. `isXmas` is true inside it.
- `timeLeft` outside the period counts to the next 25 December 00:00 by
  calendar arithmetic (luxon `diff` in days, hours, minutes, seconds), not
  seconds divided by 86,400. `days` is the total day count. Seconds round
  up, so the count reaches zero exactly at midnight. Inside the period all
  four are 0.
- `months` is removed. `isNearXmas` stays "month is December or January".
- `DateTimeProvider` calls `computeXmasState` once on mount, then every
  second. The context shape stays the same apart from `months`.

**Acceptance criteria:**
- [ ] `pnpm test` exits 0. The countdown tests run each case below in
      `Europe/London` and `Pacific/Auckland` by constructing `now` in that
      zone.
- [ ] 2026-12-24 23:59:59: `isXmas` false, `xmasDayCount` −1, `timeLeft`
      `{ days: 0, hours: 0, mins: 0, secs: 1 }`.
- [ ] 2026-12-25 00:00:00: `isXmas` true, `xmasDayCount` 1, `timeLeft`
      all 0.
- [ ] 2027-01-01 12:00: `isXmas` true, `xmasDayCount` 8.
- [ ] 2027-01-05 23:59:59: `isXmas` true, `xmasDayCount` 12.
- [ ] 2027-01-06 00:00:00: `isXmas` false, `xmasDayCount` −1, `timeLeft`
      `{ days: 353, hours: 0, mins: 0, secs: 0 }` (to 2027-12-25).
- [ ] 2026-10-20 12:00 in `Europe/London`, before the clock change on
      25 October: `timeLeft` is `{ days: 65, hours: 12, mins: 0, secs: 0 }`.
- [ ] On the running site, the home page shows the countdown in its first
      second instead of placeholder values, and nothing reads `months`
      (`pnpm typecheck` exits 0).

**Depends on:** task 2

### 4. Unit tests for the stores and helpers

**Linear:** H3N-67

**Goal:** The stores and math helpers have unit tests that pin today's
behaviour.

**Files affected:**
- `src/stores/fiberStore.test.ts` (new)
- `src/stores/transitionStore.test.ts` (new)
- `src/helpers/math.test.ts` (new)
- `src/three/utils/time.test.ts` (new)
- `src/three/utils/vecs.test.ts` (new)
- `src/three/components/Boids/helpers/initialisers.test.ts` (new)

**Interfaces:**
- Consumes: `pnpm test` and the Vitest setup from task 3.

**What it does:**
- Tests only; no source changes. Store state is reset between tests.
- Where a source quirk exists, the test pins it with a comment. For
  example, `fillPositionTexture` ignores its `bounds` argument, and
  `transitionStore.exit` does not store its timer.

**Acceptance criteria:**
- [ ] `pnpm test` exits 0.
- [ ] `fiberStore`: each of `setCamera`, `setEffect`, `setDrag`,
      `setDebug` changes the fields it is given and leaves every other
      field equal to `initialState`.
- [ ] `transitionStore` (fake timers): after `init()` the state is `INIT`,
      then `COMPLETED` after 2000 ms; after `exit()` it is `EXIT`, then
      `COMPLETED` after 2000 ms; `abort()` straight after `init()` gives
      `COMPLETED` at once and clears the pending timer.
- [ ] `nextPowerOf2` returns 1, 2, 4, 1024 for 1, 2, 3, 1000.
- [ ] Over 1,000 calls each: `randomTiming(a, b)` stays in `[0, a]` and
      `[0, b]`; `randomDistance(d)` stays in `[-d/2, d/2]` on both axes;
      every control point of `randomOrbit(c, r)` is within `r` of `c`, and
      the curve is closed with 4 points.
- [ ] `fillPositionTexture` fills x, y, z in `[-5, 5)` with w = 1;
      `fillVelocityTexture` fills x, y, z in `[-5, 5)` with w = 1.

**Depends on:** task 3

**Risk:** The Boids helpers import `BOUNDS` from the Boids `index.ts`,
which also loads React components and shaders. If that fails in the
`node` environment, mock the module in that test file with
`vi.mock('..', () => ({ BOUNDS: 10, BOUNDS_HALF: 5 }))`. Don't move the
constants.

### 5. Smoke test of every route

**Linear:** H3N-68

**Goal:** A Playwright test proves every route mounts with a live 3D canvas
and no errors, against the production build.

**Files affected:**
- `e2e/smoke.spec.ts` (new)
- `playwright.config.ts`
- `package.json` (script)

**Interfaces:**
- Consumes: `playwright.config.ts` and its `webServer` from task 1;
  `DAYS` from `src/helpers/constants.tsx`.
- Produces: script `test:e2e` = `playwright test e2e/smoke.spec.ts`
  (it builds first, or the `webServer` command does).

**What it does:**
- Route list is built from `DAYS`, plus `/` and `/sandbox`: 14 routes.
- Runs twice per route with a pinned clock: once at 2026-12-27 12:00 (day
  3 of Christmas) and once at 2026-11-21 12:00 (countdown).
- Per route: wait until the `.loading__container` overlay is gone; assert a
  `canvas` exists with a non-zero size and a WebGL context that is not
  lost; fail on any `pageerror` or `console.error` not on the allow-list.
- The allow-list is an array in the spec file, each entry with a reason.
- A real error that exists on today's code: fix it if the fix changes
  nothing a visitor sees; otherwise open a Linear issue in the
  12daysofxmas project and allow-list the message with the issue number.

**Acceptance criteria:**
- [ ] `pnpm test:e2e` exits 0 locally: 28 passing tests (14 routes × 2
      clocks).
- [ ] Temporarily throwing inside one scene component makes the test for
      that route fail (checked once by hand, then reverted; noted in the
      sub-issue comment).
- [ ] Temporarily adding a `console.error` call to a scene makes the test
      fail (same check).
- [ ] Every allow-list entry has a reason, and any pre-existing error found
      is either fixed or linked to a new Linear issue.

**Depends on:** task 2

**Risk:** Headless Chromium may not create a WebGL context. Launch it with
SwiftShader (`--use-angle=swiftshader` or `--enable-unsafe-swiftshader`).
If no flag works, run headed under `xvfb-run` in CI and record that.

### 6. Lint: ESLint 10 and cleanup

**Linear:** H3N-69

**Goal:** `pnpm lint` passes with zero errors on ESLint 10 and current
plugins. The React Compiler rules are warnings until task 9.

**Files affected:**
- `package.json`, `pnpm-lock.yaml`
- `eslint.config.js`
- most files under `src/`, plus `e2e/` and config files if lint reports
  them

**What it does:**
- Latest `eslint` 10, `@eslint/js`, `typescript-eslint`,
  `eslint-plugin-react-hooks` 7, `eslint-plugin-react-refresh` 0.5,
  `globals`.
- In `eslint.config.js`, the React Compiler rules from
  `eslint-plugin-react-hooks` 7 (set-state-in-effect, purity, refs,
  immutability, and any others in that group) are set to `warn`, with a
  comment pointing at task 9.
- Everything else reported is fixed: unused imports and variables
  deleted, `any` given a type, missing hook dependencies added.
- Where adding a hook dependency would change behaviour, the rule is
  disabled on that line with a one-line reason.
- `dist/`, `captures/`, `test-results/` and `playwright-report/` are
  ignored by lint.

**Acceptance criteria:**
- [ ] `pnpm lint` exits 0 with zero errors. Any remaining warnings come
      only from the React Compiler rules.
- [ ] Every `eslint-disable` comment has a reason on the same line.
- [ ] `pnpm build`, `pnpm typecheck`, `pnpm test` and `pnpm test:e2e`
      exit 0.
- [ ] `pnpm capture after` shows all five scenes behaving as in
      `captures/before/` (checked by watching).

**Depends on:** tasks 3, 4 and 5

### 7. CI on every push and pull request

**Linear:** H3N-70

**Goal:** GitHub Actions runs every check on every push and pull request.

**Files affected:**
- `.github/workflows/ci.yml` (new)

**Interfaces:**
- Consumes: scripts `typecheck`, `lint`, `build`, `test`, `test:e2e`.

**What it does:**
- Triggers: `push` (all branches) and `pull_request`.
- Steps: checkout; pnpm via `pnpm/action-setup` (reads `packageManager`);
  Node from `.nvmrc` with the pnpm cache; `pnpm install --frozen-lockfile`;
  `typecheck`; `lint`; `build`; `test`; install Playwright Chromium with
  system dependencies; `test:e2e`.
- Uploads `playwright-report/` as an artifact when `test:e2e` fails.
- One job, `ubuntu-latest`.

**Acceptance criteria:**
- [ ] A push of `feature/revival` to GitHub runs the workflow, and every
      step passes.
- [ ] A deliberately failing unit test on a throwaway commit fails the run
      at the `test` step (checked once, then reverted).
- [ ] When `test:e2e` fails, the run has a `playwright-report` artifact.

**Depends on:** tasks 5 and 6

**Risk:** Pushing needs the owner's GitHub access from this machine. If
the push is refused, stop and ask; don't change remotes or credentials.

### 8. 3D animation on react-spring

**Linear:** H3N-71

**Goal:** `framer-motion-3d` is gone. Every 3D enter, exit and hover
animation runs on `@react-spring/three`, still on React 18 and fiber 8.

**Files affected:**
- `package.json`, `pnpm-lock.yaml` (adds `@react-spring/three`, removes
  `framer-motion-3d`)
- `src/three/utils/useEnterExit.ts` (new)
- `src/three/components/Ground/Ground.tsx` (first)
- `src/three/components/BlockText/BlockText.tsx`
- `src/three/components/Diamond/Diamond.tsx`
- `src/three/components/Forest/Forest.tsx`,
  `src/three/components/Forest/Tree.tsx`
- `src/three/components/Lightings/Lightings.tsx`
- `src/three/components/OrbitalTrails/OrbitalTrails.tsx`
- `src/three/routes/Eighth/Eighth.tsx`, `src/three/routes/Sixth/Sixth.tsx`
- plain groups: `src/three/components/CamControls/CamControls.tsx`,
  `src/three/components/Satellite/Satellite.tsx`,
  `src/three/routes/Fifth/Fifth.tsx`, `src/three/routes/Fourth/Fourth.tsx`
- unused imports: `src/three/routes/First/First.tsx`,
  `src/three/routes/Zero/Zero.tsx`, `src/three/routes/Sandbox/Sandbox.tsx`
- `eslint.config.js` only if a file needs a reasoned disable

**Interfaces:**
- Produces: `useEnterExit` in `src/three/utils/useEnterExit.ts`, the one
  shared enter/exit pattern on react-spring's `useTransition`. It takes a
  `visible` flag and the `initial`, `animate` and `exit` values with their
  durations and delays. Its exact signature is set while migrating
  `Ground.tsx` and recorded in the sub-issue comment.

**What it does:**
- `Ground.tsx` is migrated first and settles `useEnterExit`. The other
  call sites follow it.
- `AnimatePresence` from `framer-motion` is removed from every file under
  `src/three` it wrapped 3D elements in.
- Timings: each written `duration` and `delay` becomes a react-spring
  `config: { duration }` (milliseconds) and `delay`, with an easing
  matching motion's default tween ease-out where the original gave none.
  Animations that were springs stay springs.
- An exit that interrupts an unfinished enter continues from the current
  value.
- `opacity` on a group does nothing visible today; keep only its effect of
  delaying unmount.
- `BlockText`'s `whileHover` becomes pointer-over and pointer-out handlers
  driving a spring.
- `CamControls`, `Satellite`, `Fifth` and `Fourth` use plain `<group>` or
  `<points>`.
- Motion-value hooks (`useSpring`, `useTransform`, `useMotionValueEvent`,
  `frame`) in `rigControl.ts`, `Lightings.tsx` and `EffectControls.tsx`
  stay on `framer-motion` in this task.
- While each scene file is open, fix it against the React Compiler rules
  (they report as warnings since task 6). For example, derive `visible`
  from `pathname` during render; keep store calls such as `setCamera` in
  the effect.
- Second, Third, Fourth and Sixth are not mounted. They must compile and
  lint, and are not checked by eye.

**Acceptance criteria:**
- [ ] `framer-motion-3d` appears in neither `package.json` nor any file
      under `src/`.
- [ ] `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test` and
      `pnpm test:e2e` exit 0.
- [ ] `pnpm capture after`: in each of the five scenes, every element
      enters and exits on the same trigger, from the same start state to
      the same end state, as in `captures/before/` (checked by watching).
- [ ] Hovering the block text still lifts it, and moving off returns it.
- [ ] Switching routes quickly (`/` → `/first` → `/` within a second)
      leaves no element stuck half-visible, and causes no console error.
- [ ] React Compiler rule warnings in the files listed above are gone.

**Depends on:** task 5

**Risk:** If a motion cannot be reproduced as it was, stop and record it
in the sub-issue comment for the sign-off; don't change it quietly.

### 9. React 19 jump

**Linear:** H3N-72

**Goal:** The app runs on React 19, react-three-fiber 9 and the matching
3D libraries, with `framer-motion` replaced by `motion`.

**Files affected:**
- `package.json`, `pnpm-lock.yaml`
- the 32 files importing `framer-motion` (15 outside `src/three`, 17
  inside)
- `src/three/components/CamControls/rigControl.ts`
- files using React 18 or fiber 8 types (for example `MutableRefObject`,
  `GroupProps`): at least `src/App.tsx`, `src/three/ThreeView.tsx`,
  `src/three/components/CamControls/CamControls.tsx`,
  `src/three/utils/wrapper.tsx`
- `eslint.config.js`

**What it does:**
- Latest: `react`, `react-dom`, `@types/react`, `@types/react-dom` (19),
  `@react-three/fiber` (9), `@react-three/drei` (10),
  `@react-three/rapier` (2), `@react-three/postprocessing` (3), `three`
  and `@types/three` (0.187), `@react-spring/three` (stays current).
- `framer-motion` is removed and `motion` 14 added. Every
  `from 'framer-motion'` becomes `from 'motion/react'`.
- Before changing `rigControl.ts`, confirm which unit `motion` 14's
  `useSpring` reads `duration` in. Today it is `3.3 * 1000`. If the unit
  differs from `framer-motion` 11, convert it so the camera glide takes as
  long as it does today.
- Read each upgrade guide (React 19, fiber 9, drei 10, rapier 2,
  postprocessing 3, three r172 to r187) and fix what applies.
- React Compiler rules go back to `error`. Anything still reported gets a
  per-line disable with a one-line reason.

**Acceptance criteria:**
- [ ] `package.json` lists React 19.x, fiber 9.x, drei 10.x, rapier 2.x,
      postprocessing 3.x, three 0.187.x, `motion` 14.x, and no
      `framer-motion`.
- [ ] No file under `src/` imports `framer-motion`.
- [ ] `eslint.config.js` has no React Compiler rule set to `warn`;
      `pnpm lint` exits 0, and every disable has a reason.
- [ ] `pnpm build`, `pnpm typecheck`, `pnpm test` and `pnpm test:e2e`
      exit 0, locally and in CI.
- [ ] The camera glide between `/` and `/first` takes the same time as in
      `captures/before/` to within about half a second (checked by
      watching).
- [ ] `pnpm capture after`: the five scenes match `captures/before/` as in
      task 8, and bloom, noise, tilt-shift and physics still appear where
      they did.

**Depends on:** task 8

**Risk:** A 3D package may lack a release for this set (for example a
postprocessing peer range). Hold it at the newest working version and
record it; if the hold blocks React 19 itself, stop and ask.

### 10. Remaining majors

**Linear:** H3N-73

**Goal:** React Router 8, immer 11 and camera-controls 3 are in, and
nothing is behind.

**Files affected:**
- `package.json`, `pnpm-lock.yaml`
- files importing `react-router` (`src/main.tsx`, `src/App.tsx`,
  `src/three/ThreeView.tsx`, `src/components/Navi/Navi.tsx`, the scene
  routes and UI routes)
- `src/stores/*.ts` if immer 11 needs it
- `src/three/components/CamControls/*` if camera-controls 3 needs it

**What it does:**
- Each package follows its own upgrade guide, one at a time, with checks
  between them.
- Routing stays declarative: `BrowserRouter` and `<Routes>`, no move to a
  data router.

**Acceptance criteria:**
- [ ] `package.json` lists `react-router` 8.x, `immer` 11.x,
      `camera-controls` 3.x.
- [ ] `pnpm outdated` lists nothing, or only holds recorded on the feature
      issue.
- [ ] Deep links work under `vite preview`: loading `/fifth` directly
      shows day 5, and the in-app back control returns to `/`.
- [ ] Orbiting the camera by drag and the min/max zoom limits behave as
      before on `/`.
- [ ] `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test` and
      `pnpm test:e2e` exit 0, locally and in CI.

**Depends on:** task 9

### 11. Owner sign-off

**Linear:** H3N-74

**Goal:** The owner has compared each mounted scene before and after and
signed it off.

**Files affected:** none

**What it does:**
- Run `pnpm capture after` on the final code.
- Give the owner the paths of the five before/after pairs, plus a list of
  anything recorded as "could not reproduce" in tasks 8 and 9.
- The owner either signs off a scene or names what to change. Changes go
  back to the task that owns them, then capture and sign-off repeat for
  that scene.

**Acceptance criteria:**
- [ ] Five before/after pairs exist in `captures/before/` and
      `captures/after/`.
- [ ] The owner's sign-off for each of `/`, `/first`, `/fifth`, `/eighth`,
      `/sandbox` is recorded in a comment on this sub-issue.
- [ ] CI is green on the final commit of `feature/revival`.

**Depends on:** tasks 1 and 10
