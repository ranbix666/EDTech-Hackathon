(function initializeProberAuth(global) {
    const SESSION_KEY = 'proberGeminiApiKey';
    const PERSISTENT_KEY = 'geminiApiKey';

    function readStorage(storage, key) {
        try {
            return storage.getItem(key);
        } catch {
            return null;
        }
    }

    function removeStorage(storage, key) {
        try {
            storage.removeItem(key);
        } catch {
            // Storage can be unavailable in locked-down browsing contexts.
        }
    }

    function getApiKey() {
        return readStorage(global.sessionStorage, SESSION_KEY)
            || readStorage(global.localStorage, PERSISTENT_KEY)
            || '';
    }

    function setApiKey(value, options = {}) {
        const apiKey = String(value || '').trim();
        const remember = Boolean(options.remember);
        clearApiKey();
        if (!apiKey) return;

        const targetStorage = remember ? global.localStorage : global.sessionStorage;
        const targetKey = remember ? PERSISTENT_KEY : SESSION_KEY;
        targetStorage.setItem(targetKey, apiKey);
    }

    function clearApiKey() {
        removeStorage(global.sessionStorage, SESSION_KEY);
        removeStorage(global.localStorage, PERSISTENT_KEY);
    }

    function sanitizeNextPath(candidate, fallback = '/') {
        if (!candidate || typeof candidate !== 'string' || !candidate.startsWith('/') || candidate.startsWith('//')) {
            return fallback;
        }
        try {
            const resolved = new URL(candidate, global.location.origin);
            if (resolved.origin !== global.location.origin) return fallback;
            return `${resolved.pathname}${resolved.search}${resolved.hash}`;
        } catch {
            return fallback;
        }
    }

    function getSafeNext(fallback = '/') {
        const next = new URLSearchParams(global.location.search).get('next');
        return sanitizeNextPath(next, fallback);
    }

    function getCurrentPath() {
        return `${global.location.pathname}${global.location.search}${global.location.hash}`;
    }

    function buildLoginUrl(nextPath = getCurrentPath()) {
        const safeNext = sanitizeNextPath(nextPath, '/');
        return `/login?next=${encodeURIComponent(safeNext)}`;
    }

    function buildApiHeaders(apiKey = getApiKey()) {
        const headers = { 'Content-Type': 'application/json' };
        if (apiKey) headers['X-Gemini-Api-Key'] = apiKey;
        return headers;
    }

    async function getServerConfig() {
        const response = await global.fetch('/api/config', {
            cache: 'no-store',
            headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error('Could not load server configuration.');
        return response.json();
    }

    global.ProberAuth = Object.freeze({
        buildApiHeaders,
        buildLoginUrl,
        clearApiKey,
        getApiKey,
        getCurrentPath,
        getSafeNext,
        getServerConfig,
        sanitizeNextPath,
        setApiKey,
    });
}(window));
