(() => {
  const WORK_DURATION = 25 * 60; // seconds
  const BREAK_DURATION = 5 * 60; // seconds

  const phaseLabel = document.getElementById('phaseLabel');
  const timeDisplay = document.getElementById('timeDisplay');
  const startButton = document.getElementById('startButton');
  const pauseButton = document.getElementById('pauseButton');
  const resetButton = document.getElementById('resetButton');

  const state = {
    phase: 'work', // 'work' | 'break'
    remainingSeconds: WORK_DURATION,
    isRunning: false,
    intervalId: null,
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const updateDisplay = () => {
    timeDisplay.textContent = formatTime(state.remainingSeconds);
    const isWork = state.phase === 'work';
    phaseLabel.textContent = isWork ? '作業中' : '休憩中';
    phaseLabel.classList.toggle('timer__phase--break', !isWork);
  };

  const stopTimer = () => {
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    state.isRunning = false;
    startButton.disabled = false;
  };

  const beep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (err) {
      console.error('Audio initialization failed', err);
    }
  };

  const switchPhase = () => {
    state.phase = state.phase === 'work' ? 'break' : 'work';
    state.remainingSeconds = state.phase === 'work' ? WORK_DURATION : BREAK_DURATION;
    updateDisplay();
    beep();
  };

  const tick = () => {
    state.remainingSeconds -= 1;
    if (state.remainingSeconds <= 0) {
      switchPhase();
      return;
    }
    updateDisplay();
  };

  const startTimer = () => {
    if (state.isRunning) return;
    state.isRunning = true;
    startButton.disabled = true;
    state.intervalId = setInterval(tick, 1000);
  };

  const pauseTimer = () => {
    stopTimer();
  };

  const resetTimer = () => {
    stopTimer();
    state.phase = 'work';
    state.remainingSeconds = WORK_DURATION;
    updateDisplay();
  };

  startButton.addEventListener('click', startTimer);
  pauseButton.addEventListener('click', pauseTimer);
  resetButton.addEventListener('click', resetTimer);

  updateDisplay();
})();
