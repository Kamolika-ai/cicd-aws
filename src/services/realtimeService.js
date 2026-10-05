/**
 * CloudDeploy — Real-Time WebSocket Service (Socket.IO)
 * Centralized real-time event distribution layer for live pipeline status,
 * user registration, system health, deployment monitoring, and notifications.
 */

const { Server } = require('socket.io');

let io = null;
let mongooseRef = null;
let UserRef = null;
let startTime = new Date();

// State Store
let activeConnectionsCount = 0;
let currentPipelineState = {
    status: 'SUCCESS',
    stage: 'DEPLOYED',
    pipelineId: 'pipe-aws-prod-0881',
    branch: 'main',
    commit: '7f3a19b',
    commitMessage: 'feat(auth): enable real-time user registration & socket sync',
    author: 'DevOps Lead',
    updatedAt: new Date().toISOString(),
    progress: 100,
    stages: [
        { name: 'Source', status: 'SUCCESS', desc: 'GitHub Push SHA 7f3a19b' },
        { name: 'CodeBuild', status: 'SUCCESS', desc: 'Pre-build unit tests passed (4/4)' },
        { name: 'Docker', status: 'SUCCESS', desc: 'Image node:20-alpine containerized' },
        { name: 'Deploy', status: 'SUCCESS', desc: 'AWS Elastic Beanstalk active' }
    ]
};

let currentDeploymentState = {
    id: 'dep-9041',
    environment: 'Production (AWS Cloud)',
    version: 'v1.0.0',
    status: 'DEPLOYED',
    startTime: new Date(Date.now() - 3600000).toISOString(),
    durationSeconds: 142,
    target: 'AWS Elastic Beanstalk (ap-south-1)',
    health: 'HEALTHY'
};

// Activity log feed buffer (max 30 items)
let activityFeed = [
    { id: 'act-1', type: 'system', title: 'Backend Online', desc: 'CloudDeploy Node.js server started', timestamp: new Date().toISOString(), icon: '🖥️' },
    { id: 'act-2', type: 'db', title: 'Database Connected', desc: 'Connected to local MongoDB (clouddeploy)', timestamp: new Date().toISOString(), icon: '🍃' },
    { id: 'act-3', type: 'pipeline', title: 'Pipeline Success', desc: 'AWS CodePipeline completed build #125', timestamp: new Date(Date.now() - 1200000).toISOString(), icon: '⚡' }
];

// Notifications buffer (max 20 items)
let notifications = [
    { id: 'notif-1', title: 'System Ready', message: 'Real-time WebSocket server connected.', type: 'info', timestamp: new Date().toISOString() }
];

/**
 * Initialize Socket.IO server
 */
function init(server, mongooseInstance, UserModel) {
    mongooseRef = mongooseInstance;
    UserRef = UserModel;
    startTime = new Date();

    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', async (socket) => {
        activeConnectionsCount++;
        console.log(`⚡ [Socket.IO] Client connected: ${socket.id} (Total live: ${activeConnectionsCount})`);

        // Send initial state to newly connected client
        const initialStats = await getStats();
        socket.emit('initial:state', {
            stats: initialStats,
            pipeline: currentPipelineState,
            deployment: currentDeploymentState,
            activityFeed: activityFeed.slice(0, 15),
            notifications: notifications.slice(0, 10)
        });

        // Broadcast active connections count to all clients
        broadcastStats();

        // Handle client trigger for pipeline simulation
        socket.on('pipeline:trigger', (data) => {
            triggerPipelineSimulation(data);
        });

        // Handle client disconnect
        socket.on('disconnect', () => {
            activeConnectionsCount = Math.max(0, activeConnectionsCount - 1);
            console.log(`⚡ [Socket.IO] Client disconnected: ${socket.id} (Total live: ${activeConnectionsCount})`);
            broadcastStats();
        });
    });

    return io;
}

/**
 * Get consolidated stats for real-time dashboard
 */
