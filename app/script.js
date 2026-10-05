/**
 * CloudDeploy — CI/CD Dashboard Client Script
 * Topic: Automated CI/CD Pipeline for Cloud-Native Web Application Deployment
 * 
 * Manages live UI updates, API status fetching, health endpoint validation,
 * interactive pipeline execution simulation, User Authentication system, and Viva reference modal.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Uptime Timer
    initUptimeTimer();

    // 2. Initial Data Fetch from Backend APIs
    fetchApiStatus();
    fetchHealthStatus();
    checkCurrentUser();

    // 3. Attach Event Listeners
    setupEventListeners();
    setupAuthListeners();
});

let uptimeSeconds = 0;
let isPipelineRunning = false;
let currentUser = null;

/**
 * Live Uptime Counter
 */
function initUptimeTimer() {
    const uptimeEl = document.getElementById('app-uptime-text');
    setInterval(() => {
        uptimeSeconds++;
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = uptimeSeconds % 60;
        
        let formatted = '';
        if (hours > 0) formatted += `${hours}h `;
        if (minutes > 0 || hours > 0) formatted += `${minutes}m `;
        formatted += `${seconds}s`;
        
        if (uptimeEl) {
            uptimeEl.textContent = formatted;
        }
    }, 1000);
}

/**
 * Fetch status metrics from backend `/api/status` endpoint
 */
async function fetchApiStatus() {
    try {
        const response = await fetch('/api/status');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        // Update UI Cards
        if (data.application) {
            updateText('card-app-status', data.application.status || 'ONLINE');
            updateText('version-text', data.application.version || 'v1.0.0');
            updateText('card-version-val', data.application.version || 'v1.0.0');
            if (data.application.uptime_seconds) {
                uptimeSeconds = data.application.uptime_seconds;
            }
        }
        
        if (data.pipeline) {
            updateText('card-pipeline-status', data.pipeline.status || 'SUCCESS');
            updateText('card-build-status', data.pipeline.build_status || 'PASSED');
            updateText('card-deploy-status', data.pipeline.deployment_status || 'DEPLOYED');
        }

        if (data.docker) {
            updateText('card-docker-status', data.docker.containerized ? 'CONTAINERIZED' : 'STANDALONE');
        }
    } catch (err) {
        console.warn('API status fetch fallback:', err.message);
    }
}

/**
 * Fetch health data from `/health` endpoint and update Panel 1
 */
async function fetchHealthStatus() {
    const startTime = performance.now();
    try {
        const response = await fetch('/health');
        const endTime = performance.now();
        const latencyMs = Math.round(endTime - startTime);

        const httpCodeEl = document.getElementById('health-http-code');
        const latencyEl = document.getElementById('health-latency');
        const jsonOutputEl = document.getElementById('health-json-output');

        if (response.ok) {
            const data = await response.json();
            if (httpCodeEl) httpCodeEl.textContent = `${response.status} OK`;
            if (latencyEl) latencyEl.textContent = `${latencyMs}ms`;
            if (jsonOutputEl) jsonOutputEl.textContent = JSON.stringify(data, null, 2);
        } else {
            if (httpCodeEl) httpCodeEl.textContent = `${response.status} Error`;
            if (latencyEl) latencyEl.textContent = `${latencyMs}ms`;
        }
    } catch (err) {
        const httpCodeEl = document.getElementById('health-http-code');
        const jsonOutputEl = document.getElementById('health-json-output');
        if (httpCodeEl) httpCodeEl.textContent = 'Connection Error';
        if (jsonOutputEl) jsonOutputEl.textContent = JSON.stringify({ error: err.message }, null, 2);
    }
}

/**
 * Check logged-in user state via `/api/auth/me`
 */
async function checkCurrentUser() {
    try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
            const data = await res.json();
            if (data.authenticated && data.user) {
                currentUser = data.user;
                updateAuthPill(data.user);
            }
        }
    } catch (err) {
        console.warn('Auth check fallback:', err.message);
    }
}

function updateAuthPill(user) {
    const pillText = document.getElementById('auth-pill-username');
    if (pillText) {
        pillText.textContent = user ? user.name : 'Sign In / Profile';
    }
}

/**
 * Attach UI Click Listeners
 */
function setupEventListeners() {
    // Pipeline Simulation Trigger
    const triggerBtn = document.getElementById('btn-trigger-pipeline-demo');
    if (triggerBtn) {
        triggerBtn.addEventListener('click', runPipelineSimulation);
    }

    // Ping Health Button
    const pingBtn = document.getElementById('btn-ping-health');
    if (pingBtn) {
        pingBtn.addEventListener('click', () => {
            fetchHealthStatus();
            appendTerminalLog('[CLIENT ACTION] Manual ping sent to GET /health -> 200 OK');
        });
    }

    // Viva Modal Control
    const openModalBtn = document.getElementById('btn-open-viva-modal');
    const closeModalBtn = document.getElementById('btn-close-viva-modal');
    const closeModalBtn2 = document.getElementById('btn-close-viva-modal-2');
    const vivaModal = document.getElementById('viva-modal');

    if (openModalBtn && vivaModal) {
        openModalBtn.addEventListener('click', () => {
            vivaModal.style.display = 'flex';
        });
    }

    const closeModal = () => {
        if (vivaModal) vivaModal.style.display = 'none';
    };

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (closeModalBtn2) closeModalBtn2.addEventListener('click', closeModal);

    if (vivaModal) {
        vivaModal.addEventListener('click', (e) => {
            if (e.target === vivaModal) closeModal();
        });
    }
}

