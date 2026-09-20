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

  const playDoorSound = (action, material = getCurrentMaterial()) => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') ctx.resume();

    const soundMap = {
      wood: {
        open: () => {
          playTone({ start:190,end:145,duration:.045,type:'square',gain:.012 });
          playNoise({ duration:.42,gain:.028,lowpass:900,highpass:90,delay:.035 });
          playTone({ start:115,end:72,duration:.34,type:'sawtooth',gain:.016,delay:.05 });
        },
        close: () => {
          playNoise({ duration:.22,gain:.022,lowpass:1000,highpass:80 });
          playTone({ start:105,end:64,duration:.15,type:'sawtooth',gain:.018,delay:.015 });
          playTone({ start:72,end:45,duration:.09,type:'triangle',gain:.05,delay:.16 });
        },
        lock: () => {
          playTone({ start:880,end:620,duration:.035,type:'square',gain:.018 });
          playTone({ start:540,end:430,duration:.055,type:'triangle',gain:.022,delay:.05 });
        },
        unlock: () => {
          playTone({ start:300,end:410,duration:.05,type:'square',gain:.012 });
          playTone({ start:520,end:760,duration:.045,type:'triangle',gain:.019,delay:.055 });
        }
      },
      glass: {
        open: () => {
          playTone({ start:420,end:300,duration:.04,type:'triangle',gain:.01 });
          playNoise({ duration:.14,gain:.008,lowpass:2800,highpass:500,delay:.02 });
          playTone({ start:760,end:580,duration:.12,type:'sine',gain:.01,delay:.04 });
        },
        close: () => {
          playNoise({ duration:.08,gain:.008,lowpass:2400,highpass:450 });
          playTone({ start:700,end:500,duration:.05,type:'sine',gain:.008,delay:.11 });
        },
        lock: () => {
          playTone({ start:980,end:760,duration:.03,type:'triangle',gain:.014 });
          playTone({ start:620,end:500,duration:.04,type:'square',gain:.014,delay:.05 });
        },
        unlock: () => {
          playTone({ start:460,end:620,duration:.04,type:'triangle',gain:.012 });
          playTone({ start:620,end:880,duration:.04,type:'square',gain:.013,delay:.05 });
        }
      },
      metal: {
        open: () => {
          playTone({ start:260,end:180,duration:.05,type:'square',gain:.014 });
          playNoise({ duration:.24,gain:.018,lowpass:1800,highpass:220,delay:.03 });
          playTone({ start:520,end:350,duration:.12,type:'triangle',gain:.016,delay:.04 });
        },
        close: () => {
          playNoise({ duration:.14,gain:.014,lowpass:2200,highpass:260 });
          playTone({ start:680,end:430,duration:.05,type:'square',gain:.016,delay:.12 });
          playTone({ start:110,end:68,duration:.08,type:'triangle',gain:.026,delay:.15 });
        },
        lock: () => {
          playTone({ start:1180,end:820,duration:.03,type:'square',gain:.02 });
          playTone({ start:700,end:500,duration:.045,type:'triangle',gain:.022,delay:.045 });
        },
        unlock: () => {
          playTone({ start:380,end:560,duration:.045,type:'square',gain:.014 });
          playTone({ start:700,end:960,duration:.04,type:'triangle',gain:.018,delay:.045 });
        }
      },
      marble: {
        open: () => {
          playTone({ start:120,end:86,duration:.05,type:'square',gain:.014 });
          playNoise({ duration:.28,gain:.014,lowpass:700,highpass:50,delay:.03 });
          playTone({ start:92,end:60,duration:.28,type:'triangle',gain:.018,delay:.05 });
        },
        close: () => {
          playNoise({ duration:.10,gain:.01,lowpass:850,highpass:50 });
          playTone({ start:90,end:52,duration:.14,type:'triangle',gain:.042,delay:.05 });
        },
        lock: () => {
          playTone({ start:520,end:380,duration:.05,type:'square',gain:.016 });
          playTone({ start:260,end:180,duration:.06,type:'triangle',gain:.014,delay:.06 });
        },
        unlock: () => {
          playTone({ start:240,end:330,duration:.05,type:'square',gain:.011 });
          playTone({ start:330,end:460,duration:.05,type:'triangle',gain:.012,delay:.06 });
        }
      },
      futuristic: {
        open: () => {
          playTone({ start:520,end:700,duration:.04,type:'sine',gain:.01 });
          playTone({ start:180,end:110,duration:.16,type:'triangle',gain:.01,delay:.025 });
          playNoise({ duration:.16,gain:.01,lowpass:2200,highpass:240,delay:.04 });
        },
        close: () => {
          playTone({ start:760,end:540,duration:.05,type:'sine',gain:.01 });
          playNoise({ duration:.10,gain:.008,lowpass:1800,highpass:220,delay:.05 });
          playTone({ start:240,end:130,duration:.09,type:'triangle',gain:.014,delay:.08 });
        },
        lock: () => {
          playTone({ start:640,end:840,duration:.03,type:'sine',gain:.01 });
          playTone({ start:920,end:620,duration:.04,type:'square',gain:.016,delay:.04 });
        },
        unlock: () => {
          playTone({ start:460,end:700,duration:.03,type:'sine',gain:.01 });
          playTone({ start:700,end:920,duration:.04,type:'square',gain:.015,delay:.04 });
        }
      },
      expensive: {
        open: () => {
          playTone({ start:240,end:190,duration:.04,type:'triangle',gain:.01 });
          playNoise({ duration:.18,gain:.01,lowpass:1400,highpass:120,delay:.03 });
          playTone({ start:150,end:110,duration:.18,type:'triangle',gain:.012,delay:.05 });
        },
        close: () => {
          playNoise({ duration:.08,gain:.008,lowpass:1200,highpass:90 });
          playTone({ start:150,end:88,duration:.11,type:'triangle',gain:.016,delay:.05 });
        },
        lock: () => {
          playTone({ start:760,end:560,duration:.035,type:'triangle',gain:.014 });
          playTone({ start:420,end:320,duration:.05,type:'square',gain:.014,delay:.05 });
        },
        unlock: () => {
          playTone({ start:360,end:520,duration:.04,type:'triangle',gain:.011 });
          playTone({ start:520,end:720,duration:.04,type:'square',gain:.012,delay:.05 });
        }
      }
    };

    const set = soundMap[material] || soundMap.wood;
    if (set[action]) set[action]();
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
