// State variables
const state = {
  timerInterval: null,
  timerStarted: false,
  timeLeft: 25 * 60, // Defaults to 25 minutes
  currentInterval: "pomodoro",
  sound: true,
  soundBreaks: true,
}
// let backgroundColor = '#F1F1EF'; // Default background color

let audio: HTMLAudioElement

// DOM elements
const timeLeftEl = document.getElementById("time-left")
const startStopBtn = document.getElementById("start-stop-btn")
const resetBtn = document.getElementById("reset-btn")
const pomodoroIntervalBtn = document.getElementById("pomodoro-interval-btn")
const shortBreakIntervalBtn = document.getElementById(
  "short-break-interval-btn"
)
const longBreakIntervalBtn = document.getElementById("long-break-interval-btn")
const settingsBtn = document.getElementById("settings-btn")
const settingsModal = document.getElementById("settings-modal")
const closeModalBtn = document.querySelector(".close-btn")
const saveBtn = document.getElementById("save-btn")
// const backgroundColorSelect = document.getElementById('background-color');

// Settings
const backgroundImageSelect = document.getElementById(
  "background-image"
) as HTMLSelectElement
const soundCheckbox = document.getElementById(
  "option-sound"
) as HTMLInputElement
const soundBreaksCheckbox = document.getElementById(
  "option-sound-breaks"
) as HTMLInputElement

const intervals = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 10 * 60,
}

function setCurrentTimer(interval: keyof typeof intervals) {
  state.currentInterval = interval
  state.timeLeft = intervals[interval]
  updateTimeLeftTextContent()
  localStorage.setItem("currentInterval", interval)
}

// Event listeners for interval buttons
pomodoroIntervalBtn.addEventListener("click", () => {
  setCurrentTimer("pomodoro")
})

shortBreakIntervalBtn.addEventListener("click", () => {
  setCurrentTimer("shortBreak")
})

longBreakIntervalBtn.addEventListener("click", () => {
  setCurrentTimer("longBreak")
})

// Event listener for double click on time left element to reset timer
timeLeftEl.addEventListener("dblclick", (e) => {
  e.stopPropagation()
  resetTimer()
})

// Event listeners for start/stop button and time left element click
startStopBtn.addEventListener("click", toggleTimer)
timeLeftEl.addEventListener("click", toggleTimer)

// Helper function to toggle timer state
function toggleTimer(e: Event) {
  e && e.stopPropagation()
  if (!state.timerStarted) {
    startTimer()
  } else {
    stopTimer()
  }
}

// Event listener for reset button
resetBtn.addEventListener("click", resetTimer)

// Event listener for settings button
settingsBtn.addEventListener("click", () => {
  settingsModal.style.display = "flex"
})

// Event listener for close button in the settings modal
closeModalBtn.addEventListener("click", () => {
  settingsModal.style.display = "none"
  applyUserPreferences()
})

// Function to start the timer
function startTimer() {
  clearInterval(state.timerInterval)
  state.timerStarted = true
  startStopBtn.textContent = "Stop"

  localStorage.setItem("timerStarted", "true")
  localStorage.setItem(
    "endTime",
    (Date.now() + state.timeLeft * 1000).toString()
  ) // Store expected end timestamp

  state.timerInterval = setInterval(() => {
    state.timeLeft--
    updateTimeLeftTextContent()
    localStorage.setItem("timeLeft", state.timeLeft.toString()) // Save remaining time to localStorage
    if (state.timeLeft === 0) {
      clearInterval(state.timerInterval)
      if (state.currentInterval === "pomodoro") {
        state.sound && playSound()
        setCurrentTimer("shortBreak")
        startTimer()
      } else if (state.currentInterval === "shortBreak") {
        state.soundBreaks && playSound()
        setCurrentTimer("longBreak")
        startTimer()
      } else {
        state.soundBreaks && playSound()
        setCurrentTimer("pomodoro")
        stopTimer()
      }
    }
  }, 1000)
}

