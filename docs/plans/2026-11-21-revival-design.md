# Revival: design

Date: 2026-11-21
Status: approved
Size: feature
Linear: to be created
Project: 12daysofxmas
Builds on: none. Follow-ups that depend on this: H3N-59 (WebGPU), H3N-60 (Cloudflare Workers hosting).

## Intent

12daysofxmas was last touched in January 2025. It is to be finished for
Christmas 2026, with more days and an AI feature still to come. Before any
of that, the project needs a current, tested base: packages up to date,
tests that catch breakage, and the major library upgrades done once.

This feature is that base. It adds no new scenes and no new features.

## Goals

- Every dependency is on its latest stable version, or held for a recorded
  reason.
- Basic tests exist: unit tests for the pure logic, and a browser smoke
  test that proves every route still mounts.
- React 19, React Router 8 and react-three-fiber 9 are in, and the dead
  `framer-motion-3d` library is gone.
- The Christmas countdown is correct.
- Lint is clean, and CI runs every check on every push and pull request.

## Non-goals

- WebGPU. The project stays on WebGL. Tracked in H3N-59.
- Hosting on Cloudflare Workers. Tracked in H3N-60.
- New days, new scenes, or wiring up scenes that are commented out today.
- The AI feature.
- Component render tests for the HTML UI.
- Automated visual comparison of scenes.
- Stopping visitors opening a day's URL before it unlocks. The gap exists
  today and stays.
- Refactors beyond what an upgrade or a lint fix needs.
- A README rewrite.
- Firefox and Safari in the smoke test.

## Anti-goals

The work has failed, even if every check is green, if:

- a scene animates differently in a way the owner did not sign off;
- any behaviour other than the countdown fixes changes;
- a choice made here blocks the later move to WebGPU (for example, new
  code tied to WebGL-only APIs);
- tests are padded to look thorough, or a failing check is silenced
  instead of fixed.

## Constraints

- Each 3D animation keeps its trigger, its start state and its end state.
  Spring feel may differ slightly. The owner signs off each mounted scene
  by eye against a before-capture.
- TypeScript goes only as far as `typescript-eslint` supports. At the time
  of writing it accepts `<6.1.0`, and TypeScript 7 is out.
- The package manager stays pnpm. The existing lockfile is version 6 and
  `pnpm outdated` crashes on it under pnpm 10, so the lockfile is
  regenerated.
- Work happens on a branch off `develop`, one commit per task.

## Where the project stands

Vite 6, React 18.3, React Router 7, react-three-fiber 8, pnpm. Type-check
passes. Lint fails with 296 problems (267 errors, 29 warnings), mostly
unused imports. No tests, no CI, no deploy config.

`src/App.tsx` mounts a full-screen WebGL canvas (`src/three/ThreeView.tsx`)
under an HTML UI layer routed by React Router. Each day is a route. The
canvas does not use the router to mount scenes: every scene component is
always mounted and shows or hides itself from `useLocation()`, so that it
can run its own exit animation. Scenes mounted today: Zero (`/`), First,
Fifth, Eighth, Sandbox. Second, Third, Fourth and Sixth exist but are
commented out or not mounted.

Versions, current to target (latest stable on 2026-11-21):

| Package | Now | Target | Step |
|---|---|---|---|
| vite | 6.0 | 8.3 | 1 |
| @vitejs/plugin-react-swc | 3.7 | 4.3 | 1 |
| vite-plugin-restart | 0.4 | 2.0 | 1 |
| vite-plugin-glsl | 1.3 | 1.6 | 1 |
| typescript | 5.6 | newest typescript-eslint accepts | 1 |
| sass, luxon, zustand, styled-components, gl-matrix, postprocessing, @types/luxon | in-range bumps | latest | 1 |
| vitest, @playwright/test | none | 5.1, 1.65 | 2 |
| eslint, @eslint/js | 9.16 | 10.x | 3 |
| typescript-eslint | 8.18 | 8.73 | 3 |
| eslint-plugin-react-hooks | 5.1 | 7.1 | 3 |
| eslint-plugin-react-refresh | 0.4 | 0.5 | 3 |
| globals | 15 | 17 | 3 |
| react, react-dom, @types/react, @types/react-dom | 18.3 | 19.3 | 5 |
| @react-three/fiber | 8.17 | 9.8 | 5 |
| @react-three/drei | 9.120 | 10.7 | 5 |
| @react-three/rapier | 1.5 | 2.2 | 5 |
| @react-three/postprocessing | 2.16 | 3.2 | 5 |
| three, @types/three | 0.171 / 0.170 | 0.187 | 5 |
| framer-motion | 11.15 | replaced by `motion` 14 | 5 |
| framer-motion-3d | 11.15 | removed, replaced by `@react-spring/three` 10 | 5 |
| react-router | 7.0 | 8.5 | 6 |
| immer | 10.1 | 11.2 | 6 |
| camera-controls | 2.9 | 3.1 | 6 |

