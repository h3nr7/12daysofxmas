import { useNavigate } from "react-router";
import { motion } from 'framer-motion'
import { Color } from "three";
import { AnimatePresence } from "framer-motion";
import { AnimText } from "../../components/AnimText";
import './Sixth.scss'
import { useMobile } from "../../hooks/isMobile";

export default function SixthUI() {

  const isMobile = useMobile()
  const navi = useNavigate();
  const title = isMobile ? `Day 6 of\nXmas` : `Day 6 of\nXmas`
  
  return (
    <div className="sixth__ui">
      <h1>
        <AnimText content={title} />
      </h1>
    </div>
  )
}