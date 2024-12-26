import { useNavigate } from "react-router";
import { motion } from 'framer-motion'
import { Color } from "three";
import { AnimatePresence } from "framer-motion";
import { AnimText } from "../../components/AnimText";
import './Second.scss'

export default function SecondUI() {

  const navi = useNavigate();
  
  return (
    <div className="second__ui">
      <h1>
        <AnimText content={`Day 2\nof xmas`} />
      </h1>
    </div>
  )
}