import { useNavigate } from "react-router";
import { motion } from 'framer-motion'
import { Color } from "three";
import { AnimatePresence } from "framer-motion";
import { AnimText } from "../../components/AnimText";
import './First.scss'

export default function FirstUI() {

  const navi = useNavigate();
  
  return (
    <div className="first__ui">
      <h1>
        <AnimText content={`Day 1\nof xmas`} />
      </h1>
    </div>
  )
}