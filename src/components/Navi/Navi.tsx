import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router'
import './navi.scss'
import { DAYS } from '../../helpers/constants'
import { DateTimeProvider, useDateTime } from '../../hooks/dateTime'
import { useEffect, useMemo } from 'react'
import { AnimText } from '../AnimText'
import { AnimatePresence, motion} from 'framer-motion'

export function Navi() {

  const { pathname } = useLocation()
  const navi = useNavigate()
  const { isNearXmas, timeLeft, isXmas, xmasDayCount } = useDateTime()

  const isVisible = useMemo(() => pathname !== '/', [pathname])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.section className="navi">
          <motion.h3
            style={{
              cursor: 'pointer'
            }}
            whileHover={{
              scale: 1.2
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

function NaviDays() {

  const { day } = useParams()

  const { curIso } = useDateTime()


  const cur = DAYS.findIndex(d => d.day === day)
  const prev = cur === 0 ? (DAYS.length - 1) : cur - 1
  const next = cur === DAYS.length - 1 ? 0 : cur + 1
  
  return day && (
    <div className="navi__container">It's the {day} of Christmas <Link to={`/${DAYS[prev].day}`}>{'<'}</Link> <Link to={`/${DAYS[next].day}`}>{'>'}</Link></div>
  )
}