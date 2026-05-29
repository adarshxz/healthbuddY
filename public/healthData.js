// ============================================================
// healthData.js — Health Knowledge Base
// ============================================================

const HealthData = (() => {
  // --- Common conditions knowledge base ---
  const conditions = {
    headache: {
      name: 'Headache',
      info: 'Headaches can be caused by stress, dehydration, eye strain, lack of sleep, or tension.',
      precautions: [
        'Stay hydrated — drink plenty of water',
        'Take breaks from screens every 30 minutes',
        'Ensure adequate sleep (7-8 hours)',
        'Manage stress through relaxation techniques',
      ],
      remedies: [
        'Rest in a quiet, dark room',
        'Apply a cold or warm compress to your forehead',
        'Gently massage your temples',
        'Try deep breathing exercises',
      ],
      doctor: 'General Physician',
    },
    cold: {
      name: 'Common Cold',
      info: 'The common cold is a viral infection of the upper respiratory tract. It usually resolves in 7-10 days.',
      precautions: [
        'Wash hands frequently',
        'Avoid close contact with infected people',
        'Keep your immune system strong with good nutrition',
      ],
      remedies: [
        'Rest and stay warm',
        'Drink warm fluids like tea, soup, or warm water with honey',
        'Use steam inhalation to relieve congestion',
        'Gargle with warm salt water for a sore throat',
      ],
      doctor: 'General Physician',
    },
    flu: {
      name: 'Flu / Influenza',
      info: 'The flu is a contagious respiratory illness caused by influenza viruses. Symptoms are more severe than a cold.',
      precautions: [
        'Get an annual flu vaccination',
        'Practice good hand hygiene',
        'Avoid touching your face',
        'Stay home if you feel unwell',
      ],
      remedies: [
        'Rest and hydrate well',
        'Use over-the-counter fever reducers (consult a pharmacist)',
        'Inhale steam for congestion',
        'Eat nutritious, easy-to-digest foods',
      ],
      doctor: 'General Physician',
    },
    fever: {
      name: 'Fever',
      info: 'Fever is the body\'s natural response to infection. A temperature above 100.4°F (38°C) is considered a fever.',
      precautions: [
        'Monitor your temperature regularly',
        'Stay hydrated',
        'Wear light clothing',
        'Seek medical attention if fever persists beyond 3 days',
      ],
      remedies: [
        'Rest and drink plenty of fluids',
        'Use a damp cloth on your forehead',
        'Take a lukewarm bath',
        'Eat light, nutritious foods',
      ],
      doctor: 'General Physician',
    },
    stomachpain: {
      name: 'Stomach Pain',
      info: 'Stomach pain can result from indigestion, gas, acidity, food poisoning, or stress.',
      precautions: [
        'Eat regular, balanced meals',
        'Avoid spicy and oily foods if prone to acidity',
        'Chew food thoroughly',
        'Don\'t lie down immediately after eating',
      ],
      remedies: [
        'Drink warm water or ginger tea',
        'Avoid heavy or greasy foods',
        'Try a heating pad on your abdomen',
        'Eat bland foods like bananas, rice, toast',
      ],
      doctor: 'Gastroenterologist',
    },
    backpain: {
      name: 'Back Pain',
      info: 'Back pain is often caused by poor posture, muscle strain, prolonged sitting, or lack of exercise.',
      precautions: [
        'Maintain good posture while sitting and standing',
        'Use an ergonomic chair',
        'Stretch regularly, especially after long sitting',
        'Lift heavy objects properly (bend your knees)',
      ],
      remedies: [
        'Apply ice for the first 48 hours, then switch to heat',
        'Gentle stretching exercises',
        'Avoid bed rest — keep moving gently',
        'Consider yoga or swimming',
      ],
      doctor: 'Orthopedic',
    },
    allergy: {
      name: 'Allergies',
      info: 'Allergies occur when your immune system reacts to substances like pollen, dust, pet dander, or certain foods.',
      precautions: [
        'Identify and avoid your allergens',
        'Keep your living space clean and dust-free',
        'Use air purifiers if needed',
        'Check food labels carefully if you have food allergies',
      ],
      remedies: [
        'Rinse nasal passages with saline solution',
        'Use antihistamines (consult a pharmacist)',
        'Apply cool compresses on itchy eyes',
        'Avoid outdoor activities during high pollen times',
      ],
      doctor: 'General Physician',
    },
    cough: {
      name: 'Cough',
      info: 'Coughing is a reflex that keeps your throat and airways clear. It can be caused by infections, allergies, or irritants.',
      precautions: [
        'Avoid smoke and polluted environments',
        'Stay hydrated',
        'Cover your mouth when coughing',
        'See a doctor if cough persists over 2 weeks',
      ],
      remedies: [
        'Drink warm water with honey and lemon',
        'Gargle with warm salt water',
        'Use a humidifier in dry environments',
        'Suck on throat lozenges',
      ],
      doctor: 'General Physician',
    },
    insomnia: {
      name: 'Insomnia / Sleep Issues',
      info: 'Difficulty falling or staying asleep can be caused by stress, anxiety, poor habits, or medical conditions.',
      precautions: [
        'Maintain a consistent sleep schedule',
        'Limit caffeine, especially after 2 PM',
        'Avoid screens 1 hour before bed',
        'Create a cool, dark, quiet sleeping environment',
      ],
      remedies: [
        'Practice relaxation techniques before bed',
        'Try chamomile tea or warm milk',
        'Read a book instead of using your phone',
        'Exercise regularly, but not too close to bedtime',
      ],
      doctor: 'General Physician',
    },
    anxiety: {
      name: 'Anxiety',
      info: 'Anxiety is a feeling of unease, worry, or fear. Occasional anxiety is normal, but persistent anxiety may need attention.',
      precautions: [
        'Practice mindfulness and meditation regularly',
        'Maintain a healthy routine',
        'Stay connected with friends and family',
        'Limit caffeine and alcohol',
      ],
      remedies: [
        'Deep breathing: inhale 4 sec, hold 7 sec, exhale 8 sec',
        'Progressive muscle relaxation',
        'Go for a walk in nature',
        'Write down your thoughts in a journal',
      ],
      doctor: 'Psychiatrist',
    },
    skinrash: {
      name: 'Skin Rash',
      info: 'Skin rashes can be caused by allergies, infections, heat, irritants, or autoimmune conditions.',
      precautions: [
        'Wear loose, breathable clothing',
        'Use gentle, fragrance-free soaps',
        'Avoid scratching the affected area',
        'Keep skin moisturized',
      ],
      remedies: [
        'Apply calamine lotion or aloe vera gel',
        'Use a cold compress for itching',
        'Take a cool oatmeal bath',
        'Wear cotton fabrics',
      ],
      doctor: 'Dermatologist',
    },
    toothache: {
      name: 'Toothache',
      info: 'Tooth pain can be caused by cavities, gum disease, cracked teeth, or infection.',
      precautions: [
        'Brush twice daily with fluoride toothpaste',
        'Floss daily',
        'Limit sugary foods and drinks',
        'Visit a dentist every 6 months',
      ],
      remedies: [
        'Rinse with warm salt water',
        'Apply a cold compress on the cheek',
        'Use clove oil on the affected area',
        'Avoid very hot or cold foods',
      ],
      doctor: 'Dentist',
    },
    eyestrain: {
      name: 'Eye Strain',
      info: 'Eye strain occurs from prolonged screen use, reading, or driving. It causes tired, sore, or watery eyes.',
      precautions: [
        'Follow the 20-20-20 rule (every 20 min, look 20 ft away for 20 sec)',
        'Adjust screen brightness and position',
        'Blink frequently',
        'Use proper lighting',
      ],
      remedies: [
        'Rest your eyes by closing them for a few minutes',
        'Use artificial tears / eye drops',
        'Place cool cucumber slices on closed eyes',
        'Reduce screen time',
      ],
      doctor: 'Ophthalmologist',
    },
    dehydration: {
      name: 'Dehydration',
      info: 'Dehydration happens when you lose more fluids than you take in. Symptoms include thirst, dry mouth, fatigue, and dizziness.',
      precautions: [
        'Drink at least 8 glasses of water daily',
        'Increase intake in hot weather or during exercise',
        'Monitor the color of your urine (aim for pale yellow)',
        'Eat water-rich fruits and vegetables',
      ],
      remedies: [
        'Sip water slowly and regularly',
        'Drink ORS (oral rehydration solution) if severely dehydrated',
        'Eat juicy fruits like watermelon and oranges',
        'Avoid caffeinated and alcoholic beverages',
      ],
      doctor: 'General Physician',
    },
    acidity: {
      name: 'Acidity / Heartburn',
      info: 'Acidity occurs when there is excess acid production in the stomach, causing a burning sensation.',
      precautions: [
        'Eat meals on time — don\'t skip meals',
        'Avoid spicy, fried, and oily foods',
        'Don\'t lie down immediately after eating',
        'Reduce stress',
      ],
      remedies: [
        'Drink cold milk or coconut water',
        'Chew fennel seeds after meals',
        'Eat a banana',
        'Avoid citrus fruits during episodes',
      ],
      doctor: 'Gastroenterologist',
    },
    jointpain: {
      name: 'Joint Pain',
      info: 'Joint pain can result from arthritis, injuries, overuse, or inflammation.',
      precautions: [
        'Maintain a healthy weight',
        'Exercise regularly with low-impact activities',
        'Warm up before physical activity',
        'Use proper form when exercising',
      ],
      remedies: [
        'Apply ice packs to reduce swelling',
        'Gentle stretching and range-of-motion exercises',
        'Rest the affected joint',
        'Consider joint-support supplements (consult a doctor)',
      ],
      doctor: 'Orthopedic',
    },
    fatigue: {
      name: 'Fatigue / Tiredness',
      info: 'Persistent fatigue can be caused by poor sleep, stress, nutritional deficiencies, or underlying health conditions.',
      precautions: [
        'Get 7-9 hours of quality sleep',
        'Eat a balanced, nutrient-rich diet',
        'Exercise regularly',
        'Manage stress levels',
      ],
      remedies: [
        'Take short power naps (15-20 minutes)',
        'Stay hydrated',
        'Eat iron and vitamin B12-rich foods',
        'Reduce caffeine dependence',
      ],
      doctor: 'General Physician',
    },
    sorethroat: {
      name: 'Sore Throat',
      info: 'A sore throat is usually caused by viral infections, though bacteria (like strep) can also be responsible.',
      precautions: [
        'Avoid cold drinks and ice cream when symptomatic',
        'Wash hands regularly',
        'Avoid sharing utensils',
        'Stay warm in cold weather',
      ],
      remedies: [
        'Gargle with warm salt water 3-4 times daily',
        'Drink warm honey-lemon tea',
        'Suck on throat lozenges',
        'Stay hydrated with warm fluids',
      ],
      doctor: 'ENT Specialist',
    },
    highbp: {
      name: 'High Blood Pressure',
      info: 'High blood pressure (hypertension) is when blood pressure readings are consistently 140/90 mmHg or higher.',
      precautions: [
        'Reduce salt intake',
        'Exercise regularly (at least 30 min/day)',
        'Maintain a healthy weight',
        'Monitor blood pressure regularly',
      ],
      remedies: [
        'Practice deep breathing and meditation',
        'Eat potassium-rich foods (bananas, spinach)',
        'Reduce alcohol and caffeine',
        'Follow prescribed medication strictly',
      ],
      doctor: 'Cardiologist',
    },
    diabetes: {
      name: 'Diabetes Management',
      info: 'Diabetes is a chronic condition affecting how your body turns food into energy. Regular management is essential.',
      precautions: [
        'Monitor blood sugar levels regularly',
        'Follow a balanced, low-sugar diet',
        'Exercise at least 30 minutes daily',
        'Take medications as prescribed',
      ],
      remedies: [
        'Eat high-fiber foods',
        'Stay physically active',
        'Manage stress effectively',
        'Get regular check-ups',
      ],
      doctor: 'Endocrinologist',
    },
  };

  // symptom → condition key mapping
  const symptomMap = {
    headache: 'headache',
    'head pain': 'headache',
    migraine: 'headache',
    cold: 'cold',
    runny: 'cold',
    sneezing: 'cold',
    flu: 'flu',
    influenza: 'flu',
    fever: 'fever',
    temperature: 'fever',
    'stomach pain': 'stomachpain',
    'stomach ache': 'stomachpain',
    'tummy ache': 'stomachpain',
    indigestion: 'stomachpain',
    nausea: 'stomachpain',
    'back pain': 'backpain',
    backache: 'backpain',
    'lower back': 'backpain',
    allergy: 'allergy',
    allergies: 'allergy',
    allergic: 'allergy',
    cough: 'cough',
    coughing: 'cough',
    insomnia: 'insomnia',
    'can\'t sleep': 'insomnia',
    'cannot sleep': 'insomnia',
    'sleep problem': 'insomnia',
    'trouble sleeping': 'insomnia',
    anxiety: 'anxiety',
    anxious: 'anxiety',
    worried: 'anxiety',
    panic: 'anxiety',
    stressed: 'anxiety',
    rash: 'skinrash',
    'skin rash': 'skinrash',
    itching: 'skinrash',
    itchy: 'skinrash',
    hives: 'skinrash',
    toothache: 'toothache',
    'tooth pain': 'toothache',
    'teeth pain': 'toothache',
    dental: 'toothache',
    'eye strain': 'eyestrain',
    'eye pain': 'eyestrain',
    'tired eyes': 'eyestrain',
    'blurred vision': 'eyestrain',
    dehydration: 'dehydration',
    dehydrated: 'dehydration',
    thirsty: 'dehydration',
    acidity: 'acidity',
    heartburn: 'acidity',
    'acid reflux': 'acidity',
    'joint pain': 'jointpain',
    'knee pain': 'jointpain',
    arthritis: 'jointpain',
    fatigue: 'fatigue',
    tired: 'fatigue',
    exhausted: 'fatigue',
    'sore throat': 'sorethroat',
    'throat pain': 'sorethroat',
    'blood pressure': 'highbp',
    hypertension: 'highbp',
    'high bp': 'highbp',
    diabetes: 'diabetes',
    'blood sugar': 'diabetes',
    'sugar levels': 'diabetes',
  };

  // --- Emergency symptoms ---
  const emergencyKeywords = [
    'chest pain',
    'heart attack',
    'can\'t breathe',
    'cannot breathe',
    'difficulty breathing',
    'breathing difficulty',
    'shortness of breath',
    'unconscious',
    'passed out',
    'fainted',
    'seizure',
    'severe bleeding',
    'heavy bleeding',
    'stroke',
    'paralysis',
    'suicidal',
    'suicide',
    'overdose',
    'poisoning',
    'choking',
    'severe burn',
    'anaphylaxis',
    'severe allergic reaction',
    'unresponsive',
  ];

  // --- Wellness tips ---
  const wellnessTips = {
    diet: [
      '🥗 Eat a rainbow — include fruits and vegetables of different colors for varied nutrients.',
      '🍎 Start your day with a nutritious breakfast to fuel your morning.',
      '🥜 Include healthy fats like nuts, seeds, avocado, and olive oil in your diet.',
      '🌾 Choose whole grains over refined grains for better fiber intake.',
      '🐟 Eat protein-rich foods like fish, lean meat, beans, and lentils.',
      '🍽️ Practice mindful eating — eat slowly and enjoy your food without distractions.',
    ],
    hydration: [
      '💧 Drink at least 8 glasses (2 liters) of water every day.',
      '🍋 Add lemon or cucumber slices to your water for a refreshing twist.',
      '🚰 Carry a water bottle with you to stay hydrated on the go.',
      '☕ Limit caffeinated drinks — they can dehydrate you. Balance with water.',
      '🍉 Eat water-rich foods like watermelon, cucumber, and oranges.',
    ],
    exercise: [
      '🏃 Aim for at least 30 minutes of moderate exercise 5 days a week.',
      '🧘 Try yoga or stretching to improve flexibility and reduce stress.',
      '🚶 Walking 10,000 steps daily can significantly improve cardiovascular health.',
      '💪 Include strength training at least twice a week for bone health.',
      '🏊 Swimming is an excellent full-body, low-impact exercise.',
      '🚴 Consider cycling — it\'s fun, eco-friendly, and great cardio!',
    ],
    sleep: [
      '😴 Aim for 7-9 hours of quality sleep every night.',
      '📱 Put your phone away at least 30 minutes before bed.',
      '🌙 Keep your bedroom cool, dark, and quiet for better sleep.',
      '⏰ Maintain a consistent sleep schedule, even on weekends.',
      '☕ Avoid caffeine after 2 PM to prevent sleep disruption.',
      '📖 Develop a calming bedtime routine — reading, light stretching, or meditation.',
    ],
    mental: [
      '🧠 Practice mindfulness meditation for even 5 minutes daily.',
      '📝 Keep a gratitude journal — write 3 things you\'re thankful for each day.',
      '🤗 Stay socially connected — talk to friends or family regularly.',
      '🌳 Spend time in nature — it can reduce stress and improve mood.',
      '🎨 Engage in creative hobbies like painting, music, or writing.',
      '💆 Take breaks during work — try the Pomodoro technique (25 min work, 5 min break).',
    ],
  };

  // --- Daily health tip (rotates daily) ---
  const dailyTips = [
    '🌞 Good morning! Start your day with a glass of warm water and a 5-minute stretch.',
    '🥤 Hydration check! Have you had enough water today? Aim for 8 glasses.',
    '🧘 Take a deep breath. Inhale for 4 seconds, hold for 7, exhale for 8. Repeat 3 times.',
    '🍎 An apple a day keeps the doctor away! Have you eaten a fruit today?',
    '🚶 Sitting too long? Get up and take a 5-minute walk. Your body will thank you!',
    '😴 Sleep tip: Try to go to bed and wake up at the same time every day.',
    '🧠 Mental health matters! Take a few minutes to do something you enjoy today.',
    '💪 Even 10 minutes of exercise can boost your energy and mood!',
    '🥗 Try adding one extra serving of vegetables to your meals today.',
    '📵 Screen break! Look away from your screen every 20 minutes — your eyes need rest.',
    '🌿 Step outside for some fresh air. Even 10 minutes outdoors can lift your spirits.',
    '💧 Replace one sugary drink with water today. Small changes lead to big results!',
    '🫁 Practice belly breathing for 2 minutes to calm your nervous system.',
    '🍌 Bananas are a great source of potassium and natural energy — try one as a snack!',
  ];

  // --- Disclaimers ---
  const disclaimer =
    '⚠️ *This information is for general guidance only. Please consult a doctor for professional medical advice.*';

  const emergencyDisclaimer =
    '🚨 **This is not a substitute for emergency medical care. Please call emergency services immediately.**';

  // --- Public API ---
  function getCondition(symptom) {
    const lower = symptom.toLowerCase().trim();
    // direct match
    if (conditions[lower]) return conditions[lower];
    // check symptom map
    for (const [key, value] of Object.entries(symptomMap)) {
      if (lower.includes(key)) return conditions[value];
    }
    return null;
  }

  function findConditionFromText(text) {
    const lower = text.toLowerCase();
    for (const [key, condKey] of Object.entries(symptomMap)) {
      if (lower.includes(key)) return conditions[condKey];
    }
    return null;
  }

  function isEmergency(text) {
    const lower = text.toLowerCase();
    return emergencyKeywords.some((kw) => lower.includes(kw));
  }

  function getDailyTip() {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
    );
    return dailyTips[dayOfYear % dailyTips.length];
  }

  function getRandomWellnessTips(category, count = 2) {
    const tips = wellnessTips[category];
    if (!tips) return [];
    const shuffled = [...tips].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  function getAllCategories() {
    return Object.keys(wellnessTips);
  }

  function getDoctorForSymptom(text) {
    const condition = findConditionFromText(text);
    return condition ? condition.doctor : 'General Physician';
  }

  return {
    conditions,
    symptomMap,
    emergencyKeywords,
    wellnessTips,
    disclaimer,
    emergencyDisclaimer,
    getCondition,
    findConditionFromText,
    isEmergency,
    getDailyTip,
    getRandomWellnessTips,
    getAllCategories,
    getDoctorForSymptom,
  };
})();
