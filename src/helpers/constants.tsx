import EighthUI from "../routes/Eighth/Eighth"
import FifthUI from "../routes/Fifth/FifthUI"
import First from "../routes/First/FirstUI"
import Second from "../routes/Second/SecondUI"
import SixthUI from "../routes/Sixth/SixthUI"
import Third from "../routes/Third/ThirdUI"

export const UNIVERSE_BG_COLOR = "#310000"


export const DAYS = [
  {day: "first", element: <First />, text: 'Begin Day 1 Experience'},
  {day: "second", element: <Second />, text: 'Let\'s Unbox Day 2'},
  {day: "third", element: <Third />, text: 'Day 3 awaits'},
  {day: "fourth", element: <Third />, text: 'Dive into Day 4'},
  {day: "fifth", element: <FifthUI />, text: 'Day 5 is a Sunday'},
  {day: "sixth", element: <SixthUI />, text: 'Unlock Day 6'},
  {day: "seventh", element: <Third />, text: 'The end is nagh'},
  {day: "eighth", element: <EighthUI />, text: 'Kick off to a new beginning'},
  {day: "ninth", element: <EighthUI />, text: 'Step into Day 9'},
  {day: "tenth", element: <EighthUI />, text: 'Day 10, Are we there yet?'},
  {day: "eleventh", element: <Third />, text: 'Embark on Day 11'},
  {day: "twelve", element: <Third />, text: 'Make the last day count!'}
]

export const WAITING_PHRASE = [
  "Look! Santa's On His Way!",
  "We are almost There!",
  "Countdown to Christmas!",
  "We are wrapping the Magic!",
  "Ho-Ho-Hold On!",
  "Wait! We are decking the Halls!",
  "Wait for the Jingle!",
  "Snow Much Fun Soon!",
  "Loading Christmas Cheer!"
]