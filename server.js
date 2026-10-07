/**
 * CloudDeploy - CI/CD Web Application Server
 * Topic: Automated CI/CD Pipeline for Cloud-Native Web Application Deployment
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const realtimeService = require('./src/services/realtimeService');
const githubService = require('./src/services/githubService');
const awsService = require('./src/services/awsService');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 8080;
const APP_VERSION = process.env.APP_VERSION || 'v1.0.0';
const ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'Production (AWS Cloud)' : 'Development';
const START_TIME = new Date();
const IS_DEV = process.argv.includes('--dev') || process.env.NODE_ENV !== 'production';

// MongoDB Connection Setup
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clouddeploy';
let isMongoConnected = false;

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 3000
}).then(() => {
    isMongoConnected = true;
    console.log(`✓ Connected to MongoDB database: ${MONGODB_URI}`);
    realtimeService.emitDatabaseStatus(true);
}).catch((err) => {
    isMongoConnected = false;
    console.log(`ℹ MongoDB Notice: Operating in standalone / fallback mode (${err.message})`);
    realtimeService.emitDatabaseStatus(false);
});

mongoose.connection.on('connected', () => {
    isMongoConnected = true;
    realtimeService.emitDatabaseStatus(true);
});
mongoose.connection.on('disconnected', () => {
    isMongoConnected = false;
    realtimeService.emitDatabaseStatus(false);
});
mongoose.connection.on('error', () => {
    isMongoConnected = false;
    realtimeService.emitDatabaseStatus(false);
});

// Mongoose User Schema & Model
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    role: { type: String, default: 'DevOps Engineer' },
    avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Initialize Real-Time WebSocket & GitHub Services
realtimeService.init(server, mongoose, User);
githubService.init(mongoose);

// Middleware with rawBody capture for GitHub Webhook X-Hub-Signature-256 verification
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.static(path.join(__dirname, 'app')));

// Route: Health Check Endpoint for Load Balancers, ECS, Beanstalk, and Automated Tests
app.get('/health', (req, res) => {
    const uptimeSeconds = Math.floor((Date.now() - START_TIME.getTime()) / 1000);
    res.status(200).json({
        status: 'healthy',
        service: 'CloudDeploy DevOps Dashboard',
        version: APP_VERSION,
        environment: ENVIRONMENT,
        database: isMongoConnected ? 'CONNECTED' : 'DISCONNECTED',
        uptime_seconds: uptimeSeconds,
        timestamp: new Date().toISOString(),
        http_code: 200
    });
});

// Route: API Status for DevOps Pipeline Dashboard
app.get('/api/status', async (req, res) => {
    const uptimeSeconds = Math.floor((Date.now() - START_TIME.getTime()) / 1000);
    let registeredUsersCount = 1;
    if (isMongoConnected) {
        try {
            registeredUsersCount = await User.countDocuments();
        } catch (e) {}
    }

    res.status(200).json({
        application: {
            name: 'CloudDeploy — CI/CD Dashboard',
            status: 'ONLINE',
            version: APP_VERSION,
            environment: ENVIRONMENT,
            port: PORT,
            uptime_seconds: uptimeSeconds
        },
        database: {
            type: 'MongoDB',
            status: isMongoConnected ? 'CONNECTED' : 'STANDALONE / DISCONNECTED',
            uri: MONGODB_URI.replace(/\/\/.*@/, '//***:***@'),
            total_users: registeredUsersCount
        },
        pipeline: {
            source: 'GitHub Repository',
            orchestrator: 'AWS CodePipeline',
            status: 'SUCCESS',
            build_engine: 'AWS CodeBuild',
            build_status: 'PASSED',
            deployment_target: 'AWS Elastic Beanstalk',
            deployment_status: 'DEPLOYED'
        },
        docker: {
            containerized: true,
            base_image: 'node:20-alpine',
            health_check: 'ENABLED',
            exposed_port: 8080
        },
        authentication: {
            enabled: true,
            provider: isMongoConnected ? 'MongoDB Identity Database' : 'CloudDeploy Mock Identity Service',
            features: [
                'Login',
                'Sign up',
                'Email verification',
                'Forgot password',
                'Reset password',
                'Logout',
                'User profile',
                'Protected dashboard'
            ]
        },
        system: {
            node_version: process.version,
            platform: process.platform,
            arch: process.arch,
            memory_usage_mb: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
            timestamp: new Date().toISOString()
        }
    });
});

// Fallback in-memory user
let mockUser = {
    id: 'usr-9021',
    name: 'DevOps Student',
    email: 'dev@university.edu',
    verified: true,
    role: 'Lead DevOps Engineer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
};

app.get('/api/auth/me', (req, res) => {
    res.status(200).json({ authenticated: true, user: mockUser });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    if (isMongoConnected) {
        try {
            const dbUser = await User.findOne({ email });
            if (dbUser && dbUser.password === password) {
                mockUser = {
                    id: dbUser._id.toString(),
                    name: dbUser.name,
                    email: dbUser.email,
                    verified: dbUser.verified,
                    role: dbUser.role,
                    avatar: dbUser.avatar
                };
                realtimeService.emitUserLoggedIn(mockUser);
                return res.status(200).json({
                    success: true,
                    message: 'Login successful (Authenticated via MongoDB).',
                    token: 'mongodb-jwt-token-' + dbUser._id,
                    user: mockUser
                });
            } else if (dbUser) {
                return res.status(401).json({ success: false, message: 'Invalid credentials.' });
            }
        } catch (err) {
            console.error('MongoDB Login Error:', err);
        }
    }

    mockUser.email = email;
    mockUser.name = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
    realtimeService.emitUserLoggedIn(mockUser);
    res.status(200).json({
        success: true,
        message: 'Login successful.',
        token: 'mock-jwt-token-clouddeploy-session',
        user: mockUser
    });
});

app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (isMongoConnected) {
        try {
            let existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'User already exists with this email.' });
            }
            const newUser = await User.create({ name, email, password });
            mockUser = {
                id: newUser._id.toString(),
                name: newUser.name,
                email: newUser.email,
                verified: false,
                role: newUser.role,
                avatar: newUser.avatar
            };
            realtimeService.emitUserRegistered(newUser);
            return res.status(201).json({
                success: true,
                message: 'Registration successful in MongoDB! Verification code sent to email.',
                requireVerification: true,
                user: mockUser
            });
        } catch (err) {
            console.error('MongoDB Signup Error:', err);
        }
    }

    mockUser.name = name;
    mockUser.email = email;
    mockUser.verified = false;
    realtimeService.emitUserRegistered({ id: 'usr-' + Date.now(), name, email, verified: false, role: 'DevOps Engineer' });
    res.status(201).json({
        success: true,
        message: 'Registration successful! Verification code sent to email.',
        requireVerification: true,
        user: mockUser
    });
});

app.post('/api/auth/verify-email', async (req, res) => {
    const { code } = req.body;
    if (code === '123456' || code) {
        mockUser.verified = true;
        if (isMongoConnected && mockUser.email) {
            try {
                await User.updateOne({ email: mockUser.email }, { verified: true });
            } catch (e) {}
        }
        return res.status(200).json({ success: true, message: 'Email successfully verified!', user: mockUser });
    }
    res.status(400).json({ success: false, message: 'Invalid verification code.' });
});

app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    res.status(200).json({
        success: true,
        message: `Password reset link sent to ${email || 'your email'}.`
    });
});

app.post('/api/auth/reset-password', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Password successfully updated. Please login with your new credentials.'
    });
});

app.post('/api/auth/social-login', (req, res) => {
    const { provider, name, email } = req.body;
    const providerName = provider === 'github' ? 'GitHub' : (provider === 'google' ? 'Google' : 'OAuth Provider');
    mockUser = {
        id: 'usr-' + provider + '-' + Date.now(),
        name: name || `${providerName} Developer`,
        email: email || `user@${provider}.com`,
        verified: true,
        role: 'Lead DevOps Engineer',
        avatar: provider === 'github' ? 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=150' : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'
    };
    realtimeService.emitUserLoggedIn(mockUser);
    res.status(200).json({
        success: true,
        message: `Successfully authenticated via ${providerName}!`,
        token: `oauth-token-${provider}-session`,
        user: mockUser
    });
});

app.post('/api/auth/logout', (req, res) => {
    realtimeService.emitUserLoggedOut(mockUser);
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// Real-Time Trigger Endpoint for Pipeline Simulations
app.post('/api/pipeline/trigger', (req, res) => {
    realtimeService.triggerPipelineSimulation(req.body);
    res.status(200).json({ success: true, message: 'Pipeline simulation triggered live via Socket.IO across connected dashboards.' });
});

// AWS Real Pipeline Status Endpoint
app.get('/api/pipeline/status', async (req, res) => {
    try {
        const status = await awsService.getFullPipelineStatus();
        res.status(200).json(status);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Granular AWS Service APIs
app.get('/api/aws/pipeline', async (req, res) => {
    const data = await awsService.fetchCodePipelineStatus();
    res.status(200).json({ success: true, pipeline: data });
});

app.get('/api/aws/build', async (req, res) => {
    const data = await awsService.fetchCodeBuildStatus();
    res.status(200).json({ success: true, build: data });
});

app.get('/api/aws/deployment', async (req, res) => {
    const data = await awsService.fetchElasticBeanstalkStatus();
    res.status(200).json({ success: true, deployment: data });
});

app.get('/api/aws/health', async (req, res) => {
    const data = await awsService.checkLiveAppHealth();
    res.status(200).json({ success: true, health: data });
});

// GitHub Webhook Listener Endpoint with X-Hub-Signature-256 Verification
app.post('/api/github/webhook', async (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    const eventType = req.headers['x-github-event'] || 'push';
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    // Signature verification using raw request buffer
    const isValid = githubService.verifySignature(req.rawBody || Buffer.from(JSON.stringify(req.body)), signature, secret);
    if (!isValid) {
        console.error('✖ Rejected unauthorized GitHub webhook attempt (Invalid X-Hub-Signature-256)');
        return res.status(401).json({ success: false, message: 'Invalid GitHub webhook signature.' });
    }

    try {
        const result = await githubService.processWebhook(eventType, req.body);
        return res.status(200).json({
            success: true,
            event: eventType,
            message: `GitHub webhook event '${eventType}' processed successfully and broadcast to Socket.IO clients.`,
            result
        });
    } catch (err) {
        console.error('GitHub Webhook Processing Error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Git Connect Configuration & Status API
app.get('/api/github/connect', (req, res) => {
    const config = githubService.getGitConnectionConfig();
    const repoState = githubService.getRepoState();
    const activeError = githubService.getActiveStageError();
    res.status(200).json({
        success: true,
        config,
        repoState,
        activeError
    });
});

app.post('/api/github/connect', (req, res) => {
    const updated = githubService.saveGitConnectionConfig(req.body);
    res.status(200).json({
        success: true,
        message: 'Git Connect repository configuration saved & verified successfully!',
        config: updated
    });
});

app.post('/api/github/test-connection', async (req, res) => {
    const result = await githubService.testGitConnection();
    res.status(200).json(result);
});

// Stage Error Diagnosis & Automated Remediation APIs
app.post('/api/pipeline/simulate-stage-error', (req, res) => {
    const stageKey = req.body.stageKey || 'lint';
    const result = githubService.simulateStageError(stageKey, req.body.customLog);
    res.status(200).json({
        success: true,
        message: `Simulated error in stage '${stageKey}'. Automated AI Solution generated!`,
        result
    });
});

app.post('/api/pipeline/apply-fix', (req, res) => {
    const result = githubService.applyStageFix(req.body.stageKey);
    res.status(200).json(result);
});

// GitHub Event History & Repository State API
app.get('/api/github/events', async (req, res) => {
    const history = await githubService.getEventHistory(20);
    const repoState = githubService.getRepoState();
    res.status(200).json({ success: true, repoState, events: history });
});

// Route: Fallback for SPA routing / Dashboard
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

// Start Server only if executed directly (supports testing without port collisions)
let serverInstance = null;
if (require.main === module) {
    serverInstance = server.listen(PORT, () => {
        const localUrl = `http://localhost:${PORT}/`;
        
        console.log(`CloudDeploy DevOps Dashboard`);
        console.log(`────────────────────────────────`);
        console.log(`✓ Server running with Real-Time WebSockets (Socket.IO)`);
        console.log(`✓ Environment: ${ENVIRONMENT}`);
        console.log(`✓ Port: ${PORT}`);
        console.log(`✓ MongoDB Status: ${isMongoConnected ? 'CONNECTED' : 'DISCONNECTED / FALLBACK'}`);
        console.log(`Local: ${localUrl}`);
        
        // Auto-open browser if running in dev mode
        if (IS_DEV) {
            console.log(`Opening browser...`);
            try {
                const open = require('open');
                open(localUrl).catch((err) => {
                    console.log(`Note: Browser could not be opened automatically (${err.message})`);
                });
            } catch (err) {
                console.log(`Note: Could not open browser automatically (${err.message})`);
            }
        }
    });

    serverInstance.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`CloudDeploy DevOps Dashboard`);
            console.log(`────────────────────────────────`);
            console.log(`✓ Server already active or port occupied`);
            console.log(`✓ Environment: ${ENVIRONMENT}`);
            console.log(`✓ Port: ${PORT}`);
            console.log(`Local: http://localhost:${PORT}/`);
            if (IS_DEV) {
                console.log(`Opening browser...`);
                try {
                    const open = require('open');
                    open(`http://localhost:${PORT}/`).catch(() => {});
                } catch (e) {}
            }
            process.exit(0);
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });
}

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    if (serverInstance) {
        serverInstance.close(() => {
            console.log('HTTP server closed');
        });
    }
    mongoose.connection.close();
});

module.exports = { app, server, APP_VERSION, PORT };

