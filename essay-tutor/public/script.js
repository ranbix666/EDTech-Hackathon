document.addEventListener('DOMContentLoaded', () => {
    // Gate: require Gemini API key
    const GEMINI_API_KEY = localStorage.getItem('geminiApiKey');
    if (!GEMINI_API_KEY) {
        window.location.replace('/login');
        return;
    }

    // ==========================================================================
    // 1. Element Selectors
    // ==========================================================================
    const challengeBtn = document.getElementById('challenge-btn');
    const sampleBtn = document.getElementById('sample-btn');
    const clearBtn = document.getElementById('clear-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    const themeToggle = document.getElementById('theme-toggle');
    const changeKeyBtn = document.getElementById('change-key-btn');
    const brandIconImg = document.querySelector('.brand-icon-img');
    
    const feedbackContent = document.getElementById('feedback-content');
    const feedbackEmpty = document.getElementById('feedback-empty');
    const feedbackLoading = document.getElementById('feedback-loading');
    const feedbackResults = document.getElementById('feedback-results');
    const feedbackViewToggle = document.getElementById('feedback-view-toggle');
    const wordCountBadge = document.querySelector('.word-count-badge');
    
    const toastContainer = document.getElementById('toast-container');
    const studySetupBtn = document.getElementById('study-setup-btn');
    const studyStatusBadge = document.getElementById('study-status-badge');
    const studySetupModal = document.getElementById('study-setup-modal');
    const studySetupCloseBtn = document.getElementById('study-setup-close-btn');
    const studySetupForm = document.getElementById('study-setup-form');
    const studyClearBtn = document.getElementById('study-clear-btn');
    const studyEnabledInput = document.getElementById('study-enabled-input');
    const studyParticipantInput = document.getElementById('study-participant-input');
    const studyConditionInput = document.getElementById('study-condition-input');
    const studyPromptInput = document.getElementById('study-prompt-input');

    // ==========================================================================
    // 2. State Management
    // ==========================================================================
    const personaFromUrl = (() => {
        const p = new URLSearchParams(window.location.search).get('persona');
        return (p === 'reviewer2' || p === 'confusedReader') ? p : null;
    })();
    let currentPersona = personaFromUrl || 'reviewer2'; // From home link ?persona= or default
    let isLoading = false;
    let currentHighlightRange = null; // { index, length } for editor context highlighting
    let useTabsView = true; // Switcher default ON: show 4 tabs instead of 4 cards
    let lastFeedbackData = null;
    let lastEssayText = '';
    const THEME_STORAGE_KEY = 'essayMentorTheme';
    const STUDY_CONFIG_STORAGE_KEY = 'essayMentorStudyConfig';
    const STUDY_PARTICIPANT_STORAGE_KEY = 'essayMentorStudyParticipantId';
    const EDITOR_IDLE_AUTOSAVE_MS = 20000;
    const PERIODIC_AUTOSAVE_MS = 90000;
    const urlParams = new URLSearchParams(window.location.search);
    let totalChallenges = 0;
    let unlockedCount = 0;
    let sessionLog = [];
    let studyConfig = null;
    let studyModeEnabled = false;
    let studyParticipantId = null;
    let studySessionId = null;
    let draftVersionNumber = 0;
    let lastSavedDraftText = '';
    let autosaveTimeoutId = null;
    let hasLoggedEssayEditStart = false;
    let hasLoggedAllUnlocked = false;

    // ==========================================================================
    // 3. Quill Editor Setup
    // ==========================================================================
    const quill = new Quill('#editor-container', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link'],
                ['clean']
            ]
        },
        placeholder: 'Start writing your essay here...',
    });

    quill.on('text-change', (_delta, _oldDelta, source) => {
        const text = quill.getText().trim();
        const wordCount = text.length > 0 ? text.split(/\s+/).length : 0;
        wordCountBadge.textContent = `${wordCount} words`;

        if (source === 'user' && studyModeEnabled) {
            if (!hasLoggedEssayEditStart) {
                hasLoggedEssayEditStart = true;
                logStudyEvent('essay_edit_started', {
                    currentPersona,
                    currentWordCount: wordCount,
                });
            }
            scheduleDraftAutosave('autosave_idle');
        }
    });

    function sanitizeStudyValue(value) {
        if (!value) return null;
        return String(value).trim().replace(/[^\w-]/g, '');
    }

    function loadStoredStudyConfig() {
        try {
            const raw = localStorage.getItem(STUDY_CONFIG_STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    function buildInitialStudyConfig() {
        const stored = loadStoredStudyConfig();
        const urlCondition = urlParams.get('condition') || urlParams.get('studyCondition');
        const urlPromptId = urlParams.get('promptId');
        const urlParticipantId = urlParams.get('participantId');
        const explicitStudyQuery = (urlParams.get('study') || urlParams.get('studyMode') || '').toLowerCase();
        const enabledFromUrl = ['1', 'true', 'yes'].includes(explicitStudyQuery);

        return {
            enabled: enabledFromUrl
                || Boolean(urlParticipantId)
                || Boolean(urlCondition)
                || Boolean(urlPromptId)
                || Boolean(stored.enabled),
            participantId: sanitizeStudyValue(urlParticipantId)
                || sanitizeStudyValue(stored.participantId)
                || '',
            studyCondition: sanitizeStudyValue(urlCondition)
                || sanitizeStudyValue(stored.studyCondition)
                || '',
            promptId: sanitizeStudyValue(urlPromptId)
                || sanitizeStudyValue(stored.promptId)
                || '',
        };
    }

    function generateClientId(prefix) {
        return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function getPlainWordCount(text) {
        const trimmed = String(text || '').trim();
        return trimmed ? trimmed.split(/\s+/).length : 0;
    }

    function getCurrentEssayText() {
        return quill.getText().trim();
    }

    function getStudyMetadata(overrides = {}) {
        return {
            participantId: studyParticipantId,
            sessionId: studySessionId,
            studyCondition: studyConfig?.studyCondition || null,
            promptId: studyConfig?.promptId || null,
            essayVersionNumber: draftVersionNumber,
            ...overrides,
        };
    }

    async function postStudyJson(url, payload, options = {}) {
        const { useBeacon = false } = options;
        const body = JSON.stringify(payload);

        if (useBeacon && navigator.sendBeacon) {
            try {
                const blob = new Blob([body], { type: 'application/json' });
                if (navigator.sendBeacon(url, blob)) {
                    return true;
                }
            } catch (error) {
                console.warn(`Study logging beacon failed for ${url}:`, error);
            }
        }

        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
                keepalive: useBeacon,
            });
            return true;
        } catch (error) {
            console.warn(`Study logging failed for ${url}:`, error);
            return false;
        }
    }

    function persistStudyConfig() {
        localStorage.setItem(STUDY_CONFIG_STORAGE_KEY, JSON.stringify(studyConfig));
        if (studyConfig.participantId) {
            localStorage.setItem(STUDY_PARTICIPANT_STORAGE_KEY, studyConfig.participantId);
        } else {
            localStorage.removeItem(STUDY_PARTICIPANT_STORAGE_KEY);
        }
    }

    function hydrateStudySetupForm() {
        if (!studySetupForm) return;
        studyEnabledInput.checked = studyConfig.enabled;
        studyParticipantInput.value = studyConfig.participantId || '';
        studyConditionInput.value = studyConfig.studyCondition || '';
        studyPromptInput.value = studyConfig.promptId || '';
        updateStudySetupFieldState();
    }

    function updateStudySetupFieldState() {
        if (!studySetupForm) return;
        const disabled = !studyEnabledInput.checked;
        [studyParticipantInput, studyConditionInput, studyPromptInput].forEach((input) => {
            input.disabled = disabled;
        });
    }

    function updateStudyStatusBadge() {
        if (!studyStatusBadge) return;
        if (!studyModeEnabled) {
            studyStatusBadge.hidden = true;
            studyStatusBadge.textContent = '';
            return;
        }

        const parts = [
            studyConfig.participantId || 'pilot',
            studyConfig.studyCondition || 'unassigned',
        ];
        studyStatusBadge.innerHTML = `<strong>Study</strong> ${parts.join(' / ')}`;
        studyStatusBadge.hidden = false;
    }

    function openStudySetupModal() {
        if (!studySetupModal) return;
        hydrateStudySetupForm();
        studySetupModal.hidden = false;
        document.body.classList.add('study-setup-open');
        if (studyEnabledInput.checked) {
            studyParticipantInput.focus();
        } else {
            studyEnabledInput.focus();
        }
    }

    function closeStudySetupModal() {
        if (!studySetupModal) return;
        studySetupModal.hidden = true;
        document.body.classList.remove('study-setup-open');
    }

    function scheduleDraftAutosave(source = 'autosave_idle') {
        if (!studyModeEnabled) return;
        window.clearTimeout(autosaveTimeoutId);
        autosaveTimeoutId = window.setTimeout(() => {
            saveDraftSnapshot(source);
        }, EDITOR_IDLE_AUTOSAVE_MS);
    }

    async function endStudySession(reason = 'session_completed', options = {}) {
        const { useBeacon = false } = options;
        if (!studySessionId) return;

        window.clearTimeout(autosaveTimeoutId);
        await saveDraftSnapshot('session_end', { force: true, useBeacon });
        await logStudyEvent('session_completed', {
            unlockedCount,
            totalChallenges,
            reason,
        }, { useBeacon });

        studySessionId = null;
        studyParticipantId = null;
        draftVersionNumber = 0;
        lastSavedDraftText = '';
        hasLoggedEssayEditStart = false;
    }

    async function initializeStudySession(reason = 'session_started') {
        if (!studyModeEnabled) {
            updateStudyStatusBadge();
            return;
        }

        studyParticipantId = sanitizeStudyValue(studyConfig.participantId) || generateClientId('pilot');
        studyConfig.participantId = studyParticipantId;
        persistStudyConfig();

        studySessionId = generateClientId('session');
        draftVersionNumber = 0;
        lastSavedDraftText = '';
        hasLoggedEssayEditStart = false;

        await postStudyJson('/study/session', {
            participantId: studyParticipantId,
            sessionId: studySessionId,
            studyCondition: studyConfig.studyCondition || null,
            promptId: studyConfig.promptId || null,
            consentConfirmed: true,
            startedAt: new Date().toISOString(),
            initialPersona: currentPersona,
            pagePath: window.location.pathname,
            referrer: document.referrer || null,
        });

        await logStudyEvent('session_started', {
            initialPersona: currentPersona,
            feedbackView: useTabsView ? 'tabs' : 'cards',
            reason,
        });

        updateStudyStatusBadge();
    }

    async function saveStudySetup(event) {
        event.preventDefault();

        const nextConfig = {
            enabled: Boolean(studyEnabledInput.checked),
            participantId: sanitizeStudyValue(studyParticipantInput.value) || '',
            studyCondition: sanitizeStudyValue(studyConditionInput.value) || '',
            promptId: sanitizeStudyValue(studyPromptInput.value) || '',
        };

        const wasEnabled = studyModeEnabled;
        const previousParticipant = studyConfig?.participantId || null;
        const previousCondition = studyConfig?.studyCondition || null;
        const previousPromptId = studyConfig?.promptId || null;

        if (wasEnabled && studySessionId) {
            await endStudySession('study_setup_updated');
        }

        studyConfig = nextConfig;
        studyModeEnabled = nextConfig.enabled;
        persistStudyConfig();

        if (studyModeEnabled) {
            await initializeStudySession('study_setup_saved');
            showToast('Study setup saved. A fresh study session is now active.', 'success');
        } else {
            updateStudyStatusBadge();
            showToast('Study logging disabled for this browser.', 'info');
        }

        closeStudySetupModal();

        if (!wasEnabled && studyModeEnabled) {
            await logStudyEvent('study_enabled', {
                participantId: studyConfig.participantId,
                studyCondition: studyConfig.studyCondition,
                promptId: studyConfig.promptId,
            });
        } else if (
            previousParticipant !== studyConfig.participantId
            || previousCondition !== studyConfig.studyCondition
            || previousPromptId !== studyConfig.promptId
        ) {
            await logStudyEvent('study_config_changed', {
                participantId: studyConfig.participantId,
                studyCondition: studyConfig.studyCondition,
                promptId: studyConfig.promptId,
            });
        }
    }

    async function logStudyEvent(eventType, payload = {}, options = {}) {
        if (!studyModeEnabled || !studySessionId) return false;
        return postStudyJson('/study/event', {
            study: getStudyMetadata(),
            eventType,
            payload,
        }, options);
    }

    async function saveDraftSnapshot(source, options = {}) {
        if (!studyModeEnabled || !studySessionId) return draftVersionNumber || null;
        const { force = false, useBeacon = false } = options;
        const essayText = getCurrentEssayText();
        if (!essayText) return draftVersionNumber || null;

        const hasChanged = essayText !== lastSavedDraftText;
        if (!force && !hasChanged) {
            return draftVersionNumber || null;
        }

        if (hasChanged) {
            draftVersionNumber += 1;
            lastSavedDraftText = essayText;
        }

        const versionNumber = draftVersionNumber;
        await postStudyJson('/study/draft', {
            study: getStudyMetadata({ essayVersionNumber: versionNumber }),
            source,
            versionNumber,
            essayText,
            wordCount: getPlainWordCount(essayText),
            characterCount: essayText.length,
            currentPersona,
        }, { useBeacon });

        return versionNumber;
    }

    function countFeedbackQuestions(data) {
        if (!data) return 0;

        if (currentPersona === 'confusedReader') {
            return [
                data.clarification_question || data.claim_question,
                data.coconstruction_question || data.co_construction_question || data.reasoning_question,
            ].filter(Boolean).length;
        }

        return [
            data.claim_question,
            data.reasoning_question,
            data.counterargument_question,
            data.scope_or_implication_question,
        ].filter(Boolean).length;
    }

    studyConfig = buildInitialStudyConfig();
    studyModeEnabled = Boolean(studyConfig.enabled);

    // ==========================================================================
    // 4. Core Functionality & Event Listeners
    // ==========================================================================
    
    challengeBtn.addEventListener('click', handleChallenge);

    if (studySetupBtn) {
        studySetupBtn.addEventListener('click', openStudySetupModal);
    }

    if (studySetupCloseBtn) {
        studySetupCloseBtn.addEventListener('click', closeStudySetupModal);
    }

    if (studySetupModal) {
        studySetupModal.addEventListener('click', (event) => {
            if (event.target?.dataset?.studyClose === 'true') {
                closeStudySetupModal();
            }
        });
    }

    if (studySetupForm) {
        studySetupForm.addEventListener('submit', saveStudySetup);
    }

    if (studyEnabledInput) {
        studyEnabledInput.addEventListener('change', updateStudySetupFieldState);
    }

    if (studyClearBtn) {
        studyClearBtn.addEventListener('click', () => {
            studyEnabledInput.checked = false;
            studyParticipantInput.value = '';
            studyConditionInput.value = '';
            studyPromptInput.value = '';
            updateStudySetupFieldState();
        });
    }

    if (changeKeyBtn) {
        changeKeyBtn.addEventListener('click', () => {
            localStorage.removeItem('geminiApiKey');
            window.location.href = '/login';
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && studySetupModal && !studySetupModal.hidden) {
            closeStudySetupModal();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleChallenge();
        }
    });

    // Theme toggle (default blue theme <-> orange)
    if (themeToggle) {
        const body = document.body;

        const applyTheme = (theme) => {
            const isOrange = theme === 'orange';
            body.classList.toggle('theme-orange', isOrange);

            // Swap toggle icon and brand icon to reflect current theme
            themeToggle.innerHTML = isOrange
                ? '<i class="fa-solid fa-sun"></i>'
                : '<i class="fa-solid fa-moon"></i>';

            if (brandIconImg) {
                brandIconImg.src = isOrange ? '/icon.jpg' : '/iconBlue.jpg';
            }
        };

        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'purple';
        applyTheme(savedTheme);

        themeToggle.addEventListener('click', () => {
            const isCurrentlyOrange = body.classList.contains('theme-orange');
            const nextTheme = isCurrentlyOrange ? 'purple' : 'orange';
            applyTheme(nextTheme);
            localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        });
    }

    if (feedbackViewToggle) {
        feedbackViewToggle.addEventListener('click', () => {
            useTabsView = !useTabsView;
            const isOn = useTabsView;
            feedbackViewToggle.classList.toggle('switcher-on', isOn);
            feedbackViewToggle.setAttribute('aria-pressed', isOn);
            feedbackViewToggle.setAttribute('aria-label', isOn ? 'View as tabs (on)' : 'View as cards (off)');
            logStudyEvent('feedback_view_toggled', { feedbackView: isOn ? 'tabs' : 'cards' });
            if (lastFeedbackData && lastEssayText !== undefined) {
                renderFeedback(lastFeedbackData, lastEssayText);
            }
        });
    }

    sampleBtn.addEventListener('click', () => {
        const sampleEssay = `The pervasive influence of social media on teen mental health is a pressing contemporary issue. While these platforms offer avenues for connection, they also present significant risks that cannot be ignored.\n\nThe constant exposure to curated, idealized lives can foster feelings of inadequacy and low self-esteem among adolescents. Studies have shown a correlation between high social media usage and increased rates of anxiety and depression. The pressure to maintain a perfect online persona creates a stressful environment where teens feel they are under constant scrutiny.\n\nFurthermore, cyberbullying has become a rampant problem, extending schoolyard conflicts into the digital realm, where they can persist 24/7. This form of harassment can have devastating and long-lasting psychological effects on its victims, who often feel isolated and helpless.\n\nIn conclusion, while social media is an integral part of modern adolescent life, it is crucial for parents, educators, and policymakers to address its dark side. Fostering digital literacy and promoting a healthier, more balanced relationship with these powerful platforms is essential for protecting the mental well-being of the next generation.`;
        quill.setText(sampleEssay);
        logStudyEvent('sample_loaded', { sampleId: 'builtin-social-media' });
        showToast('Sample essay loaded.', 'info');
    });

    clearBtn.addEventListener('click', () => {
        quill.setText('');
        feedbackResults.innerHTML = '';
        updateFeedbackState('empty');
        totalChallenges = 0;
        unlockedCount = 0;
        sessionLog = [];
        hasLoggedAllUnlocked = false;
        updateProgressTracker();
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) exportBtn.style.display = 'none';
        logStudyEvent('editor_cleared');
        showToast('Editor cleared.', 'info');
    });

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportSession);
    }

    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                quill.setText(e.target.result);
                logStudyEvent('file_uploaded', {
                    fileName: file.name,
                    fileSizeBytes: file.size,
                });
                showToast('File uploaded successfully.', 'success');
            };
            reader.onerror = () => { showToast('Error reading file.', 'error'); };
            reader.readAsText(file);
        }
    });

    const personaCards = document.querySelectorAll('.persona-card');
    if (personaCards.length) {
        personaCards.forEach(card => {
            card.addEventListener('click', () => {
                document.querySelector('.persona-card.selected')?.classList.remove('selected');
                card.classList.add('selected');
                currentPersona = card.dataset.persona;
                logStudyEvent('persona_selected', { persona: currentPersona });
            });
        });
        const defaultPersonaCard = document.querySelector(`.persona-card[data-persona="${currentPersona}"]`);
        defaultPersonaCard?.classList.add('selected');
    }

    const personaTabs = document.querySelectorAll('.persona-tab');
    if (personaTabs.length) {
        const applyPersonaTabState = (persona) => {
            personaTabs.forEach(tab => {
                const isSelected = tab.dataset.persona === persona;
                tab.setAttribute('aria-selected', String(isSelected));
            });
        };

        applyPersonaTabState(currentPersona);

        personaTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const nextPersona = tab.dataset.persona;
                if (!nextPersona) return;
                currentPersona = nextPersona;
                applyPersonaTabState(currentPersona);
                logStudyEvent('persona_selected', { persona: currentPersona });
            });
        });
    }

    // ==========================================================================
    // 5. API Communication
    // ==========================================================================
    async function handleChallenge() {
        if (isLoading) return;
        const essayText = quill.getText().trim();
        if (essayText.length < 20) {
            showToast('Please write at least 20 words to get a challenge.', 'error');
            return;
        }

        const essayVersionNumber = await saveDraftSnapshot('before_challenge');
        await logStudyEvent('challenge_requested', {
            persona: currentPersona,
            essayVersionNumber,
            wordCount: getPlainWordCount(essayText),
        });

        setLoadingState(true);
        updateFeedbackState('loading');

        try {
            const response = await fetch('/challenge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    essay: essayText,
                    persona: currentPersona,
                    geminiApiKey: GEMINI_API_KEY,
                    study: studyModeEnabled ? getStudyMetadata({ essayVersionNumber }) : undefined,
                }),
            });

            if (!response.ok) {
                let errorMsg = `Server error (${response.status})`;
                try {
                    const errBody = await response.json();
                    if (errBody?.error) errorMsg = errBody.error;
                } catch {}
                if (response.status === 401) {
                    errorMsg = 'API key rejected. Please check your Gemini API key and try again.';
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            await logStudyEvent('challenge_returned', {
                persona: currentPersona,
                essayVersionNumber,
                questionCount: countFeedbackQuestions(data),
            });
            renderFeedback(data, essayText); // Pass essay text for unlock endpoint
            updateFeedbackState('results');
            // counters removed from header

        } catch (error) {
            await logStudyEvent('challenge_failed', {
                persona: currentPersona,
                essayVersionNumber,
                message: error.message || 'unknown_error',
            });
            console.error('Error getting feedback:', error);
            showToast(error.message || 'Failed to get feedback from the server.', 'error');
            updateFeedbackState('empty');
            totalChallenges = 0;
            unlockedCount = 0;
            hasLoggedAllUnlocked = false;
            updateProgressTracker();
        } finally {
            setLoadingState(false);
        }
    }

    // ==========================================================================
    // 6. UI Update Functions
    // ==========================================================================
    
    function setLoadingState(state) {
        isLoading = state;
        challengeBtn.classList.toggle('loading', state);
        challengeBtn.disabled = state;
    }

    function updateFeedbackState(state) {
        feedbackEmpty.style.display = 'none';
        feedbackLoading.style.display = 'none';
        feedbackResults.style.display = 'none';

        if (state === 'loading') {
            feedbackLoading.style.display = 'block';
        } else if (state === 'results') {
            feedbackResults.style.display = 'block';
        } else {
            feedbackEmpty.style.display = 'block';
        }
    }

    function renderFeedback(data, essayText) {
        lastFeedbackData = data;
        lastEssayText = essayText;
        feedbackResults.innerHTML = '';
        sessionLog = [];
        const exportBtnEl = document.getElementById('export-btn');
        if (exportBtnEl) exportBtnEl.style.display = 'none';

        // Map backend fields into UI labels.
        // For Confused Reader we intentionally only surface two questions:
        // Clarification + Co-Construction.
        let entries;
        if (currentPersona === 'confusedReader') {
            const questions = {
                'Clarification Question': {
                    // Prefer the specialized field if present, fall back to generic.
                    question: data.clarification_question || data.claim_question,
                    excerpt: data.clarification_excerpt || data.claim_excerpt || null,
                },
                'Co-Construction Question': {
                    // Support both static (`coconstruction_...`) and dynamic
                    // (`co_construction_...`) naming, with generic as a final fallback.
                    question:
                        data.coconstruction_question ||
                        data.co_construction_question ||
                        data.reasoning_question,
                    excerpt:
                        data.coconstruction_excerpt ||
                        data.co_construction_excerpt ||
                        data.reasoning_excerpt ||
                        null,
                },
            };
            entries = Object.entries(questions).filter(([, p]) => p.question);
        } else {
            const questions = {
                CLAIM: { question: data.claim_question, excerpt: data.claim_excerpt || null },
                REASONING: { question: data.reasoning_question, excerpt: data.reasoning_excerpt || null },
                COUNTERARGUMENT: { question: data.counterargument_question, excerpt: data.counterargument_excerpt || null },
                'SCOPE / IMPLICATION': { question: data.scope_or_implication_question, excerpt: data.scope_or_implication_excerpt || null },
            };
            entries = Object.entries(questions).filter(([, p]) => p.question);
        }

        totalChallenges = entries.length;
        unlockedCount = 0;
        hasLoggedAllUnlocked = false;
        updateProgressTracker();

        if (useTabsView && entries.length > 0) {
            feedbackResults.classList.remove('feedback-cards-view');
            renderFeedbackAsTabs(entries, essayText);
        } else {
            /* Cards view: only the 4 cards, no "How would you address this?" */
            feedbackResults.classList.add('feedback-cards-view');
            entries.forEach(([title, payload]) => {
                const { question, excerpt } = payload;
                feedbackResults.appendChild(createChallengeCard(title, question, { excerpt }));
            });
        }
    }

    function renderFeedbackAsTabs(entries, essayText) {
        const wrap = document.createElement('div');
        wrap.className = 'feedback-tabs-wrap';

        const tabList = document.createElement('div');
        tabList.className = 'feedback-tabs';
        tabList.setAttribute('role', 'tablist');

        const panelsContainer = document.createElement('div');
        panelsContainer.className = 'feedback-tab-panels';

        entries.forEach(([title, payload], index) => {
            const { question, excerpt } = payload;
            const tabId = `feedback-tab-${index}`;
            const panelId = `feedback-panel-${index}`;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'feedback-tab-btn';
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-selected', index === 0);
            btn.setAttribute('aria-controls', panelId);
            btn.setAttribute('id', tabId);
            btn.textContent = title;
            tabList.appendChild(btn);

            const panel = document.createElement('div');
            panel.className = 'feedback-tab-panel';
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('aria-labelledby', tabId);
            panel.setAttribute('id', panelId);
            panel.setAttribute('aria-hidden', index !== 0);
            panel.appendChild(createGatedChallenge(title, question, essayText, excerpt));
            panelsContainer.appendChild(panel);
        });

        if (entries.length > 0) {
            logStudyEvent('feedback_tab_opened', {
                title: entries[0][0],
                index: 0,
                trigger: 'initial',
            });
        }

        tabList.querySelectorAll('.feedback-tab-btn').forEach((btn, i) => {
            btn.addEventListener('click', () => {
                tabList.querySelectorAll('.feedback-tab-btn').forEach((b, j) => {
                    b.setAttribute('aria-selected', j === i);
                });
                panelsContainer.querySelectorAll('.feedback-tab-panel').forEach((p, j) => {
                    p.setAttribute('aria-hidden', j !== i);
                });
                logStudyEvent('feedback_tab_opened', {
                    title: entries[i][0],
                    index: i,
                    trigger: 'click',
                });
            });
        });

        wrap.appendChild(tabList);
        wrap.appendChild(panelsContainer);
        feedbackResults.appendChild(wrap);
    }

    function createChallengeCard(title, content, options = {}) {
        const { excerpt = null } = options;
        const card = document.createElement('div');
        card.className = 'challenge-card';
        card.innerHTML = `
            <div class="challenge-card-header">${title}</div>
            <div class="challenge-card-body">${content}</div>
        `;

        if (excerpt && typeof excerpt === 'string' && excerpt.trim().length > 0) {
            card.dataset.excerpt = excerpt;
            let excerptEngagementStartedAt = null;

            const startExcerptEngagement = (trigger) => {
                highlightExcerptInEditor(excerpt);
                if (excerptEngagementStartedAt) return;
                excerptEngagementStartedAt = Date.now();
                logStudyEvent('excerpt_engagement_started', {
                    title,
                    trigger,
                    excerptLength: excerpt.length,
                });
            };

            const endExcerptEngagement = (trigger) => {
                clearEditorHighlight();
                if (!excerptEngagementStartedAt) return;
                const durationMs = Date.now() - excerptEngagementStartedAt;
                excerptEngagementStartedAt = null;
                logStudyEvent('excerpt_engagement_ended', {
                    title,
                    trigger,
                    durationMs,
                    excerptLength: excerpt.length,
                });
            };

            const attachHighlightListeners = (el) => {
                el.addEventListener('mouseenter', () => startExcerptEngagement('mouse'));
                el.addEventListener('mouseleave', () => endExcerptEngagement('mouse'));
                el.addEventListener('focus', () => startExcerptEngagement('keyboard'));
                el.addEventListener('blur', () => endExcerptEngagement('keyboard'));
            };

            attachHighlightListeners(card);
        }

        return card;
    }

    function createGatedChallenge(title, question, essayText, excerpt = null) {
        const container = document.createElement('div');

        const card = createChallengeCard(title, question, { excerpt });
        card.classList.add('gated');
        container.appendChild(card);

        const reflectionSection = document.createElement('div');
        reflectionSection.className = 'reflection-section';
        reflectionSection.innerHTML = `
            <label class="reflection-label"><i class="fa-solid fa-pen-to-square"></i> How would you address this?</label>
            <textarea class="reflection-input" rows="4" placeholder="e.g., 'I could strengthen my thesis by...'" ></textarea>
            <button type="button" class="get-suggestions-btn button primary">
                <span class="btn-icon"><i class="fa-solid fa-lock-open"></i></span>
                <span class="btn-text">Unlock Suggestion</span>
                <span class="btn-spinner"><i class="fa-solid fa-spinner"></i></span>
            </button>
        `;
        container.appendChild(reflectionSection);

        const reflectionInput = reflectionSection.querySelector('.reflection-input');
        const getSuggestionsBtn = reflectionSection.querySelector('.get-suggestions-btn');
        let hasLoggedReflectionStart = false;
        let reflectionStartedAt = null;
        let firstReflectionInputAt = null;
        let lastReflectionInputAt = null;

        reflectionInput.addEventListener('focus', () => {
            if (hasLoggedReflectionStart) return;
            hasLoggedReflectionStart = true;
            reflectionStartedAt = Date.now();
            logStudyEvent('reflection_started', { title, question });
        });

        reflectionInput.addEventListener('input', () => {
            const now = Date.now();
            if (!reflectionStartedAt) {
                reflectionStartedAt = now;
            }
            if (!firstReflectionInputAt) {
                firstReflectionInputAt = now;
                logStudyEvent('reflection_typing_started', { title, question });
            }
            lastReflectionInputAt = now;
        });

        getSuggestionsBtn.addEventListener('click', async () => {
            const userDefense = reflectionInput.value;
            if (!userDefense.trim()) {
                showToast('Please write a reflection before unlocking.', 'error');
                return;
            }

            const trimmedDefense = userDefense.trim();
            const currentEssay = getCurrentEssayText() || essayText;
            const essayVersionNumber = await saveDraftSnapshot('before_unlock');
            const now = Date.now();
            const reflectionDurationMs = reflectionStartedAt ? now - reflectionStartedAt : null;
            const idleBeforeSubmitMs = lastReflectionInputAt ? now - lastReflectionInputAt : null;
            await logStudyEvent('reflection_submitted', {
                title,
                question,
                essayVersionNumber,
                durationMs: reflectionDurationMs,
                idleBeforeSubmitMs,
                defenseCharCount: trimmedDefense.length,
                defenseWordCount: getPlainWordCount(trimmedDefense),
            });
            await logStudyEvent('unlock_requested', {
                title,
                question,
                essayVersionNumber,
                reflectionDurationMs,
                defenseWordCount: getPlainWordCount(trimmedDefense),
            });

            getSuggestionsBtn.classList.add('loading');
            getSuggestionsBtn.disabled = true;

            try {
                const unlockResponse = await fetch('/unlock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        essay: currentEssay,
                        question: question,
                        userDefense: userDefense,
                        label: title,
                        excerpt: excerpt || null,
                        geminiApiKey: GEMINI_API_KEY,
                        study: studyModeEnabled ? getStudyMetadata({ essayVersionNumber }) : undefined,
                    }),
                });

                if (!unlockResponse.ok) {
                    let unlockErrMsg = 'Failed to get suggestion.';
                    try {
                        const errBody = await unlockResponse.json();
                        if (errBody?.error) unlockErrMsg = errBody.error;
                    } catch {}
                    throw new Error(unlockErrMsg);
                }

                const suggestionData = await unlockResponse.json();
                await logStudyEvent('unlock_returned', {
                    title,
                    question,
                    essayVersionNumber,
                    defenseWordCount: getPlainWordCount(trimmedDefense),
                    suggestionLength: (suggestionData.suggestion || '').length,
                });
                await saveDraftSnapshot('post_unlock');
                renderReward(suggestionData.suggestion, suggestionData.tip, container);

                sessionLog.push({
                    title: title,
                    question: question,
                    excerpt: excerpt || null,
                    defense: userDefense.trim(),
                    suggestion: suggestionData.suggestion,
                    tip: suggestionData.tip || '',
                });
                unlockedCount++;
                updateProgressTracker();
                const exportBtnEl = document.getElementById('export-btn');
                if (exportBtnEl) exportBtnEl.style.display = 'inline-flex';

                getSuggestionsBtn.remove();
                reflectionInput.disabled = true;

            } catch (error) {
                await logStudyEvent('unlock_failed', {
                    title,
                    question,
                    essayVersionNumber,
                    message: error.message || 'unknown_error',
                });
                showToast(error.message, 'error');
                getSuggestionsBtn.classList.remove('loading');
                getSuggestionsBtn.disabled = false;
            }
        });

        return container;
    }

    function renderReward(suggestion, tip, container) {
        const rewardBlock = document.createElement('div');
        rewardBlock.className = 'reward-block';
        rewardBlock.innerHTML = `
            <h4>Defense Successful!</h4>
            <div class="suggestion-card">
                <h5>Here's a specific suggestion:</h5>
                <p>${suggestion}</p>
            </div>
            <blockquote class="tip-blockquote">
                <strong>Pro Tip:</strong> ${tip}
            </blockquote>
        `;
        container.appendChild(rewardBlock);
        showToast('Suggestion unlocked!', 'success');
    }

    function updateSessionStats() {}

    function updateProgressTracker() {
        const tracker = document.getElementById('progress-tracker');
        const progressText = document.getElementById('progress-text');
        if (!tracker || !progressText) return;

        if (totalChallenges === 0) {
            tracker.style.display = 'none';
            return;
        }

        tracker.style.display = 'flex';
        progressText.textContent = `${unlockedCount} / ${totalChallenges} Unlocked`;

        if (unlockedCount >= totalChallenges) {
            tracker.classList.add('progress-tracker--complete');
            if (!hasLoggedAllUnlocked) {
                hasLoggedAllUnlocked = true;
                saveDraftSnapshot('all_challenges_unlocked', { force: true });
                logStudyEvent('all_challenges_unlocked', {
                    unlockedCount,
                    totalChallenges,
                });
                showToast('All challenges unlocked! Consider exporting your session.', 'success');
            }
        } else {
            tracker.classList.remove('progress-tracker--complete');
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    async function exportSession() {
        if (!sessionLog.length) return;

        await saveDraftSnapshot('final_export', { force: true });
        await logStudyEvent('session_exported', {
            unlockedCount,
            totalChallenges,
            exportedEntries: sessionLog.length,
        });

        lastEssayText = getCurrentEssayText() || lastEssayText;

        const essaySnippet = lastEssayText.length > 500
            ? lastEssayText.slice(0, 500) + '…'
            : lastEssayText;

        const personaLabel = currentPersona === 'confusedReader' ? 'Confused Reader' : 'Reviewer 2';
        const dateStr = new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        const entriesHtml = sessionLog.map((entry, i) => `
        <div class="entry">
            <div class="entry-num">Challenge ${i + 1} — ${escapeHtml(entry.title)}</div>
            ${entry.excerpt ? `<blockquote class="excerpt">"${escapeHtml(entry.excerpt)}"</blockquote>` : ''}
            <div class="section-label">Question asked:</div>
            <p class="question-text">${escapeHtml(entry.question)}</p>
            <div class="section-label">Student's reflection:</div>
            <p class="defense-text">${escapeHtml(entry.defense)}</p>
            <div class="section-label">AI revision suggestion:</div>
            <p class="suggestion-text">${escapeHtml(entry.suggestion)}</p>
            ${entry.tip ? `<p class="tip-text"><strong>Pro tip:</strong> ${escapeHtml(entry.tip)}</p>` : ''}
        </div>`).join('');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prober.ai — Session Export (${dateStr})</title>
    <style>
        body { font-family: Georgia, 'Times New Roman', serif; max-width: 780px; margin: 2rem auto; padding: 2rem; color: #1f2937; line-height: 1.65; background: #fff; }
        header { margin-bottom: 2rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 1.25rem; }
        header h1 { font-size: 1.5rem; margin: 0 0 0.25rem; color: #0f52ba; }
        header .meta { font-size: 0.875rem; color: #6b7280; }
        .essay-preview { background: #f3f4f6; border-left: 4px solid #0f52ba; padding: 1rem 1.25rem; border-radius: 4px; font-size: 0.9rem; margin-bottom: 2.5rem; font-family: sans-serif; white-space: pre-wrap; }
        .essay-preview h2 { font-size: 0.9rem; font-family: sans-serif; color: #4b5563; margin: 0 0 0.5rem; }
        .entry { margin-bottom: 2.5rem; padding-bottom: 2rem; border-bottom: 1px solid #e5e7eb; }
        .entry:last-child { border-bottom: none; }
        .entry-num { font-family: sans-serif; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #0f52ba; margin-bottom: 0.75rem; }
        blockquote.excerpt { margin: 0 0 1rem; padding: 0.75rem 1rem; background: #fffbeb; border-left: 4px solid #f59e0b; font-style: italic; color: #78350f; border-radius: 4px; font-size: 0.9rem; }
        .section-label { font-family: sans-serif; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; margin-bottom: 0.35rem; margin-top: 0.85rem; }
        .question-text { font-style: italic; color: #374151; margin: 0 0 0.5rem; }
        .defense-text { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 0.75rem 1rem; border-radius: 4px; margin: 0 0 0.5rem; font-family: sans-serif; white-space: pre-wrap; }
        .suggestion-text { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 0.75rem 1rem; border-radius: 4px; margin: 0 0 0.5rem; font-family: sans-serif; }
        .tip-text { font-size: 0.875rem; font-style: italic; color: #6b7280; margin: 0.25rem 0 0; font-family: sans-serif; }
        footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; font-size: 0.8rem; font-family: sans-serif; color: #9ca3af; text-align: center; }
        @media print { body { padding: 0; margin: 0; } .entry { break-inside: avoid; } }
    </style>
</head>
<body>
    <header>
        <h1>Prober.ai — Reflection Session</h1>
        <div class="meta">Date: ${dateStr} &nbsp;|&nbsp; Persona: ${personaLabel} &nbsp;|&nbsp; Challenges completed: ${sessionLog.length}</div>
    </header>
    <div class="essay-preview">
        <h2>Essay excerpt (first 500 characters)</h2>${escapeHtml(essaySnippet)}
    </div>
    ${entriesHtml}
    <footer>Generated by <strong>Prober.ai</strong> — an AI-supported writing tool that refuses to rewrite your essay.</footer>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (win) {
            win.focus();
            showToast('Session exported! Use Ctrl+P to print or save as PDF.', 'success');
        } else {
            const a = document.createElement('a');
            a.href = url;
            a.download = `prober-session-${Date.now()}.html`;
            a.click();
        }
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    }

    // ==========================================================================
    // 7. Editor Context Highlighting for Devil's Advocate Cards
    // ==========================================================================

    function clearEditorHighlight() {
        if (!currentHighlightRange) return;

        const { index, length } = currentHighlightRange;
        try {
            quill.formatText(index, length, { background: false });
        } catch {
            // No-op if range is out of bounds or editor unavailable
        }
        currentHighlightRange = null;
    }

    function highlightExcerptInEditor(excerpt) {
        if (!excerpt || typeof excerpt !== 'string') return;

        const cleanedExcerpt = excerpt.trim();
        if (!cleanedExcerpt) return;

        const editorText = quill.getText();
        const index = editorText.indexOf(cleanedExcerpt);

        if (index === -1) {
            clearEditorHighlight();
            return;
        }

        clearEditorHighlight();

        const length = cleanedExcerpt.length;
        try {
            quill.formatText(index, length, { background: 'rgba(250, 204, 21, 0.4)' }); // soft yellow
            currentHighlightRange = { index, length };
        } catch {
            currentHighlightRange = null;
        }
    }

    // ==========================================================================
    // 8. UI Enhancements
    // ==========================================================================

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = {
            info: 'fa-circle-info',
            success: 'fa-circle-check',
            error: 'fa-fire-flame-curved',
        };
        toast.innerHTML = `
            <div class="toast-icon"><i class="fa-solid ${icons[type]}"></i></div>
            <div class="toast-body">
                <h5>${type.charAt(0).toUpperCase() + type.slice(1)}</h5>
                <p>${message}</p>
            </div>
        `;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('exiting');
            toast.addEventListener('animationend', () => toast.remove());
        }, 3500);
    }

    const slides = document.querySelectorAll('.tip-slide');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    let currentSlide = 0;

    if (slides.length && dots.length) {
        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
                if (dots[i]) {
                    dots[i].classList.toggle('active', i === index);
                }
            });
        }

        setInterval(() => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }, 5000);

        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                currentSlide = parseInt(e.target.dataset.slide);
                showSlide(currentSlide);
            });
        });
    }

    document.querySelectorAll('.button').forEach(button => {
        button.addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const oldRipple = this.querySelector('.ripple');
            if (oldRipple) oldRipple.remove();
            const circle = document.createElement('span');
            const diameter = Math.max(this.clientWidth, this.clientHeight);
            const radius = diameter / 2;
            circle.style.width = circle.style.height = `${diameter}px`;
            circle.style.left = `${x - radius}px`;
            circle.style.top = `${y - radius}px`;
            circle.classList.add('ripple');
            this.appendChild(circle);
            setTimeout(() => {
                if (circle.parentElement) circle.remove();
            }, 600);
        });
    });

    // --- Initializations ---
    updateFeedbackState('empty');
    hydrateStudySetupForm();
    updateStudyStatusBadge();
    initializeStudySession();

    window.setInterval(() => {
        if (!studyModeEnabled || document.hidden) return;
        saveDraftSnapshot('autosave_interval');
    }, PERIODIC_AUTOSAVE_MS);

    document.addEventListener('visibilitychange', () => {
        if (!studyModeEnabled || !document.hidden) return;
        saveDraftSnapshot('visibility_hidden', { useBeacon: true });
        logStudyEvent('page_hidden', {
            unlockedCount,
            totalChallenges,
        }, { useBeacon: true });
    });

    window.addEventListener('beforeunload', () => {
        if (!studyModeEnabled) return;
        endStudySession('browser_unload', { useBeacon: true });
    });

    // --- Particle Generator ---
    const particlesContainer = document.getElementById('particles');
    const numParticles = 15;

    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 150 + 150; // 150px to 300px
        const left = Math.random() * 100; // 0% to 100%
        const duration = Math.random() * 20 + 20; // 20s to 40s
        const delay = Math.random() * 15; // 0s to 15s

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}%`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;

        particlesContainer.appendChild(particle);
    }
});