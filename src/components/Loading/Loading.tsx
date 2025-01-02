import { AnimatePresence, motion, useSpring, useTransform } from 'framer-motion'
import { useAssetsLoader } from '../../hooks/AssetsLoader/AssetsLoader'
import './Loading.scss'

export function Loading() {

  const { progress, loading } = useAssetsLoader()


  console.log(progress, loading)

  return (
    <AnimatePresence>
    {loading && (
      <motion.div 
        className="loading__container"
        initial={{
          width: `0vw`
        }}
        animate={{
          width: `${progress * 100}vw`,
          transition: {
            duration: 1.2
          }
        }}
        exit={{
          width: `0vw`
        }}
      />
    )}
    </AnimatePresence>
  )
}