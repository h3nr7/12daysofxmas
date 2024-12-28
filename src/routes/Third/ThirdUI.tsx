import { useNavigate } from "react-router";
import { motion } from 'framer-motion'
import { Color } from "three";
import { AnimatePresence } from "framer-motion";
import { AnimText } from "../../components/AnimText";
import './Third.scss'

export default function ThridUI() {

  const navi = useNavigate();
  
  return (
    <div className="second__ui">
      <h1>
        <AnimText content={`Day 3\nof xmas`} />
      </h1>
    </div>
  )
}