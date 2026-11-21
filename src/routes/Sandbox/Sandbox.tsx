

import { AnimText } from "../../components/AnimText";
import './Sandbox.scss'

export default function SandboxUI() {

  
  return (
    <div className="sandbox__ui">
      <h1>
        <AnimText content={`Sandbox`} />
      </h1>
    </div>
  )
}