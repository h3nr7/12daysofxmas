import { AnimText } from "../../components/AnimText";
import './Eighth.scss'

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