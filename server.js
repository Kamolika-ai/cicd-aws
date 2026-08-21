/**
 * CloudDeploy - CI/CD Web Application Server
 * Topic: Automated CI/CD Pipeline for Cloud-Native Web Application Deployment
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const APP_VERSION = process.env.APP_VERSION || 'v1.0.0';
const ENVIRONMENT = process.env.ENVIRONMENT || 'Production (AWS Cloud)';
const START_TIME = new Date();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'app')));

// Route: Health Check Endpoint for Load Balancers, ECS, Beanstalk, and Automated Tests
app.get('/health', (req, res) => {
    const uptimeSeconds = Math.floor((Date.now() - START_TIME.getTime()) / 1000);
    res.status(200).json({
        status: 'healthy',
        service: 'CloudDeploy DevOps Dashboard',
        version: APP_VERSION,
        environment: ENVIRONMENT,
        uptime_seconds: uptimeSeconds,
        timestamp: new Date().toISOString(),
        http_code: 200
    });
});

// Route: API Status for DevOps Pipeline Dashboard
app.get('/api/status', (req, res) => {
    const uptimeSeconds = Math.floor((Date.now() - START_TIME.getTime()) / 1000);
    res.status(200).json({
        application: {
            name: 'CloudDeploy — CI/CD Dashboard',
            status: 'ONLINE',
            version: APP_VERSION,
            environment: ENVIRONMENT,
            port: PORT,
            uptime_seconds: uptimeSeconds
        },
        pipeline: {
            source: 'GitHub Repository',
            orchestrator: 'AWS CodePipeline',
            status: 'SUCCESS',
            build_engine: 'AWS CodeBuild',
            build_status: 'PASSED',
            deployment_target: 'AWS Elastic Beanstalk / App Runner',
            deployment_status: 'DEPLOYED'
        },
        docker: {
            containerized: true,
            base_image: 'node:20-alpine',
            health_check: 'ENABLED',
            exposed_port: 8080
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

// Route: Fallback for SPA routing / Dashboard
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

// Start Server only if executed directly (supports testing without port collisions)
let serverInstance = null;
if (require.main === module) {
    serverInstance = app.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(`🚀 CloudDeploy CI/CD Web Application Started`);
        console.log(`📡 URL: http://localhost:${PORT}`);
        console.log(`🩺 Health Endpoint: http://localhost:${PORT}/health`);
        console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
        console.log(`🏷️  Version: ${APP_VERSION} | Environment: ${ENVIRONMENT}`);
        console.log(`=======================================================`);
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
});

module.exports = { app, APP_VERSION, PORT };
