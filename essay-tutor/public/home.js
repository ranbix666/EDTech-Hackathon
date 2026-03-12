document.addEventListener('DOMContentLoaded', () => {
  // Gate: require API key before showing the home page
  if (!localStorage.getItem('geminiApiKey')) {
    window.location.replace('/login');
    return;
  }

  const THEME_STORAGE_KEY = 'proberHomeTheme';

  const toggleBtn = document.getElementById('home-theme-toggle');
  const logoImg = document.querySelector('.home-logo-img');
  if (!toggleBtn) return;

  const body = document.body;

  const applyTheme = (theme) => {
    const isOrange = theme === 'orange';
    body.classList.toggle('theme-orange', isOrange);
    body.classList.toggle('theme-unc', !isOrange);

    if (logoImg) {
      logoImg.src = isOrange ? '/icon.jpg' : '/iconBlue.jpg';
    }

    toggleBtn.innerHTML = isOrange
      ? '<i class="fa-solid fa-moon"></i>'
      : '<i class="fa-solid fa-sun"></i>';
  };

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'orange';
  applyTheme(savedTheme === 'unc' ? 'unc' : 'orange');

  toggleBtn.addEventListener('click', () => {
    const isCurrentlyOrange = body.classList.contains('theme-orange');
    const nextTheme = isCurrentlyOrange ? 'unc' : 'orange';
    applyTheme(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  });

  const changeKeyBtn = document.getElementById('change-key-btn');
  if (changeKeyBtn) {
    changeKeyBtn.addEventListener('click', () => {
      localStorage.removeItem('geminiApiKey');
      window.location.href = '/login';
    });
  }
});

