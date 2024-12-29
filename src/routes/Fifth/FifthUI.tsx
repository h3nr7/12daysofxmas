import { useNavigate } from "react-router";
import { motion } from 'framer-motion'
import { Color } from "three";
import { AnimatePresence } from "framer-motion";
import { AnimText } from "../../components/AnimText";
import './Fifth.scss'
import { useMobile } from "../../hooks/isMobile";

export default function FifthUI() {

  const isMobile = useMobile()
  const navi = useNavigate();
  const title = isMobile ? `Day 5 is a\nLazy\nSunday` : `Day 5 is a\nLazy Sunday`
  
  return (
    <div className="fifth__ui">
      <h1>
        <AnimText content={title} />
      </h1>
    </div>
  )
}