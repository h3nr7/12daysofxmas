# Debug mode: design

Date: 2026-11-21
Status: approved
Size: feature
Linear: H3N-78
Project: 12daysofxmas
Builds on: [Revival design](2026-11-21-revival-design.md) (H3N-63), the countdown rules from H3N-66, and H3N-77 (the home page title).

## Intent

The site's owner needs to test 12daysofxmas before and during Christmas
without waiting for the calendar or editing code. Today there are two
debug switches and neither can be reached:

- `const DEBUGGING = false` is hard-coded in `src/routes/Zero/ZeroUI.tsx`.
  It is meant to show the "Can't wait? Begin here..." link, but that line
  never renders: `!isNearXmas || DEBUGGING && <h6>` evaluates to `true`
  outside December and January, and React renders `true` as nothing.
- `data.debug` in `src/stores/fiberStore.ts` shows drei's `<Stats/>`
  (`src/App.tsx`) and a camera helper
  (`src/three/components/CamControls/CamControls.tsx`). Nothing turns it
  on, and `src/three/routes/Eighth/Eighth.tsx` turns it off on mount.

This feature replaces both with one debug mode, switched on from the URL.

## Goals

- `?debug` in the URL turns debug mode on, on any page, in any build,
  including the live site.
- Debug mode shows the Stats panel and the camera helper on every page,
  and the "Begin here" link on the home page.
- `&date=YYYY-MM-DD` makes the site behave as on that date: the
  countdown, the day N button, the waiting text. Without `date=`, the real
  date is used.
- `?debug` and `date=` stay in the URL on every in-app move: the home
  button, the "Begin here" link and the `*Bk` back link. A reload or a
  copied link keeps debug on. Removing them from the URL turns debug off.

## Non-goals

- LaunchDarkly. It was in the first request and dropped by the owner:
  "forget launchdarkly, just a query param flag that carried over when
  navigating."
- Remembering debug anywhere but the URL (session or local storage).
- A time of day in `date=`.
- Carrying query params other than `debug` and `date`.
- An on-screen debug panel or toggle.
- Making the camera helper more useful. It is attached to the camera
  being looked through, so it probably shows little. It is wired up as
  it is.

## Anti-goals

- Any change for a visitor without `?debug`. URLs, the home page and the
  "Begin here" link (hidden) stay exactly as today.
- Navigation that mounts a page twice. `<Routes key={location.key}>` in
  `src/App.tsx` remounts the UI on every location change, so a second
  navigation to restore params would restart a day page's entry
  animations.
- Debug state held anywhere but the URL, so that what the address bar
  says and what the page does can't disagree.

## Constraints

- Work on `feature/revival`. `main` is 15 commits behind and has no e2e
  suite.
- The countdown rules from H3N-66 stand: local midnight, 25 December
  through 5 January, `computeXmasState` as a pure function.
- Unit tests run in Vitest's node environment (`src/**/*.test.ts`), with
  no DOM. Browser behaviour is tested with Playwright against the
  production build.
- CI runs typecheck, lint, build, unit and e2e tests on every push.

## Where it stands today

- Navigation happens in three places only: the home button
  (`navi(\`/${DAYS[xmasDayCount - 1].day}\`)`) and the "Begin here"
  `<Link to='/first'>` in `ZeroUI.tsx`, and `*Bk` (`navi('/')`) in
  `src/components/Navi/Navi.tsx`.
- Only `src/hooks/dateTime.tsx` reads the clock (`DateTime.now()`, on
  first render and in a 1-second interval).
- The day pages `/first` to `/twelve` open by URL on any date. Only the
  home page depends on the date.
- Router context reaches inside the R3F canvas: the Eighth scene already
  calls `useLocation()` there.

## Approaches

**A. Debug comes from the URL, and the three links carry it.** A hook
reads `debug` and `date` from the current URL. The three navigation spots
add the params through a pure `withDebug(path, search)`. Stats and the
camera helper read the hook; the store loses `debug`. Gives: the URL is
the only switch, one navigation per move, pure functions to unit test.
Costs: a future link that skips the wrapper drops debug, guarded by a
lint rule and a browser test.

**B. Read once into the store, restore the params after every move.** At
load the URL's params go into the zustand store. A watcher sees any
location without them and does a `replace` navigation adding them back.
Gives: every navigation, now or future, keeps debug with no change at the
call sites. Costs: two navigations per move, so the UI remounts
(`key={location.key}`) and day pages restart their entry animations; in
the app, debug can't be turned off without a reload.

