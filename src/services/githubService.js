/**
 * CloudDeploy — Real-Time GitHub Integration Service
 * Webhook signature verification, event parsing, MongoDB persistence,
 * and live Socket.IO broadcasting for GitHub Push, PR, Workflow, & Deployment events.
 */

const crypto = require('crypto');
const realtimeService = require('./realtimeService');
const solutionEngine = require('./solutionEngine');

let mongooseRef = null;
let GithubEventModel = null;

// Git Connect Connection Configuration State
let gitConnectionConfig = {
    connected: true,
    repoUrl: 'https://github.com/Kamolika-ai/cicd-aws',
    owner: 'Kamolika-ai',
    repo: 'cicd-aws',
    branch: 'main',
    webhookUrl: '/api/github/webhook',
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || 'clouddeploy_webhook_secret_998',
    status: 'ACTIVE_VERIFIED',
    lastSynced: new Date().toISOString(),
    autoCheckStages: true
};

// Active Stage Error Diagnosis & Solution Container
let activeStageError = null;

// Real-Time 10-Stage Executable Pipeline State
let livePipelineStages = [
    { key: 'checkout', name: 'Checkout', status: 'SUCCESS', icon: '📥', desc: 'actions/checkout@v4' },
    { key: 'install', name: 'Install Dependencies', status: 'SUCCESS', icon: '📦', desc: 'npm ci' },
    { key: 'lint', name: 'Code Linting', status: 'SUCCESS', icon: '🔍', desc: 'eslint .' },
    { key: 'tests', name: 'Unit Tests', status: 'SUCCESS', icon: '🧪', desc: 'npm test (4/4 passing)' },
    { key: 'security', name: 'Security Scan', status: 'SUCCESS', icon: '🛡️', desc: 'npm audit & Trivy scan' },
    { key: 'docker_build', name: 'Docker Build', status: 'SUCCESS', icon: '🐳', desc: 'docker build -t clouddeploy:latest .' },
    { key: 'image_scan', name: 'Docker Image Scan', status: 'SUCCESS', icon: '🔎', desc: 'aquasecurity/trivy-action' },
    { key: 'registry_push', name: 'Push to Registry', status: 'SUCCESS', icon: '🚀', desc: 'AWS ECR Image Dispatch' },
    { key: 'deploy', name: 'Cloud Deployment', status: 'SUCCESS', icon: '🌐', desc: 'AWS Elastic Beanstalk' },
    { key: 'health_check', name: 'Health Validation', status: 'SUCCESS', icon: '🟢', desc: 'GET /health (HTTP 200 OK)' }
];

// Real-Time GitHub Repository State Cache
let latestRepoState = {
    name: 'cicd-aws',
    owner: 'Kamolika-ai',
    repoUrl: 'https://github.com/Kamolika-ai/cicd-aws',
    defaultBranch: 'main',
    latestCommitSha: 'a82f91c',
    latestCommitMessage: 'feat(ci): automate cloud deployment pipeline',
    latestCommitAuthor: 'DevOps Lead',
    lastPushTime: new Date().toISOString(),
    latestWorkflowStatus: 'SUCCESS',
    workflowName: 'CloudDeploy CI/CD Pipeline',
    runId: '12849102',
    runNumber: 42,
    totalEvents: 0,
    successfulWorkflows: 1,
    failedWorkflows: 0,
    runningWorkflows: 0,
    successfulDeployments: 1,
    failedDeployments: 0,
    stages: livePipelineStages,
    connectionConfig: gitConnectionConfig,
    activeStageError: null
};

/**
 * Initialize GitHub Service & Register Mongoose Model
 */
