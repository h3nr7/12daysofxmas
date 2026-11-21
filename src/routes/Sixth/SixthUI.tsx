import { AnimText } from "../../components/AnimText";
import './Sixth.scss'
import { useMobile } from "../../hooks/isMobile";

export default function SixthUI() {

  const isMobile = useMobile()
  const title = isMobile ? `Day 6 of\nXmas` : `Day 6 of\nXmas`
  
  return (
    <div className="sixth__ui">
      <h1>
        <AnimText content={title} />
      </h1>
    </div>
  )
}