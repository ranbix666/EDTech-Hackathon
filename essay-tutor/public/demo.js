// Demo mode: fully self-contained. No API key required anywhere.
// All questions AND unlock suggestions are pre-baked — no server calls needed.

const DEMO_ESSAY_TEXT = `Driverless cars are exaclty what you would expect them to be. Cars that will drive without a person actually behind the wheel controlling the actions of the vehicle. The idea of driverless cars going in to developement shows the amount of technological increase that the wolrd has made. The leader of this idea of driverless cars are the automobiles they call Google cars. The arduous task of creating safe driverless cars has not been fully mastered yet. The developement of these cars should be stopped immediately because there are too many hazardous and dangerous events that could occur.

One thing that the article mentions is that the driver will be alerted when they will need to take over the driving responsibilites of the car. This is such a dangerous thing because we all know that whenever humans get their attention drawn in on something interesting it is hard to draw their focus somewhere else. The article explains that companies are trying to implement vibrations when the car is in trouble. Their are some people out there who do not feel vibrations and therefore would not be able to take control of the car when needed. The article also states that companies are trying to put in-car entertainment into the car while it is being driven. This is just another thing that will distract the person who is supposed to be ready at all times to take over driving when asked to do so.

Another thing that can go wrong with these cars is any type of techological malfucntion. Every person with any kind of technological device has experienced some sort of error. Now imagine if your car has an error technologically and it takes the life of one your loved ones. The article talks about sensors around the car that read the surroundings of the car and that is what helps he car to drive without a true driver behind the wheel. Those sensors could have a malfunctions and be sensing something that is that even there and make a left turn into a 100 foot deep lake. The vibrations that cause the driver to be notified to drive could malfunction and now the driver has no way of knowing that the car is in trouble and now you, the driver, and the rest of your passengers are being buried in your local cemetery.

One last thing that the article mentions is negative about the developement of driverless cars is who to blame for the wreck if there were possibly some sort of technological malfunciton or even some sort of human error when taking over the driving aspect. Should the manufacturer of the car be blamed or should it be the driver? No one knows because there is so many different factors that attribute to who to assign the blame to. Some of what will have to be made is a judgement call. When it comes to insurance and having to pay for any damages you do not want someone to have to make some sort of judgement call. What if that judgement call that was made was the wrong call? Now there are going to be even more lawsuits today in our courts than there already are. This problem alone will just lead to many more issues today in the world that should not have to be dealt with.

With all these things that could possibly go wrong with these driverless cars there is no way that the developement of them should continue any further. In today's society if something bad COULD happen or something COULD go wrong, it WILL happen, and it WILL go wrong. There are just way too many safety hazards that come along with these driverless cars. Becuase of all of these problems that arise with the cars it is just a gargantuan risk to implement these cars into our lifestyles.`;

const DEMO_FEEDBACK = {
    claim_question: "Your central claim is that driverless car development should stop immediately — but what specific criteria would need to be met for you to change that position, and have you considered whether any of those criteria might already be achievable?",
    claim_excerpt: "The developement of these cars should be stopped immediately because there are too many hazardous and dangerous events that could occur.",
    reasoning_question: "You write \"if something bad COULD happen, it WILL happen\" — what logical framework supports treating every possible failure as inevitable, and does that same standard apply consistently to other technologies we already accept in daily life?",
    reasoning_excerpt: "In today's society if something bad COULD happen or something COULD go wrong, it WILL happen, and it WILL go wrong.",
    counterargument_question: "What evidence or argument would you need to encounter before you could acknowledge that driverless systems might actually outperform distracted human drivers on the very dimensions you cite as dangerous?",
    counterargument_excerpt: "With all these things that could possibly go wrong with these driverless cars there is no way that the developement of them should continue any further.",
    scope_or_implication_question: "If the liability ambiguity you describe in the final body paragraph is your strongest objection, does that imply a legal reform could make development acceptable — and what does that reveal about the actual scope of your core claim?",
    scope_or_implication_excerpt: "No one knows because there is so many different factors that attribute to who to assign the blame to."
};

const DEMO_FEEDBACK_CONFUSED_READER = {
    clarification_question: "You mention that 'The leader of this idea of driverless cars are the automobiles they call Google cars' — but you never explain what makes them the benchmark. Could you clarify what 'leader' means here: most technically advanced, most commercially deployed, or most widely studied in the research you read?",
    clarification_excerpt: "The leader of this idea of driverless cars are the automobiles they call Google cars.",
    co_construction_question: "You argue that in-car entertainment will fatally distract the person who needs to take over driving — but what other design solutions could you imagine that might separate the passenger experience from emergency override? What possibilities haven't been tried or explored yet?",
    co_construction_excerpt: "The article also states that companies are trying to put in-car entertainment into the car while it is being driven."
};

