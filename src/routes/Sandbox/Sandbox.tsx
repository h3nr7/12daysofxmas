

import { useNavigate } from "react-router";
import { motion } from 'framer-motion'
import { Color } from "three";
import { AnimatePresence } from "framer-motion";
import { AnimText } from "../../components/AnimText";
import './Sandbox.scss'

export default function SandboxUI() {

  const navi = useNavigate();
  
  return (
    <div className="sandbox__ui">
      <h1>
        <AnimText content={`Sandbox`} />
      </h1>
    </div>
  )
}