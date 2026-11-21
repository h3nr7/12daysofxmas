# Implementation Plan: debug mode

Design: [2026-11-21-debug-mode-design.md](./2026-11-21-debug-mode-design.md)
Linear: H3N-78

## Overview

One debug mode for the owner to test 12daysofxmas, switched on from the
URL. `?debug` shows the Stats panel, the camera helper and the "Begin
here" link; `&date=YYYY-MM-DD` makes the site behave as on that date.
Both params stay in the URL on every in-app move. It replaces the
unreachable `DEBUGGING` constant in `ZeroUI.tsx` and the store's
`data.debug`, which nothing turned on.

## Global constraints

- Build on a branch off `feature/revival` (`main` is 15 commits behind
  and has no e2e suite).
- Nothing changes for a visitor without `?debug`: URLs, the home page,
  and the "Begin here" link (hidden) stay as today.
- URL format, exactly: `?debug` or `?debug&date=YYYY-MM-DD`. Not
  `debug=&date=`.
- `debug` present means on, unless its value is `0`, `false` or `off`.
- `date` is read only when debug is on, and kept only when it is a valid
  date in exact `YYYY-MM-DD` shape. An invalid one logs
  `console.warn('debug: ignoring date "<value>", expected YYYY-MM-DD')`,
  a warning, never an error.
- Only `debug` and `date` are carried between pages; other params drop
  on the first move, as today.
- Debug state lives only in the URL. No store field, no storage.
- `computeXmasState` and the H3N-66 rules (local midnight, 25 December
  through 5 January) are unchanged.
- Browser tests stub Typekit (`page.route('https://use.typekit.net/**', …)`)
  as `e2e/smoke.spec.ts` does, and install the clock before `goto`.

## Tasks

### 1. URL helpers, and navigation that carries them

**Linear:** H3N-79

**Goal:** `?debug` and `date=` are parsed from the URL in one place, and
every in-app move keeps them.

**Files affected:**
- `src/hooks/debug.ts` (new)
- `src/hooks/debug.test.ts` (new)
- `src/hooks/debugNavigation.tsx` (new)
- `src/routes/Zero/ZeroUI.tsx`
- `src/components/Navi/Navi.tsx`
- `eslint.config.js`
- `e2e/debug.spec.ts` (new)

**Interfaces:**
- Produces, from `src/hooks/debug.ts`:
  - `interface DebugState { on: boolean; date?: string }`
  - `parseDebug(search: string): DebugState`
  - `withDebug(path: string, search: string): string`
  - `useDebug(): DebugState`, `parseDebug(useLocation().search)` memoised
    on the search string
- Produces, from `src/hooks/debugNavigation.tsx`:
  - `useDebugNavigate(): (path: string) => void`
  - `DebugLink`, props `{ to: string; children: ReactNode }`, rendering
    react-router's `Link` with `to={withDebug(to, search)}`

**What it does:**
- `parseDebug` follows the global constraints; it accepts the search
  with or without the leading `?`.
- `withDebug` returns `path` unchanged when debug is off. When on, it
  returns `${path}?debug`, plus `&date=${date}` when there is a date,
  built by hand.
- The home button and `*Bk` call `useDebugNavigate()`. The "Begin here"
  link becomes a `DebugLink`; its show condition is left for task 3.
- `eslint.config.js` adds `no-restricted-imports` with
  `paths: [{ name: 'react-router', importNames: ['useNavigate', 'Link'], message }]`.
  The message names `useDebugNavigate` and `DebugLink` from
  `src/hooks/debugNavigation.tsx`. That file is exempt.
- `debugNavigation.tsx` exports a hook and a component. Silence
  `react-refresh/only-export-components` with the one-line disable
  comment the codebase already uses beside context hooks.

**Acceptance criteria:**
- [ ] `pnpm test` covers `parseDebug`: `''` gives `{ on: false }`;
  `?debug` and `?debug=1` are on; `?debug=0`, `?debug=false` and
  `?debug=off` are off; `?debug&date=2026-12-27` gives
  `{ on: true, date: '2026-12-27' }`; `?date=2026-12-27` gives
  `{ on: false }` with no date.
- [ ] `?debug&date=` with `2026-13-40`, `2026-02-29`, `tomorrow` and
  `27-12-2026` each gives `{ on: true }` with no date, and calls
  `console.warn` once with a message containing the bad value.
- [ ] `pnpm test` covers `withDebug`: with search `''` it returns
  `/third`; with `?debug`, `/third?debug`; with
  `?debug&date=2026-12-27`, `/third?debug&date=2026-12-27`; with
  `?debug&utm_source=x`, `/third?debug`.
