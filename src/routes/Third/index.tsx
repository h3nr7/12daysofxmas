import { useNavigate } from "react-router";
import { motion } from 'framer-motion'
import { Color } from "three";
import { AnimatePresence } from "framer-motion";

export default function Third() {

  const navi = useNavigate();
  
  return (
    <AnimatePresence>
      <motion.h1>Third</motion.h1>
    </AnimatePresence>
  )
}