/**
 * User Authentication System Modal & Tab Management
 */
function setupAuthListeners() {
    const openAuthBtn = document.getElementById('btn-open-auth-modal');
    const closeAuthBtn = document.getElementById('btn-close-auth-modal');
    const authModal = document.getElementById('auth-modal');

    if (openAuthBtn && authModal) {
        openAuthBtn.addEventListener('click', () => {
            authModal.style.display = 'flex';
            if (currentUser) {
                switchAuthView('profile');
            } else {
                switchAuthView('login');
            }
        });
    }

    if (closeAuthBtn && authModal) {
        closeAuthBtn.addEventListener('click', () => {
            authModal.style.display = 'none';
        });
    }

    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) authModal.style.display = 'none';
        });
    }

    // Tabs
    const tabs = ['login', 'signup', 'verify', 'forgot'];
    tabs.forEach(tab => {
        const btn = document.getElementById(`tab-${tab}`);
        if (btn) {
            btn.addEventListener('click', () => switchAuthView(tab));
        }
    });

    // Form Submissions
    const loginForm = document.getElementById('form-auth-login');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (data.success) {
                    currentUser = data.user;
                    updateAuthPill(currentUser);
                    showAuthStatus('✓ Login successful! Session token active.', '#34d399');
                    setTimeout(() => switchAuthView('profile'), 1000);
                } else {
                    showAuthStatus(`✖ ${data.message}`, '#f87171');
                }
            } catch (err) {
                showAuthStatus('✖ Network error during login.', '#f87171');
            }
        });
    }

    const signupForm = document.getElementById('form-auth-signup');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            try {
                const res = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await res.json();
                if (data.success) {
                    showAuthStatus('✓ Registration complete! Verification code sent.', '#34d399');
                    setTimeout(() => switchAuthView('verify'), 1200);
                } else {
                    showAuthStatus(`✖ ${data.message}`, '#f87171');
                }
            } catch (err) {
                showAuthStatus('✖ Registration failed.', '#f87171');
            }
        });
    }

    const verifyForm = document.getElementById('form-auth-verify');
    if (verifyForm) {
        verifyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = document.getElementById('verify-code').value;
            try {
                const res = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                });
                const data = await res.json();
                if (data.success) {
                    showAuthStatus('✓ Email verified successfully!', '#34d399');
                    if (data.user) {
                        currentUser = data.user;
                        updateAuthPill(currentUser);
                        setTimeout(() => switchAuthView('profile'), 1200);
                    }
                } else {
                    showAuthStatus(`✖ ${data.message}`, '#f87171');
                }
            } catch (err) {
                showAuthStatus('✖ Verification failed.', '#f87171');
            }
        });
    }

    const forgotForm = document.getElementById('form-auth-forgot');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value;
            try {
                const res = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();
                showAuthStatus(`✓ ${data.message}`, '#38bdf8');
            } catch (err) {
                showAuthStatus('✖ Request failed.', '#f87171');
            }
        });
    }

    const logoutBtn = document.getElementById('btn-auth-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
                currentUser = null;
                updateAuthPill(null);
                showAuthStatus('Logged out safely.', '#94a3b8');
                setTimeout(() => switchAuthView('login'), 800);
            } catch (err) {
                currentUser = null;
                updateAuthPill(null);
                switchAuthView('login');
            }
        });
    }
}

function switchAuthView(viewName) {
    const views = {
        login: document.getElementById('form-auth-login'),
        signup: document.getElementById('form-auth-signup'),
        verify: document.getElementById('form-auth-verify'),
        forgot: document.getElementById('form-auth-forgot'),
        profile: document.getElementById('auth-user-profile')
    };

    Object.keys(views).forEach(k => {
        if (views[k]) views[k].style.display = 'none';
        const tabBtn = document.getElementById(`tab-${k}`);
        if (tabBtn) {
            tabBtn.style.color = '#94a3b8';
            tabBtn.style.borderBottom = 'none';
        }
    });

    if (views[viewName]) {
        views[viewName].style.display = 'flex';
    }

    const activeTab = document.getElementById(`tab-${viewName}`);
    if (activeTab) {
        activeTab.style.color = '#38bdf8';
        activeTab.style.borderBottom = '2px solid #38bdf8';
    }

    if (viewName === 'profile' && currentUser) {
        const nameEl = document.getElementById('profile-name');
        const emailEl = document.getElementById('profile-email');
        const avatarEl = document.getElementById('profile-avatar-initial');
        if (nameEl) nameEl.textContent = currentUser.name || 'User Profile';
        if (emailEl) emailEl.textContent = currentUser.email || '';
        if (avatarEl && currentUser.name) avatarEl.textContent = currentUser.name.charAt(0).toUpperCase();
    }

    showAuthStatus('', '');
}