- [ ] In the browser on a 27 December 2026 clock, `/?debug`: clicking
  the home button lands on `/third?debug`, and clicking `*Bk` there lands
  on `/?debug`.
- [ ] The same walk from `/` lands on `/third`, then `/`: no params
  appear for a visitor.
- [ ] ESLint on a throwaway `src/` file that imports `Link` from
  `react-router` fails with the rule's message; `pnpm lint` passes on the
  real tree.
- [ ] `useNavigate` and `Link` are imported from `react-router` only in
  `src/hooks/debugNavigation.tsx`.

### 2. The fake date

**Linear:** H3N-80

**Goal:** with `?debug&date=YYYY-MM-DD`, the site behaves as on that
date, with the clock still running.

**Files affected:**
- `src/hooks/debug.ts`
- `src/hooks/debug.test.ts`
- `src/hooks/dateTime.tsx`
- `e2e/debug.spec.ts`

**Interfaces:**
- Consumes: `useDebug()` from task 1
- Produces: `debugOffset(date: string | undefined, now: DateTime): number`
  in `src/hooks/debug.ts`

**What it does:**
- `debugOffset` returns 0 with no date. Otherwise it returns, in
  milliseconds, `now` with its year, month and day set to `date`
  (keeping time of day and zone) minus `now`.
- `DateTimeProvider` computes the offset once per `date` value and uses
  `DateTime.now().plus(offset)` on the first render and in the 1-second
  tick. When the offset changes, the state is recomputed at once.

**Acceptance criteria:**
- [ ] `pnpm test`: `debugOffset(undefined, now)` is 0.
- [ ] `pnpm test`: for `now` at 2026-11-21T17:10:05 local,
  `now.plus(debugOffset('2026-12-27', now))` is 2026-12-27T17:10:05.
- [ ] `pnpm test`: for `now` at 2026-11-21T23:00:00 local, seven hours
  after `now.plus(debugOffset('2026-12-27', now))` is on 28 December.
- [ ] In the browser on a 21 November 2026 clock,
  `/?debug&date=2026-12-27` shows an enabled button reading "Day 3
  awaits". Clicking it lands on `/third?debug&date=2026-12-27`, and
  `*Bk` there lands on `/?debug&date=2026-12-27`.
- [ ] On the same clock, `/?debug&date=2026-12-01` shows the countdown
  with `23D`.
- [ ] On the same clock, `/?date=2026-12-27` and
  `/?debug&date=2026-13-40` both show a disabled button with no "Day 3
  awaits".
- [ ] The existing `xmasCountdown` unit tests pass unchanged.

**Depends on:** task 1

### 3. Overlays and the "Begin here" link on debug mode

**Linear:** H3N-81

**Goal:** debug mode shows the Stats panel and camera helper on every
page and the "Begin here" link on home; the old switches are gone.

**Files affected:**
- `src/App.tsx`
- `src/three/components/CamControls/CamControls.tsx`
- `src/routes/Zero/ZeroUI.tsx`
- `src/stores/fiberStore.ts`
- `src/stores/fiberStore.test.ts`
- `src/three/routes/Eighth/Eighth.tsx`
- `e2e/debug.spec.ts`

**Interfaces:**
- Consumes: `useDebug()` and `DebugLink` from task 1

**What it does:**
- `App` renders `<Stats className="debug-stats" />` when
  `useDebug().on`.
- `CamControls` renders the camera helper when `useDebug().on`.
- `ZeroUI` drops `const DEBUGGING` and renders the "Begin here" `h6`
  when `useDebug().on`, replacing `!isNearXmas || DEBUGGING && …`.
- `fiberStore` loses `data.debug` and `setDebug`; its test loses the
  `setDebug` case. `Eighth` loses its `setDebug(false)` effect.

**Acceptance criteria:**
- [ ] In the browser on a 21 November 2026 clock,
  `/?debug&date=2026-12-27` shows `.debug-stats` and the "Begin here"
  link. Clicking "Begin here" lands on `/first?debug&date=2026-12-27`.
- [ ] After clicking the home button from there, `/third?debug&date=2026-12-27`
  still shows `.debug-stats`.
- [ ] `/?debug` shows `.debug-stats`, the "Begin here" link and a
  disabled button, with no page errors.
- [ ] `/eighth?debug` still shows `.debug-stats` once the scene has
  mounted.
- [ ] `/` shows no `.debug-stats` and no "Begin here" link.
- [ ] `grep -rn "setDebug\|data.debug\|DEBUGGING" src` finds nothing.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test` and
  `pnpm test:e2e` pass, including the existing home, smoke and camera
  specs.

**Depends on:** task 1
