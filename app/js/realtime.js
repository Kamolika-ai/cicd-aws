/**
 * CloudDeploy — Real-Time Frontend WebSocket Client (Socket.IO)
 * Topic: Automated CI/CD Pipeline for Cloud-Native Web Application Deployment
 * 
 * Synchronizes live metrics, database status, registered user count, CI/CD pipeline,
 * deployment monitoring, activity feed, and toast notifications across browser tabs.
 */

(function () {
    let socket = null;

    // Toast Container Setup
    function ensureToastContainer() {
        let container = document.getElementById('realtime-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'realtime-toast-container';
            container.className = 'realtime-toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * Display real-time toast notification popup
     */
    function showToast(title, message, type = 'info') {
        const container = ensureToastContainer();
        const toast = document.createElement('div');
        toast.className = `realtime-toast toast-${type}`;

        const icons = {
            info: 'ℹ️',
            success: '✓',
            warning: '⚠️',
            error: '✖'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || '🔔'}</span>
            <div class="toast-content">
                <div class="toast-title">${escapeHtml(title)}</div>
                <div class="toast-message">${escapeHtml(message)}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;

        container.appendChild(toast);

        // Auto remove toast after 4 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('toast-hiding');
                setTimeout(() => toast.remove(), 400);
            }
        }, 4000);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * Update connection indicator pill in header
     */
    function updateConnectionIndicator(state, text) {
        const pill = document.getElementById('socket-connection-pill');
        const textEl = document.getElementById('socket-connection-text');
        const dotEl = document.getElementById('socket-pulse-dot');

        if (!pill) return;

        pill.className = `badge-item socket-status-${state}`;
        if (textEl) textEl.textContent = text;

        if (dotEl) {
            if (state === 'live') {
                dotEl.style.background = '#10b981';
                dotEl.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.8)';
            } else if (state === 'reconnecting') {
                dotEl.style.background = '#f59e0b';
                dotEl.style.boxShadow = '0 0 10px rgba(245, 158, 11, 0.8)';
            } else {
                dotEl.style.background = '#ef4444';
                dotEl.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.8)';
            }
        }
    }

    /**
     * Update stats across dashboard cards
     */
    function updateDashboardStats(stats) {
        if (!stats) return;

        // User count
        const userCountEls = document.querySelectorAll('.live-user-count');
        userCountEls.forEach(el => {
            el.textContent = stats.totalUsers || 1;
        });

        // App Status & Database Status
        const dbStatusEl = document.getElementById('card-db-status');
        const dbPillEl = document.getElementById('status-db-pill');
        if (dbStatusEl) dbStatusEl.textContent = stats.dbStatus === 'CONNECTED' ? 'CONNECTED (MongoDB)' : 'STANDALONE / DISCONNECTED';
        if (dbPillEl) dbPillEl.textContent = stats.dbStatus === 'CONNECTED' ? 'MongoDB Connected' : 'MongoDB Disconnected';

        // Online connections counter
        const activeConnectionsEl = document.getElementById('live-active-connections');
        if (activeConnectionsEl) activeConnectionsEl.textContent = stats.activeConnectionsCount || 1;

        // Uptime counter
        const uptimeEl = document.getElementById('app-uptime-text');
        if (uptimeEl && stats.uptimeSeconds !== undefined) {
            const mins = Math.floor(stats.uptimeSeconds / 60);
            const secs = stats.uptimeSeconds % 60;
            uptimeEl.textContent = `${mins}m ${secs}s`;
        }
    }

    /**
     * Render a single activity item into the live activity container
     */
    function prependActivityItem(act) {
        const container = document.getElementById('live-activity-feed-container');
        if (!container) return;

        // Remove empty placeholder if present
        const emptyMsg = container.querySelector('.activity-empty-state');
        if (emptyMsg) emptyMsg.remove();

        const timeStr = act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now';

        const item = document.createElement('div');
        item.className = 'activity-feed-item activity-new-slide';
        item.innerHTML = `
            <div class="activity-icon">${act.icon || '📌'}</div>
            <div class="activity-body">
                <div class="activity-header">
                    <span class="activity-title">${escapeHtml(act.title)}</span>
                    <span class="activity-time">${timeStr}</span>
                </div>
                <div class="activity-desc">${escapeHtml(act.desc)}</div>
            </div>
        `;

        container.insertBefore(item, container.firstChild);

        // Keep maximum 20 items in DOM
        while (container.children.length > 20) {
            container.removeChild(container.lastChild);
        }
    }

    /**
     * Update CI/CD Pipeline UI
     */
    /**
     * Update Cards 1 to 5 & CI/CD Pipeline UI from Real Event Data
     */
    function updatePipelineUI(pipeline) {
        if (!pipeline) return;

        const stages = pipeline.stages || [];
        const findStage = (key) => stages.find(s => s.key === key || s.name.toLowerCase().includes(key));

        // Card 1 — Application Health
        const cardHealthStatus = document.getElementById('card-app-status');
        if (cardHealthStatus) {
            if (pipeline.healthStatus === 'OFFLINE') {
                cardHealthStatus.innerHTML = '<span style="color: #ef4444;">✕ OFFLINE</span>';
            } else if (pipeline.healthStatus === 'CHECKING') {
                cardHealthStatus.innerHTML = '<span style="color: #f59e0b;">● CHECKING...</span>';
            } else {
                cardHealthStatus.innerHTML = '<span style="color: #10b981;">✓ ONLINE</span>';
            }
        }

        // Card 2 — AWS CodePipeline
        const cardPipelineStatus = document.getElementById('card-pipeline-status');
        const cardPipelineTrigger = document.getElementById('card-pipeline-trigger');
        if (cardPipelineStatus) {
            const pStatus = pipeline.status || 'READY';
            if (pStatus === 'IN_PROGRESS' || pStatus === 'RUNNING' || pStatus === 'BUILDING') {
                cardPipelineStatus.innerHTML = '<span style="color: #38bdf8;" class="pulse-text">● RUNNING</span>';
            } else if (pStatus === 'SUCCESS') {
                cardPipelineStatus.innerHTML = '<span style="color: #10b981;">✓ SUCCESS</span>';
            } else if (pStatus === 'FAILURE' || pStatus === 'FAILED') {
                cardPipelineStatus.innerHTML = '<span style="color: #ef4444;">✕ FAILED</span>';
            } else {
                cardPipelineStatus.innerHTML = '<span style="color: #94a3b8;">READY</span>';
            }
        }
        if (cardPipelineTrigger) {
            cardPipelineTrigger.textContent = `GitHub Push (${pipeline.branch || 'main'})`;
        }

        // Card 3 — AWS CodeBuild
        const cardBuildStatus = document.getElementById('card-build-status');
        const cardTestResults = document.getElementById('card-test-results');
        const unitStage = findStage('test') || findStage('lint');
        if (cardBuildStatus) {
            if (unitStage) {
                if (unitStage.status === 'IN_PROGRESS') {
                    cardBuildStatus.innerHTML = '<span style="color: #38bdf8;" class="pulse-text">● BUILDING</span>';
                } else if (unitStage.status === 'SUCCESS') {
                    cardBuildStatus.innerHTML = '<span style="color: #10b981;">✓ PASSED</span>';
                } else if (unitStage.status === 'FAILURE') {
                    cardBuildStatus.innerHTML = '<span style="color: #ef4444;">✕ FAILED</span>';
                } else if (unitStage.status === 'SKIPPED') {
                    cardBuildStatus.innerHTML = '<span style="color: #f59e0b;">SKIPPED</span>';
                } else {
                    cardBuildStatus.innerHTML = '<span style="color: #94a3b8;">WAITING</span>';
                }
            } else {
                cardBuildStatus.innerHTML = pipeline.status === 'SUCCESS' ? '<span style="color: #10b981;">✓ PASSED</span>' : '<span style="color: #94a3b8;">READY</span>';
            }
        }
        if (cardTestResults) {
            if (unitStage && unitStage.status === 'FAILURE') {
                cardTestResults.textContent = 'Automated Tests Failed';
            } else {
                cardTestResults.textContent = '4/4 Passing (100%)';
            }
        }

        // Card 4 — Docker Engine
        const cardDockerStatus = document.getElementById('card-docker-status');
        const dockerStage = findStage('docker') || findStage('registry');
        if (cardDockerStatus) {
            if (dockerStage) {
                if (dockerStage.status === 'IN_PROGRESS') {
                    cardDockerStatus.innerHTML = '<span style="color: #38bdf8;" class="pulse-text">● BUILDING</span>';
                } else if (dockerStage.status === 'SUCCESS') {
                    cardDockerStatus.innerHTML = '<span style="color: #10b981;">✓ BUILT</span>';
                } else if (dockerStage.status === 'FAILURE') {
                    cardDockerStatus.innerHTML = '<span style="color: #ef4444;">✕ FAILED</span>';
                } else if (dockerStage.status === 'SKIPPED') {
                    cardDockerStatus.innerHTML = '<span style="color: #f59e0b;">SKIPPED</span>';
                } else {
                    cardDockerStatus.innerHTML = '<span style="color: #94a3b8;">WAITING</span>';
                }
            } else {
                cardDockerStatus.innerHTML = pipeline.status === 'SUCCESS' ? '<span style="color: #10b981;">✓ BUILT</span>' : '<span style="color: #94a3b8;">READY</span>';
            }
        }

        // Card 5 — Cloud Deployment
        const cardDeployStatus = document.getElementById('card-deploy-status');
        const deployStage = findStage('deploy');
        if (cardDeployStatus) {
            if (deployStage) {
                if (deployStage.status === 'IN_PROGRESS') {
                    cardDeployStatus.innerHTML = '<span style="color: #38bdf8;" class="pulse-text">● DEPLOYING</span>';
                } else if (deployStage.status === 'SUCCESS') {
                    cardDeployStatus.innerHTML = '<span style="color: #10b981;">✓ DEPLOYED</span>';
                } else if (deployStage.status === 'FAILURE') {
                    cardDeployStatus.innerHTML = '<span style="color: #ef4444;">✕ FAILED</span>';
                } else if (deployStage.status === 'SKIPPED') {
                    cardDeployStatus.innerHTML = '<span style="color: #f59e0b;">SKIPPED</span>';
                } else {
                    cardDeployStatus.innerHTML = '<span style="color: #94a3b8;">WAITING</span>';
                }
            } else {
                cardDeployStatus.innerHTML = pipeline.status === 'SUCCESS' ? '<span style="color: #10b981;">✓ DEPLOYED</span>' : '<span style="color: #94a3b8;">READY</span>';
            }
        }

        // Overview & Pipeline view status tags
        const statusBadges = document.querySelectorAll('.pipeline-status-badge');
        statusBadges.forEach(badge => {
            badge.textContent = pipeline.status;
            badge.className = `pipeline-status-badge badge-${pipeline.status.toLowerCase()}`;
        });

        if (pipeline.stages) {
            renderPipelineStagesCards(pipeline.stages);
        }
    }

    /**
     * Render 10 Executable Pipeline Stage Cards
     */
    function renderPipelineStagesCards(stages) {
        const container = document.getElementById('executable-pipeline-stages-container');
        if (!container || !stages || !Array.isArray(stages)) return;

        const statusBadges = {
            SUCCESS: '✅ SUCCESS',
            IN_PROGRESS: '🔵 RUNNING',
            FAILURE: '🔴 FAILED',
            QUEUED: '⏳ QUEUED',
            SKIPPED: '🟡 SKIPPED'
        };

        container.innerHTML = stages.map(s => `
            <div class="stage-card stage-status-${s.status}">
                <div class="stage-card-header">
                    <span class="stage-card-title">${s.icon || '📌'} ${escapeHtml(s.name)}</span>
                    <span class="stage-card-status">${statusBadges[s.status] || s.status}</span>
                </div>
                <div class="stage-card-desc">${escapeHtml(s.desc)}</div>
            </div>
        `).join('');
    }

    /**
     * Initialize Socket.IO Client Connection
     */
    function initSocket() {
        if (typeof io === 'undefined') {
            console.warn('⚡ [Socket.IO] Library script not loaded yet.');
            return;
        }

        socket = io({
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        });

        socket.on('connect', () => {
            console.log('⚡ [Socket.IO] Real-time connection established. Socket ID:', socket.id);
            updateConnectionIndicator('live', '🟢 Live');
            showToast('Real-time Connected', 'WebSockets active & synchronized', 'success');
        });

        socket.on('disconnect', (reason) => {
            console.warn('⚡ [Socket.IO] Disconnected:', reason);
            updateConnectionIndicator('disconnected', '🔴 Disconnected');
            showToast('Connection Lost', 'Reconnecting to real-time server...', 'warning');
        });

        socket.on('connect_error', (error) => {
            console.warn('⚡ [Socket.IO] Connection error:', error.message);
            updateConnectionIndicator('reconnecting', '🟡 Reconnecting...');
        });

        socket.on('reconnect_attempt', (attemptNumber) => {
            updateConnectionIndicator('reconnecting', `🟡 Reconnecting (${attemptNumber})...`);
        });

        socket.on('reconnect', (attemptNumber) => {
            console.log('⚡ [Socket.IO] Reconnected after', attemptNumber, 'attempts');
            updateConnectionIndicator('live', '🟢 Live');
            showToast('Reconnected', 'Real-time WebSocket connection restored.', 'success');
        });

        // Event Listeners
        socket.on('initial:state', (data) => {
            if (data.stats) updateDashboardStats(data.stats);
            if (data.pipeline) updatePipelineUI(data.pipeline);
            if (data.activityFeed && Array.isArray(data.activityFeed)) {
                const container = document.getElementById('live-activity-feed-container');
                if (container) {
                    container.innerHTML = '';
                    data.activityFeed.slice().reverse().forEach(act => prependActivityItem(act));
                }
            }
        });

        socket.on('stats:update', (stats) => {
            updateDashboardStats(stats);
        });

        socket.on('db:status', (data) => {
            showToast(data.status === 'CONNECTED' ? 'MongoDB Connected' : 'MongoDB Disconnected', data.message, data.status === 'CONNECTED' ? 'success' : 'warning');
            const dbStatusEl = document.getElementById('card-db-status');
            if (dbStatusEl) dbStatusEl.textContent = data.status === 'CONNECTED' ? 'CONNECTED (MongoDB)' : 'STANDALONE / DISCONNECTED';
        });

        socket.on('user:registered', (data) => {
            showToast('New User Registered', `${data.user.name} registered (${data.user.role}).`, 'info');
            // Trigger quick animation pulse on user count card
            const card = document.getElementById('card-user-count-wrapper');
            if (card) {
                card.classList.add('card-pulse-highlight');
                setTimeout(() => card.classList.remove('card-pulse-highlight'), 1200);
            }
        });

        socket.on('user:login', (data) => {
            showToast('User Login', `${data.user.name} logged into dashboard.`, 'info');
        });

        socket.on('github:push', (data) => {
            showToast('🟢 GitHub Push Detected', `${data.branch} (${data.commitSha}): "${data.commitMessage}" by ${data.author}`, 'success');

            // Update Live Commit Elements
            const commitShaEl = document.getElementById('gh-latest-commit-sha');
            const commitMsgEl = document.getElementById('gh-latest-commit-msg');
            const commitAuthorEl = document.getElementById('gh-latest-commit-author');
            const commitBranchEl = document.getElementById('gh-latest-branch');

            if (commitShaEl) commitShaEl.textContent = data.commitSha;
            if (commitMsgEl) commitMsgEl.textContent = data.commitMessage;
            if (commitAuthorEl) commitAuthorEl.textContent = data.author;
            if (commitBranchEl) commitBranchEl.textContent = data.branch;
        });

        socket.on('github:pull_request', (data) => {
            showToast(`🔀 GitHub PR #${data.prNumber} ${data.status}`, `"${data.prTitle}" by ${data.author}`, data.status === 'MERGED' ? 'success' : 'info');
        });

        socket.on('github:repo_state', (state) => {
            if (!state) return;
            const totalEventsEl = document.getElementById('gh-total-events');
            const repoUrlEl = document.getElementById('gh-repo-url-btn');
            const repoNameEl = document.getElementById('gh-repo-name');

            if (totalEventsEl) totalEventsEl.textContent = state.totalEvents || 0;
            if (repoNameEl && state.name) repoNameEl.textContent = state.name;
            if (repoUrlEl && state.repoUrl) {
                repoUrlEl.href = state.repoUrl;
            }

            if (state.stages) {
                renderPipelineStagesCards(state.stages);
            }
        });

        socket.on('github:pipeline_stages', (stages) => {
            renderPipelineStagesCards(stages);
        });

        socket.on('pipeline:update', (pipeline) => {
            updatePipelineUI(pipeline);
        });

        socket.on('activity:new', (activity) => {
            prependActivityItem(activity);
        });

        socket.on('notification:new', (notif) => {
            showToast(notif.title, notif.message, notif.type || 'info');
        });
    }

    // Initialize when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSocket);
    } else {
        initSocket();
    }

    // Expose global interface
    window.CloudDeployRealtime = {
        getSocket() { return socket; },
        triggerPipelineDemo(customData) {
            if (socket && socket.connected) {
                socket.emit('pipeline:trigger', customData || {});
                showToast('Pipeline Simulation Triggered', 'Executing CI/CD stages live across all clients...', 'info');
            } else {
                showToast('Offline Mode', 'Cannot trigger simulation: Socket disconnected.', 'warning');
            }
        },
        showToast
    };
})();
