import { useNavigate } from "react-router";
import { motion } from 'framer-motion'
import { Color } from "three";
import { AnimatePresence } from "framer-motion";
import { AnimText } from "../../components/AnimText";
import './Eighth.scss'
import { useMobile } from "../../hooks/isMobile";

export default function EighthUI() {

  const title = `Hi'ya\n2025`
  
  return (
    <div className="eighth__ui">
      <h1>
        <AnimText content={title} />
      </h1>
    </div>
  )
}