`@use-gesture/vanilla`, `tunnel-rat` and `typed-glsl` are already on their
latest versions.

## Approaches

The only real choice was what replaces `framer-motion-3d`. It is
deprecated and its peer dependency pins react-three-fiber 8, while React 19
requires react-three-fiber 9. Twelve call sites use `motion.group` or
`motion.mesh` with `initial`, `animate`, `exit`, `transition` and one
`whileHover`, wrapped in `AnimatePresence`. Four more use `motion.group`
with no animation.

- **A. An in-repo `motion3d` module** that mimics the same props on top of
  `motion`'s `animate()` and `usePresence`. Smallest diff and timings carry
  over as written, but about 200 lines of animation glue to own, and
  `AnimatePresence` inside fiber 9 is unproven.
- **B. `@react-spring/three`.** A maintained library built for
  react-three-fiber. Every call site and its exit handling is rewritten,
  timings are re-expressed, and the project carries two animation
  libraries (react-spring for 3D elements, `motion` for everything else).
- **C. Hand-written `useFrame` easing per component.** No dependency and
  no abstraction, but the most code and every timing changes.

GSAP was considered and dropped: a third animation system whose timelines
do not fit the mount/unmount pattern.

**Chosen: B**, by the owner. A was recommended for keeping timings as
written; the owner preferred a maintained library over owned glue code.

## The design

### Order of work

```
0  Before-captures   record each mounted scene on today's code
1  Safe updates      in-range bumps + build tooling, lockfile regenerated
2  Tests + countdown Vitest units, countdown fixed, Playwright smoke
3  Lint              ESLint 10, clear the existing problems
4  CI                GitHub Actions: type-check, lint, build, units, smoke
5  React 19 jump     the React 19 group, framer-motion-3d -> react-spring
6  Remaining majors  React Router 8, immer 11, camera-controls 3
7  Sign-off          the owner compares each scene with its before-capture
```

The order is the owner's (updates, tests, majors) with lint, CI and
sign-off placed where earlier steps protect them: lint after tests, so a
hook-dependency fix cannot silently change behaviour; CI before the
React 19 jump, so the riskiest step is checked on every push.

Step 5 is one indivisible change. React 19, fiber 9, drei 10, rapier 2 and
postprocessing 3 all require each other, and `framer-motion-3d` cannot load
once fiber 9 is in.

Each step ends with every check that exists at that point passing. Steps 0
and 1 predate the tests, so they are proved by build, type-check and a
manual look at the five mounted scenes.

### Step 0: before-captures

A Playwright script, `e2e/capture.ts`, opens each mounted scene (`/`,
`/first`, `/fifth`, `/eighth`, `/sandbox`), records a short video that
includes the enter animation, then navigates away to record the exit. It
is run once on today's code and again in step 7. Output goes to a
git-ignored folder.

### Step 1: safe updates

Everything not tied to the React 19 group: the in-range bumps and the
build tooling in the table above. The lockfile is regenerated under the
current pnpm. `package.json` gains a `packageManager` field and an
`engines.node` range so the versions are pinned.

`three` is not in this step. 0.171 to 0.187 is a minor bump by number but
breaking in practice, and drei 10 sets the floor, so it moves with step 5.

### Step 2: tests and the countdown

**Countdown.** The maths in `src/hooks/dateTime.tsx` sits inside a
`setInterval` callback and cannot be tested there. It moves into a pure
function that takes "now" and returns the state. The provider calls it
once on mount and then every second. Three fixes go in with it:

1. Christmas starts at the visitor's local midnight on 25 December, not
   midnight UTC. Each day unlocks at local midnight.
2. The 12 days run through 5 January. The period ends at the start of
   6 January. Today the "still last Christmas" rule checks `day < 5`, so
   5 January is treated as over.
3. `months` is removed. It was computed as days divided by 12 and nothing
   reads it.

The remainder (days, hours, minutes, seconds) comes from calendar
arithmetic, not seconds divided by 86,400, so a clock change between now
and Christmas cannot shift the split. `days` stays a total day count, as
the home page displays it. `isNearXmas` (December or January) is
unchanged.

**Unit tests** (Vitest, files beside the code they test):