**Considered and dropped:** a custom router history that adds the params
to every URL. React Router 8's `BrowserRouter` takes no custom history,
so this means changing the router setup in `src/main.tsx`: more change
than three call sites justify, with risk to the scene and camera
behaviour fixed in H3N-72.

**Picked: A.** It matches what the owner asked for (the URL is the
switch; remove it and debug is off) and avoids double-mounting pages that
depend on their entry animations.

## The design

### How it fits together

```
URL ?debug&date=2026-12-27
        │
  src/hooks/debug.ts ── parseDebug(search) → { on, date }
        │                withDebug(path, search) → path + ?debug[&date=]
        │                debugOffset(date, now) → ms
        │                useDebug()  (reads useLocation().search)
        │
        ├─ DateTimeProvider ── fakes "now" from date
        ├─ App ─────────────── <Stats/> when on
        ├─ CamControls ─────── camera helper when on
        ├─ ZeroUI ──────────── "Begin here" link when on
        └─ useDebugNavigate / DebugLink ── carry the params on each move
                 used by: home button, "Begin here", *Bk
```

### The parts

- **`src/hooks/debug.ts` (new).**
  - `parseDebug(search: string): { on: boolean; date?: string }`. `debug`
    present means on, unless its value is `0`, `false` or `off`. `date` is
    read only when debug is on, and only kept when it is a valid
    `YYYY-MM-DD` date (Luxon `DateTime.fromISO` with `isValid`, and the
    exact `YYYY-MM-DD` shape).
  - `withDebug(path: string, search: string): string`. With debug off,
    returns `path` unchanged. With debug on, returns
    `${path}?debug`, plus `&date=${date}` when there is a date. Written by
    hand so the URL reads `?debug&date=…`, as typed, not URLSearchParams'
    `debug=&date=…`.
  - `debugOffset(date: string | undefined, now: DateTime): number`. With
    no date, 0. Otherwise `now` with its year, month and day set to
    `date`, keeping the time of day and the zone, minus `now`, in
    milliseconds.
  - `useDebug()`: `parseDebug(useLocation().search)`, memoised on the
    search string.
- **`src/hooks/debugNavigation.tsx` (new).** `useDebugNavigate()` returns
  `(path) => navigate(withDebug(path, search))`. `<DebugLink to>` renders
  react-router's `<Link to={withDebug(to, search)}>`. The only file
  allowed to import `useNavigate` and `Link` from `react-router`.
- **`src/routes/Zero/ZeroUI.tsx`.** The button uses `useDebugNavigate`;
  "Begin here" becomes a `DebugLink`. `const DEBUGGING` goes. The link
  renders when `useDebug().on`, which also replaces the broken
  `!isNearXmas || DEBUGGING && …` expression.
- **`src/components/Navi/Navi.tsx`.** `*Bk` uses `useDebugNavigate`.
- **`src/App.tsx`.** `<Stats className="debug-stats"/>` renders when
  `useDebug().on`.
- **`src/three/components/CamControls/CamControls.tsx`.** The camera
  helper renders when `useDebug().on`.
- **`src/stores/fiberStore.ts`.** `data.debug` and `setDebug` are removed,
  with their test in `fiberStore.test.ts`.
- **`src/three/routes/Eighth/Eighth.tsx`.** The `setDebug(false)` effect
  goes. Nothing in the code ever set debug on, so nothing relied on it.
- **`eslint.config.js`.** `no-restricted-imports` bans `useNavigate` and
  `Link` from `react-router`, with a message pointing to
  `useDebugNavigate` and `DebugLink`, except in
  `src/hooks/debugNavigation.tsx`.

### The fake date

`DateTimeProvider` takes `date` from `useDebug()`, computes
`offset = debugOffset(date, DateTime.now())` once per `date` value, and
uses `DateTime.now().plus(offset)` wherever it used `DateTime.now()`: the
first render and the 1-second tick. When the offset changes, the state is
recomputed at once.

```
real now:  21 Nov 17:10:05
date=      2026-12-27
fake now:  27 Dec 17:10:05  → ticks on → 27 Dec 23:59:59 → 28 Dec 00:00:00
```

What the owner sees:

- `/?debug&date=2026-12-27`: day 3. The "Day 3 awaits" button is enabled.
- `/?debug&date=2026-12-24` at 17:10: the countdown shows `6H 49M 55S`
  and runs down to Christmas at the fake midnight.
- `/?debug&date=2026-01-06`: the waiting text and a disabled button.

`computeXmasState` and the H3N-66 rules are unchanged; it is only handed
a different "now".

### Errors and edge cases

