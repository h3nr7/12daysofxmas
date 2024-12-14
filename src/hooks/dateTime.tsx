import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { DateTime } from 'luxon'

const initials = {
  curDay: 0,
  isNearXmas: true,
  timeLeft: { months: 12, days: 0, hours: 0, mins: 0, secs: 0 },
  curIso: ""
}

const dtCtx = createContext(initials)

export function DateTimeProvider({ children }: PropsWithChildren) {

  const [curIso, setCurIso] = useState(initials.curIso)
  const [curDay, setCurDay] = useState(initials.curDay)
  const [isNearXmas, setIsNearXmas] = useState(initials.isNearXmas)
  const [timeLeft, setTimeLeft] = useState(initials.timeLeft)

  useEffect(() => {
    const id = setInterval(() => {
      const dt = DateTime.now()
      const thisXmas = DateTime.utc(dt.year, 12, 25, 0, 0, 0, 0)
      const left = thisXmas.diffNow('seconds').seconds
      setCurIso(dt.toISO())
      setCurDay(dt.day)
      setIsNearXmas(dt.month === 12)
      const secs = Math.ceil(left%60)
      const mins = Math.floor(left/60%60)
      const hours = Math.floor(left/(60*60)%24)
      const days = Math.floor(left/(60*60*24))
      const months = Math.floor(left/(60*60*24*12))
      setTimeLeft({
        months,
        days,
        hours,
        mins,
        secs
      })
    }, 1000);
    return () => clearInterval(id)
  }, [])

  return (
    <dtCtx.Provider value={{
      curIso,
      curDay,
      isNearXmas,
      timeLeft
    }}>{children}</dtCtx.Provider>
  )
}

export const useDateTime = () => useContext(dtCtx)