// Pre-baked unlock suggestions — one per question label. No API call needed.
const DEMO_UNLOCK_SUGGESTIONS = {
    'CLAIM': {
        suggestion: "Consider making your claim conditional rather than absolute. Instead of \"The development of these cars should be stopped immediately,\" try: \"Until comprehensive regulatory frameworks and proven fail-safe systems are in place, the commercial deployment of driverless vehicles should be halted.\" This anchors your argument to specific, falsifiable conditions — making it far harder to dismiss.",
        tip: "Claims that include conditions for change ('until X is true') are logically stronger than unconditional bans because they show you've thought about what evidence would change your mind."
    },
    'REASONING': {
        suggestion: "Replace the logical leap in your conclusion with an analogy-based argument. Instead of \"if something COULD go wrong, it WILL go wrong,\" write: \"Aviation history shows that new transportation technologies almost always experience catastrophic failures before adequate safety protocols are developed — and unlike early planes, driverless cars share roads with pedestrians who cannot opt out of the risk.\" This grounds your reasoning in precedent rather than probability.",
        tip: "When you catch yourself using possibility as proof of inevitability, ask: what historical evidence actually supports this claim? That evidence is what your reader needs to see."
    },
    'COUNTERARGUMENT': {
        suggestion: "Strengthen your rebuttal by first acknowledging the best version of the opposing argument. Before your current conclusion, add: \"Proponents correctly note that human error causes the majority of traffic accidents — and that driverless systems, in controlled tests, eliminate driver distraction and fatigue entirely. But controlled tests are not public roads, and no trial has yet simulated simultaneous sensor failure in adverse weather across a mixed fleet.\" This shows intellectual honesty while sharpening your refutation.",
        tip: "Always argue against the strongest version of the opposing view, not the weakest. This is called 'steelmanning' — and it makes your own argument more persuasive, not less."
    },
    'SCOPE / IMPLICATION': {
        suggestion: "Your liability argument reveals a more precise — and stronger — version of your claim. Consider replacing the conclusion with: \"The core problem is not whether driverless cars can drive safely, but whether our legal and insurance systems can assign responsibility when they fail. Until lawmakers resolve that ambiguity, deploying these vehicles creates an accountability vacuum that harms accident victims regardless of fault.\" This focuses your argument on the governance gap, your most concrete piece of evidence.",
        tip: "If your most specific evidence points to a systemic problem like legal ambiguity, make that the centerpiece of your argument rather than listing it as one equal point among three."
    },
    'Clarification Question': {
        suggestion: "Add a brief definition the first time you introduce 'Google cars.' For example: \"Google's Waymo program, currently the most extensively road-tested autonomous vehicle effort, has logged tens of millions of test miles — yet still requires safety drivers in most jurisdictions.\" This tells a non-expert reader exactly why Google is the benchmark without derailing your main argument.",
        tip: "Each proper noun or technical term you introduce without definition is a place where a non-expert reader can fall off. One defining clause per term is usually enough."
    },
    'Co-Construction Question': {
        suggestion: "Explore this design tension directly in your essay: \"One proposed solution is a strict modal separation — a 'passenger mode' that locks the wheel, and an 'emergency mode' triggered only by collision detection. If such a system worked reliably, it would address my distraction objection — but it creates a new one: can a system sophisticated enough to detect emergencies also be trusted to drive the car? The two requirements may be fundamentally at odds.\" Adding this shows you've wrestled with the best counterargument.",
        tip: "When you can describe a hypothetical solution and then explain why it doesn't fully resolve your concern, you've demonstrated the deepest kind of critical thinking."
    },
};

