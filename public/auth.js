// ============================================================
// auth.js — Login / Signup Controller
// ============================================================
(() => {
  // Redirect if already logged in
  if (API.isLoggedIn()) {
    window.location.href = '/chat';
    return;
  }

  // DOM
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  const tabIndicator = document.getElementById('tabIndicator');
  const loginError = document.getElementById('loginError');
  const signupError = document.getElementById('signupError');
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const strengthBar = document.getElementById('strengthBar');

  // Generate particles
  const particlesContainer = document.getElementById('particles');
  if (particlesContainer) {
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      const size = Math.random() * 4 + 2;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
      particle.style.animationDelay = (Math.random() * 10) + 's';
      particlesContainer.appendChild(particle);
    }
  }

  // Tab switching
  function switchTab(tab) {
    loginForm.classList.toggle('active', tab === 'login');
    signupForm.classList.toggle('active', tab === 'signup');
    loginTab.classList.toggle('active', tab === 'login');
    signupTab.classList.toggle('active', tab === 'signup');
    tabIndicator.classList.toggle('right', tab === 'signup');
    loginError.textContent = '';
    signupError.textContent = '';
  }

  loginTab.addEventListener('click', () => switchTab('login'));
  signupTab.addEventListener('click', () => switchTab('signup'));

  document.querySelectorAll('.switch-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.target));
  });

  // Password visibility toggle
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.textContent = input.type === 'password' ? '👁️' : '🙈';
    });
  });

  // Password strength
  const signupPassword = document.getElementById('signupPassword');
  if (signupPassword) {
    signupPassword.addEventListener('input', () => {
      const val = signupPassword.value;
      let strength = 0;
      if (val.length >= 6) strength++;
      if (val.length >= 10) strength++;
      if (/[A-Z]/.test(val)) strength++;
      if (/[0-9]/.test(val)) strength++;
      if (/[^A-Za-z0-9]/.test(val)) strength++;

      const percent = (strength / 5) * 100;
      const colors = ['#ff4757', '#ff6b6b', '#f59e0b', '#10b981', '#00d4aa'];
      strengthBar.style.width = percent + '%';
      strengthBar.style.background = colors[strength - 1] || '#ff4757';
    });
  }

  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    loginBtn.classList.add('loading');

    try {
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      await API.login(email, password);
      window.location.href = '/chat';
    } catch (error) {
      loginError.textContent = '⚠️ ' + error.message;
    } finally {
      loginBtn.classList.remove('loading');
    }
  });

  // Signup
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    signupError.textContent = '';
    signupBtn.classList.add('loading');

    try {
      const name = document.getElementById('signupName').value;
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPassword').value;
      const age = document.getElementById('signupAge').value || undefined;
      await API.signup(name, email, password, age ? parseInt(age) : undefined);
      window.location.href = '/chat';
    } catch (error) {
      signupError.textContent = '⚠️ ' + error.message;
    } finally {
      signupBtn.classList.remove('loading');
    }
  });
})();
