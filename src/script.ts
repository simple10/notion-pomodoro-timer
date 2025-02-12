/***************************************************************
 * State Management
 ***************************************************************/

// localStorage key for state
const STORAGE_KEYS = {
  state: "timer-state",
  settings: "timer-settings",
}

// BroadcastChannel name to sync states between tabs
const CHANNEL_NAME = "timer-channel"

const TIMERS = {
  focus: 25 * 60 * 1000, // 25 minutes
  shortBreak: 5 * 60 * 1000, // 5 minutes
  longBreak: 10 * 60 * 1000, // 10 minutes
}

const INITIAL_STATE = {
  running: false,
  remaining: TIMERS.focus,
  endTime: 0,
  timer: "focus" as keyof typeof TIMERS,
  playingSound: false, // Whether the sound is currently playing
}

const INITIAL_SETTINGS = {
  sound: true, // Play sound when timer ends
  soundBreaks: true, // Play sound when break ends
  bgImage: "", // Background image
}

let state: State = INITIAL_STATE
let settings: Settings = INITIAL_SETTINGS
let timerInterval: Timer
let audio: HTMLAudioElement

const broadcastChannel = new BroadcastChannel(CHANNEL_NAME)

/***************************************************************
 * Types
 ***************************************************************/

type State = typeof INITIAL_STATE
type Settings = typeof INITIAL_SETTINGS

/***************************************************************
 * DOM Elements
 ***************************************************************/

// Timer Display
const timerDisplay = document.getElementById("time-left")
const startStopBtn = document.getElementById("start-stop-btn")
const resetBtn = document.getElementById("reset-btn")
const timerFocusBtn = document.getElementById("timer-focus-btn")
const timerShortBtn = document.getElementById("timer-short-btn")
const timerLongBtn = document.getElementById("timer-long-btn")

// Settings
const settingsBtn = document.getElementById("settings-btn")
const settingsModal = document.getElementById("settings-modal")
const closeModalBtn = document.querySelector(".close-btn")
const saveBtn = document.getElementById("save-btn")
const bgImageSelect = document.getElementById(
  "background-image"
) as HTMLSelectElement
const soundCheckbox = document.getElementById(
  "option-sound"
) as HTMLInputElement
const soundBreaksCheckbox = document.getElementById(
  "option-sound-breaks"
) as HTMLInputElement

/***************************************************************
 * State Management Functions
 ***************************************************************/

function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

/**
 * Attempt to load state from localStorage
 */
function loadState(): State | null {
  return loadFromLocalStorage<State>(STORAGE_KEYS.state)
}

/**
 * Save the current state to localStorage
 */
function saveState(_state: State): void {
  localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(_state))
}

/**
 * Set the current timer
 * Called when the user clicks on the timer buttons
 */
function setCurrentTimer(timer: keyof typeof TIMERS) {
  state.remaining = TIMERS[timer]
  state.endTime = Date.now() + state.remaining
  state.timer = timer
  broadcastNewState(state)
}

/**
 * Broadcast the current state to other tabs and save locally
 */
function broadcastNewState(newState) {
  saveState(newState)
  broadcastChannel.postMessage(newState)
  updateDisplay()
}

/***************************************************************
 * Settings Functions
 ***************************************************************/

function loadSettings() {
  return loadFromLocalStorage<Settings>(STORAGE_KEYS.settings)
}

function saveSettings(_settings: Settings): void {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(_settings))
}

function applySettings(_settings: Settings) {
  setBackgroundImage(_settings.bgImage)
}

/***************************************************************
 * Display Functions
 ***************************************************************/

/**
 * Set the interval for the timer
 * @param interval - interval in milliseconds, 500 is twice a second
 */
function setTimerInterval(interval: number = 500): Timer {
  clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (state.running) {
      // Recalculate how much time is left
      const now = Date.now()
      const newRemaining = state.endTime - now

      // Check if countdown reached zero
      if (newRemaining <= 0) {
        // Change to next timer
        // focus -> shortBreak -> reset
        // longBreak -> reset
        playTimerSound()
        if (state.timer === "focus") {
          setCurrentTimer("shortBreak")
        } else {
          state.running = false
          setCurrentTimer("focus")
        }
      } else {
        // Still counting down
        state.remaining = newRemaining
        updateDisplay()
      }
    }
  }, interval) // update 5 times a second
  return timerInterval
}

/**
 * Update the display based on current state
 */
