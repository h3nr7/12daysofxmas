import { useNavigate } from "react-router";
import { motion } from 'framer-motion'
import { Color } from "three";
import { AnimatePresence } from "framer-motion";

export default function Second() {

  const navi = useNavigate();
  
  return (
    <AnimatePresence>
      <motion.h1>Second</motion.h1>
    </AnimatePresence>
  )
}