- the countdown, with a fixed clock, at the boundaries listed under
  "Errors and edge cases", run in two time zones;
- `fiberStore`: each setter updates its fields, and a partial update
  leaves the other fields alone;
- `transitionStore`, with fake timers: `init` reaches `COMPLETED` after
  2 seconds, `exit` does the same, `abort` cancels the pending timer;
- `nextPowerOf2`; `randomTiming`, `randomDistance` and `randomOrbit` stay
  inside their bounds; the boid texture fills stay inside theirs.

**Smoke test** (Playwright, `e2e/smoke.spec.ts`, Chromium only, against
`vite preview` of the production build). It visits all 14 routes: `/`, the
12 day routes from `DAYS` in `src/helpers/constants.tsx`, and `/sandbox`.
For each it asserts that a canvas with a live WebGL context exists, that
the loading overlay has gone, and that no uncaught error or
`console.error` occurred.

New scripts: `test`, `test:e2e`, `typecheck`.

### Step 3: lint

ESLint 10 and the plugin versions in the table. The existing problems are
cleared: unused imports and variables deleted, `any` given a type,
hook-dependency warnings resolved one at a time.

`eslint-plugin-react-hooks` 7 adds React Compiler rules (for example
set-state-in-effect, purity, refs, immutability). They object to patterns
the scenes rely on: each scene sets `visible` from the route inside an
effect so it can play its exit, random values are made during render, and
the camera rig reads refs during render. In this step those rules are set
to `warn`, so lint passes with zero errors. Everything else is fixed here.

Scene files are fixed against the compiler rules in step 5, when they are
rewritten anyway, so no file is rewritten twice. At the end of step 5 the
rules go back to `error`. Anything still reported then gets a per-line
disable with a one-line reason. (Decided by the owner after the builder
check.)

### Step 4: CI

One workflow, `.github/workflows/ci.yml`, on push and pull request:
install with a pnpm cache, type-check, lint, build, unit tests, smoke test.
The countdown tests run under two `TZ` values. The Playwright report is
uploaded when the smoke test fails.

### Step 5: the React 19 jump

The React 19 group in the table, as one change.

**3D animation.** The 12 animated call sites move to react-spring's
`animated.*` elements. Enter and exit use `useTransition`, which replaces
`AnimatePresence`. One shared hook holds the enter/exit pattern so the
call sites do not each hand-roll it. `src/three/components/Ground/Ground.tsx`
is the simplest case and is migrated first to settle the pattern; the
other 11 follow it. Durations and delays written today are kept as
durations and delays, not converted to spring physics.

While each scene file is open, it is also fixed against the React
Compiler lint rules (see step 3). At the end of this step those rules go
back to `error`.

