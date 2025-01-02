import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router'
import './navi.scss'
import { DAYS } from '../../helpers/constants'
import { DateTimeProvider, useDateTime } from '../../hooks/dateTime'
import { useEffect, useMemo } from 'react'
import { AnimText } from '../AnimText'
import { AnimatePresence, motion} from 'framer-motion'
import { useAssetsLoader } from '../../hooks/AssetsLoader/AssetsLoader'

export function Navi() {

  const { pathname } = useLocation()
  const navi = useNavigate()
  const { isNearXmas, timeLeft, isXmas, xmasDayCount } = useDateTime()

  const isVisible = useMemo(() => pathname !== '/', [pathname])

  const { progress } = useAssetsLoader()

  useEffect(() => {
    console.log('load progress: ', progress)
  }, [progress])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.section className="navi">
          <motion.h3
            style={{
              cursor: 'pointer'
            }}
            whileHover={{
              y: -8
            }}
            onClick={() => navi('/')}
          >
            <AnimText content={`*Bk`} delay={3} charDelay={0.5}/>
          </motion.h3>
        </motion.section>
      )}      
    </AnimatePresence>
  )
}