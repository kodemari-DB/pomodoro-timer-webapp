(() => {
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
  const workMinutesInput = document.getElementById('workMinutes');
  const breakMinutesInput = document.getElementById('breakMinutes');
  const settingsButton = document.getElementById('settingsButton');
  const settingsModal = document.getElementById('settingsModal');
  const settingsForm = document.getElementById('settingsForm');
  const modalOverlay = settingsModal?.querySelector('[data-role="modal-overlay"]');
  const modalCloseButtons = settingsModal?.querySelectorAll('[data-role="modal-close"]');
  const subtitle = document.querySelector('.app__subtitle');

  const state = {
    phase: 'work', // 'work' | 'break'
    settings: {
      workSeconds: 25 * 60,
      breakSeconds: 5 * 60,
    },
    remainingSeconds: 25 * 60,
    isRunning: false,
    intervalId: null,
  };

  const getPhaseDuration = () => (state.phase === 'work' ? state.settings.workSeconds : state.settings.breakSeconds);

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
      label.textContent = isWork ? 'Work' : 'Break';
      label.classList.toggle('timer__phase--break', !isWork);
    });

    updateProgressCircle();
    updateFlatProgress();
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

  const updateFlatProgress = () => {
    if (!flatProgressFill) return;
    const duration = getPhaseDuration();
    const progressRatio = Math.max(0, Math.min(1, state.remainingSeconds / duration));
    flatProgressFill.style.width = `${progressRatio * 100}%`;
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
    state.remainingSeconds = getPhaseDuration();
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
    state.remainingSeconds = state.settings.workSeconds;
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

  const applySettings = () => {
    const parseMinutes = (value, fallback) => {
      const minutes = Number(value);
      if (!Number.isFinite(minutes)) return fallback;
      const clamped = Math.min(Math.max(Math.floor(minutes), 1), 180);
      return clamped;
    };

    const workMinutes = parseMinutes(workMinutesInput?.value, state.settings.workSeconds / 60);
    const breakMinutes = parseMinutes(breakMinutesInput?.value, state.settings.breakSeconds / 60);

    state.settings.workSeconds = workMinutes * 60;
    state.settings.breakSeconds = breakMinutes * 60;

    if (workMinutesInput) workMinutesInput.value = workMinutes.toString();
    if (breakMinutesInput) breakMinutesInput.value = breakMinutes.toString();

    stopTimer();
    state.remainingSeconds = getPhaseDuration();
    updateSubtitle(workMinutes, breakMinutes);
    updateDisplay();
  };

  const openSettings = () => {
    if (!settingsModal) return;
    settingsModal.classList.add('is-open');
    settingsModal.setAttribute('aria-hidden', 'false');
  };

  const closeSettings = () => {
    if (!settingsModal) return;
    settingsModal.classList.remove('is-open');
    settingsModal.setAttribute('aria-hidden', 'true');
  };

  const updateSubtitle = (workMinutes, breakMinutes) => {
    if (!subtitle) return;
    const work = workMinutes ?? state.settings.workSeconds / 60;
    const rest = breakMinutes ?? state.settings.breakSeconds / 60;
    subtitle.textContent = `作業${work}分 / 休憩${rest}分`;
  };

  startButton.addEventListener('click', startTimer);
  pauseButton.addEventListener('click', pauseTimer);
  resetButton.addEventListener('click', resetTimer);
  viewSelect?.addEventListener('change', handleViewChange);
  settingsButton?.addEventListener('click', openSettings);
  modalOverlay?.addEventListener('click', closeSettings);
  modalCloseButtons?.forEach((button) => button.addEventListener('click', closeSettings));
  settingsForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    applySettings();
    closeSettings();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeSettings();
    }
  });

  setView(document.body.getAttribute('data-view') || '1');
  updateSubtitle();
  updateDisplay();
})();