The four `motion.group`s with no animation (`CamControls`, `Fifth`,
`Fourth`, `Satellite`'s `motion.points`) become plain elements.

Scenes not mounted today (Second, Third, Fourth, Sixth) are migrated so
they compile. They are not signed off by eye.

**Everything else on `framer-motion`.** `framer-motion` 11 becomes
`motion` 14, the library's current name. 32 files import it: 15 in the
HTML UI and 17 inside `src/three`. All of them change their import to
`motion/react`. Only the `motion.*` 3D elements move to react-spring.
Motion-value hooks used inside the canvas (`useSpring`, `useTransform`,
`useMotionValueEvent`, `frame` in
`src/three/components/CamControls/rigControl.ts`,
`src/three/components/Lightings/Lightings.tsx` and
`src/three/components/EffectControls/EffectControls.tsx`) stay on
`motion`. Nothing else about them changes.

The camera rig needs its own check. Its spring is set as
`duration: 3.3 * 1000`. Before the upgrade, confirm which unit `motion`
14's `useSpring` reads `duration` in. If it differs from `framer-motion`
11, convert the value so the glide takes as long as it does today. The
camera glide is part of every scene's sign-off.

**Types.** React 19 and fiber 9 change some types this code uses, for
example `MutableRefObject` and fiber's `GroupProps`. They are fixed here.

### Step 6: remaining majors

React Router 8, immer 11 and camera-controls 3, each following its own
upgrade guide.

### Step 7: sign-off

The capture script runs again. The owner compares before and after for
`/`, `/first`, `/fifth`, `/eighth` and `/sandbox` and signs off each one.

## Errors and edge cases

**Countdown**, all in the visitor's local time:

| Now | Expected |
|---|---|
| 24 Dec 23:59:59 | not Christmas; one second left |
| 25 Dec 00:00:00 | Christmas; day 1 |
| 1 Jan | still last year's Christmas; day 8 |
| 5 Jan 23:59:59 | Christmas; day 12 |
| 6 Jan 00:00:00 | over; counting down to the next 25 December |

**Smoke test**

- The browser clock is pinned, with one run inside the 12 days and one
  outside, so the home page is the same on every run.
- An empty canvas must fail, not pass. That is why each route asserts a
  live WebGL context and a finished loading overlay.
- Only uncaught errors and `console.error` fail the test. A known harmless
  message goes on a short, explicit allow-list with a reason.
- If the smoke test finds a real error that exists on today's code, fix it
  when the fix changes nothing a visitor sees. Otherwise open a Linear
  issue for it and put it on the allow-list with the issue number.

**Upgrades**

- If a package has no release that works with the new stack, it is held
  at the newest version that does, and the hold is recorded in the Linear
  issue. The builder decides this without stopping to ask.
- If Vite 8 breaks the GLSL or restart plugin, Vite is held at 7 on the
  same rule.

**3D animation**

- An exit that interrupts an unfinished enter (fast route changes)
  continues from the current value, not from the end state.
- `opacity` on a group does nothing visible today; it only delays
  unmounting. The delay is kept. The no-op is not faked.
- Where react-spring cannot reproduce something as it is, it is raised at
  sign-off. It is not quietly changed.

**Lint**

- Where adding a missing hook dependency would change behaviour, behaviour
  wins: the rule is disabled on that line with a one-line reason.

## Decisions

**The owner's**

- React 19 now, with `framer-motion-3d` replaced, not deferred.
- `@react-spring/three` as the replacement (approach B).
- Tests are unit tests for logic plus a browser smoke test. No component
  render tests.
- WebGPU is a separate follow-up (H3N-59). Hosting on Cloudflare Workers
  is a separate follow-up (H3N-60).
- Done means build, tests and lint clean, with CI.
- Animations keep their behaviour; feel may differ slightly; sign-off is
  by eye per scene.
- The countdown bugs are fixed as part of the tests, and Christmas starts
  at the visitor's local midnight.
- The order of work above.
- React Compiler lint rules are set to warn in step 3, fixed in the scene
  files during step 5, then set back to error; anything left gets a
  per-line disable with a reason.

**Mine (the designer's), open to being overruled**

- `three` moves with the React 19 jump, not with the safe updates.
- Lint comes after tests; CI comes before the React 19 jump.
- Tests sit beside the code; the smoke test lives in `e2e/`.
- The smoke test runs in Chromium only, against `vite preview`.
- One shared hook for the react-spring enter/exit pattern.
- All 32 `framer-motion` imports are renamed to `motion/react`.
- Motion-value hooks inside the canvas (camera rig, lights, effects) stay
  on `motion`. Only `motion.*` 3D elements move to react-spring. This
  keeps the camera glide, the most visible motion in every scene, off the
  rewrite list. (Raised by the builder check.)
- A real error the smoke test finds in today's code is fixed if the fix
  is invisible to visitors, otherwise logged in Linear and allow-listed.
  (Raised by the builder check.)
- `months` is deleted from the countdown.
- The countdown is computed once on mount, then every second. Today the
  first second shows placeholder values.
- Unmounted scenes are migrated to compile but not signed off.
- A package that cannot reach latest is held and recorded without asking.
- No coverage threshold.
- The countdown tests run under two `TZ` values in CI.

## How we will know it works

| Behaviour | Proof |
|---|---|
| Countdown fixes and boundaries | Vitest, fixed clock, two time zones |
| Store updates and transitions | Vitest, fake timers where needed |
| Helpers stay inside their bounds | Vitest |
| Every route mounts with a live canvas and no errors | Playwright smoke, 14 routes, production build |
| Scenes look and move as before | before/after captures, owner sign-off on 5 scenes |
| Nothing is behind | `pnpm outdated` shows only recorded holds |
| The toolchain is sound | `pnpm build`, `pnpm typecheck`, `pnpm lint` exit clean, locally and in CI |

## Left to the builder

- The exact versions at install time, and any hold a peer conflict forces.
- The shape of the shared enter/exit hook, once Ground has been migrated.
- How the smoke test detects a finished load and a live WebGL context.
- How headless Chromium gets a WebGL context in CI.
- The API changes in React Router 8, drei 10, rapier 2, postprocessing 3,
  three 0.187 and `eslint-plugin-react-hooks` 7. None was checked in
  detail for this design; read each upgrade guide before its step.
- Which second time zone the countdown tests use.
- The branch name and the split of each step into commits.
