// theme.js — Shared Theme Toggle Logic
(() => {
  const applyTheme = (theme) => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('hb_theme', theme);
  };

  const savedTheme = localStorage.getItem('hb_theme') || 'dark';
  applyTheme(savedTheme);

  window.toggleTheme = () => {
    const isLight = document.body.classList.contains('light-theme');
    applyTheme(isLight ? 'dark' : 'light');
  };
})();
