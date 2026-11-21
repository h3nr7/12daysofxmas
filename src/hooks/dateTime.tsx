import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { DateTime } from 'luxon'
import { computeXmasState, XmasState } from "./xmasCountdown";

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

  // Computed on mount, so the first render already shows the real countdown.
  const [state, setState] = useState(() => computeXmasState(DateTime.now()))

  useEffect(() => {
    const id = setInterval(() => setState(computeXmasState(DateTime.now())), 1000);
    return () => clearInterval(id)
  }, [])

  return (
    <dtCtx.Provider value={state}>{children}</dtCtx.Provider>
  )
}

export const useDateTime = () => useContext(dtCtx)
