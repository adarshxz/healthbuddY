// ============================================================
// family.js — Family Caregiver Dashboard Controller
// ============================================================
(() => {
  if (!API.requireAuth()) return;
  const user = API.getUser();
  document.getElementById('userName').textContent = user?.name || 'Caregiver';
  document.getElementById('logoutBtn')?.addEventListener('click', () => API.logout());

  // ─── State ────────────────────────────────────────────────
  let members = [];
  let currentMemberId = null;
  let currentMemberData = null;

  // ─── Toast ────────────────────────────────────────────────
  function toast(msg, type = 'info') {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} ${msg}`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  // ─── Helpers ──────────────────────────────────────────────
  function timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }

  function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  // ─── Load Dashboard ──────────────────────────────────────
  async function loadDashboard() {
    try {
      const data = await API.get('/family/dashboard-summary');
      const s = data?.summary;
      if (!s) return;

      document.getElementById('statMembers').textContent = s.totalMembers;
      document.getElementById('statReminders').textContent = s.totalReminders;
      document.getElementById('statMissed').textContent = s.totalMissedToday;
      document.getElementById('statAlerts').textContent = s.criticalAlerts;

      members = s.memberSummaries || [];
      renderMembers(members);
      renderRecentAlerts(s.recentNotifications || []);
      loadNotifBadge();
    } catch (err) {
      console.error('Dashboard load error:', err);
      toast('Failed to load dashboard', 'error');
    }
  }

  // ─── Render Member Cards ─────────────────────────────────
  function renderMembers(list) {
    const grid = document.getElementById('membersGrid');
    if (!list.length) {
      grid.innerHTML = `<div class="empty-state"><span class="empty-icon">👨‍👩‍👧</span><p>No family members yet. Add your first member to get started!</p><button class="btn-primary" onclick="document.getElementById('addMemberBtn').click()">➕ Add Member</button></div>`;
      return;
    }
    grid.innerHTML = list.map(m => {
      const conditions = (m.conditions || []).slice(0, 3).map(c => `<span class="tag tag-condition">${c}</span>`).join('');
      const allergies = (m.allergies || []).slice(0, 2).map(a => `<span class="tag tag-allergy">${a}</span>`).join('');
      const upcoming = (m.upcomingMeds || []).slice(0, 2).map(u => `<div class="upcoming-med"><span class="upcoming-time">${u.timing}</span> ${u.medicineName} (${u.dosage})</div>`).join('');
      const missed = m.missedToday > 0 ? `<span class="missed-badge">⚠️ ${m.missedToday} missed</span>` : '';
      return `
        <div class="member-card" data-id="${m._id}">
          <div class="member-top">
            <div class="member-avatar ${m.gender}">${getInitials(m.name)}</div>
            <div>
              <div class="member-name">${m.name}</div>
              <div class="member-meta">${m.age} yrs · ${m.gender} · ${m.relation} ${missed}</div>
            </div>
          </div>
          <div class="member-tags">${conditions}${allergies}${m.totalReminders ? `<span class="tag tag-meds">💊 ${m.totalReminders} meds</span>` : ''}</div>
          ${upcoming ? `<div class="member-upcoming"><h4>Upcoming Medicines</h4>${upcoming}</div>` : ''}
          <div class="member-actions">
            <button class="btn-view" onclick="familyApp.viewMember('${m._id}')">📋 Details</button>
            <button class="btn-remind" onclick="familyApp.openReminderModal('${m._id}')">💊 Reminder</button>
            <button class="btn-edit" onclick="familyApp.openEditMember('${m._id}')">✏️ Edit</button>
          </div>
        </div>`;
    }).join('');
  }

  // ─── Render Recent Alerts ─────────────────────────────────
  function renderRecentAlerts(notifs) {
    const el = document.getElementById('recentAlerts');
    if (!notifs.length) {
      el.innerHTML = `<div class="empty-state"><span class="empty-icon">✅</span><p>No new alerts. Everything looks good!</p></div>`;
      return;
    }
    el.innerHTML = notifs.slice(0, 6).map(n => {
      const cls = n.severity === 'critical' ? 'critical' : n.severity === 'high' ? 'risk' : n.type === 'ai_suggestion' ? 'suggestion' : 'positive';
      return `<div class="insight-card ${cls}"><span class="insight-icon">${n.severity === 'critical' ? '🔴' : n.severity === 'high' ? '🟠' : '🔵'}</span><div class="insight-content"><h4>${n.title}</h4><p>${n.message}</p><small style="color:var(--text-muted);font-size:0.72rem">${timeAgo(n.createdAt)}</small></div></div>`;
    }).join('');
  }

  // ─── View Member Detail ───────────────────────────────────
  async function viewMember(id) {
    try {
      const data = await API.get(`/family/members/${id}`);
      if (!data?.member) return toast('Member not found', 'error');

      currentMemberId = id;
      currentMemberData = data.member;
      const m = data.member;
      const reminders = data.reminders || [];

      document.getElementById('dashboardView').style.display = 'none';
      document.getElementById('detailView').classList.add('open');

      const avatar = document.getElementById('detailAvatar');
      avatar.textContent = getInitials(m.name);
      avatar.className = `detail-avatar member-avatar ${m.gender}`;
      document.getElementById('detailName').textContent = m.name;
      document.getElementById('detailMeta').textContent = `${m.age} years · ${m.gender} · ${m.relation}`;

      // Health profile
      const hp = m.healthProfile || {};
      const healthList = document.getElementById('detailHealth');
      healthList.innerHTML = `
        <li>🩸 <strong>Blood Type:</strong> ${hp.bloodType || 'Unknown'}</li>
        <li>⚠️ <strong>Allergies:</strong> ${(hp.allergies || []).join(', ') || 'None listed'}</li>
        <li>🏥 <strong>Conditions:</strong> ${(hp.conditions || []).join(', ') || 'None listed'}</li>
        <li>💊 <strong>Medications:</strong> ${(hp.medications || []).join(', ') || 'None listed'}</li>
        ${hp.notes ? `<li>📝 <strong>Notes:</strong> ${hp.notes}</li>` : ''}`;

      // Adherence
      loadAdherence(id);

      // Reminders
      renderMemberReminders(reminders);

      // AI Insights
      loadInsights(id);
    } catch (err) {
      toast('Failed to load member details', 'error');
    }
  }

  // ─── Adherence ────────────────────────────────────────────
  async function loadAdherence(memberId) {
    const el = document.getElementById('detailAdherence');
    try {
      const data = await API.get(`/family/adherence/${memberId}`);
      const a = data?.adherence;
      if (!a) { el.innerHTML = '<p style="color:var(--text-muted)">No data yet</p>'; return; }
      const rate = a.overallRate;
      const cls = rate >= 80 ? 'high' : rate >= 50 ? 'medium' : 'low';
      el.innerHTML = `
        <div style="font-family:var(--font-heading);font-size:2.2rem;font-weight:800;color:${rate >= 80 ? 'var(--accent-green)' : rate >= 50 ? 'var(--accent-amber)' : 'var(--accent-coral)'}">${rate}%</div>
        <div class="adherence-bar-wrap"><div class="adherence-bar-bg"><div class="adherence-bar-fill ${cls}" style="width:${rate}%"></div></div>
        <div class="adherence-label"><span>Taken: ${a.takenDoses}</span><span>Missed: ${a.missedDoses}</span><span>Late: ${a.lateDoses}</span></div></div>
        ${a.medicineStats.map(ms => `<div style="margin-top:10px;font-size:0.82rem"><strong>${ms.medicineName}</strong> — ${ms.adherenceRate}% adherence (${ms.taken}/${ms.total} doses)</div>`).join('')}`;
    } catch { el.innerHTML = '<p style="color:var(--text-muted)">Unable to load</p>'; }
  }

  // ─── Member Reminders ─────────────────────────────────────
  function renderMemberReminders(reminders) {
    const el = document.getElementById('detailReminders');
    if (!reminders.length) {
      el.innerHTML = `<div class="empty-state"><span class="empty-icon">💊</span><p>No active reminders</p><button class="btn-primary" onclick="familyApp.openReminderModal('${currentMemberId}')">Add Reminder</button></div>`;
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    el.innerHTML = reminders.map(r => {
      const timings = r.timings.map(t => {
        const logged = (r.adherenceLog || []).find(l => l.date?.split('T')[0] === today && l.timing === t);
        const statusIcon = logged ? (logged.status === 'taken' ? '✅' : logged.status === 'missed' ? '❌' : '⏰') : '';
        return `<span class="timing-chip">${statusIcon} ${t}</span>`;
      }).join('');
      return `
        <div class="reminder-card">
          <span class="reminder-icon">💊</span>
          <div class="reminder-info">
            <div class="reminder-name">${r.medicineName} — ${r.dosage}</div>
            <div class="reminder-detail">${r.frequency.replace('_', ' ')} · ${r.instructions || 'No instructions'}</div>
            <div class="reminder-timings">${timings}</div>
          </div>
          <div class="reminder-actions">
            ${r.timings.map(t => {
              const logged = (r.adherenceLog || []).find(l => l.date?.split('T')[0] === today && l.timing === t);
              if (logged) return '';
              return `<button class="log-taken" onclick="familyApp.logDose('${r._id}','${t}','taken')" title="Mark ${t} taken">✅ ${t}</button>`;
            }).join('')}
            <button class="del-btn" onclick="familyApp.deleteReminder('${r._id}')" title="Delete">🗑️</button>
          </div>
        </div>`;
    }).join('');
  }

  // ─── AI Insights ──────────────────────────────────────────
  async function loadInsights(memberId) {
    const el = document.getElementById('detailInsights');
    el.innerHTML = '<div class="empty-state">🤖 Analyzing health data...</div>';
    try {
      const data = await API.get(`/family/insights/${memberId}`);
      const ins = data?.insights;
      if (!ins) { el.innerHTML = '<div class="empty-state">No insights available</div>'; return; }

      const all = [
        ...(ins.alerts || []).map(i => ({ ...i, cls: 'critical' })),
        ...(ins.insights || []).map(i => ({ ...i, cls: i.type === 'positive' ? 'positive' : 'risk' })),
        ...(ins.suggestions || []).map(i => ({ ...i, cls: 'suggestion' })),
      ];
      if (!all.length) { el.innerHTML = '<div class="empty-state"><span class="empty-icon">✅</span><p>No concerns detected. Keep up the great care!</p></div>'; return; }
      el.innerHTML = all.map(i => `<div class="insight-card ${i.cls}"><span class="insight-icon">${i.icon}</span><div class="insight-content"><h4>${i.title}</h4><p>${i.message}</p></div></div>`).join('');
    } catch { el.innerHTML = '<div class="empty-state">Unable to load insights</div>'; }
  }

  // ─── Log Dose ─────────────────────────────────────────────
  async function logDose(reminderId, timing, status) {
    try {
      await API.post(`/family/reminders/${reminderId}/log`, {
        date: new Date().toISOString().split('T')[0],
        timing, status,
      });
      toast(`Dose marked as ${status}`, 'success');
      viewMember(currentMemberId); // refresh
    } catch (err) { toast('Failed to log dose', 'error'); }
  }

  // ─── Delete Reminder ──────────────────────────────────────
  async function deleteReminder(id) {
    if (!confirm('Delete this reminder?')) return;
    try {
      await API.del(`/family/reminders/${id}`);
      toast('Reminder deleted', 'success');
      viewMember(currentMemberId);
    } catch { toast('Failed to delete', 'error'); }
  }

  // ─── Delete Member ────────────────────────────────────────
  document.getElementById('deleteMemberBtn')?.addEventListener('click', async () => {
    if (!currentMemberId || !confirm(`Remove ${currentMemberData?.name}? All their reminders will also be deactivated.`)) return;
    try {
      await API.del(`/family/members/${currentMemberId}`);
      toast('Member removed', 'success');
      backToList();
      loadDashboard();
    } catch { toast('Failed to remove', 'error'); }
  });

  // ─── Back to list ─────────────────────────────────────────
  function backToList() {
    document.getElementById('detailView').classList.remove('open');
    document.getElementById('dashboardView').style.display = 'block';
    currentMemberId = null;
    currentMemberData = null;
  }
  document.getElementById('backToListBtn')?.addEventListener('click', backToList);

  // ─── Member Modal ─────────────────────────────────────────
  function openMemberModal(editId = null) {
    document.getElementById('memberModal').classList.add('open');
    document.getElementById('memberFormError').textContent = '';
    if (editId) {
      document.getElementById('memberModalTitle').textContent = 'Edit Family Member';
      document.getElementById('memberFormSubmit').textContent = 'Save Changes';
      document.getElementById('memberEditId').value = editId;
      const m = members.find(x => x._id === editId) || currentMemberData;
      if (m) {
        document.getElementById('mfName').value = m.name || '';
        document.getElementById('mfAge').value = m.age || '';
        document.getElementById('mfGender').value = m.gender || '';
        document.getElementById('mfRelation').value = m.relation || '';
        document.getElementById('mfBlood').value = m.healthProfile?.bloodType || '';
        document.getElementById('mfAllergies').value = (m.healthProfile?.allergies || m.allergies || []).join(', ');
        document.getElementById('mfConditions').value = (m.healthProfile?.conditions || m.conditions || []).join(', ');
        document.getElementById('mfMedications').value = (m.healthProfile?.medications || []).join(', ');
        document.getElementById('mfNotes').value = m.healthProfile?.notes || '';
      }
    } else {
      document.getElementById('memberModalTitle').textContent = 'Add Family Member';
      document.getElementById('memberFormSubmit').textContent = 'Add Member';
      document.getElementById('memberEditId').value = '';
      document.getElementById('memberForm').reset();
    }
  }

  function closeMemberModal() {
    document.getElementById('memberModal').classList.remove('open');
  }

  document.getElementById('addMemberBtn')?.addEventListener('click', () => openMemberModal());
  document.getElementById('memberModalClose')?.addEventListener('click', closeMemberModal);
  document.getElementById('memberFormCancel')?.addEventListener('click', closeMemberModal);
  document.getElementById('editMemberBtn2')?.addEventListener('click', () => {
    if (currentMemberId) openMemberModal(currentMemberId);
  });

  document.getElementById('memberForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('memberFormError');
    errEl.textContent = '';
    const editId = document.getElementById('memberEditId').value;
    const payload = {
      name: document.getElementById('mfName').value.trim(),
      age: parseInt(document.getElementById('mfAge').value),
      gender: document.getElementById('mfGender').value,
      relation: document.getElementById('mfRelation').value.trim(),
      healthProfile: {
        bloodType: document.getElementById('mfBlood').value,
        allergies: document.getElementById('mfAllergies').value.split(',').map(s => s.trim()).filter(Boolean),
        conditions: document.getElementById('mfConditions').value.split(',').map(s => s.trim()).filter(Boolean),
        medications: document.getElementById('mfMedications').value.split(',').map(s => s.trim()).filter(Boolean),
        notes: document.getElementById('mfNotes').value.trim(),
      },
    };
    try {
      if (editId) {
        await API.put(`/family/members/${editId}`, payload);
        toast('Member updated', 'success');
        if (currentMemberId === editId) viewMember(editId);
      } else {
        await API.post('/family/members', payload);
        toast('Member added!', 'success');
      }
      closeMemberModal();
      loadDashboard();
    } catch (err) { errEl.textContent = err.message || 'Failed to save'; }
  });

  function openEditMember(id) {
    // Need full member data for edit
    API.get(`/family/members/${id}`).then(data => {
      if (data?.member) {
        currentMemberData = data.member;
        openMemberModal(id);
      }
    }).catch(() => toast('Failed to load member', 'error'));
  }

  // ─── Reminder Modal ───────────────────────────────────────
  function openReminderModal(memberId = null) {
    document.getElementById('reminderModal').classList.add('open');
    document.getElementById('reminderFormError').textContent = '';
    document.getElementById('reminderForm').reset();
    document.getElementById('rfEditId').value = '';
    document.getElementById('rfStartDate').value = new Date().toISOString().split('T')[0];

    // Reset timings
    const timingsWrap = document.getElementById('rfTimings');
    timingsWrap.innerHTML = '<input type="time" class="timing-entry" value="08:00">';

    // Populate member select
    const select = document.getElementById('rfMemberSelect');
    select.innerHTML = '<option value="">Select member</option>' + members.map(m => `<option value="${m._id}" ${m._id === memberId ? 'selected' : ''}>${m.name} (${m.relation})</option>`).join('');

    if (memberId) {
      document.getElementById('rfMemberId').value = memberId;
      document.getElementById('rfMemberSelectWrap').style.display = 'none';
    } else {
      document.getElementById('rfMemberSelectWrap').style.display = 'block';
    }
  }

  function closeReminderModal() {
    document.getElementById('reminderModal').classList.remove('open');
  }

  document.getElementById('addReminderForBtn')?.addEventListener('click', () => {
    if (currentMemberId) openReminderModal(currentMemberId);
  });
  document.getElementById('reminderModalClose')?.addEventListener('click', closeReminderModal);
  document.getElementById('reminderFormCancel')?.addEventListener('click', closeReminderModal);

  // Add timing button
  document.getElementById('addTimingBtn')?.addEventListener('click', () => {
    const wrap = document.getElementById('rfTimings');
    const input = document.createElement('input');
    input.type = 'time'; input.className = 'timing-entry'; input.value = '14:00';
    wrap.appendChild(input);
  });

  document.getElementById('reminderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('reminderFormError');
    errEl.textContent = '';
    const memberId = document.getElementById('rfMemberId').value || document.getElementById('rfMemberSelect').value;
    if (!memberId) { errEl.textContent = 'Please select a family member'; return; }

    const timings = Array.from(document.querySelectorAll('#rfTimings .timing-entry')).map(i => i.value).filter(Boolean);
    if (!timings.length) { errEl.textContent = 'Add at least one timing'; return; }

    const payload = {
      memberId,
      medicineName: document.getElementById('rfMedName').value.trim(),
      dosage: document.getElementById('rfDosage').value.trim(),
      frequency: document.getElementById('rfFrequency').value,
      timings,
      startDate: document.getElementById('rfStartDate').value,
      endDate: document.getElementById('rfEndDate').value || undefined,
      instructions: document.getElementById('rfInstructions').value.trim(),
    };
    try {
      await API.post('/family/reminders', payload);
      toast('Reminder created!', 'success');
      closeReminderModal();
      if (currentMemberId === memberId) viewMember(memberId);
      loadDashboard();
    } catch (err) { errEl.textContent = err.message || 'Failed to save'; }
  });

  // ─── Notifications ────────────────────────────────────────
  async function loadNotifBadge() {
    try {
      const data = await API.get('/family/notifications?unreadOnly=true');
      const badge = document.getElementById('notifBadge');
      if (data?.unreadCount > 0) { badge.textContent = data.unreadCount; badge.style.display = 'flex'; }
      else { badge.style.display = 'none'; }
    } catch {}
  }

  async function loadNotifications() {
    const list = document.getElementById('notifList');
    try {
      const data = await API.get('/family/notifications');
      const notifs = data?.notifications || [];
      if (!notifs.length) { list.innerHTML = '<div class="notif-empty">No notifications yet</div>'; return; }
      list.innerHTML = notifs.map(n => `
        <div class="notif-item ${!n.isRead ? 'unread' : ''} severity-${n.severity}" onclick="familyApp.markNotifRead('${n._id}')">
          <div class="notif-item-title">${n.title}</div>
          <div class="notif-item-msg">${n.message}</div>
          <div class="notif-item-time">${timeAgo(n.createdAt)} · ${n.memberId?.name || ''}</div>
        </div>`).join('');
    } catch { list.innerHTML = '<div class="notif-empty">Unable to load</div>'; }
  }

  async function markNotifRead(id) {
    try { await API.put(`/family/notifications/${id}/read`, {}); loadNotifBadge(); loadNotifications(); } catch {}
  }

  document.getElementById('notifToggleBtn')?.addEventListener('click', () => {
    const panel = document.getElementById('notifPanel');
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) loadNotifications();
  });
  document.getElementById('notifCloseBtn')?.addEventListener('click', () => {
    document.getElementById('notifPanel').classList.remove('open');
  });

  document.getElementById('markAllReadBtn')?.addEventListener('click', async () => {
    try { await API.put('/family/notifications/read-all', {}); toast('All marked as read', 'success'); loadDashboard(); loadNotifBadge(); } catch {}
  });

  // ─── Close modals on overlay click ────────────────────────
  document.getElementById('memberModal')?.addEventListener('click', (e) => { if (e.target.id === 'memberModal') closeMemberModal(); });
  document.getElementById('reminderModal')?.addEventListener('click', (e) => { if (e.target.id === 'reminderModal') closeReminderModal(); });

  // ─── Expose public API ────────────────────────────────────
  window.familyApp = { viewMember, openReminderModal, openEditMember, logDose, deleteReminder, markNotifRead };

  // ─── Init ─────────────────────────────────────────────────
  loadDashboard();

  // Auto-refresh every 60s
  setInterval(() => { loadNotifBadge(); }, 60000);
})();