function showAuthStatus(msg, color) {
    const el = document.getElementById('auth-status-msg');
    if (el) {
        if (!msg) {
            el.style.display = 'none';
        } else {
            el.style.display = 'block';
            el.style.color = color;
            el.textContent = msg;
        }
    }
}

/**
 * Interactive Step-by-Step CI/CD Pipeline Run Simulation
 */
async function runPipelineSimulation() {
    if (isPipelineRunning) return;
    isPipelineRunning = true;

    const triggerBtn = document.getElementById('btn-trigger-pipeline-demo');
    const terminalOutput = document.getElementById('terminal-output');
    const terminalStatus = document.getElementById('terminal-status-text');
    const overallBadge = document.getElementById('pipeline-overall-badge');

    if (triggerBtn) {
        triggerBtn.disabled = true;
        triggerBtn.style.opacity = '0.6';
    }

    if (terminalStatus) terminalStatus.textContent = 'RUNNING';
    if (overallBadge) {
        overallBadge.textContent = 'PIPELINE IN PROGRESS';
        overallBadge.style.background = 'rgba(234, 179, 8, 0.2)';
        overallBadge.style.color = '#fde047';
    }

    // Clear Terminal Output
    if (terminalOutput) {
        terminalOutput.textContent = '';
    }

    appendTerminalLog(`[${new Date().toLocaleTimeString()}] 🚀 PIPELINE TRIGGERED via GitHub Webhook event.`);
    appendTerminalLog(`[COMMIT] Commit SHA: 7f3a19b - "chore: update web application version to v1.0.0"`);

    const stages = [
        { id: 'node-developer', name: 'STAGE 1: Developer', log: 'Git commit pushed to branch refs/heads/main.' },
        { id: 'node-github', name: 'STAGE 2: GitHub', log: 'GitHub webhook received. Triggering AWS CodePipeline.' },
        { id: 'node-codepipeline', name: 'STAGE 3: AWS CodePipeline', log: 'CodePipeline Stage "Source" succeeded. Starting Stage "Build".' },
        { id: 'node-codebuild', name: 'STAGE 4: AWS CodeBuild', log: 'Executing buildspec.yml: npm test -> 100% Passed. Building Docker image.' },
        { id: 'node-docker', name: 'STAGE 5: Docker Engine', log: 'Docker container built and tagged: clouddeploy-app:latest' },
        { id: 'node-production', name: 'STAGE 6: AWS Production', log: 'Deployed artifact to AWS Elastic Beanstalk container environment. Health: Green.' }
    ];

    // Reset Stage Nodes Visuals
    stages.forEach(s => {
        const el = document.getElementById(s.id);
        if (el) {
            el.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            el.style.transform = 'none';
        }
    });

    // Step through each stage
    for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const nodeEl = document.getElementById(stage.id);

        if (nodeEl) {
            nodeEl.style.borderColor = '#38bdf8';
            nodeEl.style.transform = 'translateY(-4px)';
        }

        appendTerminalLog(`[${new Date().toLocaleTimeString()}] ▶ Executing ${stage.name}...`);
        appendTerminalLog(`      ↳ ${stage.log}`);

        await sleep(1200);

        if (nodeEl) {
            nodeEl.style.borderColor = '#10b981';
            nodeEl.style.transform = 'none';
        }
    }

    appendTerminalLog(`[${new Date().toLocaleTimeString()}] 🎉 PIPELINE COMPLETED SUCCESSFULLY with status 0.`);
    appendTerminalLog(`[RESULT] Web application is live and passing all health checks at HTTP 200 OK.`);

    if (terminalStatus) terminalStatus.textContent = 'SUCCESS / IDLE';
    if (overallBadge) {
        overallBadge.textContent = 'PIPELINE SUCCESSFUL';
        overallBadge.style.background = 'rgba(16, 185, 129, 0.2)';
        overallBadge.style.color = '#6ee7b7';
    }

    if (triggerBtn) {
        triggerBtn.disabled = false;
        triggerBtn.style.opacity = '1';
    }

    isPipelineRunning = false;
}

/**
 * Append line to simulation terminal body
 */
function appendTerminalLog(message) {
    const terminalOutput = document.getElementById('terminal-output');
    if (terminalOutput) {
        terminalOutput.textContent += message + '\n';
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
}

/**
 * Helper: Update element textContent safely
 */
function updateText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

/**
 * Helper: Sleep Promise
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
