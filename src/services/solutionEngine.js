/**
 * CloudDeploy — Automated Pipeline Stage Error Diagnosis & Remediation Engine
 * Topic: Automated CI/CD Pipeline for Cloud-Native Web Application Deployment
 * 
 * Analyzes errors across all 10 CI/CD stages, identifies root causes, 
 * provides actionable step-by-step remediation solutions, and generates code fixes.
 */

const STAGE_SOLUTIONS = {
    checkout: {
        name: 'Stage 1 — Checkout Repository Source Code',
        icon: '📥',
        errorCategory: 'GIT_AUTHENTICATION_OR_BRANCH_ERROR',
        defaultMessage: 'Failed to checkout repository branch or commit SHA.',
        rootCause: 'GitHub Actions runner could not fetch git references due to invalid token permissions, non-existent branch, or depth restrictions.',
        solutionTitle: 'Repository Checkout Remediation Guide',
        solutionSteps: [
            'Verify that the branch name specified in your workflow (`main` or `master`) exists in your GitHub repository.',
            'Check your GitHub Personal Access Token or repository secrets for `ACTIONS_RUNTIME_TOKEN` read permissions.',
            'Ensure `actions/checkout@v4` uses `fetch-depth: 0` if submodules or tags are required for build verification.',
            'Run `git push origin main` to ensure remote branch head is up to date.'
        ],
        codeFix: `name: Stage 1 — Checkout Repository Source Code
uses: actions/checkout@v4
with:
  fetch-depth: 0
  token: \${{ secrets.GITHUB_TOKEN }}`
    },

    install: {
        name: 'Stage 2 — Install Project Dependencies',
        icon: '📦',
        errorCategory: 'PACKAGE_LOCK_MISMATCH_OR_DEPENDENCY_FAILURE',
        defaultMessage: 'npm ci command failed due to package-lock.json mismatch.',
        rootCause: 'The package-lock.json file is out of sync with package.json, or a third-party registry dependency is unreachable.',
        solutionTitle: 'Dependency Installation Remediation Guide',
        solutionSteps: [
            'Run `npm install` locally to sync `package.json` and `package-lock.json`.',
            'Verify Node.js version compatibility in `.nvmrc` or GitHub workflow (`node-version: 20`).',
            'If installing private npm packages, configure `.npmrc` with authToken credentials in GitHub Secrets.',
            'Commit the updated `package-lock.json` file and push to GitHub.'
        ],
        codeFix: `# Run locally to re-generate lockfile
npm install
git add package.json package-lock.json
git commit -m "fix(deps): sync package-lock.json for CI pipeline"
git push origin main`
    },

    lint: {
        name: 'Stage 3 — Code Linting (ESLint)',
        icon: '🔍',
        errorCategory: 'ESLINT_SYNTAX_OR_FORMATTING_VIOLATION',
        defaultMessage: 'ESLint detected code formatting or syntax errors in source files.',
        rootCause: 'Unused variables, missing semi-colons, or syntax violations against project ESLint rules in server.js or app/ script files.',
        solutionTitle: 'ESLint Code Linting Remediation Guide',
        solutionSteps: [
            'Execute `npm run lint` locally to identify all syntax and formatting violations.',
            'Run `npx eslint . --fix` to automatically repair auto-fixable formatting rules.',
            'Review `eslint.config.js` or `.eslintrc.json` to adjust overly strict linter rules if necessary.',
            'Ensure all imported modules and variables in `server.js` and `src/` are actively referenced.'
        ],
        codeFix: `# Run automated ESLint code repair
npx eslint . --fix
git add .
git commit -m "style(lint): fix ESLint violations in source code"
git push origin main`
    },

    tests: {
        name: 'Stage 4 — Automated Unit & Integration Testing',
        icon: '🧪',
        errorCategory: 'UNIT_TEST_ASSERTION_FAILURE',
        defaultMessage: 'Automated test suite (npm test) failed with assertion errors.',
        rootCause: 'One or more HTTP endpoint tests in tests/test.js failed (e.g. GET /health expected status "healthy" or HTTP 200 OK).',
        solutionTitle: 'Unit & Integration Test Failure Remediation Guide',
        solutionSteps: [
            'Run `npm test` locally to inspect exact failing assertion lines and stack traces.',
            'Verify `/health` route in `server.js` returns `{ status: "healthy", http_code: 200 }`.',
            'Ensure port 8080 or test server port 8089 is free and not blocked by local background processes.',
            'Re-run `npm test` until all 4 core test cases pass with green output before pushing.'
        ],
        codeFix: `// Verify in server.js:
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'CloudDeploy DevOps Dashboard',
        version: 'v1.0.0',
        uptime_seconds: Math.floor((Date.now() - START_TIME) / 1000)
    });
});`
    },

    security: {
        name: 'Stage 5 — Security Vulnerability Scan',
        icon: '🛡️',
        errorCategory: 'VULNERABILITY_THRESHOLD_EXCEEDED',
        defaultMessage: 'High or Critical security vulnerability detected in npm dependencies.',
        rootCause: 'npm audit or Trivy scanner detected CVE vulnerabilities exceeding security threshold in installed packages.',
        solutionTitle: 'Security Dependency Scan Remediation Guide',
        solutionSteps: [
            'Run `npm audit` in terminal to view the detailed vulnerability vulnerability report.',
            'Execute `npm audit fix` to automatically patch vulnerable packages to secure versions.',
            'If breaking major updates are required, run `npm audit fix --force` and run tests to ensure stability.',
            'Re-scan with Trivy filesystem scanner before pushing to main branch.'
        ],
        codeFix: `# Fix high and critical vulnerabilities
npm audit fix
git add package-lock.json
git commit -m "security(deps): patch high severity npm vulnerabilities"
git push origin main`
    },

    docker_build: {
        name: 'Stage 6 — Docker Container Build',
        icon: '🐳',
        errorCategory: 'DOCKERFILE_BUILD_OR_COPY_ERROR',
        defaultMessage: 'Docker image compilation failed during build phase.',
        rootCause: 'Missing source files, invalid base image tag in Dockerfile, or non-root user permission issue.',
        solutionTitle: 'Docker Build Remediation Guide',
        solutionSteps: [
            'Test building Docker image locally using `docker build -t clouddeploy:test .`.',
            'Verify `Dockerfile` uses official lightweight base image `node:20-alpine`.',
            'Ensure `package.json` and `server.js` are copied correctly into `/usr/src/app`.',
            'Verify non-root container permissions (`USER node`) after `npm ci --only=production`.'
        ],
        codeFix: `# Dockerfile verification fix:
FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
USER node
CMD ["node", "server.js"]`
    },

    image_scan: {
        name: 'Stage 7 — Docker Image Vulnerability Scan',
        icon: '🔎',
        errorCategory: 'CONTAINER_CVE_VULNERABILITY',
        defaultMessage: 'Trivy container scanner detected OS package vulnerabilities.',
        rootCause: 'Alpine base image OS libraries contain unpatched CVE vulnerabilities.',
        solutionTitle: 'Docker Image Security Remediation Guide',
        solutionSteps: [
            'Update base image tag in `Dockerfile` to latest stable release (`node:20-alpine3.19`).',
            'Add `apk upgrade --no-cache` step in `Dockerfile` to apply OS security updates.',
            'Re-build and scan container image locally using Trivy CLI.'
        ],
        codeFix: `FROM node:20-alpine
RUN apk update && apk upgrade --no-cache
WORKDIR /usr/src/app`
    },

    registry_push: {
        name: 'Stage 8 — Container Registry Packaging',
        icon: '🚀',
        errorCategory: 'ECR_REGISTRY_AUTHENTICATION_FAILURE',
        defaultMessage: 'Failed to push Docker image to AWS ECR or Docker Hub.',
        rootCause: 'AWS IAM credentials expired, ECR login token failed, or target repository does not exist.',
        solutionTitle: 'Container Registry Remediation Guide',
        solutionSteps: [
            'Verify AWS CLI credentials and `aws ecr get-login-password` token in AWS CodeBuild/GitHub Secrets.',
            'Ensure AWS ECR Repository `clouddeploy` is created in region `ap-south-1`.',
            'Check IAM Policy `AmazonEC2ContainerRegistryPowerUser` is attached to CodeBuild role.'
        ],
        codeFix: `# AWS ECR Login & Tag Command
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com
docker tag clouddeploy:latest <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/clouddeploy:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/clouddeploy:latest`
    },

    deploy: {
        name: 'Stage 9 — Production Cloud Deployment',
        icon: '🌐',
        errorCategory: 'ELASTIC_BEANSTALK_DEPLOYMENT_FAILURE',
        defaultMessage: 'AWS Elastic Beanstalk deployment failed to initialize instance environment.',
        rootCause: 'Dockerrun.aws.json invalid container port configuration or EC2 instance health Degraded.',
        solutionTitle: 'Cloud Deployment Remediation Guide',
        solutionSteps: [
            'Inspect `Dockerrun.aws.json` descriptor to ensure container port is set to `8080`.',
            'Check AWS Elastic Beanstalk Environment health status and Event Logs in AWS Console.',
            'Verify EC2 Security Group allows HTTP inbound traffic on port 80/8080.',
            'Increase Elastic Beanstalk application version timeout if container launch is slow.'
        ],
        codeFix: `{
  "AWSEBDockerrunVersion": "1",
  "Ports": [
    {
      "ContainerPort": "8080"
    }
  ]
}`
    },

    health_check: {
        name: 'Stage 10 — Health Validation Endpoint',
        icon: '🟢',
        errorCategory: 'HEALTH_CHECK_HTTP_NON_200_OR_TIMEOUT',
        defaultMessage: 'Production health check endpoint returned non-200 HTTP code.',
        rootCause: 'Deployed container is failing startup, database connection timed out, or endpoint /health returned HTTP 500/503.',
        solutionTitle: 'Live Health Check Remediation Guide',
        solutionSteps: [
            'Curl `http://localhost:8080/health` or Elastic Beanstalk URL to view full JSON response.',
            'Verify MongoDB connection string `MONGODB_URI` environment variable is accessible.',
            'Check server startup logs to confirm Express app bound to `0.0.0.0:8080`.',
            'Ensure `/health` route handles database fallback mode gracefully without crashing.'
        ],
        codeFix: `# Test health endpoint locally or in staging:
curl -v http://localhost:8080/health

# Expected response:
# HTTP/1.1 200 OK
# {"status":"healthy","service":"CloudDeploy DevOps Dashboard","database":"CONNECTED"}`
    }
};

