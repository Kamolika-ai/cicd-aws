/**
 * CloudDeploy — Centralized Mock Data Layer
 * Topic: Automated CI/CD Pipeline for Cloud-Native Web Application Deployment
 * 
 * Provides mock data objects for Phase 1 Frontend UI/UX.
 * Designed to make Phase 2 backend integration seamless.
 */

const CloudDeployMock = {
    // Current Logged-in User Data
    user: {
        id: 'usr-9021',
        name: 'Alex Johnson',
        email: 'alex.johnson@university.edu',
        role: 'Lead DevOps Engineer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
        initials: 'AJ',
        verified: true,
        accountCreated: '2026-01-15',
        status: 'Active',
        security: {
            twoFactorEnabled: true,
            lastPasswordChange: '2026-07-10',
            activeSessionsCount: 2
        }
    },

    // Pipelines List & Details
    pipelines: [
        {
            id: 'pipe-prod',
            name: 'Production Release Pipeline',
            branch: 'main → production',
            status: 'SUCCESS',
            trigger: 'GitHub Push (main)',
            lastRun: '10 mins ago',
            duration: '3m 42s',
            stages: [
                { name: 'GitHub', step: 'STAGE 1', status: 'SUCCESS', desc: 'Webhook event received from main branch commit' },
                { name: 'Source', step: 'STAGE 2', status: 'SUCCESS', desc: 'AWS CodeStar fetched commit SHA 7f3a19b' },
                { name: 'Build', step: 'STAGE 3', status: 'SUCCESS', desc: 'AWS CodeBuild compiled Node.js runtime' },
                { name: 'Test', step: 'STAGE 4', status: 'SUCCESS', desc: 'npm test executed: 4/4 automated tests passed' },
                { name: 'Docker Build', step: 'STAGE 5', status: 'SUCCESS', desc: 'Built and tagged image clouddeploy-app:v1.0.0' },
                { name: 'Deploy', step: 'STAGE 6', status: 'SUCCESS', desc: 'AWS Elastic Beanstalk container deployed' },
                { name: 'Production', step: 'STAGE 7', status: 'SUCCESS', desc: 'Live app verified at GET /health -> 200 OK' }
            ]
        },
        {
            id: 'pipe-staging',
            name: 'Staging Integration Pipeline',
            branch: 'develop → staging',
            status: 'SUCCESS',
            trigger: 'Pull Request Merged',
            lastRun: '2 hours ago',
            duration: '2m 15s',
            stages: [
                { name: 'GitHub', step: 'STAGE 1', status: 'SUCCESS', desc: 'PR #42 merged into develop branch' },
                { name: 'Source', step: 'STAGE 2', status: 'SUCCESS', desc: 'CodeStar fetched commit SHA 4e9c12a' },
                { name: 'Build', step: 'STAGE 3', status: 'SUCCESS', desc: 'CodeBuild staging environment ready' },
                { name: 'Test', step: 'STAGE 4', status: 'SUCCESS', desc: 'Automated test suite passed' },
                { name: 'Docker Build', step: 'STAGE 5', status: 'SUCCESS', desc: 'Image tagged clouddeploy-app:staging' },
                { name: 'Deploy', step: 'STAGE 6', status: 'SUCCESS', desc: 'Deployed to Staging environment' },
                { name: 'Staging', step: 'STAGE 7', status: 'SUCCESS', desc: 'Staging endpoint active' }
            ]
        },
        {
            id: 'pipe-feature',
            name: 'Feature Branch CI Pipeline',
            branch: 'feature/auth-module → dev',
            status: 'FAILED',
            trigger: 'Git Push (feature/auth-module)',
            lastRun: '5 hours ago',
            duration: '1m 18s',
            stages: [
                { name: 'GitHub', step: 'STAGE 1', status: 'SUCCESS', desc: 'Commit pushed to feature/auth-module' },
                { name: 'Source', step: 'STAGE 2', status: 'SUCCESS', desc: 'CodeStar fetched commit SHA 9a11b8c' },
                { name: 'Build', step: 'STAGE 3', status: 'SUCCESS', desc: 'Node.js dependencies installed' },
                { name: 'Test', step: 'STAGE 4', status: 'FAILED', desc: 'Test failure: assertion failed in tests/test.js' },
                { name: 'Docker Build', step: 'STAGE 5', status: 'SKIPPED', desc: 'Build skipped due to pre_build test failure' },
                { name: 'Deploy', step: 'STAGE 6', status: 'SKIPPED', desc: 'Deployment aborted' },
                { name: 'Development', step: 'STAGE 7', status: 'SKIPPED', desc: 'Target environment preserved' }
            ]
        }
    ],

    // Builds History & Details
    builds: [
        {
            id: '#125',
            commit: '7f3a19b',
            branch: 'main',
            status: 'SUCCESS',
            duration: '3m 42s',
            author: 'Alex Johnson',
            time: '10 mins ago',
            message: 'chore: update production dashboard version to v1.0.0',
            testResults: { total: 4, passed: 4, failed: 0, coverage: '98.5%' },
            dockerStatus: 'Image Built & Pushed (clouddeploy-app:v1.0.0)',
            logs: [
                '10:42:01 INFO [AWS CodeBuild] Build container initialized (aws/codebuild/standard:7.0)',
                '10:42:04 INFO [PHASE 1 - INSTALL] Node.js v20.11.0, npm 10.2.4 detected',
                '10:42:15 INFO [PHASE 1 - INSTALL] Running: npm install --silent',
                '10:42:24 SUCCESS [PHASE 1 - INSTALL] Installed 73 packages in 9 seconds',
                '10:42:25 INFO [PHASE 2 - PRE_BUILD] Running automated unit test suite: npm test',
                '10:42:27 INFO [TEST] ✔ Health Check Endpoint (GET /health) -> Status: 200 OK',
                '10:42:28 INFO [TEST] ✔ Application Dashboard UI Content (GET /) -> HTML DOM Verified',
                '10:42:29 INFO [TEST] ✔ DevOps Status API (GET /api/status) -> Application: ONLINE',
                '10:42:30 INFO [TEST] ✔ Project File System Integrity -> Dockerfile & buildspec.yml verified',
                '10:42:31 SUCCESS [PHASE 2 - PRE_BUILD] 4/4 automated tests passed successfully (0 failures)',
                '10:42:32 INFO [PHASE 3 - BUILD] Executing: docker build -t clouddeploy-app:v1.0.0 .',
                '10:42:35 INFO [DOCKER] Step 1/8 : FROM node:20-alpine',
                '10:42:38 INFO [DOCKER] Step 4/8 : RUN npm install --omit=dev',
                '10:42:45 INFO [DOCKER] Step 7/8 : EXPOSE 8080',
                '10:43:10 SUCCESS [PHASE 3 - BUILD] Docker image built successfully: clouddeploy-app:v1.0.0',
                '10:43:12 INFO [PHASE 4 - POST_BUILD] Packaging Dockerrun.aws.json manifest',
                '10:43:20 SUCCESS [AWS CodePipeline] Build artifact uploaded to S3 bucket codepipeline-ap-south-1',
                '10:43:45 SUCCESS [AWS Elastic Beanstalk] Environment update complete. Live status: GREEN'
            ]
        },
        {
            id: '#124',
            commit: '4e9c12a',
            branch: 'develop',
            status: 'SUCCESS',
            duration: '2m 15s',
            author: 'Sarah Chen',
            time: '2 hours ago',
            message: 'feat: add interactive health inspector widget',
            testResults: { total: 4, passed: 4, failed: 0, coverage: '98.5%' },
            dockerStatus: 'Image Built & Pushed (clouddeploy-app:staging)',
            logs: [
                '08:15:00 INFO [AWS CodeBuild] Build triggered by GitHub Webhook',
                '08:15:10 INFO [PHASE 1 - INSTALL] npm install completed',
                '08:15:25 INFO [PHASE 2 - PRE_BUILD] Executing npm test',
                '08:15:35 SUCCESS [PHASE 2 - PRE_BUILD] All 4 unit tests passed',
                '08:16:45 SUCCESS [PHASE 3 - BUILD] Docker build complete',
                '08:17:15 SUCCESS [AWS CodePipeline] Deployment to Staging complete'
            ]
        },
        {
            id: '#123',
            commit: '9a11b8c',
            branch: 'feature/auth-module',
            status: 'FAILED',
            duration: '1m 18s',
            author: 'DevOps Student',
            time: '5 hours ago',
            message: 'test: intentional build failure test',
            testResults: { total: 4, passed: 3, failed: 1, coverage: '75.0%' },
            dockerStatus: 'Aborted due to test failure',
            logs: [
                '05:10:00 INFO [AWS CodeBuild] Build container initialized',
                '05:10:15 INFO [PHASE 1 - INSTALL] Dependencies installed',
                '05:10:20 INFO [PHASE 2 - PRE_BUILD] Running npm test...',
                '05:10:25 ERROR [TEST] ✖ Health Check Endpoint -> Expected status 200, got 500',
                '05:10:26 ERROR [PHASE 2 - PRE_BUILD] Automated test failed! Exiting with code 1.',
                '05:10:27 ERROR [AWS CodeBuild] BUILD FAILED during pre_build phase.',
                '05:10:28 WARN [AWS CodePipeline] Pipeline halted immediately. Production untouched.'
            ]
        },
        {
            id: '#122',
            commit: '3b8d41e',
            branch: 'main',
            status: 'SUCCESS',
            duration: '3m 10s',
            author: 'Alex Johnson',
            time: '1 day ago',
            message: 'docs: update architecture.md and viva guide',
            testResults: { total: 4, passed: 4, failed: 0, coverage: '98.5%' },
            dockerStatus: 'Image Built & Pushed (clouddeploy-app:v0.9.9)',
            logs: [
                '09:00:00 INFO [AWS CodeBuild] Build started',
                '09:01:20 SUCCESS [PHASE 2 - PRE_BUILD] All tests passed',
                '09:03:10 SUCCESS [AWS Elastic Beanstalk] Deployed successfully'
            ]
        }
    ],

    // Deployments History
    deployments: [
        {
            id: 'dep-901',
            environment: 'Production',
            version: 'v1.0.0',
            status: 'DEPLOYED',
            time: '10 mins ago',
            commit: '7f3a19b',
            duration: '1m 20s',
            deployedBy: 'AWS CodePipeline (Auto)',
            health: 'Healthy (HTTP 200)'
        },
        {
            id: 'dep-900',
            environment: 'Staging',
            version: 'v1.0.0-rc2',
            status: 'DEPLOYED',
            time: '2 hours ago',
            commit: '4e9c12a',
            duration: '58s',
            deployedBy: 'AWS CodePipeline (Auto)',
            health: 'Healthy (HTTP 200)'
        },
        {
            id: 'dep-899',
            environment: 'Development',
            version: 'v1.0.0-dev',
            status: 'DEPLOYED',
            time: '5 hours ago',
            commit: '3b8d41e',
            duration: '45s',
            deployedBy: 'Alex Johnson',
            health: 'Healthy (HTTP 200)'
        }
    ],

    // Environments Infrastructure Status
    environments: [
        {
            id: 'env-prod',
            name: 'Production',
            status: 'Healthy',
            version: 'v1.0.0',
            url: 'http://clouddeploy-prod.ap-south-1.elasticbeanstalk.com',
            region: 'aws ap-south-1 (Mumbai)',
            platform: 'Docker 20.10 / Amazon Linux 2023',
            metrics: {
                cpu: 18,
                memory: 34,
                responseTime: '12ms',
                uptime: '99.98%',
                containers: '1 Active Container (Port 8080)'
            }
        },
        {
            id: 'env-staging',
            name: 'Staging',
            status: 'Healthy',
            version: 'v1.0.0-rc2',
            url: 'http://clouddeploy-staging.ap-south-1.elasticbeanstalk.com',
            region: 'aws ap-south-1 (Mumbai)',
            platform: 'Docker 20.10 / Amazon Linux 2023',
            metrics: {
                cpu: 12,
                memory: 28,
                responseTime: '15ms',
                uptime: '99.95%',
                containers: '1 Active Container (Port 8080)'
            }
        },
        {
            id: 'env-dev',
            name: 'Development',
            status: 'Healthy',
            version: 'v1.0.0-dev',
            url: 'http://localhost:8080',
            region: 'Local Environment',
            platform: 'Node.js 20 Express Server',
            metrics: {
                cpu: 5,
                memory: 42,
                responseTime: '2ms',
                uptime: '100%',
                containers: 'Standalone / Containerized'
            }
        }
    ],

    // Comprehensive Live Log Stream Items
    logs: [
        { line: 101, timestamp: '10:42:01', level: 'INFO', message: 'AWS CodeBuild build container initialized (aws/codebuild/standard:7.0)' },
        { line: 102, timestamp: '10:42:04', level: 'INFO', message: 'Environment detected: Node.js v20.11.0, NPM 10.2.4' },
        { line: 103, timestamp: '10:42:15', level: 'INFO', message: 'Executing phase: install -> npm install --silent' },
        { line: 104, timestamp: '10:42:24', level: 'SUCCESS', message: 'Install completed successfully: 73 packages audited in 9s' },
        { line: 105, timestamp: '10:42:25', level: 'INFO', message: 'Executing phase: pre_build -> npm test' },
        { line: 106, timestamp: '10:42:27', level: 'SUCCESS', message: 'Test 1 Passed: GET /health returns HTTP 200 OK with status "healthy"' },
        { line: 107, timestamp: '10:42:28', level: 'SUCCESS', message: 'Test 2 Passed: GET / returns HTML DOM structure containing CloudDeploy brand' },
        { line: 108, timestamp: '10:42:29', level: 'SUCCESS', message: 'Test 3 Passed: GET /api/status returns JSON payload with status "ONLINE"' },
        { line: 109, timestamp: '10:42:30', level: 'SUCCESS', message: 'Test 4 Passed: File integrity verified for Dockerfile and buildspec.yml' },
        { line: 110, timestamp: '10:42:31', level: 'SUCCESS', message: 'Automated test suite passed 4/4 tests. Proceeding to Docker build.' },
        { line: 111, timestamp: '10:42:32', level: 'INFO', message: 'Executing phase: build -> docker build -t clouddeploy-app:v1.0.0 .' },
        { line: 112, timestamp: '10:42:35', level: 'INFO', message: 'Docker step 1/8: FROM node:20-alpine' },
        { line: 113, timestamp: '10:42:38', level: 'INFO', message: 'Docker step 4/8: RUN npm install --omit=dev --silent' },
        { line: 114, timestamp: '10:42:45', level: 'INFO', message: 'Docker step 7/8: EXPOSE 8080' },
        { line: 115, timestamp: '10:43:10', level: 'SUCCESS', message: 'Docker image built and tagged successfully: clouddeploy-app:v1.0.0' },
        { line: 116, timestamp: '10:43:12', level: 'INFO', message: 'Executing phase: post_build -> Packaging Dockerrun.aws.json manifest' },
        { line: 117, timestamp: '10:43:20', level: 'SUCCESS', message: 'Build artifact pushed to S3 bucket codepipeline-ap-south-1-49201' },
        { line: 118, timestamp: '10:43:45', level: 'SUCCESS', message: 'AWS Elastic Beanstalk deployment finished. Environment health: GREEN' }
    ],

    // GitHub-inspired Repository Representation
    repository: {
        name: 'cloud-native-cicd-project',
        branch: 'main',
        lastCommit: {
            sha: '7f3a19b',
            message: 'chore: update production dashboard version to v1.0.0',
            author: 'Alex Johnson',
            time: '10 mins ago'
        },
        files: [
            {
                name: 'Dockerfile',
                type: 'file',
                size: '1.3 KB',
                content: `# Dockerfile - Base Image: Node.js 20 Alpine Linux
FROM node:20-alpine
LABEL maintainer="DevOps Student <student@university.edu>" project="CloudDeploy"
WORKDIR /usr/src/app
ENV NODE_ENV=production PORT=8080 APP_VERSION=v1.0.0
COPY package*.json ./
RUN npm install --omit=dev --silent
COPY server.js ./
COPY app ./app
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget --quiet --spider http://localhost:8080/health || exit 1
CMD ["npm", "start"]`
            },
            {
                name: 'buildspec.yml',
                type: 'file',
                size: '2.5 KB',
                content: `# AWS CodeBuild Specification (buildspec.yml)
version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: 20
    commands:
      - echo "Installing dependencies..."
      - npm install
  pre_build:
    commands:
      - echo "Running automated tests..."
      - npm test
  build:
    commands:
      - echo "Building Docker image..."
      - docker build -t clouddeploy-app:latest .
  post_build:
    commands:
      - echo "Preparing deployment artifacts..."
artifacts:
  files:
    - 'Dockerrun.aws.json'
    - 'Dockerfile'
    - 'package.json'
    - 'server.js'
    - 'app/**/*'`
            },
            {
                name: 'server.js',
                type: 'file',
                size: '3.4 KB',
                content: `const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.static('app'));
app.get('/health', (req, res) => res.json({ status: 'healthy', version: 'v1.0.0' }));
app.listen(PORT, () => console.log('Server running on port ' + PORT));`
            },
            {
                name: 'package.json',
                type: 'file',
                size: '529 B',
                content: `{
  "name": "cloud-native-cicd-project",
  "version": "1.0.0",
  "scripts": {
    "dev": "node server.js --dev",
    "start": "node server.js",
    "test": "node tests/test.js"
  },
  "dependencies": {
    "express": "^4.21.2",
    "open": "^8.4.2"
  }
}`
            },
            {
                name: 'Dockerrun.aws.json',
                type: 'file',
                size: '194 B',
                content: `{
  "AWSEBDockerrunVersion": "1",
  "Image": {
    "Name": "clouddeploy-app",
    "Update": "true"
  },
  "Ports": [
    {
      "ContainerPort": "8080"
    }
  ]
}`
            },
            {
                name: 'app/',
                type: 'folder',
                size: '3 items',
                content: 'app/index.html\napp/style.css\napp/script.js'
            },
            {
                name: 'tests/',
                type: 'folder',
                size: '1 item',
                content: 'tests/test.js'
            },
            {
                name: 'docs/',
                type: 'folder',
                size: '4 items',
                content: 'docs/architecture.md\ndocs/deployment.md\ndocs/ci-cd-pipeline.md\ndocs/viva-questions.md'
            }
        ]
    },

    // Settings Data Model
    settings: {
        general: {
            projectName: 'CloudDeploy — CI/CD Dashboard',
            defaultBranch: 'main',
            environmentMode: 'Production (AWS Elastic Beanstalk)'
        },
        cicd: {
            autoDeployOnPush: true,
            autoRunTests: true,
            pipelineTrigger: 'GitHub Webhook (CodeStar Connection)',
            buildTimeoutMinutes: 10
        },
        notifications: {
            deploymentSuccessEmail: true,
            buildFailureAlert: true,
            slackWebhook: 'https://hooks.slack.com/services/T00/B00/XXXXX'
        },
        security: {
            require2FA: true,
            sessionTimeoutMinutes: 60,
            cognitoConfigured: false,
            cognitoNote: 'AWS Cognito configuration is required as a manual AWS setup step.'
        }
    }
};

// Export to window for global client access
window.CloudDeployMock = CloudDeployMock;
