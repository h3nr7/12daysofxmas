import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DefaultLoadingManager, LoadingManager } from "three";


const initial:{
  loading: boolean
  progress: number
  errorMessage?: string
} = {
  loading: false,
  progress: 0
}


const ctx = createContext(initial)

export function AssetsLoader({ children }: PropsWithChildren) {

  const [loading, setLoading] = useState(initial.loading)
  const [progress, setProgress] = useState(initial.progress)
  const [errorMessage, setErrorMessage] = useState<string>()

  useEffect(() => {
    if(!DefaultLoadingManager) return
    
    DefaultLoadingManager.onStart = (url, progress, total) => {
      setLoading(true)
      setErrorMessage(undefined)
    }

    DefaultLoadingManager.onProgress = (url, progress, total) => {
      setProgress(progress/total)
      // if(progress/total >= 1) setLoading(false)
    }

    DefaultLoadingManager.onLoad = () => {
      setLoading(false)
      setErrorMessage(undefined)
    }

    DefaultLoadingManager.onError = err => {
      setLoading(false)
      setErrorMessage(err)
    }

  }, [DefaultLoadingManager])

  return (
    <ctx.Provider value={{
      loading, progress, errorMessage
    }}>
      {children}
    </ctx.Provider>
  )
}

export const useAssetsLoader = () => useContext(ctx);