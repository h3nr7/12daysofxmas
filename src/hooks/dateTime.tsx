import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { DateTime } from 'luxon'
import { computeXmasState, XmasState } from "./xmasCountdown";
import { debugOffset, useDebug } from "./debug";

const initials: XmasState = {
  curDay: 0,
  isNearXmas: true,
  isXmas: false,
  xmasDayCount: -1,
  timeLeft: { days: 0, hours: 0, mins: 0, secs: 0 },
  curIso: ""
}

const dtCtx = createContext(initials)

export function DateTimeProvider({ children }: PropsWithChildren) {

  // Debug mode's fake date (?debug&date=YYYY-MM-DD) as a fixed shift of the
  // clock, worked out once per date so the fake clock keeps running. 0 normally.
  const { date } = useDebug()
  const offset = useMemo(() => debugOffset(date, DateTime.now()), [date])

  // Computed on mount, so the first render already shows the countdown.
  const [state, setState] = useState(() => computeXmasState(DateTime.now().plus(offset)))

  useEffect(() => {
    const tick = () => setState(computeXmasState(DateTime.now().plus(offset)))
    tick() // at once when the offset changes, not a second later
    const id = setInterval(tick, 1000);
    return () => clearInterval(id)
  }, [offset])

  return (
    <dtCtx.Provider value={state}>{children}</dtCtx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook lives beside its provider
export const useDateTime = () => useContext(dtCtx)
