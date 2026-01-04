(() => {
  const WORK_DURATION = 25 * 60; // seconds
  const BREAK_DURATION = 5 * 60; // seconds
  const RING_FULL_SECONDS = 60 * 60; // progress ring always represents 60 minutes

  const phaseLabels = document.querySelectorAll('[data-role="phase-label"]');
  const timeDisplays = document.querySelectorAll('[data-role="time-display"]');
  const progressCircle = document.getElementById('progressCircle');
  const flatProgressFill = document.querySelector('.flat-progress__fill');
  const viewSelect = document.getElementById('viewSelect');
  const timerViews = document.querySelectorAll('.timer__view');
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
    const formatted = formatTime(state.remainingSeconds);
    timeDisplays.forEach((el) => {
      el.textContent = formatted;
    });

    const isWork = state.phase === 'work';
    phaseLabels.forEach((label) => {
      label.textContent = isWork ? '作業中' : '休憩中';
      label.classList.toggle('timer__phase--break', !isWork);
    });

    updateProgressCircle();
  };

  const updateProgressCircle = () => {
    if (!progressCircle) return;
    const radius = progressCircle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.max(0, Math.min(1, state.remainingSeconds / RING_FULL_SECONDS));

    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = circumference * (1 - progress);
    progressCircle.style.stroke = state.phase === 'work' ? 'var(--accent)' : '#38bdf8';
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

  const setView = (viewId) => {
    document.body.setAttribute('data-view', viewId);
    if (viewSelect && viewSelect.value !== viewId) {
      viewSelect.value = viewId;
    }
    timerViews.forEach((view) => {
      const isActive = view.dataset.view === viewId;
      view.setAttribute('aria-hidden', (!isActive).toString());
    });
  };

  const handleViewChange = (event) => {
    const viewId = event.target.value;
    setView(viewId);
  };

  startButton.addEventListener('click', startTimer);
  pauseButton.addEventListener('click', pauseTimer);
  resetButton.addEventListener('click', resetTimer);
  viewSelect?.addEventListener('change', handleViewChange);

  setView(document.body.getAttribute('data-view') || '1');
  updateDisplay();
})();
