/***************************************************************
 * State Management
 ***************************************************************/
// localStorage key for state
const STORAGE_KEY = "timer-state"

// BroadcastChannel name to sync states between tabs
const CHANNEL_NAME = "timer-channel"

const TIMERS = {
  pomodoro: 25 * 60 * 1000, // 25 minutes
  shortBreak: 5 * 60 * 1000, // 5 minutes
  longBreak: 10 * 60 * 1000, // 10 minutes
}

type State = {
  running: boolean
  remaining: number // milliseconds
  endTime: number
}

let state: State = initState()
let timerInterval: Timer

function initState(): State {
  return {
    running: false,
    remaining: TIMERS.pomodoro,
    endTime: 0,
  }
}

/***************************************************************
 * DOM Elements
 ***************************************************************/
const timerDisplay = document.getElementById("time-left")
const startStopBtn = document.getElementById("start-stop-btn")
const stopBtn = document.getElementById("stopBtn")
const resetBtn = document.getElementById("reset-btn")
const timerFocusBtn = document.getElementById("timer-focus-btn")
const timerShortBtn = document.getElementById("timer-short-btn")
const timerLongBtn = document.getElementById("timer-long-btn")

/***************************************************************
 * Broadcast Channel Setup
 ***************************************************************/
const broadcastChannel = new BroadcastChannel(CHANNEL_NAME)

/**
 * Attempt to load state from localStorage
 */
function loadStateFromLocalStorage(): State | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    // If JSON parsing fails or item doesn't exist, return null
    return null
  }
}

/**
 * Save the current state to localStorage
 */
function saveStateToLocalStorage(state: State): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/**
 * Set the current timer
 * Called when the user clicks on the timer buttons
 */
function setCurrentTimer(timer: keyof typeof TIMERS) {
  state.remaining = TIMERS[timer]
  state.endTime = Date.now() + state.remaining
  broadcastNewState(state)
}

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

      if (newRemaining <= 0) {
        // Countdown has reached zero, reset state
        state = initState()
        broadcastNewState(state)
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

/**
 * Broadcast the current state to other tabs and save locally
 */
function broadcastNewState(newState) {
  saveStateToLocalStorage(newState)
  broadcastChannel.postMessage(newState)
  updateDisplay()
}

/**
 * Initialize event listeners
 */
function initListeners(): void {
  // Listen for incoming messages from other tabs
  broadcastChannel.onmessage = (event) => {
    if (!event.data) return
    state = event.data
    // Persist new state
    saveStateToLocalStorage(state)
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
        state.remaining = TIMERS.pomodoro
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
    state = initState()
    broadcastNewState(state)
  }

  timerFocusBtn.onclick = () => {
    setCurrentTimer("pomodoro")
  }

  timerShortBtn.onclick = () => {
    setCurrentTimer("shortBreak")
  }

  timerLongBtn.onclick = () => {
    setCurrentTimer("longBreak")
  }
}

function init() {
  state = loadStateFromLocalStorage() || initState()

  if (state.running) {
    const now = Date.now()
    const newRemaining = state.endTime - now
    if (newRemaining <= 0) {
      // Timer ran out while page was closed
      state.running = false
      state.remaining = 0
      state.endTime = 0
      saveStateToLocalStorage(state)
    } else {
      state.remaining = newRemaining
    }
  }

  initListeners()

  // On page load, sync the display
  updateDisplay()

  setTimerInterval()
}

init()
// State variables

// DEBUGGING
// Debug shortcut to set timer to 3 seconds. Useful for testing how breaks work when timer runs out.
document.addEventListener("keydown", (event) => {
  if (event.key === "3") {
    state.remaining = 3 * 1000
    state.endTime = Date.now() + state.remaining
    broadcastNewState(state)
  }
})
