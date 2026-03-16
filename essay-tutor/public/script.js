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

    quill.on('text-change', () => {
        const text = quill.getText().trim();
        const wordCount = text.length > 0 ? text.split(/\s+/).length : 0;
        wordCountBadge.textContent = `${wordCount} words`;
    });

    // ==========================================================================
    // 4. Core Functionality & Event Listeners
    // ==========================================================================
    
    challengeBtn.addEventListener('click', handleChallenge);

    if (changeKeyBtn) {
        changeKeyBtn.addEventListener('click', () => {
            localStorage.removeItem('geminiApiKey');
            window.location.href = '/login';
        });
    }

    document.addEventListener('keydown', (e) => {
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
            if (lastFeedbackData && lastEssayText !== undefined) {
                renderFeedback(lastFeedbackData, lastEssayText);
            }
        });
    }

    sampleBtn.addEventListener('click', () => {
        const sampleEssay = `The pervasive influence of social media on teen mental health is a pressing contemporary issue. While these platforms offer avenues for connection, they also present significant risks that cannot be ignored.\n\nThe constant exposure to curated, idealized lives can foster feelings of inadequacy and low self-esteem among adolescents. Studies have shown a correlation between high social media usage and increased rates of anxiety and depression. The pressure to maintain a perfect online persona creates a stressful environment where teens feel they are under constant scrutiny.\n\nFurthermore, cyberbullying has become a rampant problem, extending schoolyard conflicts into the digital realm, where they can persist 24/7. This form of harassment can have devastating and long-lasting psychological effects on its victims, who often feel isolated and helpless.\n\nIn conclusion, while social media is an integral part of modern adolescent life, it is crucial for parents, educators, and policymakers to address its dark side. Fostering digital literacy and promoting a healthier, more balanced relationship with these powerful platforms is essential for protecting the mental well-being of the next generation.`;
        quill.setText(sampleEssay);
        showToast('Sample essay loaded.', 'info');
    });

    clearBtn.addEventListener('click', () => {
        quill.setText('');
        feedbackResults.innerHTML = '';
        updateFeedbackState('empty');
        showToast('Editor cleared.', 'info');
    });

    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                quill.setText(e.target.result);
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

        setLoadingState(true);
        updateFeedbackState('loading');

        try {
            const response = await fetch('/challenge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ essay: essayText, persona: currentPersona, geminiApiKey: GEMINI_API_KEY }),
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
            renderFeedback(data, essayText); // Pass essay text for unlock endpoint
            updateFeedbackState('results');
            // counters removed from header

        } catch (error) {
            console.error('Error getting feedback:', error);
            showToast(error.message || 'Failed to get feedback from the server.', 'error');
            updateFeedbackState('empty');
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

        tabList.querySelectorAll('.feedback-tab-btn').forEach((btn, i) => {
            btn.addEventListener('click', () => {
                tabList.querySelectorAll('.feedback-tab-btn').forEach((b, j) => {
                    b.setAttribute('aria-selected', j === i);
                });
                panelsContainer.querySelectorAll('.feedback-tab-panel').forEach((p, j) => {
                    p.setAttribute('aria-hidden', j !== i);
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

            const attachHighlightListeners = (el) => {
                el.addEventListener('mouseenter', () => highlightExcerptInEditor(excerpt));
                el.addEventListener('mouseleave', clearEditorHighlight);
                el.addEventListener('focus', () => highlightExcerptInEditor(excerpt));
                el.addEventListener('blur', clearEditorHighlight);
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

        const getSuggestionsBtn = reflectionSection.querySelector('.get-suggestions-btn');
        getSuggestionsBtn.addEventListener('click', async () => {
            const userDefense = reflectionSection.querySelector('.reflection-input').value;
            if (!userDefense.trim()) {
                showToast('Please write a reflection before unlocking.', 'error');
                return;
            }

            getSuggestionsBtn.classList.add('loading');
            getSuggestionsBtn.disabled = true;

            try {
                const unlockResponse = await fetch('/unlock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        essay: essayText,
                        question: question,
                        userDefense: userDefense,
                        label: title,
                        excerpt: excerpt || null,
                        geminiApiKey: GEMINI_API_KEY,
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
                renderReward(suggestionData.suggestion, suggestionData.tip, container);
                // counters removed from header
                getSuggestionsBtn.remove();
                reflectionSection.querySelector('.reflection-input').disabled = true;

            } catch (error) {
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