function updateDisplay() {
  // Display the current remainingMs in mm:ss format
  let remaining = state.remaining
  if (remaining < 0) remaining = 0

  const totalSeconds = Math.floor(remaining / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  // Format as MM:SS
  const minuteStr = String(minutes).padStart(2, "0")
  const secondStr = String(seconds).padStart(2, "0")

  timerDisplay.textContent = `${minuteStr}:${secondStr}`

  startStopBtn.textContent = state.running ? "Stop" : "Start"
}

function setBackgroundImage(image: string) {
  document.body.style.backgroundImage = `url('${image}')`
}

/***************************************************************
 * Initialization Functions
 ***************************************************************/

/**
 * Play the timer buzzer sound if enabled in settings and not currently playing
 */
async function playTimerSound() {
  // Play sound if enabled in settings
  if (!state.playingSound &&
    (state.timer === "focus" && settings.sound) ||
    (state.timer.includes("break") && settings.soundBreaks)
  ) {
    if (typeof audio != "object") {
      audio = new Audio("assets/sounds/alarm1.mp3")
    }
    state.playingSound = true
    await audio.play()
    state.playingSound = false
    // Notify other tabs that the sound has stopped playing
    broadcastNewState(state)
  }
}

/***************************************************************
 * Initialization Functions
 ***************************************************************/

/**
 * Initialize event listeners
 */
function initListeners(): void {
  // Listen for incoming messages from other tabs
  broadcastChannel.onmessage = (event) => {
    if (!event.data) return
    state = event.data
    // Persist new state
    saveState(state)
    // Update our display
    updateDisplay()
  }

  // Start/Stop button
  startStopBtn.onclick = () => {
    if (!state.running) {
      // Start the timer and reset if it has ended
      state.running = true
      // If countdown has ended (remainingMs <= 0), reset it to 25 min
      if (state.remaining <= 0) {
        state.remaining = TIMERS.focus
      }
      state.endTime = Date.now() + state.remaining
    } else {
      // Stop the timer and store how much time was left
      state.running = false
      const now = Date.now()
      state.remaining = state.endTime - now
      if (state.remaining < 0) state.remaining = 0
      state.endTime = 0
    }
    broadcastNewState(state)
  }
  // Enable clicking on the timer display to start/stop the timer
  timerDisplay.onclick = startStopBtn.onclick

  // Reset button
  resetBtn.onclick = () => {
    setCurrentTimer(state.timer)
    broadcastNewState(state)
  }

  // Timer buttons
  timerFocusBtn.onclick = () => {
    setCurrentTimer("focus")
  }
  timerShortBtn.onclick = () => {
    setCurrentTimer("shortBreak")
  }
  timerLongBtn.onclick = () => {
    setCurrentTimer("longBreak")
  }

  // Settings
  settingsBtn.onclick = () => {
    settingsModal.style.display = "flex"
  }
  closeModalBtn.addEventListener("click", () => {
    settingsModal.style.display = "none"
    // Reapply settings to revert to the previous state
    applySettings(settings)
  })
  saveBtn.onclick = () => {
    if (bgImageSelect.value) {
      settings.bgImage = bgImageSelect.value
    }
    settings.sound = soundCheckbox.checked
    settings.soundBreaks = soundBreaksCheckbox.checked
    saveSettings(settings)
    applySettings(settings)
    // Close the modal after saving preferences
    settingsModal.style.display = "none"
  }
  // Event listener for background image select changes
  bgImageSelect.onchange = (event) => {
    const selectedImage = (event.target as HTMLSelectElement).value
    if (selectedImage) {
      setBackgroundImage(selectedImage)
    }
  }
}

/**
/**
 * Initialize the script
 */
function init() {
  state = loadState() || INITIAL_STATE
  settings = loadSettings() || INITIAL_SETTINGS
  applySettings(settings)
  if (state.running) {
    const now = Date.now()
    const newRemaining = state.endTime - now
    if (newRemaining <= 0) {
      // Timer ran out while page was closed
      state.running = false
      state.remaining = 0
      state.endTime = 0
      saveState(state)
    } else {
      state.remaining = newRemaining
    }
  }
  initListeners()
  updateDisplay()
  setTimerInterval()
}

// Initialize the script
init()

/***************************************************************
 * Debug Functions
 ***************************************************************/
// DEBUGGING
// Debug shortcut to set timer to 3 seconds. Useful for testing how breaks work when timer runs out.
document.addEventListener("keydown", (event) => {
  if (event.key === "3") {
    state.remaining = 3 * 1000
    state.endTime = Date.now() + state.remaining
    broadcastNewState(state)
  }
})
