// ============================================================
// api.js — Centralized API Helper with JWT
// ============================================================
const API = (() => {
  const BASE_URL = '/api';

  function getToken() { return localStorage.getItem('hb_token'); }
  function setToken(token) { localStorage.setItem('hb_token', token); }
  function clearToken() { localStorage.removeItem('hb_token'); localStorage.removeItem('hb_user'); }
  function getUser() { try { return JSON.parse(localStorage.getItem('hb_user')); } catch { return null; } }
  function setUser(user) { localStorage.setItem('hb_user', JSON.stringify(user)); }
  function isLoggedIn() { return !!getToken(); }
  function isAdmin() { const u = getUser(); return u && u.role === 'admin'; }
  function isDoctor() { const u = getUser(); return u && u.role === 'doctor'; }

  function requireAuth() {
    if (!isLoggedIn()) { window.location.href = '/'; return false; }
    return true;
  }

  function requireAdmin() {
    if (!isLoggedIn() || !isAdmin()) { window.location.href = '/'; return false; }
    return true;
  }

  function requireDoctor() {
    if (!isLoggedIn() || (!isDoctor() && !isAdmin())) { window.location.href = '/'; return false; }
    return true;
  }

  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const config = { headers: { 'Content-Type': 'application/json' }, ...options };
    const token = getToken();
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    if (config.body && typeof config.body === 'object') config.body = JSON.stringify(config.body);

    try {
      const response = await fetch(url, config);
      let data;
      try { data = await response.json(); } catch { data = {}; }
      if (response.status === 401) { clearToken(); window.location.href = '/'; return null; }
      if (!response.ok) throw new Error(data.message || 'Something went wrong');
      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error.message);
      throw error;
    }
  }

  const get = (endpoint) => request(endpoint, { method: 'GET' });
  const post = (endpoint, body) => request(endpoint, { method: 'POST', body });
  const put = (endpoint, body) => request(endpoint, { method: 'PUT', body });
  const del = (endpoint) => request(endpoint, { method: 'DELETE' });

  async function signup(name, email, password, age) {
    const data = await post('/auth/signup', { name, email, password, age });
    if (data) { setToken(data.token); setUser(data.user); }
    return data;
  }

  async function login(email, password) {
    const data = await post('/auth/login', { email, password });
    if (data) { setToken(data.token); setUser(data.user); }
    return data;
  }

  async function logout() {
    try { await post('/auth/logout', {}); } catch {}
    clearToken();
    window.location.href = '/';
  }

  async function verifyToken() {
    try {
      const data = await get('/auth/me');
      if (data && data.user) { setUser(data.user); return data.user; }
    } catch { clearToken(); }
    return null;
  }

  async function analyzeTriage(query) { return await post('/triage/analyze', { query }); }
  async function getHealthHistory() { return await get('/triage/history'); }
  async function getHealthAnalytics() { return await get('/triage/analytics'); }
  async function searchFacilities(lat, lng, type, radius = 5000) { return await get(`/facilities?lat=${lat}&lng=${lng}&type=${type || 'hospital'}&radius=${radius}`); }

  return {
    getToken, setToken, clearToken, getUser, setUser,
    isLoggedIn, isAdmin, isDoctor,
    requireAuth, requireAdmin, requireDoctor,
    get, post, put, del, delete: del,
    signup, login, logout, verifyToken,
    analyzeTriage, getHealthHistory, getHealthAnalytics, searchFacilities,
  };
})();