/**
 * Generate automated stage error diagnosis & remediation payload
 */
function diagnoseStageError(stageKey, customLog = null) {
    const template = STAGE_SOLUTIONS[stageKey] || {
        name: `Stage — ${stageKey}`,
        icon: '⚠️',
        errorCategory: 'UNHANDLED_STAGE_PIPELINE_ERROR',
        defaultMessage: customLog || 'Pipeline execution failed at this stage.',
        rootCause: 'Pipeline runner encountered an unexpected exit code or process interruption.',
        solutionTitle: 'General Pipeline Troubleshooting Guide',
        solutionSteps: [
            'Review recent git commit changes in source repository.',
            'Check workflow run logs on GitHub Actions or AWS CodeBuild console.',
            'Re-run pipeline workflow after resolving code defects.'
        ],
        codeFix: `# Check git commit status\ngit status\n`
    };

    return {
        stageKey,
        stageName: template.name,
        stageIcon: template.icon,
        errorCategory: template.errorCategory,
        errorMessage: customLog || template.defaultMessage,
        rootCause: template.rootCause,
        solutionTitle: template.solutionTitle,
        solutionSteps: template.solutionSteps,
        codeFix: template.codeFix,
        autoFixAvailable: true,
        timestamp: new Date().toISOString()
    };
}

module.exports = {
    STAGE_SOLUTIONS,
    diagnoseStageError
};