async function getStats() {
    let totalUsers = 1;
    let dbStatus = 'DISCONNECTED';

    if (mongooseRef && mongooseRef.connection && mongooseRef.connection.readyState === 1) {
        dbStatus = 'CONNECTED';
        if (UserRef) {
            try {
                totalUsers = await UserRef.countDocuments();
            } catch (e) {
                totalUsers = 1;
            }
        }
    }

    const uptimeSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);

    return {
        serverStatus: 'ONLINE',
        dbStatus,
        uptimeSeconds,
        totalUsers,
        activeConnectionsCount,
        pipelineStatus: currentPipelineState.status,
        deploymentStatus: currentDeploymentState.status,
        timestamp: new Date().toISOString()
    };
}

/**
 * Broadcast current system statistics to all connected clients
 */
async function broadcastStats() {
    if (!io) return;
    const stats = await getStats();
    io.emit('stats:update', stats);
}

/**
 * Emit database connection status change
 */
function emitDatabaseStatus(isConnected) {
    if (!io) return;
    const statusText = isConnected ? 'CONNECTED' : 'DISCONNECTED';
    io.emit('db:status', {
        status: statusText,
        message: isConnected ? 'Connected to local MongoDB database (clouddeploy)' : 'MongoDB disconnected. Operating in standalone fallback mode.',
        timestamp: new Date().toISOString()
    });

    addActivity({
        type: 'db',
        title: isConnected ? 'Database Connected' : 'Database Disconnected',
        desc: isConnected ? 'MongoDB local server active' : 'MongoDB connection lost / fallback mode',
        icon: isConnected ? '🍃' : '⚠️'
    });

    addNotification({
        title: isConnected ? 'MongoDB Connected' : 'MongoDB Disconnected',
        message: isConnected ? 'Real-time sync restored with MongoDB.' : 'Database connection unavailable.',
        type: isConnected ? 'success' : 'warning'
    });

    broadcastStats();
}

/**
 * Emit user registered event
 */
async function emitUserRegistered(user) {
    if (!io) return;

    // Sanitize user object: DO NOT expose password or secret tokens
    const safeUser = {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'DevOps Engineer',
        verified: !!user.verified,
        createdAt: user.createdAt || new Date().toISOString()
    };

    io.emit('user:registered', {
        user: safeUser,
        timestamp: new Date().toISOString()
    });

    addActivity({
        type: 'user',
        title: 'User Registered',
        desc: `New engineer ${safeUser.name} (${safeUser.email}) created an account`,
        icon: '👤'
    });

    addNotification({
        title: 'New User Registered',
        message: `${safeUser.name} registered as ${safeUser.role}.`,
        type: 'info'
    });

    broadcastStats();
}

/**
 * Emit user logged in event
 */
function emitUserLoggedIn(user) {
    if (!io) return;

    const safeUser = {
        name: user.name,
        email: user.email,
        role: user.role || 'DevOps Engineer'
    };

    io.emit('user:login', {
        user: safeUser,
        timestamp: new Date().toISOString()
    });

    addActivity({
        type: 'user',
        title: 'User Logged In',
        desc: `${safeUser.name} authenticated into dashboard`,
        icon: '🔑'
    });

    broadcastStats();
}

/**
 * Emit user logged out event
 */
function emitUserLoggedOut(user) {
    if (!io) return;

    io.emit('user:logout', {
        name: user ? user.name : 'User',
        timestamp: new Date().toISOString()
    });

    addActivity({
        type: 'user',
        title: 'User Logged Out',
        desc: `${user ? user.name : 'A user'} logged out of session`,
        icon: '🚪'
    });
}

/**
 * Emit Pipeline Status update across all stages
 */
function emitPipelineStatus(statusDetails) {
    currentPipelineState = { ...currentPipelineState, ...statusDetails, updatedAt: new Date().toISOString() };
    if (!io) return;

    io.emit('pipeline:update', currentPipelineState);

    addActivity({
        type: 'pipeline',
        title: `Pipeline ${statusDetails.status || 'Updated'}`,
        desc: `AWS CodePipeline stage: ${statusDetails.stage || statusDetails.status}`,
        icon: '⚡'
    });

    addNotification({
        title: `CI/CD Pipeline ${statusDetails.status}`,
        message: `Pipeline execution updated to stage: ${statusDetails.stage || statusDetails.status}.`,
        type: statusDetails.status === 'SUCCESS' ? 'success' : (statusDetails.status === 'FAILED' ? 'error' : 'info')
    });

    broadcastStats();
}

/**
 * Emit Deployment Status update
 */
