// ============================================================
// appointments.js — Appointment Booking (API + Local Fallback)
// ============================================================

const Appointments = (() => {
  let appointments = Storage.loadAppointments();

  const specializations = [
    { name: 'General Physician', icon: '🩺', description: 'For general health issues, fever, cold, and routine check-ups' },
    { name: 'Dentist', icon: '🦷', description: 'For tooth pain, dental care, and oral health' },
    { name: 'Cardiologist', icon: '❤️', description: 'For heart-related issues and blood pressure' },
    { name: 'Dermatologist', icon: '🧴', description: 'For skin conditions, rashes, and allergies' },
    { name: 'Orthopedic', icon: '🦴', description: 'For bone, joint, and muscle issues' },
    { name: 'ENT Specialist', icon: '👂', description: 'For ear, nose, and throat problems' },
    { name: 'Pediatrician', icon: '👶', description: 'For children\'s health issues' },
    { name: 'Neurologist', icon: '🧠', description: 'For headaches, migraines, and nervous system issues' },
    { name: 'Psychiatrist', icon: '💬', description: 'For mental health, anxiety, and depression' },
    { name: 'Ophthalmologist', icon: '👁️', description: 'For eye-related issues and vision problems' },
    { name: 'Gastroenterologist', icon: '🫄', description: 'For stomach, digestive, and gut issues' },
    { name: 'Endocrinologist', icon: '⚕️', description: 'For diabetes, thyroid, and hormonal issues' },
  ];

  const symptomToDoctor = {
    headache: 'General Physician',
    migraine: 'Neurologist',
    cold: 'General Physician',
    flu: 'General Physician',
    fever: 'General Physician',
    cough: 'General Physician',
    'stomach pain': 'Gastroenterologist',
    indigestion: 'Gastroenterologist',
    acidity: 'Gastroenterologist',
    'back pain': 'Orthopedic',
    'joint pain': 'Orthopedic',
    'knee pain': 'Orthopedic',
    allergy: 'General Physician',
    rash: 'Dermatologist',
    'skin problem': 'Dermatologist',
    toothache: 'Dentist',
    'tooth pain': 'Dentist',
    'sore throat': 'ENT Specialist',
    'ear pain': 'ENT Specialist',
    'eye strain': 'Ophthalmologist',
    'blurred vision': 'Ophthalmologist',
    anxiety: 'Psychiatrist',
    depression: 'Psychiatrist',
    stress: 'Psychiatrist',
    'blood pressure': 'Cardiologist',
    'heart pain': 'Cardiologist',
    diabetes: 'Endocrinologist',
    thyroid: 'Endocrinologist',
    child: 'Pediatrician',
    baby: 'Pediatrician',
  };

  function _generateId() {
    return 'APT-' + Date.now().toString(36).toUpperCase();
  }

  function _persist() {
    Storage.saveAppointments(appointments);
  }

  // Create locally and also save to API
  function create(details) {
    const appointment = {
      id: _generateId(),
      patientName: details.patientName || 'Patient',
      age: details.age || null,
      symptoms: details.symptoms || '',
      specialization: details.specialization || 'General Physician',
      doctorType: details.specialization || 'General Physician',
      date: details.date || '',
      time: details.time || '',
      status: 'booked',
      createdAt: new Date().toISOString(),
    };
    appointments.push(appointment);
    _persist();

    // Save to backend API
    if (typeof API !== 'undefined' && API.isLoggedIn()) {
      API.post('/appointments', {
        patientName: appointment.patientName,
        doctorType: appointment.doctorType,
        symptoms: appointment.symptoms,
        date: appointment.date,
        time: appointment.time,
      }).catch(() => console.log('API sync pending for appointment'));
    }

    return appointment;
  }

  function cancel(id) {
    const idx = appointments.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    appointments[idx].status = 'cancelled';
    _persist();
    return appointments[idx];
  }

  function reschedule(id, newDate, newTime) {
    const apt = appointments.find((a) => a.id === id);
    if (!apt) return null;
    apt.date = newDate;
    apt.time = newTime;
    apt.status = 'rescheduled';
    _persist();
    return apt;
  }

  function getUpcoming() {
    return appointments
      .filter((a) => a.status !== 'cancelled')
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  function getAll() {
    return [...appointments];
  }

  function suggestDoctor(symptomText) {
    const lower = symptomText.toLowerCase().trim();

    // First, check if the user typed a specialization name directly
    for (const spec of specializations) {
      if (lower.includes(spec.name.toLowerCase())) {
        return spec.name;
      }
    }

    // Then, check symptom-to-doctor mapping
    for (const [symptom, doctor] of Object.entries(symptomToDoctor)) {
      if (lower.includes(symptom)) return doctor;
    }

    return 'General Physician';
  }

  function getSpecializations() {
    return specializations;
  }

  function remove(id) {
    appointments = appointments.filter((a) => a.id !== id);
    _persist();
  }

  return {
    create,
    cancel,
    reschedule,
    getUpcoming,
    getAll,
    suggestDoctor,
    getSpecializations,
    remove,
  };
})();
