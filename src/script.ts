// Global variables
let timerStarted = false;
let timeLeft = 25 * 60; // seconds
let timerInterval;
let currentInterval = 'pomodoro';
let backgroundColor = '#F1F1EF'; // Default background color

// DOM elements
const timeLeftEl = document.getElementById('time-left');
const startStopBtn = document.getElementById('start-stop-btn');
const resetBtn = document.getElementById('reset-btn');
const pomodoroIntervalBtn = document.getElementById('pomodoro-interval-btn');
const shortBreakIntervalBtn = document.getElementById('short-break-interval-btn');
const longBreakIntervalBtn = document.getElementById('long-break-interval-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModalBtn = document.querySelector('.close-btn');
const backgroundColorSelect = document.getElementById('background-color');
const backgroundImageSelect = document.getElementById('background-image') as HTMLSelectElement;
const saveBtn = document.getElementById('save-btn');

// Event listeners for interval buttons
pomodoroIntervalBtn.addEventListener('click', () => {
  currentInterval = 'pomodoro';
  timeLeft = 25 * 60;
  updateTimeLeftTextContent();
});

shortBreakIntervalBtn.addEventListener('click', () => {
  currentInterval = 'short-break';
  timeLeft = 5 * 60;
  updateTimeLeftTextContent();
});

longBreakIntervalBtn.addEventListener('click', () => {
  currentInterval = 'long-break';
  timeLeft = 10 * 60;
  updateTimeLeftTextContent();
});

// Event listeners for start/stop button
startStopBtn.addEventListener('click', (e) => {
  e.stopPropagation(); // Prevent document click from firing
  toggleTimer();
});

// Event listener for document click, ignore clicks on buttons and modal
// Allows clicking anywhere on the page to toggle timer
document.addEventListener('click', (e) => {
  // Ignore clicks on buttons and modal
  if (
    e.target instanceof HTMLButtonElement ||
    e.target instanceof HTMLSelectElement ||
    (e.target instanceof HTMLElement && e.target.closest('.modal'))
  ) {
    return;
  }
  toggleTimer();
});

// Helper function to toggle timer state
function toggleTimer() {
  if (!timerStarted) {
    startTimer();
  } else {
    stopTimer();
  }
}

// Event listener for reset button
resetBtn.addEventListener('click', () => {
  stopTimer();
  if (currentInterval === 'pomodoro') {
    timeLeft = 25 * 60;
  } else if (currentInterval === 'short-break') {
    timeLeft = 5 * 60;
  } else {
    timeLeft = 10 * 60;
  }
  updateTimeLeftTextContent();
  startStopBtn.textContent = 'Start';
});

// Event listener for settings button
settingsBtn.addEventListener('click', () => {
  settingsModal.style.display = 'flex';
});

// Event listener for close button in the settings modal
closeModalBtn.addEventListener('click', () => {
  settingsModal.style.display = 'none';
  applyUserPreferences();
});

// Function to start the timer
function startTimer() {
  timerStarted = true;
  startStopBtn.textContent = 'Stop';

  localStorage.setItem("timerStarted", "true");
  localStorage.setItem("endTime", (Date.now() + timeLeft * 1000).toString()); // Store expected end timestamp

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimeLeftTextContent();
    localStorage.setItem('timeLeft', timeLeft.toString()); // Save remaining time to localStorage
    if (timeLeft === 0) {
      clearInterval(timerInterval);
      if (currentInterval === 'pomodoro') {
        timeLeft = 5 * 60;
        currentInterval = 'short-break';
        startTimer();
      } else if (currentInterval === 'short-break') {
        timeLeft = 10 * 60;
        currentInterval = 'long-break';
        startTimer();
      } else {
        timeLeft = 25 * 60;
        currentInterval = 'pomodoro';
      }
    }
  }, 1000);
}

// Function to stop the timer
function stopTimer() {
  clearInterval(timerInterval);
  timerStarted = false;
  localStorage.setItem("timerStarted", "false");
  localStorage.removeItem("endTime");
  startStopBtn.textContent = 'Start';
}

// Function to update the time left text content
function updateTimeLeftTextContent() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timeLeftEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Function to apply the user's saved preferences
function applyUserPreferences() {
  // Retrieve user preferences from localStorage
  const savedBackgroundImage = localStorage.getItem('backgroundImage');

  // Apply the preferences if they exist in localStorage
  if (savedBackgroundImage) {
    document.body.style.backgroundImage = `url('${savedBackgroundImage}')`;
  }
}

// Event listener for save button in the settings modal
saveBtn.addEventListener('click', () => {
  const newBackgroundImage = backgroundImageSelect.value;

  // Save preferences to localStorage
  localStorage.setItem('backgroundImage', newBackgroundImage);

  // Apply the new saved preferences
  applyUserPreferences();

  // Close the modal after saving preferences
  settingsModal.style.display = 'none';
});

// Event listener for background image select changes
backgroundImageSelect.addEventListener('change', (event) => {
  const selectedImage = (event.target as HTMLSelectElement).value;
  if (selectedImage) {
    document.body.style.backgroundImage = `url('${selectedImage}')`;
  }
});

function init() {
  // Apply user preferences on page load
  applyUserPreferences()

  // Restore time left
  const savedTimeLeft = parseInt(localStorage.getItem("timeLeft") || "0", 10)
  const savedTimerStarted = localStorage.getItem("timerStarted") === "true"
  const savedEndTime = parseInt(localStorage.getItem("endTime") || "0", 10)
  if (savedTimeLeft) {
    timeLeft = savedTimeLeft
    updateTimeLeftTextContent()
  }
  // Start timer if it was previously running and end time is in the future
  if (savedTimerStarted && savedEndTime && savedEndTime > Date.now()) {
    timeLeft = Math.round((savedEndTime - Date.now()) / 1000)
    startTimer()
  }
}

init();
