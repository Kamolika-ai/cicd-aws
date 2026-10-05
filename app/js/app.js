/**
 * CloudDeploy — Master Application UI Controller (Phase 1)
 * Topic: Automated CI/CD Pipeline for Cloud-Native Web Application Deployment
 * 
 * Orchestrates router, mock data, auth session, page renders, sidebar navigation,
 * mobile drawer, log stream filtering, and code file preview modal.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Navigation & Subscriptions
    initApp();
});

function initApp() {
    const router = window.CloudDeployRouter;
    const auth = window.CloudDeployAuth;

    // Mobile Drawer Setup
    setupMobileDrawer();

    // Subscribe router changes
    router.subscribe((route, param, path) => {
        handleRouteRender(route, param, path);
    });

    // Initial Routing trigger
    router.init();
}

/**
 * Mobile Drawer Toggle
 */
function setupMobileDrawer() {
    const drawerBtn = document.getElementById('btn-mobile-drawer');
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('drawer-backdrop');

    const closeDrawer = () => {
        if (sidebar) sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('open');
    };

    if (drawerBtn && sidebar && backdrop) {
        drawerBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            backdrop.classList.toggle('open');
        });
        backdrop.addEventListener('click', closeDrawer);
    }
}

/**
 * Router Dispatcher
 */