// Function to stop the timer
function stopTimer() {
  clearInterval(state.timerInterval)
  state.timerStarted = false
  localStorage.setItem("timerStarted", "false")
  localStorage.removeItem("endTime")
  startStopBtn.textContent = "Start"
}

function resetTimer() {
  stopTimer()
  if (state.currentInterval === "pomodoro") {
    state.timeLeft = intervals.pomodoro
  } else if (state.currentInterval === "shortBreak") {
    state.timeLeft = intervals.shortBreak
  } else {
    state.timeLeft = intervals.longBreak
  }
  updateTimeLeftTextContent()
  startStopBtn.textContent = "Start"
}

function playSound() {
  if (typeof audio != "object") {
    audio = new Audio("assets/sounds/alarm1.mp3")
  }
  audio.play()
}

// Function to update the time left text content
function updateTimeLeftTextContent() {
  const minutes = Math.floor(state.timeLeft / 60)
  const seconds = state.timeLeft % 60
  timeLeftEl.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`
}

// Function to apply the user's saved preferences
function applyUserPreferences() {
  // Retrieve user preferences from localStorage
  const savedBackgroundImage = localStorage.getItem("backgroundImage")
  const savedSound = localStorage.getItem("sound")
  const savedSoundBreaks = localStorage.getItem("soundBreaks")

  // Apply the preferences if they exist in localStorage
  if (savedBackgroundImage) {
    document.body.style.backgroundImage = `url('${savedBackgroundImage}')`
  }
  if (savedSound) {
    state.sound = savedSound === "true"
  }
  if (savedSoundBreaks) {
    state.soundBreaks = savedSoundBreaks === "true"
  }
}

// Event listener for save button in the settings modal
saveBtn.addEventListener("click", () => {
  const newBackgroundImage = backgroundImageSelect.value

  // Save preferences to localStorage
  localStorage.setItem("backgroundImage", newBackgroundImage)
  localStorage.setItem("sound", soundCheckbox.checked.toString())
  localStorage.setItem("soundBreaks", soundBreaksCheckbox.checked.toString())

  // Apply the new saved preferences
  applyUserPreferences()

  // Close the modal after saving preferences
  settingsModal.style.display = "none"
})

// Event listener for background image select changes
backgroundImageSelect.addEventListener("change", (event) => {
  const selectedImage = (event.target as HTMLSelectElement).value
  if (selectedImage) {
    document.body.style.backgroundImage = `url('${selectedImage}')`
  }
})

function init() {
  const savedSound = localStorage.getItem("sound")
  const savedSoundBreaks = localStorage.getItem("soundBreaks")
  if (savedSound) {
    soundCheckbox.checked = savedSound === "true"
  }
  if (savedSoundBreaks) {
    soundBreaksCheckbox.checked = savedSoundBreaks === "true"
  }
  const savedCurrentInterval = localStorage.getItem("currentInterval")
  if (savedCurrentInterval) {
    state.currentInterval = savedCurrentInterval as keyof typeof intervals
  }

  // Apply user preferences on page load
  applyUserPreferences()

  // Restore time left
  const savedTimeLeft = parseInt(localStorage.getItem("timeLeft") || "0", 10)
  const savedTimerStarted = localStorage.getItem("timerStarted") === "true"
  const savedEndTime = parseInt(localStorage.getItem("endTime") || "0", 10)
  if (savedTimeLeft) {
    state.timeLeft = savedTimeLeft
    updateTimeLeftTextContent()
  }
  // Start timer if it was previously running and end time is in the future
  if (savedTimerStarted && savedEndTime && savedEndTime > Date.now()) {
    state.timeLeft = Math.round((savedEndTime - Date.now()) / 1000)
    startTimer()
  }
}

init()

// DEBUGGING
// Debug shortcut to set timer to 3 seconds. Useful for testing how breaks work when timer runs out.
// document.addEventListener("keydown", (event) => {
//   if (event.key === "3") {
//     state.timeLeft = 3
//     updateTimeLeftTextContent()
//   }
// })
