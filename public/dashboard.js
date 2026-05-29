// ============================================================
// dashboard.js — Dashboard Controller with PDF & Analytics
// ============================================================
(() => {
  if (!API.requireAuth()) return;

  const user = API.getUser();
  if (user) {
    document.getElementById('userName').textContent = user.name || 'User';
    document.getElementById('profileName').textContent = user.name || '—';
    document.getElementById('profileEmail').textContent = user.email || '—';
    document.getElementById('profileAge').textContent = user.age || '—';
    document.getElementById('profileDate').textContent = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—';
  }

  document.getElementById('logoutBtn')?.addEventListener('click', () => API.logout());

  // Profile editing
  const editBtn = document.getElementById('editProfileBtn');
  const editForm = document.getElementById('editProfileForm');
  const profileCard = document.getElementById('profileCard');
  const cancelBtn = document.getElementById('cancelEditBtn');

  editBtn?.addEventListener('click', () => {
    profileCard.style.display = 'none';
    editForm.style.display = 'grid';
    document.getElementById('editName').value = user?.name || '';
    document.getElementById('editAge').value = user?.age || '';
  });

  cancelBtn?.addEventListener('click', () => {
    profileCard.style.display = 'grid';
    editForm.style.display = 'none';
  });

  editForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const name = document.getElementById('editName').value;
      const age = document.getElementById('editAge').value;
      const data = await API.put('/user/profile', { name, age: age ? parseInt(age) : undefined });
      if (data?.user) {
        API.setUser(data.user);
        document.getElementById('profileName').textContent = data.user.name;
        document.getElementById('profileAge').textContent = data.user.age || '—';
        document.getElementById('userName').textContent = data.user.name;
      }
      profileCard.style.display = 'grid';
      editForm.style.display = 'none';
    } catch (err) {
      document.getElementById('profileError').textContent = err.message;
    }
  });

  // Load data
  loadDashboardData();

  async function loadDashboardData() {
    // Appointments
    try {
      const aptData = await API.get('/appointments');
      const apts = aptData?.appointments || [];
      document.getElementById('totalAppointments').textContent = apts.filter(a => a.status !== 'cancelled').length;
      const grid = document.getElementById('appointmentsGrid');
      if (apts.length === 0) { grid.innerHTML = '<div class="loading-state">No appointments yet</div>'; }
      else {
        grid.innerHTML = apts.slice(0, 10).map(a => `
          <div class="data-card">
            <span class="data-card-icon"></span>
            <div class="data-card-info">
              <div class="data-card-title">${a.specialization || 'General Consultation'}</div>
              <div class="data-card-meta">
                <span>Date: ${a.date}</span>
                <span>Time: ${a.time}</span>
                <span>Patient: ${a.patientName}</span>
              </div>
            </div>
            <div style="display:flex; gap:12px; align-items:center">
              <span class="data-card-badge badge-${a.status === 'cancelled' ? 'emergency' : 'mild'}">${a.status}</span>
              ${a.status !== 'cancelled' ? `<button class="delete-btn" onclick="cancelAppointment('${a._id}')" title="Cancel Appointment">Cancel</button>` : ''}
            </div>
          </div>
        `).join('');
      }
    } catch { document.getElementById('appointmentsGrid').innerHTML = '<div class="loading-state">Unable to load</div>'; }

    window.cancelAppointment = async (id) => {
      if (!confirm('Are you sure you want to cancel this appointment?')) return;
      try {
        await API.delete(`/appointments/${id}`);
        loadDashboardData();
      } catch (err) { alert('Failed to cancel: ' + err.message); }
    };

    // Reminders
    try {
      const remData = await API.get('/reminders');
      const rems = remData?.reminders || [];
      document.getElementById('totalReminders').textContent = rems.filter(r => r.active).length;
      const grid = document.getElementById('remindersGrid');
      if (rems.length === 0) { grid.innerHTML = '<div class="loading-state">No reminders yet</div>'; }
      else {
        grid.innerHTML = rems.map(r => `<div class="data-card"><span class="data-card-icon"></span><div class="data-card-info"><div class="data-card-title">${r.medicineName}</div><div class="data-card-meta"><span>Dosage: ${r.dosage}</span><span>Frequency: ${r.frequency}</span><span>Time: ${(r.timing || []).join(', ')}</span></div></div><span class="data-card-badge ${r.active ? 'badge-mild' : 'badge-emergency'}">${r.active ? 'active' : 'inactive'}</span></div>`).join('');
      }
    } catch { document.getElementById('remindersGrid').innerHTML = '<div class="loading-state">Unable to load</div>'; }

    // Health analytics
    try {
      const analytics = await API.getHealthAnalytics();
      document.getElementById('totalTriages').textContent = analytics.totalInteractions || 0;
      document.getElementById('emergencyCount').textContent = analytics.emergencyCount || 0;
      document.getElementById('avgSeverity').textContent = analytics.avgSeverity || 0;

      const topList = document.getElementById('topSymptomsList');
      if (analytics.topSymptoms?.length > 0) {
        topList.innerHTML = analytics.topSymptoms.map(s => `<span class="symptom-tag">${s.symptom} (${s.count})</span>`).join('');
      } else {
        topList.innerHTML = '<span style="color:var(--text-muted);font-size:0.85rem">No data yet</span>';
      }

      // Health history
      const historyGrid = document.getElementById('historyGrid');
      const historyData = await API.getHealthHistory();
      if (historyData?.history?.length > 0) {
        historyGrid.innerHTML = historyData.history.map(h => {
          const cls = h.classification || (h.intensity >= 8 ? 'emergency' : h.intensity >= 5 ? 'moderate' : 'mild');
          return `<div class="data-card"><span class="data-card-icon"></span><div class="data-card-info"><div class="data-card-title">${(h.symptoms || [h.symptom]).join(', ')}</div><div class="data-card-meta"><span>Date: ${new Date(h.timestamp).toLocaleDateString()}</span><span>Severity: ${h.intensity}/10</span><span>${h.recommendation ? 'Recommendation: ' + h.recommendation.substring(0, 60) + '...' : ''}</span></div></div><span class="data-card-badge badge-${cls}">${cls}</span></div>`;
        }).join('');
      } else {
        historyGrid.innerHTML = '<div class="loading-state">No health history yet. Chat with the AI to get started!</div>';
      }
    } catch {
      document.getElementById('historyGrid').innerHTML = '<div class="loading-state">Unable to load history</div>';
    }
  }

  // --- PDF Report ---
  document.getElementById('downloadReportBtn')?.addEventListener('click', async () => {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const user = API.getUser();

      doc.setFontSize(20);
      doc.setTextColor(0, 212, 170);
      doc.text('HealthBuddy — Health Report', 20, 20);

      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Patient: ${user?.name || 'Unknown'}`, 20, 35);
      doc.text(`Email: ${user?.email || ''}`, 20, 42);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 49);

      doc.setDrawColor(0, 212, 170);
      doc.line(20, 55, 190, 55);

      let y = 65;
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text('Health History', 20, y); y += 10;

      const historyData = await API.getHealthHistory();
      if (historyData?.history?.length > 0) {
        doc.setFontSize(10);
        historyData.history.slice(0, 15).forEach(h => {
          if (y > 270) { doc.addPage(); y = 20; }
          const symptoms = (h.symptoms || [h.symptom]).join(', ');
          doc.setTextColor(60);
          doc.text(`${new Date(h.timestamp).toLocaleDateString()} — Severity: ${h.intensity}/10 — ${h.classification || 'mild'}`, 20, y);
          y += 6;
          doc.setTextColor(100);
          doc.text(`Symptoms: ${symptoms}`, 25, y); y += 6;
          if (h.recommendation) {
            const rec = h.recommendation.length > 80 ? h.recommendation.substring(0, 80) + '...' : h.recommendation;
            doc.text(`Recommendation: ${rec}`, 25, y); y += 8;
          }
        });
      } else {
        doc.setFontSize(10);
        doc.text('No health history records found.', 20, y);
      }

      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('This report is AI-generated and not a substitute for professional medical advice.', 20, 285);

      doc.save(`HealthBuddy_Report_${user?.name || 'Patient'}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  });
})();