function handleRouteRender(route, param, path) {
    const mock = window.CloudDeployMock;
    const auth = window.CloudDeployAuth;
    const currentUser = auth.getCurrentUser();

    // Update Header user badge
    updateHeaderUserBadge(currentUser);

    // Update Sidebar Navigation Active Link
    updateSidebarActive(route);

    // Hide all view containers
    const allViews = document.querySelectorAll('.view-page');
    allViews.forEach(v => v.classList.remove('active'));

    // Handle Authentication Page Views
    const authRoutes = ['/login', '/signup', '/verify-email', '/forgot-password', '/reset-password'];
    if (authRoutes.includes(route)) {
        renderAuthPage(route);
        return;
    }

    // Handle Protected Dashboard Views
    const viewId = 'view-' + route.replace('/', '');
    let targetView = document.getElementById(viewId);

    // Dynamic Parameterized Views (e.g. /builds/#125 or /pipelines/pipe-prod)
    if (route === '/builds' && param) {
        renderBuildDetails(param);
        return;
    }
    if (route === '/pipelines' && param) {
        renderPipelineDetails(param);
        return;
    }
    if (route === '/deployments' && param) {
        renderDeploymentDetails(param);
        return;
    }

    if (!targetView) {
        targetView = document.getElementById('view-dashboard');
    }

    if (targetView) {
        targetView.classList.add('active');
    }

    // Specific Page Renderers
    switch (route) {
        case '/dashboard':
            renderDashboard();
            break;
        case '/pipelines':
            renderPipelines();
            break;
        case '/builds':
            renderBuildsList();
            break;
        case '/deployments':
            renderDeployments();
            break;
        case '/environments':
            renderEnvironments();
            break;
        case '/logs':
            renderLogs();
            break;
        case '/repository':
            renderRepository();
            break;
        case '/profile':
            renderProfile();
            break;
        case '/settings':
            renderSettings();
            break;
    }

    // Auto-close mobile drawer on route change
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('drawer-backdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
}

/**
 * Update Sidebar Active Highlight
 */
function updateSidebarActive(route) {
    const navItems = document.querySelectorAll('.sidebar .nav-item');
    navItems.forEach(item => {
        const itemRoute = item.getAttribute('data-route');
        if (itemRoute === route) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update Topbar Title
    const titleEl = document.getElementById('topbar-page-title');
    if (titleEl) {
        const routeTitles = {
            '/dashboard': 'Overview Dashboard',
            '/pipelines': 'CI/CD Pipelines',
            '/builds': 'Build Execution History',
            '/deployments': 'Cloud Deployments',
            '/environments': 'Environment Health Monitoring',
            '/logs': 'Live Console Log Viewer',
            '/repository': 'Repository Source Explorer',
            '/profile': 'User Profile & Security',
            '/settings': 'DevOps Project Settings',
            '/login': 'Authentication',
            '/signup': 'Create Account',
            '/verify-email': 'Verify Email',
            '/forgot-password': 'Forgot Password',
            '/reset-password': 'Reset Password'
        };
        titleEl.textContent = routeTitles[route] || 'DevOps Dashboard';
    }
}

function updateHeaderUserBadge(user) {
    const pillText = document.getElementById('auth-pill-username');
    if (pillText) {
        pillText.textContent = user ? user.name : 'Sign In / Profile';
    }
}

/**
 * 1. Render Auth Pages
 */
function renderAuthPage(route) {
    const loginView = document.getElementById('view-login');
    if (loginView) loginView.classList.add('active');

    // Setup Split-Screen Login Page Handlers if on /login
    if (route === '/login' || route === '/') {
        setupLoginPage();
    }
}

/**
 * Setup Login Page Interactions & Mock Authentication Handler
 */
function setupLoginPage() {
    const form = document.getElementById('form-login-page');
    const togglePwBtn = document.getElementById('btn-toggle-login-pw');
    const pwInput = document.getElementById('login-password-input');
    const emailInput = document.getElementById('login-email-input');
    const alertError = document.getElementById('login-alert-error');
    const errText = document.getElementById('login-error-text');
    const errEmail = document.getElementById('err-login-email');
    const errPw = document.getElementById('err-login-password');
    const btnSubmit = document.getElementById('btn-login-submit');
    const spinner = document.getElementById('spinner-login-btn');
    const btnText = document.getElementById('btn-login-text');

    if (!form || form.dataset.initialized === 'true') return;
    form.dataset.initialized = 'true';

    // Show/Hide Password Toggle
    if (togglePwBtn && pwInput) {
        togglePwBtn.addEventListener('click', () => {
            const isPw = pwInput.getAttribute('type') === 'password';
            pwInput.setAttribute('type', isPw ? 'text' : 'password');
            togglePwBtn.setAttribute('aria-label', isPw ? 'Hide password' : 'Show password');
            togglePwBtn.innerHTML = isPw ? `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
            ` : `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
            `;
        });
    }

    // Form Submit Handler
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Reset errors
        if (alertError) alertError.style.display = 'none';
        if (errEmail) errEmail.style.display = 'none';
        if (errPw) errPw.style.display = 'none';
        if (emailInput) emailInput.classList.remove('input-error');
        if (pwInput) pwInput.classList.remove('input-error');

        const email = emailInput ? emailInput.value.trim() : '';
        const password = pwInput ? pwInput.value : '';

        // Validation
        let isValid = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            if (errEmail) { errEmail.textContent = 'Email address is required.'; errEmail.style.display = 'block'; }
            if (emailInput) emailInput.classList.add('input-error');
            isValid = false;
        } else if (!emailRegex.test(email)) {
            if (errEmail) { errEmail.textContent = 'Please enter a valid email address.'; errEmail.style.display = 'block'; }
            if (emailInput) emailInput.classList.add('input-error');
            isValid = false;
        }

        if (!password) {
            if (errPw) { errPw.textContent = 'Password is required.'; errPw.style.display = 'block'; }
            if (pwInput) pwInput.classList.add('input-error');
            isValid = false;
        }

        if (!isValid) return;

        // Trigger Loading Spinner State
        if (btnSubmit) btnSubmit.disabled = true;
        if (spinner) spinner.style.display = 'inline-block';
        if (btnText) btnText.textContent = 'Authenticating...';

        // Simulate Mock Authentication
        setTimeout(() => {
            if (btnSubmit) btnSubmit.disabled = false;
            if (spinner) spinner.style.display = 'none';
            if (btnText) btnText.textContent = 'Sign In';

            // Mock login check
            const user = window.CloudDeployAuth.login(email, password);
            if (user) {
                window.CloudDeployRouter.navigate('/dashboard');
            } else {
                if (alertError && errText) {
                    errText.textContent = 'Invalid email or password. Please check your credentials and try again.';
                    alertError.style.display = 'flex';
                }
            }
        }, 850);
    });
}

/**
 * 2. Render Dashboard Overview Page
 */