| Case | What happens |
|---|---|
| `?date=2026-12-27` without `debug` | Ignored. Real date; not carried by `withDebug`. |
| Invalid date: `2026-13-40`, `2026-02-29`, `tomorrow`, `27-12-2026` | Ignored. Debug stays on with the real date. `console.warn('debug: ignoring date "…", expected YYYY-MM-DD')`. |
| `?debug=0`, `false` or `off` | Debug is off. Bare `?debug` or any other value is on. |
| Other params, e.g. `?debug&utm_source=x` | Only `debug` and `date` are carried. Others drop on the first move, as today. |
| Deep link `/third?debug&date=2026-12-27` | Works. `*Bk` returns to `/?debug&date=2026-12-27`. |
| Browser back and forward | Each history entry already has its URL, so debug follows it. |
| A future `Link` or `useNavigate` outside the wrappers | `pnpm lint` fails with the rule's message. CI runs lint. |
| Phone | The Stats panel sits top-left over part of the title. Accepted for a debug view. |
| A visitor finds `?debug` | They see the FPS panel and can fake the date. The day pages already open by URL, so nothing is revealed that isn't public. Accepted by the owner. |

## Decisions

Made by the owner:

- Debug mode shows the Stats panel and camera helper, the "Begin here"
  link, and can fake the date.
- No LaunchDarkly; a query param only.
- The params stay in the URL on every in-app move (not remembered for the
  visit without the URL).
- The date is given as `&date=YYYY-MM-DD`, alongside `?debug`.
- The "Begin here" link shows in debug mode only; visitors don't see it.
- `?debug` works for anyone on the live site.
- Approach A.
- One feature issue with sub-issues, in the 12daysofxmas project.

My calls, made during the design and agreed section by section:

- `withDebug` writes `?debug&date=…` by hand, and returns the path
  unchanged when debug is off.
- The navigation wrappers sit in their own file, so the lint exception
  covers one file.
- The fake clock runs: the offset is fixed once, so time moves on and
  crosses midnight.
- Across a daylight-saving change from today, the faked time of day can
  be an hour out. Christmas and the weeks before it sit on one side, so
  it doesn't affect testing.
- An invalid `date=` warns in the console rather than erroring, so it
  can't fail the smoke test's console-error check.
- `0`, `false` and `off` count as off.
- Stats gets the class `debug-stats` so tests can find it.
- Browser tests run on a 21 November clock, so it is `date=`, not the
  machine's date, that moves the site to 27 December.

## Testing

**Unit (Vitest), `src/hooks/debug.test.ts`:**

- `parseDebug`: `''` is off; `?debug` and `?debug=1` are on; `?debug=0`,
  `false`, `off` are off; `?debug&date=2026-12-27` gives the date;
  `?date=2026-12-27` alone is off with no date; each invalid date in the
  table gives no date with debug on.
- `withDebug`: off returns the path unchanged; on gives `/third?debug`;
  with a date gives `/third?debug&date=2026-12-27`; other params are
  dropped.
- `debugOffset`: no date gives 0; 21 Nov 17:10:05 plus the offset is
  27 Dec 17:10:05; from 27 Dec 23:00 plus seven hours is 28 Dec.

`fiberStore.test.ts` loses its `setDebug` test.

**Browser (Playwright), `e2e/debug.spec.ts`, clock at 2026-11-21T12:00:00:**

1. `/?debug&date=2026-12-27`: the button reads "Day 3 awaits" and is
   enabled; `.debug-stats` is visible; the "Begin here" link is visible.
2. Click the button: the URL is `/third?debug&date=2026-12-27` and
   `.debug-stats` is visible. Click `*Bk`: the URL is
   `/?debug&date=2026-12-27`.
3. Click "Begin here": the URL is `/first?debug&date=2026-12-27`.
4. `/?debug`: the waiting text, a disabled button, `.debug-stats` and the
   link.
5. `/`: no `.debug-stats`, no link, a disabled button, as today.

**By command:** ESLint on a throwaway file that imports `Link` from
`react-router` fails with the rule's message. Then `pnpm typecheck`,
`lint`, `build`, `test` and `test:e2e`, with the existing home, smoke and
camera specs still passing.

## How we will know it works

- The five browser cases above pass.
- The unit tests above pass.
- The lint rule rejects a raw `Link` import.
- Every existing check still passes, and `/` without `?debug` is
  unchanged.

## Left to the builder

- `debugNavigation.tsx` exports a hook and a component, which
  `react-refresh/only-export-components` warns about. Split the file or
  use the eslint-disable comment the codebase already uses for context
  hooks, whichever keeps the lint exception to one file.
- Whether drei's `<Stats>` takes `className` directly or needs `parent`
  plus a wrapper; the test only needs a stable selector.
- The exact console warning text, as long as it names the bad value.
