import { AnimText } from "../../components/AnimText";
import './Second.scss'

export default function SecondUI() {

  
  return (
    <div className="second__ui">
      <h1>
        <AnimText content={`Day 2\nof xmas`} />
      </h1>
    </div>
  )
}