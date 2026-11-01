document.addEventListener('DOMContentLoaded', () => {
    const auth = window.ProberAuth;
    const input = document.getElementById('api-key-input');
    const loginBtn = document.getElementById('login-btn');
    const errorEl = document.getElementById('login-error');
    const rememberInput = document.getElementById('remember-key-input');
    const toggleVisBtn = document.getElementById('toggle-visibility');
    const eyeIcon = document.getElementById('eye-icon');
    const logoImg = document.getElementById('login-logo-img');
    const nextPath = auth.getSafeNext('/');

    const savedTheme = localStorage.getItem('proberHomeTheme') || 'orange';
    if (savedTheme !== 'orange') {
        document.body.classList.add('theme-unc');
        if (logoImg) logoImg.src = '/iconBlue.jpg';
    } else {
        document.body.classList.add('theme-orange');
    }

    const particlesContainer = document.getElementById('particles');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (particlesContainer && !prefersReducedMotion) {
        for (let index = 0; index < 10; index += 1) {
            const particle = document.createElement('div');
            const size = Math.random() * 150 + 150;
            particle.className = 'particle';
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDuration = `${Math.random() * 20 + 20}s`;
            particle.style.animationDelay = `${Math.random() * 15}s`;
            particlesContainer.appendChild(particle);
        }
    }

    toggleVisBtn.addEventListener('click', () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        eyeIcon.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
        toggleVisBtn.setAttribute('aria-label', isPassword ? 'Hide API key' : 'Show API key');
    });

    function showError(message) {
        errorEl.textContent = message;
        input.classList.add('login-input-error');
    }

    function clearError() {
        errorEl.textContent = '';
        input.classList.remove('login-input-error');
    }

    function handleSubmit() {
        const key = input.value.trim();
        if (!key) {
            showError('Please enter your Gemini API key.');
            input.focus();
            return;
        }
        if (key.length < 20) {
            showError('That API key appears to be incomplete.');
            input.focus();
            return;
        }

        try {
            auth.setApiKey(key, { remember: rememberInput.checked });
            window.location.replace(nextPath);
        } catch {
            showError('This browser blocked key storage. Check your privacy settings and try again.');
        }
    }

    input.addEventListener('input', clearError);
    loginBtn.addEventListener('click', handleSubmit);
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') handleSubmit();
    });

    input.focus();
});
