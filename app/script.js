/**
 * CloudDeploy — CI/CD Dashboard Client Script
 * Handles real-time API polling, health check validation, and interactive pipeline simulation
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const envBadgeText = document.getElementById('env-badge-text');
    const versionText = document.getElementById('version-text');
    const cardVersionVal = document.getElementById('card-version-val');
    const cardAppStatus = document.getElementById('card-app-status');
    const appUptimeText = document.getElementById('app-uptime-text');
    const cardPipelineStatus = document.getElementById('card-pipeline-status');
    const cardBuildStatus = document.getElementById('card-build-status');
    const cardDockerStatus = document.getElementById('card-docker-status');
    const cardDeployStatus = document.getElementById('card-deploy-status');
    
    // Health Inspector References
    const btnPingHealth = document.getElementById('btn-ping-health');
    const healthHttpCode = document.getElementById('health-http-code');
    const healthLatency = document.getElementById('health-latency');
    const healthJsonOutput = document.getElementById('health-json-output');

    // Pipeline Simulation References
    const btnTriggerPipeline = document.getElementById('btn-trigger-pipeline-demo');
    const terminalOutput = document.getElementById('terminal-output');
    const terminalStatus = document.getElementById('terminal-status-text');
    const pipelineBadge = document.getElementById('pipeline-overall-badge');

    // Viva Modal References
    const btnOpenVivaModal = document.getElementById('btn-open-viva-modal');
    const btnCloseVivaModal = document.getElementById('btn-close-viva-modal');
    const btnCloseVivaModal2 = document.getElementById('btn-close-viva-modal-2');
    const vivaModal = document.getElementById('viva-modal');

    // Pipeline Nodes
    const pipelineNodes = [
        { id: 'node-developer', name: 'Developer Workstation', stage: 'STAGE 1' },
        { id: 'node-github', name: 'GitHub Repository', stage: 'STAGE 2' },
        { id: 'node-codepipeline', name: 'AWS CodePipeline', stage: 'STAGE 3' },
        { id: 'node-codebuild', name: 'AWS CodeBuild', stage: 'STAGE 4' },
        { id: 'node-docker', name: 'Docker Engine', stage: 'STAGE 5' },
        { id: 'node-production', name: 'AWS Production Deployment', stage: 'STAGE 6' }
    ];

    let isSimulating = false;

    // Fetch live status from backend API
    async function fetchSystemStatus() {
        try {
            const res = await fetch('/api/status');
            if (res.ok) {
                const data = await res.json();
                
                // Update Versions
                const ver = data.application?.version || 'v1.0.0';
                if (versionText) versionText.textContent = ver;
                if (cardVersionVal) cardVersionVal.textContent = ver;

                // Update Application Status
                if (cardAppStatus) cardAppStatus.textContent = data.application?.status || 'ONLINE';
                if (envBadgeText) envBadgeText.textContent = `${data.application?.environment || 'PRODUCTION'} ONLINE`;

                // Update Uptime
                const uptimeSec = data.application?.uptime_seconds || 0;
                formatUptime(uptimeSec);
            }
        } catch (err) {
            console.warn('API fetch offline (running in static/local preview):', err);
            // Fallback for standalone HTML preview without active node server
            formatUptime(42);
        }
    }

    // Format Uptime Helper
    function formatUptime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        let str = '';
        if (h > 0) str += `${h}h `;
        if (m > 0 || h > 0) str += `${m}m `;
        str += `${s}s`;
        if (appUptimeText) appUptimeText.textContent = str;
    }

    // Ping Health Check Handler
    async function performHealthCheck() {
        if (!btnPingHealth) return;
        btnPingHealth.disabled = true;
        btnPingHealth.textContent = 'Pinging...';
        const startTime = performance.now();

        try {
            const response = await fetch('/health');
            const endTime = performance.now();
            const latency = Math.round(endTime - startTime);

            const json = await response.json();

            if (healthHttpCode) {
                healthHttpCode.textContent = `${response.status} OK`;
                healthHttpCode.className = 'meta-val text-emerald font-mono';
            }
            if (healthLatency) healthLatency.textContent = `${latency}ms`;
            if (healthJsonOutput) healthJsonOutput.textContent = JSON.stringify(json, null, 2);

        } catch (err) {
            const endTime = performance.now();
            const latency = Math.round(endTime - startTime);

            // Mock response if server not running (e.g. file:// protocol)
            const fallbackJson = {
                status: "healthy",
                service: "CloudDeploy DevOps Dashboard",
                version: versionText?.textContent || "v1.0.0",
                environment: "Production (AWS Cloud)",
                uptime_seconds: 120,
                timestamp: new Date().toISOString(),
                http_code: 200,
                note: "Standby response simulated locally"
            };

            if (healthHttpCode) {
                healthHttpCode.textContent = "200 OK (Simulated)";
                healthHttpCode.className = 'meta-val text-cyan font-mono';
            }
            if (healthLatency) healthLatency.textContent = `${latency}ms`;
            if (healthJsonOutput) healthJsonOutput.textContent = JSON.stringify(fallbackJson, null, 2);
        } finally {
            btnPingHealth.disabled = false;
            btnPingHealth.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 4v6h-6"></path>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                Ping /health
            `;
        }
    }

    // Real-time Pipeline Simulation Handler (for faculty/viva demonstration)
    async function runPipelineSimulation() {
        if (isSimulating) return;
        isSimulating = true;
        btnTriggerPipeline.disabled = true;
        btnTriggerPipeline.textContent = 'Pipeline Running...';

        if (pipelineBadge) {
            pipelineBadge.textContent = 'EXECUTING WORKFLOW...';
            pipelineBadge.style.color = 'var(--color-amber)';
            pipelineBadge.style.borderColor = 'var(--color-amber)';
        }

        if (terminalStatus) terminalStatus.textContent = 'RUNNING';

        // Clear terminal output
        if (terminalOutput) terminalOutput.textContent = '';

        function log(msg) {
            if (terminalOutput) {
                terminalOutput.textContent += msg + '\n';
                terminalOutput.scrollTop = terminalOutput.scrollHeight;
            }
        }

        const sleep = ms => new Promise(r => setTimeout(r, ms));

        // Reset all nodes to idle
        pipelineNodes.forEach(node => {
            const el = document.getElementById(node.id);
            if (el) {
                el.classList.remove('active-node', 'running-node');
                const indicator = el.querySelector('.node-status-indicator');
                if (indicator) {
                    indicator.textContent = 'Waiting';
                    indicator.className = 'node-status-indicator status-idle';
                }
            }
        });

        // Step 1: Developer Git Push
        log(`[${new Date().toLocaleTimeString()}] [STAGE 1] Developer Workstation: Executing 'git push origin main'`);
        const node1 = document.getElementById('node-developer');
        if (node1) {
            node1.classList.add('running-node');
            node1.querySelector('.node-status-indicator').textContent = 'Pushing...';
            node1.querySelector('.node-status-indicator').className = 'node-status-indicator status-working';
        }
        await sleep(1000);
        log(`[${new Date().toLocaleTimeString()}] [STAGE 1] Commit hash: a38f91b - "feat: automated deployment demo"`);
        if (node1) {
            node1.classList.remove('running-node');
            node1.classList.add('active-node');
            node1.querySelector('.node-status-indicator').textContent = 'Pushed';
            node1.querySelector('.node-status-indicator').className = 'node-status-indicator status-done';
        }

        // Step 2: GitHub Webhook
        await sleep(600);
        log(`[${new Date().toLocaleTimeString()}] [STAGE 2] GitHub: Received push event on branch 'refs/heads/main'`);
        log(`[${new Date().toLocaleTimeString()}] [STAGE 2] GitHub Webhook: Emitted event to AWS CodePipeline`);
        const node2 = document.getElementById('node-github');
        if (node2) {
            node2.classList.add('active-node');
            node2.querySelector('.node-status-indicator').textContent = 'Triggered';
            node2.querySelector('.node-status-indicator').className = 'node-status-indicator status-done';
        }

        // Step 3: AWS CodePipeline Source Trigger
        await sleep(800);
        log(`[${new Date().toLocaleTimeString()}] [STAGE 3] AWS CodePipeline: State 'IN_PROGRESS'`);
        log(`[${new Date().toLocaleTimeString()}] [STAGE 3] Fetching source artifact bundle (Source ID: source-out-294)`);
        const node3 = document.getElementById('node-codepipeline');
        if (node3) {
            node3.classList.add('active-node');
            node3.querySelector('.node-status-indicator').textContent = 'Succeeded';
            node3.querySelector('.node-status-indicator').className = 'node-status-indicator status-done';
        }

        // Step 4: AWS CodeBuild (Install, Test, Build)
        await sleep(900);
        log(`[${new Date().toLocaleTimeString()}] [STAGE 4] AWS CodeBuild: Invoking build agent container...`);
        const node4 = document.getElementById('node-codebuild');
        if (node4) {
            node4.classList.add('running-node');
            node4.querySelector('.node-status-indicator').textContent = 'Building...';
            node4.querySelector('.node-status-indicator').className = 'node-status-indicator status-working';
        }
        await sleep(700);
        log(`[${new Date().toLocaleTimeString()}] [STAGE 4] [PHASE: install] Node.js v20.x runtime initialized. Running 'npm install'...`);
        await sleep(800);
        log(`[${new Date().toLocaleTimeString()}] [STAGE 4] [PHASE: pre_build] Running Automated Test Suite: 'npm test'`);
        log(`             ✔ Test 1: GET /health returns 200 OK & healthy status [PASS]`);
        log(`             ✔ Test 2: HTML dashboard markup & UI elements [PASS]`);
        log(`             ✔ Test 3: API status metadata & semantic version [PASS]`);
        log(`             [Automated Tests: 3/3 Passed with exit code 0]`);
        await sleep(900);
        log(`[${new Date().toLocaleTimeString()}] [STAGE 4] [PHASE: build] Building Docker Image: 'docker build -t clouddeploy:latest .'`);
        log(`             Step 1/8 : FROM node:20-alpine`);
        log(`             Step 2/8 : WORKDIR /usr/src/app`);
        log(`             Step 3/8 : COPY package*.json ./`);
        log(`             Step 4/8 : RUN npm install --production`);
        log(`             Step 5/8 : COPY . .`);
        log(`             Step 6/8 : EXPOSE 8080`);
        log(`             Step 7/8 : HEALTHCHECK CMD wget --spider http://localhost:8080/health || exit 1`);
        log(`             Step 8/8 : CMD ["npm", "start"]`);
        log(`             Successfully tagged clouddeploy:latest (Image ID: sha256:d82e8f...)`);
        if (node4) {
            node4.classList.remove('running-node');
            node4.classList.add('active-node');
            node4.querySelector('.node-status-indicator').textContent = 'Passed';
            node4.querySelector('.node-status-indicator').className = 'node-status-indicator status-done';
        }

        // Step 5: Docker Containerization
        await sleep(700);
        log(`[${new Date().toLocaleTimeString()}] [STAGE 5] Packaging deployment artifact Dockerrun.aws.json`);
        const node5 = document.getElementById('node-docker');
        if (node5) {
            node5.classList.add('active-node');
            node5.querySelector('.node-status-indicator').textContent = 'Packaged';
            node5.querySelector('.node-status-indicator').className = 'node-status-indicator status-done';
        }

        // Step 6: AWS Elastic Beanstalk Deployment
        await sleep(800);
        log(`[${new Date().toLocaleTimeString()}] [STAGE 6] AWS Deployment: Elastic Beanstalk / App Runner updating environment...`);
        const node6 = document.getElementById('node-production');
        if (node6) {
            node6.classList.add('running-node');
            node6.querySelector('.node-status-indicator').textContent = 'Deploying...';
            node6.querySelector('.node-status-indicator').className = 'node-status-indicator status-working';
        }
        await sleep(1000);
        log(`[${new Date().toLocaleTimeString()}] [STAGE 6] Environment healthcheck status: GREEN (200 OK)`);
        log(`[${new Date().toLocaleTimeString()}] [STAGE 6] Deployed Successfully! Application is LIVE and healthy.`);
        log(`========================================================================`);
        log(`🎉 [SUCCESS] Pipeline execution finished in 6.2 seconds. Status: SUCCESS.`);
        log(`========================================================================`);

        if (node6) {
            node6.classList.remove('running-node');
            node6.classList.add('active-node');
            node6.querySelector('.node-status-indicator').textContent = 'Live Online';
            node6.querySelector('.node-status-indicator').className = 'node-status-indicator status-done';
        }

        if (pipelineBadge) {
            pipelineBadge.textContent = 'PIPELINE SUCCESS';
            pipelineBadge.style.color = 'var(--color-emerald)';
            pipelineBadge.style.borderColor = 'var(--color-emerald)';
        }

        if (terminalStatus) terminalStatus.textContent = 'SUCCESS (100%)';

        // Trigger health check update
        performHealthCheck();

        btnTriggerPipeline.disabled = false;
        btnTriggerPipeline.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Simulate Pipeline Run
        `;
        isSimulating = false;
    }

    // Viva Modal Handlers
    if (btnOpenVivaModal) {
        btnOpenVivaModal.addEventListener('click', () => {
            if (vivaModal) vivaModal.classList.add('show');
        });
    }

    if (btnCloseVivaModal) {
        btnCloseVivaModal.addEventListener('click', () => {
            if (vivaModal) vivaModal.classList.remove('show');
        });
    }

    if (btnCloseVivaModal2) {
        btnCloseVivaModal2.addEventListener('click', () => {
            if (vivaModal) vivaModal.classList.remove('show');
        });
    }

    if (vivaModal) {
        vivaModal.addEventListener('click', (e) => {
            if (e.target === vivaModal) {
                vivaModal.classList.remove('show');
            }
        });
    }

    // Event Listeners
    if (btnPingHealth) {
        btnPingHealth.addEventListener('click', performHealthCheck);
    }

    if (btnTriggerPipeline) {
        btnTriggerPipeline.addEventListener('click', runPipelineSimulation);
    }

    // Initialize
    fetchSystemStatus();
    performHealthCheck();
    setInterval(fetchSystemStatus, 10000);
});
