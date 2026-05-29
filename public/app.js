// ============================================================
// app.js — Main Application Controller
// ============================================================
const App = (() => {
  if (!API.isLoggedIn()) { window.location.href = '/'; return; }

  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');

  const typingIndicator = document.getElementById('typingIndicator');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  // AQI Fetching with GPS Precision
  async function updateAQI() {
    const aqiValue = document.getElementById('aqiValue');
    const aqiStatus = document.getElementById('aqiStatus');
    const aqiDisplay = document.getElementById('aqiDisplay');
    
    if (!aqiValue) return;

    const fetchAQI = async (url) => {
      try {
        const response = await fetch(url);
        const result = await response.json();
        if (result.status === 'ok') {
          const aqi = result.data.aqi;
          aqiValue.textContent = aqi;
          
          let status = 'Good';
          let className = 'good';
          if (aqi > 300) { status = 'Hazardous'; className = 'unhealthy'; }
          else if (aqi > 200) { status = 'Very Unhealthy'; className = 'unhealthy'; }
          else if (aqi > 150) { status = 'Unhealthy'; className = 'poor'; }
          else if (aqi > 100) { status = 'Sensitive'; className = 'poor'; }
          else if (aqi > 50) { status = 'Moderate'; className = 'moderate'; }
          
          aqiStatus.textContent = status;
          aqiDisplay.className = `aqi-display ${className}`;
          return true;
        }
      } catch (e) { console.error('Fetch Error:', e); }
      return false;
    };

    // Try GPS first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const success = await fetchAQI(`https://api.waqi.info/feed/geo:${latitude};${longitude}/?token=demo`);
          if (!success) await fetchAQI('https://api.waqi.info/feed/here/?token=demo');
        },
        async () => {
          // Fallback to IP if GPS denied
          await fetchAQI('https://api.waqi.info/feed/here/?token=demo');
        },
        { timeout: 10000 }
      );
    } else {
      await fetchAQI('https://api.waqi.info/feed/here/?token=demo');
    }
  }

  // Initial AQI call
  updateAQI();
  setInterval(updateAQI, 300000); // Update every 5 minutes
  const appointmentsList = document.getElementById('appointmentsList');
  const remindersList = document.getElementById('remindersList');
  const dailyTipText = document.getElementById('dailyTipText');
  const quickActions = document.querySelectorAll('.quick-action');
  const clearChatBtn = document.getElementById('clearChatBtn');
  const emergencyBanner = document.getElementById('emergencyBanner');
  const emergencyClose = document.getElementById('emergencyClose');
  const logoutBtn = document.getElementById('logoutBtn');
  const sidebarLogout = document.getElementById('sidebarLogout');
  const sidebarUserName = document.getElementById('sidebarUserName');
  const sidebarUserEmail = document.getElementById('sidebarUserEmail');


  let chatHistory = [];
  let recognition = null;

  async function init() {
    const user = API.getUser();
    if (user) {
      if (sidebarUserName) sidebarUserName.textContent = user.name || 'User';
      if (sidebarUserEmail) sidebarUserEmail.textContent = user.email || '';
    }

    chatHistory = Storage.loadChatHistory();
    if (chatHistory.length > 0) {
      chatHistory.forEach(msg => renderMessage(msg.text, msg.sender, msg.type, false, msg.options, msg.showPicker, msg.showTimePicker));
    } else {
      const welcomeMsg = getWelcomeMessage();
      addBotMessage(welcomeMsg.text, welcomeMsg.type, false);
    }

    if (dailyTipText) dailyTipText.textContent = HealthData.getDailyTip();
    await refreshSidebar();
    if (Reminders.getActive().length > 0) Reminders.startChecking();

    bindEvents();
    window.refreshSidebar = refreshSidebar;
    window.onReminderTrigger = (reminder) => {
      addBotMessage(Reminders.getRandomReminderMessage(ChatEngine.getUserName(), reminder.medicineName), 'reminder-alert');
    };
    scrollToBottom();
  }

  function getWelcomeMessage() {
    const user = API.getUser();
    const name = user ? user.name : ChatEngine.getUserName();
    const tip = HealthData.getDailyTip();
    return {
      text: `Hello${name ? ', **' + name + '**' : ''}! 👋 I'm your **AI Healthcare Assistant**.\n\n` +
        `I can help with:\n• 🧠 **AI Symptom Triage** — describe how you feel\n• 📅 **Book appointments**\n` +
        `• 💊 **Medicine reminders**\n• 🗺️ **Find nearby hospitals**\n• 🌟 **Wellness tips**\n• 🚨 **Emergency guidance**\n\n` +
        `Just type or use 🎤 voice input!\n\n💡 **Tip:** ${tip}`,
      type: 'greeting',
    };
  }

  function bindEvents() {
    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
    quickActions.forEach(btn => btn.addEventListener('click', () => handleQuickAction(btn.dataset.action)));
    if (sidebarToggle) sidebarToggle.addEventListener('click', () => { sidebar.classList.toggle('open'); sidebarOverlay.classList.toggle('visible'); });
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', () => { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('visible'); });
    if (clearChatBtn) clearChatBtn.addEventListener('click', clearChat);
    if (emergencyClose) emergencyClose.addEventListener('click', () => emergencyBanner.classList.remove('visible'));
    if (logoutBtn) logoutBtn.addEventListener('click', () => API.logout());
    if (sidebarLogout) sidebarLogout.addEventListener('click', () => API.logout());
    chatInput.addEventListener('input', autoResizeInput);
  }

  // --- Send ---
  function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;
    addUserMessage(text);
    chatInput.value = '';
    autoResizeInput();
    showTyping();

    setTimeout(async () => {
      hideTyping();
      const response = await ChatEngine.processMessage(text);
      addBotMessage(response.text, response.type, true, response.options, response.showPicker, response.showTimePicker);
      if (response.type === 'emergency') showEmergencyBanner();
      if (response.type === 'appointment-confirmed' && response.appointmentData) {
        try { await API.post('/appointments', response.appointmentData); } catch { }
      }
      if (response.type === 'reminder-confirmed' && response.reminderData) {
        try { await API.post('/reminders', response.reminderData); } catch { }
      }
      refreshSidebar();
    }, 400 + Math.random() * 800);
  }

  function handleQuickAction(action) {
    const msgs = { appointment: 'I want to book an appointment', reminder: 'Set a medicine reminder', health: 'Health tips', facilities: 'Find nearby healthcare facilities', emergency: 'I need emergency help!', dashboard: 'Go to my dashboard' };
    if (action === 'facilities') { window.location.href = '/map'; return; }
    if (action === 'dashboard') { window.location.href = '/dashboard'; return; }
    const msg = msgs[action];
    if (msg) { chatInput.value = msg; handleSend(); }
  }

  // --- Messages ---
  function addUserMessage(text) {
    const msg = { text, sender: 'user', type: 'user', timestamp: new Date().toISOString() };
    chatHistory.push(msg);
    Storage.saveChatHistory(chatHistory);
    renderMessage(text, 'user', 'user', true);
  }

  function addBotMessage(text, type = 'general', animate = true, options = null, showPicker = false, showTimePicker = false) {
    const msg = { text, sender: 'bot', type, timestamp: new Date().toISOString(), options, showPicker, showTimePicker };
    chatHistory.push(msg);
    Storage.saveChatHistory(chatHistory);
    renderMessage(text, 'bot', type, animate, options, showPicker, showTimePicker);
  }

  function renderMessage(text, sender, type, animate = true, options = null, showPicker = false, showTimePicker = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${sender}${animate ? ' animate-in' : ''}`;
    if (type === 'emergency') wrapper.classList.add('emergency-message');

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = sender === 'bot' ? '<span class="bot-avatar"></span>' : '<span class="user-avatar"></span>';

    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${sender}-bubble`;
    bubble.innerHTML = formatText(text);

    // Render options if present
    if (options && options.length > 0) {
      const optionsContainer = document.createElement('div');
      optionsContainer.className = 'message-options';
      
      options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        const optName = typeof opt === 'object' ? opt.name : opt;
        const optValue = (typeof opt === 'object' ? opt.value : opt) || optName;
        const optDesc = typeof opt === 'object' ? opt.description : '';
        
        btn.innerHTML = `<span class="btn-text">${optDesc || optName}</span>`;
        
        if (optDesc) {
          const showName = () => { btn.querySelector('.btn-text').textContent = optName; btn.classList.add('showing-name'); };
          const hideName = () => { btn.querySelector('.btn-text').textContent = optDesc; btn.classList.remove('showing-name'); };
          
          btn.onmouseenter = showName;
          btn.onmouseleave = hideName;
          
          let timer;
          btn.ontouchstart = () => { timer = setTimeout(showName, 300); };
          btn.ontouchend = () => { clearTimeout(timer); hideName(); };
        }

        btn.onclick = (e) => {
          e.preventDefault();
          if (typeof optValue === 'string' && optValue.startsWith('tel:')) {
            window.location.href = optValue;
          } else if (optValue === 'find_hospital') {
            window.location.href = 'map.html';
          } else {
            chatInput.value = optValue;
            handleSend();
            optionsContainer.remove();
          }
        };
        optionsContainer.appendChild(btn);
      });
      bubble.appendChild(optionsContainer);
    }

    // Render picker if requested
    if (showPicker) {
      const pickerContainer = document.createElement('div');
      pickerContainer.className = 'picker-container';
      
      const now = new Date();
      const minDate = now.toISOString().split('T')[0];
      
      pickerContainer.innerHTML = `
        <div class="picker-group">
          <input type="date" id="dateInput" min="${minDate}" value="${minDate}">
          <input type="time" id="timeInput" value="10:00">
        </div>
        <button class="picker-submit-btn">Set Date & Time</button>
      `;
      
      const submitBtn = pickerContainer.querySelector('.picker-submit-btn');
      submitBtn.onclick = () => {
        const d = pickerContainer.querySelector('#dateInput').value;
        const t = pickerContainer.querySelector('#timeInput').value;
        if (!d || !t) return;
        
        // Format to something readable for the bot
        const dateObj = new Date(d);
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        
        chatInput.value = `${formattedDate} at ${t}`;
        handleSend();
        pickerContainer.remove();
      };
      
      bubble.appendChild(pickerContainer);
    }

    // Render time-only picker if requested
    if (showTimePicker) {
      const pickerContainer = document.createElement('div');
      pickerContainer.className = 'picker-container';
      
      pickerContainer.innerHTML = `
        <div class="picker-group">
          <input type="time" id="reminderTimeInput" value="08:00">
        </div>
        <button class="picker-submit-btn">Set Reminder Time</button>
      `;
      
      const submitBtn = pickerContainer.querySelector('.picker-submit-btn');
      submitBtn.onclick = () => {
        const t = pickerContainer.querySelector('#reminderTimeInput').value;
        if (!t) return;
        
        chatInput.value = t;
        handleSend();
        pickerContainer.remove();
      };
      
      bubble.appendChild(pickerContainer);
    }

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const content = document.createElement('div');
    content.className = 'message-content';
    content.appendChild(bubble);
    content.appendChild(time);

    if (sender === 'bot') { wrapper.appendChild(avatar); wrapper.appendChild(content); }
    else { wrapper.appendChild(content); wrapper.appendChild(avatar); }

    chatMessages.appendChild(wrapper);
    scrollToBottom();
  }

  function formatText(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>').replace(/• /g, '<span class="list-bullet">•</span> ');
  }

  function showTyping() { typingIndicator.classList.add('visible'); scrollToBottom(); }
  function hideTyping() { typingIndicator.classList.remove('visible'); }
  function showEmergencyBanner() { emergencyBanner.classList.add('visible'); setTimeout(() => emergencyBanner.classList.remove('visible'), 15000); }
  function scrollToBottom() { requestAnimationFrame(() => { chatMessages.scrollTop = chatMessages.scrollHeight; }); }
  function autoResizeInput() { chatInput.style.height = 'auto'; chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px'; }

  function clearChat() {
    chatHistory = [];
    Storage.saveChatHistory([]);
    chatMessages.innerHTML = '';
    ChatEngine.resetFlow();
    addBotMessage(getWelcomeMessage().text, 'greeting', false);
  }

  async function refreshSidebar() {
    let appointments = [], reminders = [];
    try { const d = await API.get('/appointments'); if (d?.appointments) appointments = d.appointments.filter(a => a.status !== 'cancelled'); } catch { appointments = Appointments.getUpcoming(); }
    try { const d = await API.get('/reminders'); if (d?.reminders) reminders = d.reminders.filter(r => r.active); } catch { reminders = Reminders.getActive(); }

    if (appointmentsList) {
      appointmentsList.innerHTML = appointments.length === 0
        ? '<div class="empty-state"><span class="empty-icon"></span><p>No upcoming appointments</p></div>'
        : appointments.map(a => `<div class="sidebar-card"><div class="card-header"><span class="card-icon"></span><span class="card-title">${a.doctorType || a.specialization}</span><span class="card-status status-confirmed">${a.status}</span></div><div class="card-details"><span>Date: ${a.date}</span><span>Time: ${a.time}</span></div></div>`).join('');
    }

    if (remindersList) {
      remindersList.innerHTML = reminders.length === 0
        ? '<div class="empty-state"><span class="empty-icon"></span><p>No active reminders</p></div>'
        : reminders.map(r => `<div class="sidebar-card"><div class="card-header"><span class="card-icon"></span><span class="card-title">${r.medicineName}</span></div><div class="card-details"><span>Dosage: ${r.dosage}</span><span>Freq: ${r.frequency}</span></div></div>`).join('');
    }

    // Health history
    const historyEl = document.getElementById('historyTimeline');
    if (historyEl) {
      try {
        const data = await API.getHealthHistory();
        if (!data?.history?.length) {
          historyEl.innerHTML = '<div class="empty-state"><span class="empty-icon"></span><p>No health history yet</p></div>';
        } else {
          historyEl.innerHTML = data.history.slice(0, 5).map(h => `<div class="sidebar-card"><div class="card-header"><span class="card-icon"></span><span class="card-title">${(h.symptoms || [h.symptom]).slice(0, 2).join(', ')}</span><span class="card-status" style="background:rgba(0,212,170,0.1);color:var(--accent-primary)">${h.intensity}/10</span></div><div class="card-details"><span>Date: ${new Date(h.timestamp).toLocaleDateString()}</span><span>${h.classification || 'mild'}</span></div></div>`).join('');
        }
      } catch { /* silent */ }
    }
  }

  init();
  return { refreshSidebar, clearChat };
})();
