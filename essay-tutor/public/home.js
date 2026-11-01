document.addEventListener('DOMContentLoaded', async () => {
    const auth = window.ProberAuth;
    const THEME_STORAGE_KEY = 'proberHomeTheme';
    const toggleBtn = document.getElementById('home-theme-toggle');
    const logoImg = document.querySelector('.home-logo-img');
    const apiKeyBtn = document.getElementById('change-key-btn');
    const body = document.body;

    function applyTheme(theme) {
        const isOrange = theme === 'orange';
        body.classList.toggle('theme-orange', isOrange);
        body.classList.toggle('theme-unc', !isOrange);

        if (logoImg) logoImg.src = isOrange ? '/icon.jpg' : '/iconBlue.jpg';
        if (toggleBtn) {
            toggleBtn.innerHTML = isOrange
                ? '<i class="fa-solid fa-moon"></i>'
                : '<i class="fa-solid fa-sun"></i>';
        }
    }

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'orange';
    applyTheme(savedTheme === 'unc' ? 'unc' : 'orange');

    toggleBtn?.addEventListener('click', () => {
        const nextTheme = body.classList.contains('theme-orange') ? 'unc' : 'orange';
        applyTheme(nextTheme);
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    });

    let serverConfig = null;
    try {
        serverConfig = await auth.getServerConfig();
    } catch {
        // The product overview and offline demo remain usable when config fails.
    }

    const hasBrowserKey = Boolean(auth.getApiKey());
    const hasServerKey = Boolean(serverConfig?.serverApiKeyConfigured);

    if (apiKeyBtn) {
        if (hasBrowserKey) {
            apiKeyBtn.innerHTML = '<i class="fa-solid fa-key"></i> Change API Key';
            apiKeyBtn.setAttribute('aria-label', 'Change the Gemini API key stored in this browser');
        } else if (hasServerKey) {
            apiKeyBtn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Use My API Key';
            apiKeyBtn.setAttribute('aria-label', 'Optionally use your own Gemini API key');
        } else {
            apiKeyBtn.innerHTML = '<i class="fa-solid fa-key"></i> Add API Key';
            apiKeyBtn.setAttribute('aria-label', 'Add a Gemini API key');
        }

        apiKeyBtn.addEventListener('click', () => {
            if (hasBrowserKey) auth.clearApiKey();
            window.location.href = '/login';
        });
    }
});
