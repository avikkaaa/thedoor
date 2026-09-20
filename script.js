const $ = (id) => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
  const door = $('doorVisual');
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
    render();
  });

  bind('closeBtn', () => {
    isOpen = false;
    note.textContent = 'Door closed. A highly complex operation is now complete.';
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
    render();
  });

  bind('unlockBtn', () => {
    isLocked = false;
    note.textContent = 'Door unlocked. Access to the other side is now technically possible.';
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
      const map = {
        wood: 'material-wood',
        glass: 'material-glass',
        metal: 'material-metal',
        marble: 'material-marble',
        futuristic: 'material-futuristic',
        'suspiciously expensive': 'material-expensive'
      };
      door.classList.add(map[normalized] || 'material-wood');
      note.textContent = `${value} material applied. Door prestige has increased unnecessarily.`;
    }

    if (groupName === 'handle') {
      door.classList.remove(...handleClasses);
      const map = {
        'round knob': 'handle-round',
        'modern handle': 'handle-modern',
        'gold handle': 'handle-gold',
        'giant handle': 'handle-giant',
        'unnecessary handle': 'handle-unnecessary'
      };
      door.classList.add(map[normalized] || 'handle-modern');
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

  document.querySelectorAll('.chips').forEach((group) => {
    group.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        group.querySelectorAll('.chip').forEach((item) => item.classList.remove('active'));
        chip.classList.add('active');

        const value = chip.textContent.trim();
        const output = $(`${group.dataset.group}Value`);
        if (output) output.textContent = value.toUpperCase();

        applyDoorStyle(group.dataset.group, value);
        showToast(`${value} selected. Door engineering has never been this unnecessary.`);
      });
    });
  });

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
    };

    speed.addEventListener('input', syncSpeed);
    syncSpeed();
  }

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

  bind('themeButton', () => {
    document.documentElement.classList.toggle('light');
    showToast(
      document.documentElement.classList.contains('light')
        ? 'Light interface enabled. The door remains unchanged.'
        : 'Dark interface restored. Serious door operations may resume.'
    );
  });

  door.classList.add('material-wood','handle-modern');
  render();
  console.info('DOOR™ interface initialized successfully.');
});