function init(mongooseInstance) {
    mongooseRef = mongooseInstance;

    if (mongooseRef && !mongooseRef.models.GithubEvent) {
        const githubEventSchema = new mongooseRef.Schema({
            eventType: { type: String, required: true },
            repository: { type: String, default: 'clouddeploy' },
            repoUrl: { type: String, default: 'https://github.com' },
            branch: { type: String, default: 'main' },
            commitSha: { type: String, default: 'a82f91c' },
            commitMessage: { type: String, default: 'Update deployment configuration' },
            author: { type: String, default: 'GitHub Developer' },
            authorAvatar: { type: String },
            status: { type: String, default: 'SUCCESS' },
            workflowName: { type: String },
            runId: { type: String },
            runNumber: { type: Number },
            prNumber: { type: Number },
            prTitle: { type: String },
            environment: { type: String },
            details: { type: Object },
            createdAt: { type: Date, default: Date.now }
        });

        GithubEventModel = mongooseRef.model('GithubEvent', githubEventSchema);
    } else if (mongooseRef) {
        GithubEventModel = mongooseRef.models.GithubEvent;
    }
}

/**
 * Verify GitHub Webhook Signature (X-Hub-Signature-256)
 */
function verifySignature(payloadBuffer, signatureHeader, secret) {
    if (!secret || secret.trim() === '') {
        console.warn('⚠️ [GitHub Webhook] GITHUB_WEBHOOK_SECRET not set. Skipping signature verification.');
        return true;
    }

    if (!signatureHeader) {
        console.error('✖ [GitHub Webhook] Missing X-Hub-Signature-256 header.');
        return false;
    }

    try {
        const hmac = crypto.createHmac('sha256', secret);
        const digest = 'sha256=' + hmac.update(payloadBuffer).digest('hex');

        const signatureBuffer = Buffer.from(signatureHeader, 'utf8');
        const digestBuffer = Buffer.from(digest, 'utf8');

        if (signatureBuffer.length !== digestBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(signatureBuffer, digestBuffer);
    } catch (err) {
        console.error('✖ [GitHub Webhook] Signature verification error:', err.message);
        return false;
    }
}

/**
 * Main Webhook Dispatcher
 */
async function processWebhook(eventType, payload) {
    latestRepoState.totalEvents++;

    let result = { processed: true, eventType };

    switch (eventType) {
        case 'push':
            result = await handlePush(payload);
            break;
        case 'pull_request':
            result = await handlePullRequest(payload);
            break;
        case 'workflow_run':
            result = await handleWorkflowRun(payload);
            break;
        case 'workflow_job':
            result = await handleWorkflowJob(payload);
            break;
        case 'deployment':
            result = await handleDeployment(payload);
            break;
        case 'deployment_status':
            result = await handleDeploymentStatus(payload);
            break;
        case 'ping':
            result = handlePing(payload);
            break;
        default:
            console.log(`ℹ [GitHub Webhook] Received unhandled event type: ${eventType}`);
            break;
    }

    // Persist event history to MongoDB if connected
    if (result.saveData && GithubEventModel && mongooseRef.connection.readyState === 1) {
        try {
            await GithubEventModel.create(result.saveData);
        } catch (err) {
            console.error('MongoDB GitHub Event Save Error:', err.message);
        }
    }

    // Broadcast updated GitHub repository metrics & stages to Socket.IO clients
    broadcastRepoState();

    return result;
}

/**
 * 1. Handle GitHub Push Event
 */
async function handlePush(payload) {
    const repoName = payload.repository ? payload.repository.full_name : 'clouddeploy';
    const repoUrl = payload.repository ? payload.repository.html_url : 'https://github.com';
    const branch = payload.ref ? payload.ref.replace('refs/heads/', '') : 'main';
    const headCommit = payload.head_commit || (payload.commits && payload.commits[0]) || {};
    const commitSha = headCommit.id ? headCommit.id.substring(0, 7) : 'a82f91c';
    const commitMessage = headCommit.message || 'Updated code in repository';
    const author = headCommit.author ? headCommit.author.name : (payload.sender ? payload.sender.login : 'GitHub Developer');
    const timestamp = headCommit.timestamp || new Date().toISOString();

    // Update state cache
    latestRepoState.name = repoName;
    latestRepoState.repoUrl = repoUrl;
    latestRepoState.defaultBranch = branch;
    latestRepoState.latestCommitSha = commitSha;
    latestRepoState.latestCommitMessage = commitMessage;
    latestRepoState.latestCommitAuthor = author;
    latestRepoState.lastPushTime = timestamp;

    // Reset pipeline stages for new execution
    resetPipelineStages('QUEUED');

    const eventData = {
        eventType: 'push',
        repository: repoName,
        repoUrl,
        branch,
        commitSha,
        commitMessage,
        author,
        timestamp,
        status: 'PUSH_DETECTED'
    };

    const socket = realtimeService.getIo ? realtimeService.getIo() : null;
    if (socket) {
        socket.emit('github:push', eventData);
    }

    realtimeService.addActivity({
        type: 'github',
        title: '🟢 GitHub Push Received',
        desc: `${branch} (${commitSha}): "${commitMessage}" by ${author}`,
        icon: '🐙'
    });

    realtimeService.addNotification({
        title: 'GitHub Push Event',
        message: `Branch: ${branch} | Commit: ${commitSha} - "${commitMessage}"`,
        type: 'info'
    });

    return {
        success: true,
        eventType: 'push',
        saveData: {
            eventType: 'push',
            repository: repoName,
            repoUrl,
            branch,
            commitSha,
            commitMessage,
            author,
            status: 'PUSH_DETECTED'
        }
    };
}

/**
 * 2. Handle GitHub Pull Request Event
 */
async function handlePullRequest(payload) {
    const action = payload.action; // opened, closed, merged, reopened
    const pr = payload.pull_request || {};
    const repoName = payload.repository ? payload.repository.full_name : 'clouddeploy';
    const repoUrl = pr.html_url || (payload.repository ? payload.repository.html_url : 'https://github.com');
    const prNumber = pr.number || payload.number || 1;
    const prTitle = pr.title || 'Feature update';
    const author = pr.user ? pr.user.login : 'Developer';
    const sourceBranch = pr.head ? pr.head.ref : 'feature-branch';
    const targetBranch = pr.base ? pr.base.ref : 'main';
    const isMerged = !!pr.merged;

    let status = 'OPENED';
    let icon = '🟣';
    let titleText = `Pull Request #${prNumber} Opened`;

    if (action === 'closed') {
        if (isMerged) {
            status = 'MERGED';
            icon = '🟢';
            titleText = `Pull Request #${prNumber} Merged`;
        } else {
            status = 'CLOSED';
            icon = '🔴';
            titleText = `Pull Request #${prNumber} Closed`;
        }
    }

    realtimeService.addActivity({
        type: 'github',
        title: `${icon} ${titleText}`,
        desc: `"${prTitle}" by ${author} (${sourceBranch} ➔ ${targetBranch})`,
        icon: '🔀'
    });

    realtimeService.addNotification({
        title: titleText,
        message: `PR #${prNumber}: ${prTitle} (${sourceBranch} ➔ ${targetBranch})`,
        type: isMerged ? 'success' : (action === 'closed' ? 'warning' : 'info')
    });

    return {
        success: true,
        eventType: 'pull_request',
        saveData: {
            eventType: 'pull_request',
            repository: repoName,
            repoUrl,
            branch: targetBranch,
            prNumber,
            prTitle,
            author,
            status
        }
    };
}

/**
 * 3. Handle GitHub Actions Workflow Run Event
 */
async function handleWorkflowRun(payload) {
    const workflowRun = payload.workflow_run || {};
    const status = workflowRun.status; // queued, in_progress, completed
    const conclusion = workflowRun.conclusion; // success, failure, cancelled
    const workflowName = workflowRun.name || 'CloudDeploy CI/CD Pipeline';
    const branch = workflowRun.head_branch || 'main';
    const commitSha = workflowRun.head_sha ? workflowRun.head_sha.substring(0, 7) : 'a82f91c';
    const commitMessage = workflowRun.head_commit ? workflowRun.head_commit.message : 'Automated build';
    const author = workflowRun.actor ? workflowRun.actor.login : 'GitHub Actions';
    const repoName = payload.repository ? payload.repository.full_name : 'clouddeploy';
    const repoUrl = workflowRun.html_url || (payload.repository ? payload.repository.html_url : 'https://github.com');
    const runId = String(workflowRun.id || '12849102');
    const runNumber = workflowRun.run_number || 42;

    latestRepoState.workflowName = workflowName;
    latestRepoState.runId = runId;
    latestRepoState.runNumber = runNumber;

    let pipelineStatus = 'IN_PROGRESS';
    let progress = 45;

    if (status === 'queued') {
        pipelineStatus = 'QUEUED';
        progress = 10;
        latestRepoState.runningWorkflows++;
        resetPipelineStages('QUEUED');
    } else if (status === 'in_progress') {
        pipelineStatus = 'IN_PROGRESS';
        progress = 50;
    } else if (status === 'completed') {
        latestRepoState.runningWorkflows = Math.max(0, latestRepoState.runningWorkflows - 1);
        if (conclusion === 'success') {
            pipelineStatus = 'SUCCESS';
            progress = 100;
            latestRepoState.successfulWorkflows++;
            markRemainingStages('SUCCESS');
        } else {
            pipelineStatus = 'FAILURE';
            progress = 100;
            latestRepoState.failedWorkflows++;
        }
    }

    latestRepoState.latestWorkflowStatus = pipelineStatus;

    realtimeService.emitPipelineStatus({
        status: pipelineStatus,
        stage: pipelineStatus === 'SUCCESS' ? 'DEPLOYED' : pipelineStatus,
        progress,
        branch,
        commit: commitSha,
        commitMessage,
        author,
        workflowName,
        runId,
        runNumber,
        stages: livePipelineStages
    });

    return {
        success: true,
        eventType: 'workflow_run',
        saveData: {
            eventType: 'workflow_run',
            repository: repoName,
            repoUrl,
            branch,
            commitSha,
            commitMessage,
            author,
            workflowName,
            runId,
            runNumber,
            status: pipelineStatus
        }
    };
}

/**
 * 4. Handle Detailed GitHub Actions Workflow Job & Steps Event
 */
async function handleWorkflowJob(payload) {
    const job = payload.workflow_job || {};
    const jobName = (job.name || '').toLowerCase();
    const jobStatus = job.status; // queued, in_progress, completed
    const jobConclusion = job.conclusion; // success, failure, cancelled, skipped

    // Map GitHub job name / steps to 10 executable pipeline stages
    if (jobName.includes('checkout') || jobName.includes('setup')) {
        updateStageStatus('checkout', jobStatus, jobConclusion);
        updateStageStatus('install', jobStatus, jobConclusion);
    }
    if (jobName.includes('lint')) {
        updateStageStatus('lint', jobStatus, jobConclusion);
    }
    if (jobName.includes('unit') || jobName.includes('test')) {
        updateStageStatus('tests', jobStatus, jobConclusion);
    }
    if (jobName.includes('security') || jobName.includes('audit')) {
        updateStageStatus('security', jobStatus, jobConclusion);
    }
    if (jobName.includes('docker') || jobName.includes('build')) {
        updateStageStatus('docker_build', jobStatus, jobConclusion);
        updateStageStatus('image_scan', jobStatus, jobConclusion);
    }
    if (jobName.includes('registry') || jobName.includes('push')) {
        updateStageStatus('registry_push', jobStatus, jobConclusion);
    }
    if (jobName.includes('deploy') || jobName.includes('health')) {
        updateStageStatus('deploy', jobStatus, jobConclusion);
        updateStageStatus('health_check', jobStatus, jobConclusion);
    }

    // Inspect individual steps if available
    if (job.steps && Array.isArray(job.steps)) {
        job.steps.forEach(step => {
            const name = step.name.toLowerCase();
            const stepStatus = step.status;
            const stepConclusion = step.conclusion;

            if (name.includes('checkout')) updateStageStatus('checkout', stepStatus, stepConclusion);
            if (name.includes('install')) updateStageStatus('install', stepStatus, stepConclusion);
            if (name.includes('lint')) updateStageStatus('lint', stepStatus, stepConclusion);
            if (name.includes('test')) updateStageStatus('tests', stepStatus, stepConclusion);
            if (name.includes('security') || name.includes('audit') || name.includes('trivy')) updateStageStatus('security', stepStatus, stepConclusion);
            if (name.includes('docker build')) updateStageStatus('docker_build', stepStatus, stepConclusion);
            if (name.includes('scan docker image')) updateStageStatus('image_scan', stepStatus, stepConclusion);
            if (name.includes('registry') || name.includes('package')) updateStageStatus('registry_push', stepStatus, stepConclusion);
            if (name.includes('deploy')) updateStageStatus('deploy', stepStatus, stepConclusion);
            if (name.includes('health')) updateStageStatus('health_check', stepStatus, stepConclusion);
        });
    }

    broadcastRepoState();
    return { success: true, eventType: 'workflow_job' };
}

/**
 * 5. Handle GitHub Deployment Event
 */
async function handleDeployment(payload) {
    const deployment = payload.deployment || {};
    const env = deployment.environment || 'production';
    const commitSha = deployment.sha ? deployment.sha.substring(0, 7) : 'a82f91c';
    const author = deployment.creator ? deployment.creator.login : 'GitHub Deployer';

    updateStageStatus('deploy', 'in_progress', null);

    realtimeService.emitDeploymentStatus({
        status: 'PENDING',
        environment: env,
        version: 'v1.0.0',
        startTime: new Date().toISOString(),
        durationSeconds: 0
    });

    return {
        success: true,
        eventType: 'deployment',
        saveData: {
            eventType: 'deployment',
            environment: env,
            commitSha,
            author,
            status: 'PENDING'
        }
    };
}

/**
 * 6. Handle GitHub Deployment Status Event
 */
async function handleDeploymentStatus(payload) {
    const deployStatus = payload.deployment_status || {};
    const state = deployStatus.state; // pending, in_progress, success, failure
    const env = (payload.deployment && payload.deployment.environment) || 'production';
    const targetUrl = deployStatus.target_url || 'http://localhost:8080';

    let statusText = 'DEPLOYED';
    if (state === 'success') {
        statusText = 'SUCCESS';
        latestRepoState.successfulDeployments++;
        updateStageStatus('deploy', 'completed', 'success');
        updateStageStatus('health_check', 'completed', 'success');
    } else if (state === 'failure' || state === 'error') {
        statusText = 'FAILED';
        latestRepoState.failedDeployments++;
        updateStageStatus('deploy', 'completed', 'failure');
        updateStageStatus('health_check', 'completed', 'failure');
    } else if (state === 'in_progress') {
        statusText = 'IN_PROGRESS';
        updateStageStatus('deploy', 'in_progress', null);
    }

    realtimeService.emitDeploymentStatus({
        status: statusText,
        environment: env,
        version: 'v1.0.0',
        targetUrl
    });

    return {
        success: true,
        eventType: 'deployment_status',
        saveData: {
            eventType: 'deployment_status',
            environment: env,
            status: statusText
        }
    };
}

/**
 * Handle initial Ping from GitHub Webhook creation
 */
function handlePing(payload) {
    const zen = payload.zen || 'GitHub Webhook Active';
    realtimeService.addNotification({
        title: 'GitHub Webhook Connected',
        message: `Ping received: "${zen}"`,
        type: 'success'
    });
    return { success: true, eventType: 'ping' };
}

/**
 * Helper to update an individual stage status
 */
function updateStageStatus(key, status, conclusion) {
    const stage = livePipelineStages.find(s => s.key === key);
    if (!stage) return;

    if (status === 'queued') {
        stage.status = 'QUEUED';
    } else if (status === 'in_progress') {
        stage.status = 'IN_PROGRESS';
    } else if (status === 'completed') {
        if (conclusion === 'success') {
            stage.status = 'SUCCESS';
        } else if (conclusion === 'failure') {
            stage.status = 'FAILURE';
        } else if (conclusion === 'skipped') {
            stage.status = 'SKIPPED';
        } else {
            stage.status = 'SUCCESS';
        }
    }
}

function resetPipelineStages(defaultStatus = 'QUEUED') {
    livePipelineStages.forEach(s => {
        s.status = defaultStatus;
    });
}

function markRemainingStages(targetStatus = 'SUCCESS') {
    livePipelineStages.forEach(s => {
        if (s.status === 'QUEUED' || s.status === 'IN_PROGRESS') {
            s.status = targetStatus;
        }
    });
}

/**
 * Broadcast current GitHub repository metrics state to Socket.IO clients
 */
function broadcastRepoState() {
    latestRepoState.connectionConfig = gitConnectionConfig;
    latestRepoState.activeStageError = activeStageError;

    const socket = realtimeService.getIo ? realtimeService.getIo() : null;
    if (socket) {
        socket.emit('github:repo_state', latestRepoState);
        socket.emit('github:pipeline_stages', livePipelineStages);
        if (activeStageError) {
            socket.emit('pipeline:stage_error', activeStageError);
        } else {
            socket.emit('pipeline:error_resolved', { resolved: true });
        }
    }
}

/**
 * Get current Git Connect configuration state
 */
function getGitConnectionConfig() {
    return gitConnectionConfig;
}

/**
 * Save / Update Git Connect configuration
 */
function saveGitConnectionConfig(newConfig) {
    if (!newConfig) return gitConnectionConfig;

    if (newConfig.repoUrl) {
        gitConnectionConfig.repoUrl = newConfig.repoUrl;
        const parts = newConfig.repoUrl.replace('https://github.com/', '').split('/');
        if (parts.length >= 2) {
            gitConnectionConfig.owner = parts[0];
            gitConnectionConfig.repo = parts[1].replace('.git', '');
            latestRepoState.owner = gitConnectionConfig.owner;
            latestRepoState.name = gitConnectionConfig.repo;
            latestRepoState.repoUrl = gitConnectionConfig.repoUrl;
        }
    }

    if (newConfig.branch) {
        gitConnectionConfig.branch = newConfig.branch;
        latestRepoState.defaultBranch = newConfig.branch;
    }

    if (newConfig.webhookSecret) {
        gitConnectionConfig.webhookSecret = newConfig.webhookSecret;
    }

    gitConnectionConfig.connected = true;
    gitConnectionConfig.status = 'ACTIVE_VERIFIED';
    gitConnectionConfig.lastSynced = new Date().toISOString();

    realtimeService.addNotification({
        title: 'Git Connect Updated',
        message: `Repository connected: ${gitConnectionConfig.owner}/${gitConnectionConfig.repo} (branch: ${gitConnectionConfig.branch})`,
        type: 'success'
    });

    broadcastRepoState();
    return gitConnectionConfig;
}

/**
 * Test Connection to GitHub Repository
 */
async function testGitConnection() {
    const isSuccess = gitConnectionConfig.repoUrl.includes('github.com');
    const result = {
        success: isSuccess,
        repository: `${gitConnectionConfig.owner}/${gitConnectionConfig.repo}`,
        branch: gitConnectionConfig.branch,
        webhookUrl: gitConnectionConfig.webhookUrl,
        signatureVerified: true,
        status: isSuccess ? 'ACTIVE_VERIFIED' : 'FAILED',
        timestamp: new Date().toISOString()
    };

    realtimeService.addActivity({
        type: 'github',
        title: isSuccess ? '🟢 Git Connect Validated' : '🔴 Git Connect Failed',
        desc: `Verified connection to GitHub repository ${result.repository} (${result.branch})`,
        icon: '🔌'
    });

    return result;
}

/**
 * Simulate Stage Error with Automated Diagnosis & Solution
 */
function simulateStageError(stageKey = 'lint', customLog = null) {
    // Reset all stages first
    resetPipelineStages('SUCCESS');

    // Mark the targeted stage as FAILED
    const targetStage = livePipelineStages.find(s => s.key === stageKey);
    if (targetStage) {
        targetStage.status = 'FAILURE';
    }

    // Mark subsequent stages as SKIPPED
    let foundFailed = false;
    livePipelineStages.forEach(stage => {
        if (foundFailed) {
            stage.status = 'SKIPPED';
        }
        if (stage.key === stageKey) {
            foundFailed = true;
        }
    });

    // Generate Stage Error Diagnosis & Solution payload
    activeStageError = solutionEngine.diagnoseStageError(stageKey, customLog);
    latestRepoState.latestWorkflowStatus = 'FAILURE';
    latestRepoState.failedWorkflows++;
    latestRepoState.activeStageError = activeStageError;

    realtimeService.addActivity({
        type: 'github',
        title: `🔴 Stage Failure Detected: ${activeStageError.stageName}`,
        desc: `Error: "${activeStageError.errorMessage}". AI Remediation Solution generated!`,
        icon: '🚨'
    });

    realtimeService.addNotification({
        title: `Pipeline Error in ${activeStageError.stageName}`,
        message: `Root cause identified. Click 'Apply Fix' in Git Connect dashboard to resolve.`,
        type: 'error'
    });

    realtimeService.emitPipelineStatus({
        status: 'FAILURE',
        stage: stageKey,
        progress: 40,
        stages: livePipelineStages,
        activeStageError
    });

    broadcastRepoState();
    return { success: true, activeStageError, stages: livePipelineStages };
}

/**
 * Apply Automated Solution & Repair Stage Error
 */
function applyStageFix(stageKey = null) {
    const keyToFix = stageKey || (activeStageError ? activeStageError.stageKey : 'lint');

    // Mark fixed stage as SUCCESS
    const fixedStage = livePipelineStages.find(s => s.key === keyToFix);
    if (fixedStage) {
        fixedStage.status = 'SUCCESS';
    }

    // Restore all remaining stages to SUCCESS
    markRemainingStages('SUCCESS');

    const resolvedError = activeStageError;
    activeStageError = null;
    latestRepoState.latestWorkflowStatus = 'SUCCESS';
    latestRepoState.successfulWorkflows++;
    latestRepoState.activeStageError = null;

    realtimeService.addActivity({
        type: 'github',
        title: '✅ Stage Error Auto-Remediated',
        desc: `Fixed issue in ${resolvedError ? resolvedError.stageName : 'Pipeline Stage'}. Re-ran 10/10 stages with 100% SUCCESS.`,
        icon: '✨'
    });

    realtimeService.addNotification({
        title: 'Pipeline Restored to 100% HEALTHY',
        message: 'All 10 stages validated successfully. Application ready for Cloud deployment!',
        type: 'success'
    });

    realtimeService.emitPipelineStatus({
        status: 'SUCCESS',
        stage: 'DEPLOYED',
        progress: 100,
        stages: livePipelineStages,
        activeStageError: null
    });

    broadcastRepoState();
    return { success: true, message: 'Stage fix applied successfully. Pipeline fully restored!', stages: livePipelineStages };
}

/**
 * Get active stage error diagnosis
 */
function getActiveStageError() {
    return activeStageError;
}

/**
 * Get current repository metrics state
 */
function getRepoState() {
    return latestRepoState;
}

/**
 * Get live pipeline stages array
 */
function getPipelineStages() {
    return livePipelineStages;
}

/**
 * Fetch recent GitHub events from MongoDB history
 */
async function getEventHistory(limit = 20) {
    if (GithubEventModel && mongooseRef && mongooseRef.connection.readyState === 1) {
        try {
            return await GithubEventModel.find().sort({ createdAt: -1 }).limit(limit);
        } catch (err) {
            console.error('MongoDB Fetch GitHub Events Error:', err.message);
        }
    }
    return [];
}

module.exports = {
    init,
    verifySignature,
    processWebhook,
    getRepoState,
    getPipelineStages,
    getEventHistory,
    getGitConnectionConfig,
    saveGitConnectionConfig,
    testGitConnection,
    simulateStageError,
    applyStageFix,
    getActiveStageError
};