function emitDeploymentStatus(deploymentData) {
    currentDeploymentState = { ...currentDeploymentState, ...deploymentData, updatedAt: new Date().toISOString() };
    if (!io) return;

    io.emit('deployment:update', currentDeploymentState);

    addActivity({
        type: 'deployment',
        title: `Deployment ${deploymentData.status}`,
        desc: `AWS Elastic Beanstalk target: ${deploymentData.environment || 'Production'}`,
        icon: '🚀'
    });

    broadcastStats();
}

/**
 * Helper to push and emit new live activity item
 */
function addActivity(item) {
    const activityObj = {
        id: 'act-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        ...item
    };

    activityFeed.unshift(activityObj);
    if (activityFeed.length > 30) activityFeed.pop();

    if (io) {
        io.emit('activity:new', activityObj);
    }
}

/**
 * Helper to push and emit notification
 */
function addNotification(notificationData) {
    const notificationObj = {
        id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        ...notificationData
    };

    notifications.unshift(notificationObj);
    if (notifications.length > 20) notifications.pop();

    if (io) {
        io.emit('notification:new', notificationObj);
    }
}

/**
 * Simulate live CI/CD pipeline step-by-step execution across all clients
 */
function triggerPipelineSimulation(customData = {}) {
    if (!io) return;

    const stages = [
        { status: 'QUEUED', stage: 'QUEUED', progress: 10, desc: 'Git webhook received, queuing AWS CodePipeline' },
        { status: 'BUILDING', stage: 'BUILDING', progress: 35, desc: 'AWS CodeBuild compiling container & running npm tests' },
        { status: 'TESTING', stage: 'TESTING', progress: 55, desc: 'Automated test suite executing (4/4 tests)' },
        { status: 'SCANNING', stage: 'SCANNING', progress: 75, desc: 'Static code security analysis & vulnerability scan' },
        { status: 'DEPLOYING', stage: 'DEPLOYING', progress: 90, desc: 'Deploying Docker image to AWS Elastic Beanstalk' },
        { status: 'SUCCESS', stage: 'DEPLOYED', progress: 100, desc: 'Deployment complete! All health checks passed' }
    ];

    let currentStepIndex = 0;

    const interval = setInterval(() => {
        if (currentStepIndex >= stages.length) {
            clearInterval(interval);
            return;
        }

        const step = stages[currentStepIndex];
        const update = {
            status: step.status,
            stage: step.stage,
            progress: step.progress,
            pipelineId: customData.pipelineId || 'pipe-aws-prod-0881',
            branch: customData.branch || 'main',
            commit: customData.commit || '7f3a19b',
            commitMessage: customData.commitMessage || 'feat(realtime): live pipeline execution',
            author: customData.author || 'DevOps Engineer',
            stages: [
                { name: 'Source', status: 'SUCCESS', desc: 'GitHub Push' },
                { name: 'CodeBuild', status: step.progress >= 35 ? 'SUCCESS' : (step.progress >= 10 ? 'IN_PROGRESS' : 'PENDING'), desc: step.desc },
                { name: 'Docker', status: step.progress >= 75 ? 'SUCCESS' : (step.progress >= 35 ? 'IN_PROGRESS' : 'PENDING'), desc: 'Base node:20-alpine' },
                { name: 'Deploy', status: step.progress >= 100 ? 'SUCCESS' : (step.progress >= 90 ? 'IN_PROGRESS' : 'PENDING'), desc: 'AWS Elastic Beanstalk' }
            ]
        };

        emitPipelineStatus(update);

        if (step.status === 'SUCCESS') {
            emitDeploymentStatus({
                status: 'DEPLOYED',
                version: 'v1.0.0',
                environment: 'Production (AWS Cloud)',
                startTime: new Date().toISOString(),
                durationSeconds: 38
            });
        }

        currentStepIndex++;
    }, 1800);
}

function getIo() {
    return io;
}

module.exports = {
    init,
    getIo,
    getStats,
    broadcastStats,
    emitDatabaseStatus,
    emitUserRegistered,
    emitUserLoggedIn,
    emitUserLoggedOut,
    emitPipelineStatus,
    emitDeploymentStatus,
    triggerPipelineSimulation,
    addActivity,
    addNotification
};
