import { useEffect, useState } from "react";


export function useWindowSize() {
  const [[width, height], setWidthHeight] = useState<[number, number]>([window.innerWidth, window.innerHeight])

  useEffect(() => {
    function func() {
      setWidthHeight([window.innerWidth, window.innerHeight])
    }

    window.addEventListener('resize', func)

    return () => window.removeEventListener('resize', func)
  })

  return [width, height]
}