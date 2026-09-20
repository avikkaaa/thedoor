const $ = (id) => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
  const door = $('doorVisual');
  const customDoor = $('customDoorVisual');
  const statusText = $('statusText');
  const note = $('systemNote');
  const toast = $('toast');
  const toastText = $('toastText');
  const openCount = $('openCount');

  if (!door || !statusText || !note || !toast || !toastText || !openCount) {
    console.error('DOOR™ failed to initialize: required UI elements are missing.');
    return;
  }

  let isOpen = false;
  let isLocked = true;
  let count = Number(openCount.textContent) || 17;
  let toastTimer;
  let audioContext;

  const getAudioContext = () => {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioContext = new AudioCtx();
    }
    return audioContext;
  };

  const playTone = ({ start = 220, end = 180, duration = .12, type = 'sine', gain = .05, delay = 0 }) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const now = ctx.currentTime + delay;

    osc.type = type;
    osc.frequency.setValueAtTime(start, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, end), now + duration);

    amp.gain.setValueAtTime(.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + .01);
    amp.gain.exponentialRampToValueAtTime(.0001, now + duration);

    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + .02);
  };

  const playDoorSound = (action) => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') ctx.resume();

    if (action === 'open') {
      playTone({ start: 180, end: 110, duration: .22, type: 'triangle', gain: .035 });
      playTone({ start: 520, end: 420, duration: .06, type: 'sine', gain: .018, delay: .03 });
    }

    if (action === 'close') {
      playTone({ start: 130, end: 72, duration: .16, type: 'triangle', gain: .055 });
      playTone({ start: 72, end: 48, duration: .08, type: 'square', gain: .018, delay: .12 });
    }

    if (action === 'lock') {
      playTone({ start: 760, end: 520, duration: .055, type: 'square', gain: .025 });
      playTone({ start: 420, end: 330, duration: .07, type: 'square', gain: .022, delay: .07 });
    }

    if (action === 'unlock') {
      playTone({ start: 330, end: 520, duration: .07, type: 'square', gain: .022 });
      playTone({ start: 520, end: 760, duration: .055, type: 'square', gain: .025, delay: .07 });
    }
  };

  const showToast = (message) => {
    toastText.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2800);
  };

  const render = () => {
    door.classList.toggle('open', isOpen);
    door.classList.toggle('locked', isLocked);
    statusText.textContent = `${isOpen ? 'OPEN' : 'CLOSED'} · ${isLocked ? 'LOCKED' : 'UNLOCKED'}`;
  };

  const bind = (id, handler) => {
    const element = $(id);
    if (element) element.addEventListener('click', handler);
  };

  bind('openBtn', () => {
    if (isLocked) {
      isLocked = false;
      showToast('Security override approved. Unlocking and opening your extremely important door.');
    } else {
      showToast('Door opened with enterprise-grade confidence.');
    }

    if (!isOpen) {
      isOpen = true;
      count += 1;
      openCount.textContent = String(count);
    }

    note.textContent = 'Door opened successfully. Civilization continues.';
    playDoorSound('open');
    render();
  });

  bind('closeBtn', () => {
    isOpen = false;
    note.textContent = 'Door closed. A highly complex operation is now complete.';
    playDoorSound('close');
    showToast('Your door is closed again.');
    render();
  });

  bind('lockBtn', () => {
    if (isOpen) {
      isOpen = false;
      showToast('Door automatically closed before locking. We spared you the second click.');
    } else {
      showToast('Door secured. Threat level remains: door.');
    }

    isLocked = true;
    note.textContent = 'Security posture upgraded: door closed and locked.';
    playDoorSound('lock');
    render();
  });

  bind('unlockBtn', () => {
    isLocked = false;
    note.textContent = 'Door unlocked. Access to the other side is now technically possible.';
    playDoorSound('unlock');
    showToast('Door unlocked. Revolutionary.');
    render();
  });

  bind('finalOpen', () => {
    isLocked = false;
    if (!isOpen) {
      isOpen = true;
      count += 1;
      openCount.textContent = String(count);
    }
    playDoorSound('open');
    render();
    showToast('You opened the door. This is what the entire product was for.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const materialClasses = [
    'material-wood','material-glass','material-metal','material-marble','material-futuristic','material-expensive'
  ];
  const handleClasses = [
    'handle-round','handle-modern','handle-gold','handle-giant','handle-unnecessary'
  ];

  const applyDoorStyle = (groupName, value) => {
    const normalized = value.trim().toLowerCase();

    if (groupName === 'material') {
      door.classList.remove(...materialClasses);
      if (customDoor) customDoor.classList.remove(...materialClasses);
      const map = {
        wood: 'material-wood',
        glass: 'material-glass',
        metal: 'material-metal',
        marble: 'material-marble',
        futuristic: 'material-futuristic',
        'suspiciously expensive': 'material-expensive'
      };
      door.classList.add(map[normalized] || 'material-wood');
      if (customDoor) customDoor.classList.add(map[normalized] || 'material-wood');
      const previewMaterial = $('previewMaterial');
      if (previewMaterial) previewMaterial.textContent = value.toUpperCase();
      note.textContent = `${value} material applied. Door prestige has increased unnecessarily.`;
    }

    if (groupName === 'handle') {
      door.classList.remove(...handleClasses);
      if (customDoor) customDoor.classList.remove(...handleClasses);
      const map = {
        'round knob': 'handle-round',
        'modern handle': 'handle-modern',
        'gold handle': 'handle-gold',
        'giant handle': 'handle-giant',
        'unnecessary handle': 'handle-unnecessary'
      };
      door.classList.add(map[normalized] || 'handle-modern');
      if (customDoor) customDoor.classList.add(map[normalized] || 'handle-modern');
      const previewHandle = $('previewHandle');
      if (previewHandle) previewHandle.textContent = value.replace(' handle','').toUpperCase();
      note.textContent = `${value} installed. Ergonomic impact: mostly emotional.`;
    }

    if (groupName === 'sound') {
      const soundCopy = {
        'classic creak': 'Classic creak selected. Historical authenticity increased by 38%.',
        'soft click': 'Soft click selected. Very tasteful. Very door.',
        'heavy thud': 'Heavy THUD selected. Neighbours may now respect the door.',
        'sci-fi': 'Sci-fi selected. Door believes it is on a spaceship.',
        'silent': 'Silent mode selected. The door will now open mysteriously.'
      };
      note.textContent = soundCopy[normalized] || 'Door sound profile updated.';
    }
  };

  let pendingDoorChange = null;

  const openConfirm = (group, chip) => {
    const value = chip.textContent.trim();
    pendingDoorChange = { group, chip, value };

    const overlay = $('confirmOverlay');
    const type = $('confirmType');
    const confirmValue = $('confirmValue');
    const confirmText = $('confirmText');

    if (type) type.textContent = group.dataset.group.toUpperCase();
    if (confirmValue) confirmValue.textContent = value.toUpperCase();
    if (confirmText) {
      confirmText.textContent =
        `You are about to change the door's ${group.dataset.group} to ${value}. This is reversible, unnecessary, and therefore requires formal approval.`;
    }

    if (overlay) {
      overlay.classList.add('show');
      overlay.setAttribute('aria-hidden','false');
    }
  };

  const closeConfirm = () => {
    const overlay = $('confirmOverlay');
    if (overlay) {
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden','true');
    }
  };

  document.querySelectorAll('.chips').forEach((group) => {
    group.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => openConfirm(group, chip));
    });
  });

  bind('confirmCancel', () => {
    closeConfirm();
    showToast('Change cancelled. The door remains emotionally stable.');
    pendingDoorChange = null;
  });

  bind('confirmApply', () => {
    if (!pendingDoorChange) return;

    const { group, chip, value } = pendingDoorChange;
    group.querySelectorAll('.chip').forEach((item) => item.classList.remove('active'));
    chip.classList.add('active');

    const output = $(`${group.dataset.group}Value`);
    if (output) output.textContent = value.toUpperCase();

    applyDoorStyle(group.dataset.group, value);
    showToast(`${value} confirmed. The door has been officially altered.`);

    closeConfirm();
    pendingDoorChange = null;
  });

  const confirmOverlay = $('confirmOverlay');
  if (confirmOverlay) {
    confirmOverlay.addEventListener('click', (event) => {
      if (event.target === confirmOverlay) {
        closeConfirm();
        pendingDoorChange = null;
      }
    });
  }

  const speed = $('speedRange');
  const speedValue = $('speedValue');
  if (speed && speedValue) {
    const syncSpeed = () => {
      const value = Number(speed.value);
      speedValue.textContent =
        value < 25 ? 'CEREMONIALLY SLOW' :
        value < 50 ? 'CAUTIOUS' :
        value < 75 ? 'RESPONSIBLY FAST' :
        'RIDICULOUSLY FAST';

      const duration = 1.6 - (value / 100) * 1.25;
      door.style.setProperty('--door-speed', `${duration.toFixed(2)}s`);
      if (customDoor) customDoor.style.setProperty('--door-speed', `${duration.toFixed(2)}s`);
      const previewSpeed = $('previewSpeed');
      if (previewSpeed) previewSpeed.textContent = `${value}%`;
    };

    speed.addEventListener('input', syncSpeed);
    syncSpeed();
  }

  bind('previewOpen', () => {
    if (customDoor) customDoor.classList.add('open');
    playDoorSound('open');
  });

  bind('previewClose', () => {
    if (customDoor) customDoor.classList.remove('open');
    playDoorSound('close');
  });

  bind('saveConfig', () => {
    showToast('Perfect door configuration saved. Humanity may proceed.');
  });

  document.querySelectorAll('#incidentGrid button').forEach((button) => {
    button.addEventListener('click', () => {
      const response = button.dataset.response || 'Emergency resolved.';
      const consoleBox = $('emergencyResponse');

      if (consoleBox) {
        consoleBox.innerHTML = `
          <span>INCIDENT RESPONSE · COMPLETE</span>
          <p>${response}</p>
        `;
      }

      showToast(response);
    });
  });

  const insights = [
    '“You opened your door 23% more frequently today. Statistical models suggest you may open it again.”',
    '“Your door has remained closed for several minutes. This strongly correlates with not being open.”',
    '“Recommendation: consider closing your door after opening it to restore the closed state.”',
    '“Hinge activity is 14% above baseline. No action is required, but we wanted you to know.”',
    '“Predictive model confidence: 87% chance this door will continue being a door tomorrow.”'
  ];

  let insightIndex = 0;
  bind('newInsight', () => {
    insightIndex = (insightIndex + 1) % insights.length;
    const insight = $('aiInsight');
    if (insight) insight.textContent = insights[insightIndex];
    showToast('DOOR AI™ has completed another deeply necessary analysis.');
  });

  bind('whyButton', () => {
    showToast('No one asked for this. That is precisely why it exists.');
  });

  bind('secretButton', () => {
    const panel = $('secretPanel');
    if (panel) {
      panel.classList.add('show');
      panel.setAttribute('aria-hidden','false');
    }
  });

  bind('closeSecret', () => {
    const panel = $('secretPanel');
    if (panel) {
      panel.classList.remove('show');
      panel.setAttribute('aria-hidden','true');
    }
  });

  const mysteryNotes = [
    'FIELD NOTE 07 · DO NOT OVERTHINK THE DOOR',
    'OBSERVATION · THE HINGE KNOWS NOTHING',
    'SYSTEM WHISPER · OPENING IS A STATE OF MIND',
    'CLASSIFIED · HANDLE LATENCY REMAINS DRAMATIC'
  ];
  let mysteryIndex = 0;
  const mysteryChip = $('mysteryChip');
  if (mysteryChip) {
    mysteryChip.addEventListener('click', () => {
      mysteryIndex = (mysteryIndex + 1) % mysteryNotes.length;
      mysteryChip.textContent = mysteryNotes[mysteryIndex];
    });
  }

  const orb = $('cursorOrb');
  if (orb && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', (event) => {
      orb.style.left = event.clientX + 'px';
      orb.style.top = event.clientY + 'px';
    });
  }

  document.querySelectorAll('.tilt-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      card.style.transform = `perspective(800px) rotateX(${-y * 7}deg) rotateY(${x * 9}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });

  bind('themeButton', () => {
    document.documentElement.classList.toggle('light');
    showToast(
      document.documentElement.classList.contains('light')
        ? 'Light interface enabled. The door remains unchanged.'
        : 'Dark interface restored. Serious door operations may resume.'
    );
  });

  door.classList.add('material-wood','handle-modern');
  if (customDoor) customDoor.classList.add('material-wood','handle-modern');
  render();
  console.info('DOOR™ interface initialized successfully.');
});