const DEMO_SAMPLE_DEFENSES = {
    'CLAIM': 'I should avoid an absolute ban. I could define two conditions for resuming deployment: independently verified fail-safe performance and a clear liability framework.',
    'REASONING': 'Possibility is not inevitability. I should compare driverless-car risk with the baseline risk of human driving and support that comparison with failure-rate evidence.',
    'COUNTERARGUMENT': 'The strongest opposing case is that automation removes distraction and fatigue. I should acknowledge that benefit, then explain what real-world evidence would still be needed.',
    'SCOPE / IMPLICATION': 'My most defensible concern may be accountability rather than the technology itself. I can narrow the thesis to deployment before legal responsibility is settled.',
    'Clarification Question': 'I should define Google cars as Waymo autonomous vehicles and explain which concrete measure makes that program a useful benchmark.',
    'Co-Construction Question': 'I can consider an emergency mode that disables entertainment and then evaluate whether that design actually resolves the handoff problem.',
};

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // 1. Element Selectors
    // ==========================================================================
    const demoChallengeBtn = document.getElementById('demo-challenge-btn');
    const clearBtn = document.getElementById('clear-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const brandIconImg = document.querySelector('.brand-icon-img');
    const guideStatus = document.getElementById('demo-guide-status');
    const judgeNotesBtn = document.getElementById('judge-notes-btn');
    const judgeNotesDialog = document.getElementById('judge-notes-dialog');
    const judgeNotesClose = document.getElementById('judge-notes-close');

    const feedbackEmpty = document.getElementById('feedback-empty');
    const feedbackLoading = document.getElementById('feedback-loading');
    const feedbackResults = document.getElementById('feedback-results');
    const feedbackViewToggle = document.getElementById('feedback-view-toggle');
    const wordCountBadge = document.querySelector('.word-count-badge');

    const toastContainer = document.getElementById('toast-container');

    // ==========================================================================
    // 2. State
    // ==========================================================================
    let currentPersona = 'reviewer2';
    let currentHighlightRange = null;
    let useTabsView = true;
    let lastEssayText = DEMO_ESSAY_TEXT;
    let totalChallenges = 0;
    let unlockedCount = 0;
    let sessionLog = [];
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
        placeholder: 'Sample essay pre-loaded below...',
    });

    // Pre-fill with demo essay
    quill.setText(DEMO_ESSAY_TEXT);

    quill.on('text-change', () => {
        const text = quill.getText().trim();
        const wordCount = text.length > 0 ? text.split(/\s+/).length : 0;
        wordCountBadge.textContent = `${wordCount} words`;
        lastEssayText = quill.getText().trim();
    });

    // ==========================================================================
    // 4. Event Listeners
    // ==========================================================================

    demoChallengeBtn.addEventListener('click', loadDemoFeedback);

    function updateGuideStatus(step, message) {
        if (!guideStatus) return;
        guideStatus.textContent = `Step ${step} of 3: ${message}`;
        guideStatus.dataset.step = String(step);
    }

    judgeNotesBtn?.addEventListener('click', () => {
        if (typeof judgeNotesDialog?.showModal === 'function') {
            judgeNotesDialog.showModal();
        } else {
            judgeNotesDialog?.setAttribute('open', '');
        }
    });
    judgeNotesClose?.addEventListener('click', () => judgeNotesDialog?.close?.());
    judgeNotesDialog?.addEventListener('click', (event) => {
        if (event.target === judgeNotesDialog) judgeNotesDialog.close();
    });

    const personaTabs = document.querySelectorAll('.persona-tab');
    personaTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const next = tab.dataset.persona;
            if (!next || next === currentPersona) return;
            currentPersona = next;
            personaTabs.forEach(t => t.setAttribute('aria-selected', t.dataset.persona === currentPersona));
            loadDemoFeedback();
        });
    });

    clearBtn.addEventListener('click', () => {
        quill.setText('');
        feedbackResults.innerHTML = '';
        updateFeedbackState('empty');
        totalChallenges = 0;
        unlockedCount = 0;
        sessionLog = [];
        updateProgressTracker();
        hideExportButton();
        updateGuideStatus(1, 'reload the sample feedback.');
        showToast('Editor cleared. Click "Load Demo Feedback" to reload the demo.', 'info');
    });

    if (feedbackViewToggle) {
        feedbackViewToggle.addEventListener('click', () => {
            useTabsView = !useTabsView;
            const isOn = useTabsView;
            feedbackViewToggle.classList.toggle('switcher-on', isOn);
            feedbackViewToggle.setAttribute('aria-pressed', isOn);
            feedbackViewToggle.setAttribute('aria-label', isOn ? 'View as tabs (on)' : 'View as cards (off)');
            applyFeedbackViewMode();
        });
    }

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportSession);
    }

    // Theme toggle
    if (themeToggle) {
        const body = document.body;
        const applyTheme = (theme) => {
            const isOrange = theme === 'orange';
            body.classList.toggle('theme-orange', isOrange);
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

    // ==========================================================================
    // 5. Demo Feedback Loading
    // ==========================================================================

    function getDemoFeedbackForPersona() {
        return currentPersona === 'confusedReader' ? DEMO_FEEDBACK_CONFUSED_READER : DEMO_FEEDBACK;
    }

    function loadDemoFeedback() {
        updateFeedbackState('loading');
        demoChallengeBtn.classList.add('loading');
        demoChallengeBtn.disabled = true;

        setTimeout(() => {
            renderFeedback(getDemoFeedbackForPersona(), lastEssayText);
            updateFeedbackState('results');
            demoChallengeBtn.classList.remove('loading');
            demoChallengeBtn.disabled = false;
            updateGuideStatus(1, 'review a question, then add your defense.');
            showToast('Demo feedback loaded! Try writing a reflection.', 'info');
        }, 800);
    }

    // Auto-load demo feedback on page load after a brief delay
    setTimeout(() => {
        loadDemoFeedback();
    }, 600);

    // ==========================================================================
    // 6. Feedback Rendering
    // ==========================================================================

    function applyFeedbackViewMode() {
        const wrap = feedbackResults.querySelector('.feedback-tabs-wrap');
        if (!wrap) return;

        const tabList = wrap.querySelector('.feedback-tabs');
        const tabButtons = Array.from(wrap.querySelectorAll('.feedback-tab-btn'));
        const panels = Array.from(wrap.querySelectorAll('.feedback-tab-panel'));
        const storedIndex = Number.parseInt(wrap.dataset.activeTab || '0', 10);
        const activeIndex = Number.isInteger(storedIndex) && storedIndex >= 0 && storedIndex < panels.length
            ? storedIndex
            : 0;

        feedbackResults.classList.toggle('feedback-cards-view', !useTabsView);
        if (tabList) tabList.hidden = !useTabsView;
        tabButtons.forEach((button, index) => {
            const selected = index === activeIndex;
            button.setAttribute('aria-selected', String(selected));
            button.tabIndex = selected ? 0 : -1;
        });
        panels.forEach((panel, index) => {
            panel.setAttribute('aria-hidden', String(useTabsView && index !== activeIndex));
        });
    }

    function renderFeedback(data, essayText) {
        lastEssayText = essayText;
        feedbackResults.innerHTML = '';
        sessionLog = [];
        hideExportButton();

        let entries;
        if (currentPersona === 'confusedReader') {
            const questions = {
                'Clarification Question': {
                    question: data.clarification_question,
                    excerpt: data.clarification_excerpt || null,
                },
                'Co-Construction Question': {
                    question: data.co_construction_question || data.coconstruction_question,
                    excerpt: data.co_construction_excerpt || data.coconstruction_excerpt || null,
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
        updateProgressTracker();

        if (entries.length > 0) {
            renderFeedbackAsTabs(entries, essayText);
            applyFeedbackViewMode();
        }
    }

    function renderFeedbackAsTabs(entries, essayText) {
        const wrap = document.createElement('div');
        wrap.className = 'feedback-tabs-wrap';
        wrap.dataset.activeTab = '0';

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
                wrap.dataset.activeTab = String(i);
                applyFeedbackViewMode();
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
            card.addEventListener('mouseenter', () => highlightExcerptInEditor(excerpt));
            card.addEventListener('mouseleave', clearEditorHighlight);
            card.addEventListener('focus', () => highlightExcerptInEditor(excerpt));
            card.addEventListener('blur', clearEditorHighlight);
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
            <textarea class="reflection-input" rows="4" placeholder="e.g., 'I could strengthen my thesis by...'"></textarea>
            <div class="demo-reflection-shortcut">
                <button type="button" class="demo-fill-reflection button ghost">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> Use sample defense
                </button>
                <span>Presentation shortcut: still satisfies the reflection gate.</span>
            </div>
            <button type="button" class="get-suggestions-btn button primary">
                <span class="btn-icon"><i class="fa-solid fa-lock-open"></i></span>
                <span class="btn-text">Unlock Suggestion</span>
                <span class="btn-spinner"><i class="fa-solid fa-spinner"></i></span>
            </button>
        `;
        container.appendChild(reflectionSection);

        const reflectionInput = reflectionSection.querySelector('.reflection-input');
        const sampleDefenseBtn = reflectionSection.querySelector('.demo-fill-reflection');
        const sampleDefenseShortcut = reflectionSection.querySelector('.demo-reflection-shortcut');
        const getSuggestionsBtn = reflectionSection.querySelector('.get-suggestions-btn');

        reflectionInput.addEventListener('input', () => {
            if (reflectionInput.value.trim()) {
                updateGuideStatus(2, 'unlock the targeted suggestion.');
            }
        });

        sampleDefenseBtn.addEventListener('click', () => {
            reflectionInput.value = DEMO_SAMPLE_DEFENSES[title]
                || 'I would narrow the claim, explain the missing reasoning step, and identify what evidence could change my position.';
            reflectionInput.focus();
            reflectionInput.dispatchEvent(new Event('input', { bubbles: true }));
            showToast('Sample defense added. Now unlock the suggestion.', 'info');
        });

        getSuggestionsBtn.addEventListener('click', () => {
            const userDefense = reflectionInput.value;
            if (!userDefense.trim()) {
                showToast('Please write a reflection before unlocking.', 'error');
                return;
            }

            getSuggestionsBtn.classList.add('loading');
            getSuggestionsBtn.disabled = true;

            // Use pre-baked suggestion — no API call needed in demo mode
            const prebaked = DEMO_UNLOCK_SUGGESTIONS[title];
            const suggestionData = prebaked || {
                suggestion: "Great reflection! In a live session, Prober would generate a specific revision suggestion tailored to your defense here.",
                tip: "The more specific your defense, the more targeted the revision tip."
            };

            // Short artificial delay to simulate processing
            setTimeout(() => {
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
                showExportButton();
                updateGuideStatus(3, 'targeted help unlocked. The learning loop is complete.');

                getSuggestionsBtn.remove();
                sampleDefenseShortcut.remove();
                reflectionInput.disabled = true;
            }, 600);
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

    // ==========================================================================
    // 7. Progress Tracker
    // ==========================================================================

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
            showToast('All challenges unlocked! Consider exporting your session.', 'success');
        } else {
            tracker.classList.remove('progress-tracker--complete');
        }
    }

    // ==========================================================================
    // 8. Export Session
    // ==========================================================================

    function showExportButton() {
        const btn = document.getElementById('export-btn');
        if (btn) btn.style.display = 'inline-flex';
    }

    function hideExportButton() {
        const btn = document.getElementById('export-btn');
        if (btn) btn.style.display = 'none';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function exportSession() {
        if (!sessionLog.length) return;

        const essaySnippet = lastEssayText.length > 500
            ? lastEssayText.slice(0, 500) + '…'
            : lastEssayText;

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
        <div class="meta">Date: ${dateStr} &nbsp;|&nbsp; Persona: ${currentPersona === 'confusedReader' ? 'Confused Reader' : 'Reviewer 2'} (Demo) &nbsp;|&nbsp; Challenges completed: ${sessionLog.length}</div>
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
            // Fallback: direct download
            const a = document.createElement('a');
            a.href = url;
            a.download = `prober-session-${Date.now()}.html`;
            a.click();
        }
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    }

    // ==========================================================================
    // 9. Editor Highlighting
    // ==========================================================================

    function clearEditorHighlight() {
        if (!currentHighlightRange) return;
        const { index, length } = currentHighlightRange;
        try { quill.formatText(index, length, { background: false }); } catch {}
        currentHighlightRange = null;
    }

    function highlightExcerptInEditor(excerpt) {
        if (!excerpt || typeof excerpt !== 'string') return;
        const cleanedExcerpt = excerpt.trim();
        if (!cleanedExcerpt) return;
        const editorText = quill.getText();
        const index = editorText.indexOf(cleanedExcerpt);
        if (index === -1) { clearEditorHighlight(); return; }
        clearEditorHighlight();
        const length = cleanedExcerpt.length;
        try {
            quill.formatText(index, length, { background: 'rgba(250, 204, 21, 0.4)' });
            currentHighlightRange = { index, length };
        } catch { currentHighlightRange = null; }
    }

    // ==========================================================================
    // 10. UI Helpers
    // ==========================================================================

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

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { info: 'fa-circle-info', success: 'fa-circle-check', error: 'fa-fire-flame-curved' };
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

    // Particle background
    const particlesContainer = document.getElementById('particles');
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 150 + 150;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${Math.random() * 20 + 20}s`;
        particle.style.animationDelay = `${Math.random() * 15}s`;
        particlesContainer.appendChild(particle);
    }

    // Ripple effect on buttons
    document.querySelectorAll('.button').forEach(button => {
        button.addEventListener('click', function(e) {
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
            setTimeout(() => { if (circle.parentElement) circle.remove(); }, 600);
        });
    });

    // Init
    updateFeedbackState('empty');
});
