// ============================================================
// chatEngine.js — Intent Recognition & Conversation Engine
// ============================================================
const ChatEngine = (() => {
  let conversationState = { currentFlow: null, step: 0, data: {} };
  let userName = Storage.loadUserProfile().name;

  const intentPatterns = {
    greeting: { keywords: ['hello','hi','hey','good morning','good afternoon','good evening','namaste','greetings'], weight: 1 },
    farewell: { keywords: ['bye','goodbye','see you','take care','good night'], weight: 1 },
    thanks: { keywords: ['thank','thanks','thank you','appreciate'], weight: 1 },
    book_appointment: { keywords: ['book','appointment','schedule','doctor','visit','consultation','consult'], weight: 2 },
    cancel_appointment: { keywords: ['cancel appointment','cancel booking','remove appointment'], weight: 3 },
    set_reminder: { keywords: ['reminder','remind','medicine reminder','medication','pill','tablet','dose'], weight: 2 },
    health_query: { keywords: ['symptom','symptoms','what is','how to treat','remedy','treatment','precaution','cause'], weight: 1.5 },
    wellness_tip: { keywords: ['tip','tips','wellness','healthy','diet','exercise','sleep','mental health','fitness'], weight: 1.5 },
    emergency: { keywords: ['emergency','urgent','help me','dying',"can't breathe"], weight: 5 },
    show_appointments: { keywords: ['my appointments','show appointments','list appointments'], weight: 3 },
    show_reminders: { keywords: ['my reminders','show reminders','list reminders'], weight: 3 },
    find_hospital: { keywords: ['find hospital','nearest hospital','nearby hospital','hospital near','clinic near','find clinic'], weight: 3 },
    my_name: { keywords: ['my name is','i am','call me'], weight: 2 },
  };

  function detectIntent(text) {
    const lower = text.toLowerCase().trim();
    if (HealthData.isEmergency(lower)) return 'emergency';
    if (conversationState.currentFlow) return 'flow_continue';

    let bestIntent = null, bestScore = 0;
    for (const [intent, config] of Object.entries(intentPatterns)) {
      let score = 0;
      for (const kw of config.keywords) { if (lower.includes(kw)) score += config.weight; }
      if (score > bestScore) { bestScore = score; bestIntent = intent; }
    }

    if (!bestIntent || bestScore < 1.5) {
      const condition = HealthData.findConditionFromText(lower);
      if (condition) return 'health_query';
    }
    return bestIntent || 'unknown';
  }

  async function processMessage(text) {
    const intent = detectIntent(text);
    const lower = text.toLowerCase().trim();

    switch (intent) {
      case 'emergency': return handleEmergency();
      case 'flow_continue': return handleFlowStep(text);
      case 'greeting': return handleGreeting();
      case 'farewell': return handleFarewell();
      case 'thanks': return handleThanks();
      case 'book_appointment': return startAppointmentFlow(lower);
      case 'cancel_appointment': return handleCancelAppointment();
      case 'set_reminder': return startReminderFlow();
      case 'health_query': return await handleHealthQuery(lower);
      case 'wellness_tip': return handleWellnessTip(lower);
      case 'show_appointments': return handleShowAppointments();
      case 'show_reminders': return handleShowReminders();
      case 'find_hospital': return { text: 'I\'ll help you find nearby hospitals! Click the **Facility Map** button in the header, or I can search using your location.\n\nWould you like me to search now?', type: 'facilities' };
      case 'my_name': return handleNameIntroduction(text);
      default: return await handleUnknown(lower);
    }
  }

  function handleEmergency() {
    return {
      text: `**EMERGENCY ALERT**\n\nThese symptoms sound serious and require **immediate medical attention!**\n\nPlease take these steps RIGHT NOW:`,
      type: 'emergency',
      options: [
        { name: 'Ambulance (102)', value: 'tel:102' },
        { name: 'Police (100)', value: 'tel:100' },
        { name: 'Fire (101)', value: 'tel:101' },
        { name: 'Find Nearby Hospital', value: 'find_hospital' }
      ]
    };
  }

  function handleGreeting() {
    const greetings = [
      `Hello${userName ? ', ' + userName : ''}! I'm your **AI Healthcare Assistant**. How can I help?`,
      `Hi there${userName ? ', ' + userName : ''}! I'm powered by AI to help with symptom triage, appointments, and more.`,
    ];
    const tip = HealthData.getDailyTip();
    return { text: `${greetings[Math.floor(Math.random() * greetings.length)]}\n\n**Today's Tip:** ${tip}`, type: 'greeting' };
  }

  function handleFarewell() {
    return { text: `Goodbye${userName ? ', ' + userName : ''}! Take care of yourself. Remember, I'm always here if you need help!`, type: 'farewell' };
  }

  function handleThanks() {
    return { text: `You're welcome${userName ? ', ' + userName : ''}! Anything else I can help with?`, type: 'general' };
  }

  function handleNameIntroduction(text) {
    const patterns = [/my name is\s+(\w+)/i, /i am\s+(\w+)/i, /call me\s+(\w+)/i, /i'm\s+(\w+)/i];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        userName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        Storage.saveUserProfile({ name: userName });
        return { text: `Nice to meet you, **${userName}**! How can I assist you today?`, type: 'general' };
      }
    }
    return { text: `Nice to meet you! What should I call you?`, type: 'general' };
  }

  // --- APPOINTMENT FLOW ---
  function startAppointmentFlow(text) {
    const condition = HealthData.findConditionFromText(text);
    if (condition) {
      conversationState = { currentFlow: 'appointment', step: 2, data: { specialization: condition.doctor, symptoms: condition.name } };
      return { text: `For **${condition.name}**, I'd recommend a **${condition.doctor}**.\n\nMay I have your **name**?`, type: 'appointment' };
    }
    conversationState = { currentFlow: 'appointment', step: 1, data: {} };
    const specs = Appointments.getSpecializations();
    return {
      text: `What are you feeling? Tap the symptom below to book an appointment with the right specialist. **Hold** to see which doctor it is.`,
      type: 'appointment',
      options: specs.map(s => ({ name: s.name, description: s.description, value: s.name }))
    };
  }

  function handleFlowStep(text) {
    if (conversationState.currentFlow === 'appointment') return handleAppointmentStep(text);
    if (conversationState.currentFlow === 'reminder') return handleReminderStep(text);
    resetFlow();
    return processMessage(text);
  }

  function handleAppointmentStep(text) {
    const step = conversationState.step;
    const data = conversationState.data;
    switch (step) {
      case 1: {
        const doctor = Appointments.suggestDoctor(text);
        const condition = HealthData.findConditionFromText(text);
        data.specialization = doctor;
        data.symptoms = condition ? condition.name : text;
        conversationState.step = 2;
        return { text: `I'll set you up with a **${doctor}**.\n\nYour **name**?`, type: 'appointment' };
      }
      case 2: {
        data.patientName = text.trim();
        if (data.patientName.length < 2) return { text: 'Please enter a valid name.', type: 'appointment' };
        if (!userName) { userName = data.patientName.charAt(0).toUpperCase() + data.patientName.slice(1); Storage.saveUserProfile({ name: userName }); }
        conversationState.step = 3;
        return { text: `Thanks, **${data.patientName}**! How **old** are you?`, type: 'appointment' };
      }
      case 3: {
        const age = parseInt(text);
        if (isNaN(age) || age < 0 || age > 150) return { text: 'Please enter a valid age (0-150).', type: 'appointment' };
        data.age = age;
        conversationState.step = 4;
        return {
      text: `Please select your preferred **date and time**:`,
      type: 'appointment',
      showPicker: true
    };
      }
      case 4: {
        const parsed = parseDateTime(text);
        data.date = parsed.date; data.time = parsed.time;
        conversationState.step = 5;
        return {
          text: `Confirm:\n\n**Patient:** ${data.patientName}\n**Age:** ${data.age}\n**Doctor:** ${data.specialization}\n**Date:** ${data.date}\n**Time:** ${data.time}\n\n**Confirm?**`,
          type: 'appointment',
          options: ['YES', 'NO']
        };
      }
      case 5: {
        const lower = text.toLowerCase().trim();
        // Extremely broad check for any affirmative intent
        const affirmativeWords = ['yes', 'confirm', 'ok', 'sure', 'y', 'book', 'correct', 'yep', 'yeah'];
        const isConfirm = affirmativeWords.some(word => lower.includes(word));
        
        if (isConfirm) {
          try {
            const apt = Appointments.create(data);
            resetFlow();
            if (typeof window.refreshSidebar === 'function') window.refreshSidebar();
            return { 
              text: `**Appointment Booked!**\n\n**ID:** ${apt.id}\n**${apt.specialization}**\n${apt.date} at ${apt.time}`, 
              type: 'appointment-confirmed', 
              appointmentData: data 
            };
          } catch (e) {
            console.error('Booking failed:', e);
            resetFlow();
            return { text: 'Sorry, I encountered an error while saving your appointment.', type: 'error' };
          }
        }
        resetFlow();
        return { text: 'Appointment cancelled. Let me know if you want to try again.', type: 'general' };
      }
    }
    resetFlow();
    return { text: 'Something went wrong. Let\'s start over.', type: 'error' };
  }

  // --- REMINDER FLOW ---
  function startReminderFlow() {
    conversationState = { currentFlow: 'reminder', step: 1, data: {} };
    return { text: `Let's set up a medicine reminder!\n\nWhat's the **medicine name**?`, type: 'reminder' };
  }

  function handleReminderStep(text) {
    const step = conversationState.step;
    const data = conversationState.data;
    switch (step) {
      case 1: data.medicineName = text.trim(); conversationState.step = 2; return { text: `**${data.medicineName}** — What's the **dosage**? (e.g. "1 tablet", "5ml")`, type: 'reminder' };
      case 2: data.dosage = text.trim(); conversationState.step = 3; return { 
        text: `How **often**?`, 
        type: 'reminder',
        options: ['Daily', 'Twice daily', 'Three times daily', 'Every 8 hours', 'Every 12 hours']
      };
      case 3: data.frequency = text.trim(); conversationState.step = 4; return { text: `What **time(s)**?`, type: 'reminder', showTimePicker: true };
      case 4: {
        data.times = parseReminderTimes(text);
        conversationState.step = 5;
        return { 
          text: `Confirm:\n\n**${data.medicineName}**\nDosage: ${data.dosage}\nFrequency: ${data.frequency}\nTimes: ${data.times.join(', ')}\n\n**Set this?**`, 
          type: 'reminder',
          options: ['YES', 'NO']
        };
      }
      case 5: {
        if (['yes','y','confirm','sure','ok'].includes(text.toLowerCase().trim())) {
          const rem = Reminders.add(data);
          Reminders.requestNotificationPermission();
          Reminders.startChecking();
          resetFlow();
          if (typeof window.refreshSidebar === 'function') window.refreshSidebar();
          return { text: `**Reminder Set!**\n\n${rem.medicineName} — ${rem.dosage}\nTimes: ${rem.times.join(', ')}`, type: 'reminder-confirmed', reminderData: data };
        }
        resetFlow();
        return { text: 'Reminder not set. Let me know if you want to try again!', type: 'general' };
      }
    }
    resetFlow();
    return { text: 'Something went wrong. Let\'s start over.', type: 'error' };
  }

  // --- Health query (AI) ---
  async function handleHealthQuery(text) {
    try {
      const result = await API.analyzeTriage(text);
      const symptoms = (result.symptoms || []).join(', ');
      const conditions = (result.possibleConditions || []).join(', ');
      const questions = (result.followUpQuestions || []).map(q => `• ${q}`).join('\n');
      const confidence = result.confidence || 85;

      let r = `**AI Health Analysis**\n\n`;
      r += `🔍 **Symptoms:** ${symptoms}\n`;
      r += `Severity: ${result.severityScore}/10\n\n`;
      if (result.isEmergency) r += `**URGENT:** Seek immediate medical attention!\n\n`;
      r += `Possible Conditions: ${conditions}\n\n`;
      r += `Recommendation: ${result.recommendation}\n\n`;
      if (result.followUpQuestions && result.followUpQuestions.length > 0) r += `Follow-up:\n${questions}\n\n`;
      if (result.sources && result.sources.length > 0) {
        r += `📖 **Medical Sources:** ${result.sources.map(s => `*${s}*`).join(', ')}\n\n`;
      }
      r += `AI Confidence: ${confidence}%\n\n`;
      r += `Would you like to **find a nearby hospital** or **book an appointment**?`;

      return { text: r, type: result.isEmergency ? 'emergency' : 'health', isEmergency: result.isEmergency, confidence, options: ['Find Hospital', 'Book Appointment'] };
    } catch (error) {
      console.error('AI Triage Failed:', error);
      return handleLocalHealthQuery(text);
    }
  }

  function handleLocalHealthQuery(text) {
    const condition = HealthData.findConditionFromText(text);
    if (!condition) return { text: `I'm having trouble analyzing those symptoms. Could you describe them differently?`, type: 'health' };
    const precautions = condition.precautions.map(p => `• ${p}`).join('\n');
    const remedies = condition.remedies.map(r => `• ${r}`).join('\n');
    return {
      text: `**${condition.name}**\n\n${condition.info}\n\n**Precautions:**\n${precautions}\n\n**Remedies:**\n${remedies}\n\n**Doctor:** ${condition.doctor}\n\nWould you like to book an appointment?`,
      type: 'health',
    };
  }

  function handleWellnessTip(text) {
    const categories = HealthData.getAllCategories();
    let category = null;
    for (const cat of categories) { if (text.toLowerCase().includes(cat)) { category = cat; break; } }
    if (category) {
      const tips = HealthData.getRandomWellnessTips(category, 3).join('\n\n');
      return { text: `**${category}** tips:\n\n${tips}`, type: 'wellness' };
    }
    const allTips = categories.map(c => HealthData.getRandomWellnessTips(c, 1)).flat().join('\n\n');
    return { text: `Today's **wellness tips**:\n\n${allTips}`, type: 'wellness' };
  }

  function handleShowAppointments() {
    const upcoming = Appointments.getUpcoming();
    if (upcoming.length === 0) return { text: 'No upcoming appointments. Would you like to **book one**?', type: 'general' };
    const list = upcoming.map(a => `**${a.id}** — ${a.specialization}\n${a.date} at ${a.time}`).join('\n\n');
    return { text: `**Upcoming appointments:**\n\n${list}`, type: 'general' };
  }

  function handleShowReminders() {
    const active = Reminders.getActive();
    if (active.length === 0) return { text: 'No active reminders. Would you like to **set one**?', type: 'general' };
    const list = active.map(r => `**${r.medicineName}** — ${r.dosage}\nTimes: ${r.times.join(', ')}`).join('\n\n');
    return { text: `**Active reminders:**\n\n${list}`, type: 'general' };
  }

  function handleCancelAppointment() {
    const upcoming = Appointments.getUpcoming();
    if (upcoming.length === 0) return { text: 'No active appointments to cancel.', type: 'general' };
    if (upcoming.length === 1) {
      Appointments.cancel(upcoming[0].id);
      if (typeof window.refreshSidebar === 'function') window.refreshSidebar();
      return { text: `Appointment with **${upcoming[0].specialization}** on ${upcoming[0].date} **cancelled**.`, type: 'general' };
    }
    const list = upcoming.map(a => `**${a.id}** — ${a.specialization} on ${a.date}`).join('\n');
    return { text: `Which one to cancel?\n\n${list}`, type: 'general' };
  }

  async function handleUnknown(text) {
    if (text.split(' ').length > 3) return await handleHealthQuery(text);
    return {
      text: `I'm not sure I understood. I can help with:\n\n• **Book appointment**\n• **Medicine reminder**\n• **Health info** — describe your symptoms\n• **Wellness tips**\n• **Find hospital**\n• **Emergency**`,
      type: 'help',
    };
  }

  function resetFlow() { conversationState = { currentFlow: null, step: 0, data: {} }; }

  function parseDateTime(text) {
    const now = new Date();
    let date = '', time = '';
    const timeMatch = text.match(/(\d{1,2})\s*(?::(\d{2}))?\s*(am|pm|AM|PM)?/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1]); const m = timeMatch[2] ? parseInt(timeMatch[2]) : 0; const p = timeMatch[3];
      if (p) { if (p.toLowerCase() === 'pm' && h !== 12) h += 12; if (p.toLowerCase() === 'am' && h === 12) h = 0; }
      time = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    } else { time = '10:00'; }
    const lower = text.toLowerCase();
    if (lower.includes('today')) { date = fmtDate(now); }
    else if (lower.includes('tomorrow')) { const t = new Date(now); t.setDate(t.getDate()+1); date = fmtDate(t); }
    else { const t = new Date(now); t.setDate(t.getDate()+1); date = fmtDate(t); }
    return { date, time };
  }

  function fmtDate(d) {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  function parseReminderTimes(text) {
    const times = [];
    const matches = text.matchAll(/(\d{1,2})\s*(?::(\d{2}))?\s*(am|pm|AM|PM)?/gi);
    for (const m of matches) {
      let h = parseInt(m[1]); const min = m[2] ? parseInt(m[2]) : 0; const p = m[3];
      if (p) { if (p.toLowerCase() === 'pm' && h !== 12) h += 12; if (p.toLowerCase() === 'am' && h === 12) h = 0; }
      times.push(`${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`);
    }
    return times.length > 0 ? times : ['08:00'];
  }

  function getUserName() { return userName; }
  function setUserName(name) { userName = name; Storage.saveUserProfile({ name }); }

  return { processMessage, detectIntent, getUserName, setUserName, resetFlow };
})();
