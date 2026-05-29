// ============================================================
// storage.js — Local Storage Manager
// ============================================================
const Storage = (() => {
  const KEYS = {
    CHAT_HISTORY: 'hb_chat_history',
    USER_PROFILE: 'hb_user_profile',
    APPOINTMENTS: 'hb_appointments',
    REMINDERS: 'hb_reminders',
    SETTINGS: 'hb_settings',
  };

  function save(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
  }

  function load(key, defaultValue = null) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : defaultValue; } catch { return defaultValue; }
  }

  return {
    saveChatHistory: (data) => save(KEYS.CHAT_HISTORY, data),
    loadChatHistory: () => load(KEYS.CHAT_HISTORY, []),
    saveUserProfile: (data) => {
      const existing = load(KEYS.USER_PROFILE, {});
      save(KEYS.USER_PROFILE, { ...existing, ...data });
    },
    loadUserProfile: () => load(KEYS.USER_PROFILE, {}),
    saveAppointments: (data) => save(KEYS.APPOINTMENTS, data),
    loadAppointments: () => load(KEYS.APPOINTMENTS, []),
    saveReminders: (data) => save(KEYS.REMINDERS, data),
    loadReminders: () => load(KEYS.REMINDERS, []),
    saveSettings: (data) => save(KEYS.SETTINGS, data),
    loadSettings: () => load(KEYS.SETTINGS, { language: 'en', theme: 'dark' }),
    clearAll: () => Object.values(KEYS).forEach(k => localStorage.removeItem(k)),
  };
})();
