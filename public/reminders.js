// ============================================================
// reminders.js — Medicine Reminder Management (API + Local)
// ============================================================

const Reminders = (() => {
  let reminders = Storage.loadReminders();
  let checkInterval = null;

  function _generateId() {
    return 'REM-' + Date.now().toString(36).toUpperCase();
  }

  function _persist() {
    Storage.saveReminders(reminders);
  }

  function add(details) {
    const reminder = {
      id: _generateId(),
      medicineName: details.medicineName || 'Medicine',
      dosage: details.dosage || '1 tablet',
      frequency: details.frequency || 'Once daily',
      times: details.times || ['08:00'],
      active: true,
      createdAt: new Date().toISOString(),
      lastNotified: null,
    };
    reminders.push(reminder);
    _persist();

    // Save to backend API — await properly so it actually reaches MongoDB
    if (typeof API !== 'undefined' && API.isLoggedIn()) {
      API.post('/reminders', {
        medicineName: reminder.medicineName,
        dosage: reminder.dosage,
        frequency: reminder.frequency,
        timing: reminder.times,
      }).then((data) => {
        console.log('✅ Reminder saved to server:', data);
      }).catch((err) => {
        console.error('❌ Failed to save reminder to server:', err);
      });
    }

    return reminder;
  }

  function remove(id) {
    reminders = reminders.filter((r) => r.id !== id);
    _persist();
  }

  function toggle(id) {
    const rem = reminders.find((r) => r.id === id);
    if (rem) {
      rem.active = !rem.active;
      _persist();
    }
    return rem;
  }

  function getActive() {
    return reminders.filter((r) => r.active);
  }

  function getAll() {
    return [...reminders];
  }

  async function requestNotificationPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  function _notify(reminder) {
    if (Notification.permission === 'granted') {
      new Notification('💊 Medicine Reminder', {
        body: `Time to take ${reminder.medicineName} (${reminder.dosage})`,
        icon: '💊',
        tag: reminder.id,
      });
    }
    if (typeof window.onReminderTrigger === 'function') {
      window.onReminderTrigger(reminder);
    }
  }

  function checkReminders() {
    const now = new Date();
    const currentTime =
      now.getHours().toString().padStart(2, '0') + ':' +
      now.getMinutes().toString().padStart(2, '0');
    const today = now.toISOString().split('T')[0];

    reminders.forEach((rem) => {
      if (!rem.active) return;
      rem.times.forEach((time) => {
        if (time === currentTime && rem.lastNotified !== today + '-' + time) {
          _notify(rem);
          rem.lastNotified = today + '-' + time;
          _persist();
        }
      });
    });
  }

  function startChecking() {
    if (checkInterval) return;
    checkInterval = setInterval(checkReminders, 30000);
    checkReminders();
  }

  function stopChecking() {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  }

  const reminderMessages = [
    (name, med) => `Hey${name ? ' ' + name : ''}! 💊 It's time to take your ${med}. Stay on track!`,
    (name, med) => `Friendly reminder${name ? ', ' + name : ''} — please take your ${med} now. 😊`,
    (name, med) => `${name ? name + ', d' : 'D'}on't forget your ${med}! Taking it on time helps you feel better faster. 💪`,
    (name, med) => `⏰ Reminder: ${med} is due now${name ? ', ' + name : ''}. Your health journey matters!`,
  ];

  function getRandomReminderMessage(name, medicineName) {
    const idx = Math.floor(Math.random() * reminderMessages.length);
    return reminderMessages[idx](name, medicineName);
  }

  return {
    add, remove, toggle,
    getActive, getAll,
    requestNotificationPermission,
    checkReminders, startChecking, stopChecking,
    getRandomReminderMessage,
  };
})();
