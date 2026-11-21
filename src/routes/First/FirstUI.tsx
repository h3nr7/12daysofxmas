import { AnimText } from "../../components/AnimText";
import './First.scss'

export default function FirstUI() {

  
  return (
    <div className="first__ui">
      <h1>
        <AnimText content={`Day 1\nof xmas`} />
      </h1>
    </div>
  )
}