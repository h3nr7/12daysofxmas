import { Link, NavLink, Route, Routes, useParams } from 'react-router'
import './navi.scss'
import { DAYS } from '../../helpers/constants'
import { DateTimeProvider, useDateTime } from '../../hooks/dateTime'
import { useEffect } from 'react'

export function Navi() {

  return (
    <section className="navi">
      <Routes>
        <Route index element={<NaviDays />} />
        <Route path='/:day' element={<NaviDays />} />
      </Routes>
    </section>
  )
}

function NaviDays() {

  const { day } = useParams()

  const { curIso } = useDateTime()


  const cur = DAYS.findIndex(d => d.day === day)
  const prev = cur === 0 ? (DAYS.length - 1) : cur - 1
  const next = cur === DAYS.length - 1 ? 0 : cur + 1
  
  return day && (
    <>It's the {day} of Christmas <Link to={`/${DAYS[prev].day}`}>{'<'}</Link> <Link to={`/${DAYS[next].day}`}>{'>'}</Link></>
  )
}