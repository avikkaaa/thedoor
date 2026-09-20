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
    console.error('DOOR failed to initialize: required UI elements are missing.');
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

  const createNoiseBuffer = (ctx, seconds = .25) => {
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i += 1) {
      const fade = 1 - i / length;
      data[i] = (Math.random() * 2 - 1) * fade;
    }

    return buffer;
  };

  const playNoise = ({
    duration = .18,
    gain = .025,
    lowpass = 1500,
    highpass = 60,
    delay = 0
  } = {}) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const source = ctx.createBufferSource();
    source.buffer = createNoiseBuffer(ctx, duration);

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = highpass;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = lowpass;

    const amp = ctx.createGain();
    const now = ctx.currentTime + delay;

    amp.gain.setValueAtTime(.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + .012);
    amp.gain.exponentialRampToValueAtTime(.0001, now + duration);

    source.connect(hp);
    hp.connect(lp);
    lp.connect(amp);
    amp.connect(ctx.destination);

    source.start(now);
    source.stop(now + duration + .02);
  };

  const playTone = ({
    start = 220,
    end = 180,
    duration = .12,
    type = 'sine',
    gain = .05,
    delay = 0
  }) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const now = ctx.currentTime + delay;

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, start), now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, end), now + duration);

    amp.gain.setValueAtTime(.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + .008);
    amp.gain.exponentialRampToValueAtTime(.0001, now + duration);

    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + .02);
  };

  const getCurrentMaterial = () => {
    if (door.classList.contains('material-glass')) return 'glass';
    if (door.classList.contains('material-metal')) return 'metal';
    if (door.classList.contains('material-marble')) return 'marble';
    if (door.classList.contains('material-futuristic')) return 'futuristic';
    if (door.classList.contains('material-expensive')) return 'expensive';
    return 'wood';
  };

  const getCurrentDoorType = () => {
    if (door.classList.contains('type-front')) return 'front';
    if (door.classList.contains('type-office')) return 'office';
    if (door.classList.contains('type-bathroom')) return 'bathroom';
    if (door.classList.contains('type-vault')) return 'vault';
    if (door.classList.contains('type-secret')) return 'secret';
    if (door.classList.contains('type-spaceship')) return 'spaceship';
    if (door.classList.contains('type-medieval')) return 'medieval';
    return 'bedroom';
  };

  const doorTypeSoundProfile = {
    bedroom:   { rate:.96, volume:.58, accent:'soft' },
    front:     { rate:.86, volume:.78, accent:'heavy' },
    office:    { rate:1.08, volume:.58, accent:'clean' },
    bathroom:  { rate:1.18, volume:.50, accent:'light' },
    vault:     { rate:.72, volume:.92, accent:'vault' },
    secret:    { rate:.82, volume:.52, accent:'creaky' },
    spaceship: { rate:1.32, volume:.58, accent:'sci-fi' },
    medieval:  { rate:.68, volume:.86, accent:'ancient' }
  };

  const realDoorSounds = {
    open: 'https://orangefreesounds.com/wp-content/uploads/2025/01/Opening-a-door-sound-effect.mp3',
    close: 'https://www.orangefreesounds.com/wp-content/uploads/2015/04/Door-closing-sound-effect.mp3',
    lock: 'https://orangefreesounds.com/wp-content/uploads/2022/10/Lock-sound-effect.mp3',
    unlock: 'https://orangefreesounds.com/wp-content/uploads/2025/07/Door-lock-or-unlock-with-key-sound-effect.mp3'
  };

  const realAudio = Object.fromEntries(
    Object.entries(realDoorSounds).map(([action, src]) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = action === 'close' ? 0.72 : 0.62;
      return [action, audio];
    })
  );

  const playRecordedDoorSound = async (action, doorType = getCurrentDoorType()) => {
    const audio = realAudio[action];
    if (!audio) return false;

    const profile = doorTypeSoundProfile[doorType] || doorTypeSoundProfile.bedroom;

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.playbackRate = profile.rate;
      audio.volume = Math.min(1, profile.volume + (action === 'close' ? .06 : 0));
      await audio.play();
      return true;
    } catch (error) {
      console.warn('Recorded door sound could not play; using generated fallback.', error);
      return false;
    }
  };

  const playDoorTypeAccent = (action, doorType = getCurrentDoorType()) => {
    const profile = doorTypeSoundProfile[doorType] || doorTypeSoundProfile.bedroom;

    if (profile.accent === 'vault') {
      playTone({ start: action === 'unlock' ? 180 : 110, end: action === 'unlock' ? 320 : 70, duration:.22, type:'square', gain:.022, delay:.04 });
      playNoise({ duration:.11, gain:.018, lowpass:700, highpass:45, delay:.08 });
    }

    if (profile.accent === 'sci-fi') {
      playTone({ start: action === 'close' || action === 'lock' ? 760 : 340, end: action === 'close' || action === 'lock' ? 280 : 920, duration:.18, type:'sine', gain:.014, delay:.03 });
    }

    if (profile.accent === 'ancient') {
      playNoise({ duration:.36, gain:.018, lowpass:820, highpass:55, delay:.02 });
      playTone({ start:125, end:62, duration:.34, type:'sawtooth', gain:.012, delay:.04 });
    }

    if (profile.accent === 'creaky') {
      playTone({ start:165, end:82, duration:.28, type:'sawtooth', gain:.010, delay:.05 });
    }

    if (profile.accent === 'heavy' && (action === 'close' || action === 'lock')) {
      playNoise({ duration:.09, gain:.022, lowpass:520, highpass:35, delay:.12 });
    }

    if (profile.accent === 'clean' && (action === 'lock' || action === 'unlock')) {
      playTone({ start: action === 'lock' ? 720 : 440, end: action === 'lock' ? 420 : 760, duration:.05, type:'triangle', gain:.010, delay:.03 });
    }

    if (profile.accent === 'light' && (action === 'open' || action === 'close')) {
      playTone({ start:520, end:350, duration:.06, type:'triangle', gain:.006, delay:.05 });
    }
  };

  const playDoorSound = async (action, material = getCurrentMaterial()) => {
    const doorType = getCurrentDoorType();
    const playedRecordedSound = await playRecordedDoorSound(action, doorType);

    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') ctx.resume();

    playDoorTypeAccent(action, doorType);
    if (playedRecordedSound) return;

    const materialProfile = {
      wood:       { creak:.032, movement:.020, latch:.016, metal:.010, pitch:1.00 },
      glass:      { creak:.010, movement:.010, latch:.012, metal:.018, pitch:1.30 },
      metal:      { creak:.012, movement:.018, latch:.020, metal:.026, pitch:1.15 },
      marble:     { creak:.008, movement:.024, latch:.016, metal:.012, pitch:.82 },
      futuristic: { creak:.006, movement:.010, latch:.012, metal:.020, pitch:1.45 },
      expensive:  { creak:.014, movement:.012, latch:.012, metal:.014, pitch:1.08 }
    };

    const p = materialProfile[material] || materialProfile.wood;
    const f = (hz) => hz * p.pitch;

    if (action === 'open') {
      // OPEN = latch release, then long hinge/door movement
      playTone({ start:f(520), end:f(390), duration:.045, type:'square', gain:p.latch });
      playNoise({ duration:.34, gain:p.movement, lowpass:material === 'glass' ? 2600 : 1100, highpass:material === 'marble' ? 45 : 90, delay:.035 });
      playTone({ start:f(145), end:f(78), duration:.38, type:'sawtooth', gain:p.creak, delay:.055 });

      if (material === 'futuristic') {
        playTone({ start:f(420), end:f(760), duration:.16, type:'sine', gain:.010, delay:.04 });
      }
    }

    if (action === 'close') {
      // CLOSE = short movement, then unmistakable body thud + latch catch
      playNoise({ duration:.16, gain:p.movement * .85, lowpass:material === 'metal' ? 1800 : 950, highpass:70 });
      playTone({ start:f(130), end:f(62), duration:.12, type:'triangle', gain:.020, delay:.08 });
      playNoise({ duration:.075, gain:material === 'marble' ? .038 : .026, lowpass:600, highpass:35, delay:.145 });
      playTone({ start:f(640), end:f(430), duration:.045, type:'square', gain:p.latch, delay:.17 });
    }

    if (action === 'lock') {
      // LOCK = compact, descending deadbolt clack-clack
      playTone({ start:f(980), end:f(690), duration:.030, type:'square', gain:p.metal, delay:0 });
      playNoise({ duration:.035, gain:.010, lowpass:3200, highpass:900, delay:.025 });
      playTone({ start:f(560), end:f(310), duration:.055, type:'square', gain:p.metal * .95, delay:.055 });
      playTone({ start:f(260), end:f(210), duration:.040, type:'triangle', gain:.010, delay:.105 });
    }

    if (action === 'unlock') {
      // UNLOCK = lighter reverse mechanism, clearly rising instead of falling
      playTone({ start:f(280), end:f(430), duration:.045, type:'triangle', gain:p.metal * .72, delay:0 });
      playNoise({ duration:.028, gain:.007, lowpass:3600, highpass:1100, delay:.025 });
      playTone({ start:f(520), end:f(860), duration:.050, type:'square', gain:p.metal * .80, delay:.05 });
      playTone({ start:f(900), end:f(1040), duration:.028, type:'sine', gain:.008, delay:.105 });
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
    playDoorSound('open', getCurrentMaterial());
    render();
  });

  bind('closeBtn', () => {
    isOpen = false;
    note.textContent = 'Door closed. A highly complex operation is now complete.';
    playDoorSound('close', getCurrentMaterial());
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
    playDoorSound('lock', getCurrentMaterial());
    render();
  });

  bind('unlockBtn', () => {
    isLocked = false;
    note.textContent = 'Door unlocked. Access to the other side is now technically possible.';
    playDoorSound('unlock', getCurrentMaterial());
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
    playDoorSound('open', getCurrentMaterial());
    render();
    showToast('You opened the door. This is what the entire product was for.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });


  const doorTypeClasses = [
    'type-bedroom','type-front','type-office','type-bathroom',
    'type-vault','type-secret','type-spaceship','type-medieval'
  ];

  document.querySelectorAll('#doorTypeGrid .door-type-card').forEach((card) => {
    card.addEventListener('click', () => {
      const label = card.dataset.doorType || 'Door';
      const doorClass = card.dataset.doorClass || 'type-bedroom';

      document.querySelectorAll('#doorTypeGrid .door-type-card').forEach((item) => item.classList.remove('active'));
      card.classList.add('active');

      const typeValue = $('doorTypeValue');
      const doorName = $('doorName');
      if (typeValue) typeValue.textContent = label.toUpperCase();
      if (doorName) doorName.textContent = label;

      door.classList.remove(...doorTypeClasses);
      door.classList.add(doorClass);

      if (customDoor) {
        customDoor.classList.remove(...doorTypeClasses);
        customDoor.classList.add(doorClass);
      }

      showToast(label + ' selected. Door bureaucracy updated successfully.');
    });
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
    playDoorSound('open', getCurrentMaterial());
  });

  bind('previewClose', () => {
    if (customDoor) customDoor.classList.remove('open');
    playDoorSound('close', getCurrentMaterial());
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

  const themeToggle = $('themeButton');
  if (themeToggle) {
    themeToggle.addEventListener('change', () => {
      document.documentElement.classList.toggle('grayscale-mode', themeToggle.checked);
      showToast(
        themeToggle.checked
          ? 'Grayscale mode enabled. The door is now dramatically serious.'
          : 'Color mode restored. The door has regained its personality.'
      );
    });
  }

  door.classList.add('material-wood','handle-modern','type-bedroom');
  if (customDoor) customDoor.classList.add('material-wood','handle-modern','type-bedroom');
  render();
  console.info('DOOR interface initialized successfully.');
});