function renderDashboard() {
    const mock = window.CloudDeployMock;
    const user = window.CloudDeployAuth.getCurrentUser();

    // Welcome Banner
    const welcomeEl = document.getElementById('dash-welcome-title');
    if (welcomeEl && user) {
        welcomeEl.textContent = `Welcome back, ${user.name}! 👋`;
    }

    // Build Activity Table
    const recentBuildsEl = document.getElementById('dash-recent-builds');
    if (recentBuildsEl && mock.builds) {
        recentBuildsEl.innerHTML = mock.builds.slice(0, 3).map(b => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer;" onclick="window.CloudDeployRouter.navigate('/builds/${b.id}')">
                <td style="padding: 10px; font-weight: 700; color: #38bdf8;">${b.id}</td>
                <td style="padding: 10px; font-family: monospace;">${b.commit}</td>
                <td style="padding: 10px;">${b.branch}</td>
                <td style="padding: 10px;">
                    <span style="background: ${b.status === 'SUCCESS' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}; color: ${b.status === 'SUCCESS' ? '#34d399' : '#f87171'}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">
                        ${b.status}
                    </span>
                </td>
                <td style="padding: 10px; font-size: 12px; color: #94a3b8;">${b.time}</td>
            </tr>
        `).join('');
    }
}

/**
 * 3. Render Pipelines Page
 */
function renderPipelines() {
    const mock = window.CloudDeployMock;
    const container = document.getElementById('pipelines-list-container');
    if (!container || !mock.pipelines) return;

    container.innerHTML = mock.pipelines.map(p => `
        <div class="metric-card" style="margin-bottom: 16px; cursor: pointer;" onclick="window.CloudDeployRouter.navigate('/pipelines/${p.id}')">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div>
                    <h4 style="color: #fff; font-size: 16px; margin: 0;">${p.name}</h4>
                    <span style="font-size: 12px; color: #94a3b8; font-family: monospace;">${p.branch}</span>
                </div>
                <span class="badge ${p.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}" style="padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700;">
                    ${p.status}
                </span>
            </div>
            <div style="display: flex; gap: 20px; font-size: 12px; color: #64748b;">
                <span>Trigger: <strong style="color: #cbd5e1;">${p.trigger}</strong></span>
                <span>Duration: <strong style="color: #cbd5e1;">${p.duration}</strong></span>
                <span>Last Run: <strong style="color: #cbd5e1;">${p.lastRun}</strong></span>
            </div>
        </div>
    `).join('');
}

function renderPipelineDetails(id) {
    const mock = window.CloudDeployMock;
    const pipeline = mock.pipelines.find(p => p.id === id) || mock.pipelines[0];

    const view = document.getElementById('view-pipeline-detail');
    if (!view) return;

    view.classList.add('active');
    view.innerHTML = `
        <div style="margin-bottom: 16px;">
            <button class="btn btn-sm btn-outline" onclick="window.CloudDeployRouter.navigate('/pipelines')">← Back to Pipelines</button>
        </div>
        <div class="panel-box">
            <div class="panel-header">
                <div>
                    <h3 class="panel-title">${pipeline.name}</h3>
                    <p class="panel-subtitle">Target: <code>${pipeline.branch}</code> | Last Execution: ${pipeline.lastRun}</p>
                </div>
                <span class="badge ${pipeline.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}">${pipeline.status}</span>
            </div>
            <div class="panel-body">
                <h4 style="margin-bottom: 16px; color: #38bdf8;">Pipeline Execution Stages</h4>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${pipeline.stages.map(s => `
                        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(15,23,42,0.6); padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
                            <div>
                                <span style="font-size: 10px; color: #38bdf8; font-weight: 700;">${s.step}</span>
                                <h4 style="margin: 2px 0 0; color: #fff; font-size: 14px;">${s.name}</h4>
                                <p style="margin: 0; font-size: 12px; color: #94a3b8;">${s.desc}</p>
                            </div>
                            <span style="font-size: 12px; font-weight: 700; color: ${s.status === 'SUCCESS' ? '#34d399' : s.status === 'FAILED' ? '#f87171' : '#64748b'};">
                                ${s.status}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * 4. Render Builds Page & Details
 */
function renderBuildsList() {
    const mock = window.CloudDeployMock;
    const tableBody = document.getElementById('builds-table-body');
    if (!tableBody || !mock.builds) return;

    tableBody.innerHTML = mock.builds.map(b => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer;" onclick="window.CloudDeployRouter.navigate('/builds/${b.id}')">
            <td style="padding: 12px; font-weight: 700; color: #38bdf8;">${b.id}</td>
            <td style="padding: 12px; font-family: monospace; color: #cbd5e1;">${b.commit}</td>
            <td style="padding: 12px;"><code>${b.branch}</code></td>
            <td style="padding: 12px;">
                <span style="background: ${b.status === 'SUCCESS' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}; color: ${b.status === 'SUCCESS' ? '#34d399' : '#f87171'}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">
                    ${b.status}
                </span>
            </td>
            <td style="padding: 12px; font-size: 13px; color: #94a3b8;">${b.duration}</td>
            <td style="padding: 12px; font-size: 13px;">${b.author}</td>
            <td style="padding: 12px; font-size: 12px; color: #64748b;">${b.time}</td>
        </tr>
    `).join('');
}

function renderBuildDetails(id) {
    const mock = window.CloudDeployMock;
    const build = mock.builds.find(b => b.id === id) || mock.builds[0];

    const view = document.getElementById('view-build-detail');
    if (!view) return;

    view.classList.add('active');
    view.innerHTML = `
        <div style="margin-bottom: 16px;">
            <button class="btn btn-sm btn-outline" onclick="window.CloudDeployRouter.navigate('/builds')">← Back to Builds</button>
        </div>
        <div class="panel-box" style="margin-bottom: 20px;">
            <div class="panel-header">
                <div>
                    <h3 class="panel-title">Build Execution ${build.id}</h3>
                    <p class="panel-subtitle">Commit: <code>${build.commit}</code> | Author: ${build.author} | Duration: ${build.duration}</p>
                </div>
                <span style="background: ${build.status === 'SUCCESS' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}; color: ${build.status === 'SUCCESS' ? '#34d399' : '#f87171'}; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 700;">
                    ${build.status}
                </span>
            </div>
            <div class="panel-body">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 18px;">
                    <div style="background: rgba(15,23,42,0.6); padding: 12px; border-radius: 8px;">
                        <span style="font-size: 11px; color: #94a3b8;">AUTOMATED TESTS</span>
                        <h4 style="margin: 4px 0 0; color: #34d399;">${build.testResults.passed}/${build.testResults.total} Passed (${build.testResults.coverage})</h4>
                    </div>
                    <div style="background: rgba(15,23,42,0.6); padding: 12px; border-radius: 8px;">
                        <span style="font-size: 11px; color: #94a3b8;">DOCKER STATUS</span>
                        <h4 style="margin: 4px 0 0; color: #38bdf8; font-size: 13px;">${build.dockerStatus}</h4>
                    </div>
                </div>
            </div>
        </div>

        <!-- Terminal Log Viewer -->
        <div class="log-terminal-window">
            <div class="log-toolbar">
                <span style="color: #94a3b8; font-size: 13px; font-weight: 600;">AWS CodeBuild Execution Output Log</span>
                <span style="color: #34d399; font-size: 12px; font-family: monospace;">EXIT CODE: 0</span>
            </div>
            <div class="log-stream-body">
                ${build.logs.map((log, idx) => `
                    <div class="log-row">
                        <span class="log-num">${idx + 1}</span>
                        <span class="log-msg">${log}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * 5. Render Deployments Page
 */
function renderDeployments() {
    const mock = window.CloudDeployMock;
    const body = document.getElementById('deployments-table-body');
    if (!body || !mock.deployments) return;

    body.innerHTML = mock.deployments.map(d => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 12px; font-weight: 700; color: #38bdf8;">${d.id}</td>
            <td style="padding: 12px;"><strong>${d.environment}</strong></td>
            <td style="padding: 12px; font-family: monospace; color: #34d399;">${d.version}</td>
            <td style="padding: 12px;"><span style="color: #34d399; font-weight: 700; font-size: 12px;">● ${d.status}</span></td>
            <td style="padding: 12px; font-size: 12px; color: #94a3b8;">${d.time}</td>
            <td style="padding: 12px; font-size: 12px; font-family: monospace;">${d.commit}</td>
            <td style="padding: 12px; font-size: 12px; color: #94a3b8;">${d.duration}</td>
        </tr>
    `).join('');
}

function renderDeploymentDetails(id) {
    renderDeployments();
}

/**
 * 6. Render Environments Page
 */
function renderEnvironments() {
    const mock = window.CloudDeployMock;
    const grid = document.getElementById('environments-grid-container');
    if (!grid || !mock.environments) return;

    grid.innerHTML = mock.environments.map(e => `
        <div class="metric-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                <h3 style="color: #fff; margin: 0;">${e.name}</h3>
                <span style="background: rgba(16,185,129,0.2); color: #34d399; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700;">
                    ● ${e.status}
                </span>
            </div>
            <div style="font-size: 12px; color: #94a3b8; margin-bottom: 14px;">
                <div>Version: <strong style="color: #38bdf8; font-family: monospace;">${e.version}</strong></div>
                <div>URL: <a href="${e.url}" target="_blank" style="color: #38bdf8; text-decoration: none;">${e.url}</a></div>
                <div>Region: ${e.region}</div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: rgba(15,23,42,0.6); padding: 12px; border-radius: 8px; font-size: 12px;">
                <div>CPU Usage: <strong style="color: #fff;">${e.metrics.cpu}%</strong></div>
                <div>Memory: <strong style="color: #fff;">${e.metrics.memory}%</strong></div>
                <div>Latency: <strong style="color: #34d399;">${e.metrics.responseTime}</strong></div>
                <div>Uptime: <strong style="color: #34d399;">${e.metrics.uptime}</strong></div>
            </div>
        </div>
    `).join('');
}

/**
 * 7. Render Logs Page with Filter & Search
 */

let activeLogLevel = 'ALL';
let logSearchQuery = '';

function renderLogs() {
    const mock = window.CloudDeployMock;
    const body = document.getElementById('logs-stream-container');
    if (!body || !mock.logs) return;

    // Attach Log Filter Controls once
    const searchInput = document.getElementById('log-search-input');
    const levelSelect = document.getElementById('log-level-select');
    const clearBtn = document.getElementById('btn-clear-logs');

    if (searchInput && !searchInput.dataset.bound) {
        searchInput.dataset.bound = 'true';
        searchInput.addEventListener('input', (e) => {
            logSearchQuery = e.target.value.toLowerCase();
            renderLogsList();
        });
    }

    if (levelSelect && !levelSelect.dataset.bound) {
        levelSelect.dataset.bound = 'true';
        levelSelect.addEventListener('change', (e) => {
            activeLogLevel = e.target.value;
            renderLogsList();
        });
    }

    if (clearBtn && !clearBtn.dataset.bound) {
        clearBtn.dataset.bound = 'true';
        clearBtn.addEventListener('click', () => {
            mock.logs = [];
            renderLogsList();
        });
    }

    renderLogsList();
}

function renderLogsList() {
    const mock = window.CloudDeployMock;
    const body = document.getElementById('logs-stream-container');
    if (!body) return;

    let filtered = mock.logs || [];

    if (activeLogLevel !== 'ALL') {
        filtered = filtered.filter(l => l.level === activeLogLevel);
    }

    if (logSearchQuery) {
        filtered = filtered.filter(l => l.message.toLowerCase().includes(logSearchQuery));
    }

    if (filtered.length === 0) {
        body.innerHTML = `
            <div style="padding: 32px; text-align: center; color: #64748b;">
                No matching log events found.
            </div>
        `;
        return;
    }

    body.innerHTML = filtered.map(l => `
        <div class="log-row">
            <span class="log-num">${l.line}</span>
            <span class="log-time">${l.timestamp}</span>
            <span class="log-badge-${l.level.toLowerCase()}">${l.level}</span>
            <span class="log-msg">${l.message}</span>
        </div>
    `).join('');
}

/**
 * 8. Render Repository Page & Code Viewer
 */
function renderRepository() {
    const mock = window.CloudDeployMock;
    const container = document.getElementById('repo-files-container');
    if (!container || !mock.repository) return;

    container.innerHTML = mock.repository.files.map(f => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; margin-bottom: 8px; cursor: pointer;" onclick="openFilePreview('${f.name}')">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>${f.type === 'folder' ? '📁' : '📄'}</span>
                <span style="color: #38bdf8; font-weight: 600; font-family: monospace;">${f.name}</span>
            </div>
            <span style="font-size: 12px; color: #64748b;">${f.size}</span>
        </div>
    `).join('');
}

window.openFilePreview = function(filename) {
    const mock = window.CloudDeployMock;
    const file = mock.repository.files.find(f => f.name === filename);
    if (!file) return;

    const modal = document.getElementById('code-preview-modal');
    const titleEl = document.getElementById('code-modal-filename');
    const bodyEl = document.getElementById('code-modal-content');

    if (modal && titleEl && bodyEl) {
        titleEl.textContent = file.name;
        bodyEl.textContent = file.content || '// Folder listing:\n' + file.name;
        modal.style.display = 'flex';
    }
};

/**
 * 9. Render Profile Page
 */
function renderProfile() {
    const auth = window.CloudDeployAuth;
    const user = auth.getCurrentUser();
    if (!user) return;

    const nameEl = document.getElementById('prof-name-val');
    const emailEl = document.getElementById('prof-email-val');
    const roleEl = document.getElementById('prof-role-val');
    const verifyEl = document.getElementById('prof-verify-val');

    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (roleEl) roleEl.textContent = user.role;
    if (verifyEl) verifyEl.textContent = user.verified ? 'Verified ✓' : 'Pending Verification';
}

/**
 * 10. Render Settings Page
 */
function renderSettings() {
    // Tab switching for settings
    const tabs = document.querySelectorAll('.settings-tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.getAttribute('data-target');
            document.querySelectorAll('.settings-section').forEach(s => s.style.display = 'none');
            const targetSec = document.getElementById(target);
            if (targetSec) targetSec.style.display = 'block';
        });
    });
}
