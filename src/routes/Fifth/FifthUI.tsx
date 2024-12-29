import { useNavigate } from "react-router";
import { motion } from 'framer-motion'
import { Color } from "three";
import { AnimatePresence } from "framer-motion";
import { AnimText } from "../../components/AnimText";
import './Fifth.scss'

export default function FifthUI() {

  const navi = useNavigate();
  
  return (
    <div className="fifth__ui">
      <h1>
        <AnimText content={`Day 5\nof xmas`} />
      </h1>
    </div>
  )
}