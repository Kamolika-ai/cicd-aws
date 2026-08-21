/**
 * Automated CI/CD Test Suite for CloudDeploy Web Application
 * Topic: Automated CI/CD Pipeline for Cloud-Native Web Application Deployment
 * 
 * This test suite executes automatically during AWS CodeBuild `pre_build` phase.
 * If ANY test fails, the process exits with code 1, immediately halting AWS CodePipeline.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { app, PORT } = require('../server');

const TEST_PORT = 8089;
let passedCount = 0;
let failedCount = 0;

// Color helper for terminal output
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    bold: "\x1b[1m"
};

function logPass(testName, details) {
    console.log(`${colors.green}✔ [PASS]${colors.reset} ${colors.bold}${testName}${colors.reset}`);
    if (details) console.log(`         ${colors.cyan}↳ ${details}${colors.reset}`);
    passedCount++;
}

function logFail(testName, error) {
    console.log(`${colors.red}✖ [FAIL]${colors.reset} ${colors.bold}${testName}${colors.reset}`);
    console.log(`         ${colors.red}↳ Error: ${error}${colors.reset}`);
    failedCount++;
}

// Simple HTTP GET Helper
function httpGet(urlPath) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:${TEST_PORT}${urlPath}`, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function runTestSuite() {
    console.log(`\n${colors.cyan}${colors.bold}======================================================${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}🚀 Starting CloudDeploy Automated CI/CD Test Suite...${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}======================================================${colors.reset}\n`);

    // Start Test Server Instance
    const server = await new Promise((resolve) => {
        const s = app.listen(TEST_PORT, () => resolve(s));
    });

    try {
        /* ==========================================================
           TEST 1: Health Check Endpoint Validation (GET /health)
           ========================================================== */
        try {
            const res = await httpGet('/health');
            if (res.statusCode !== 200) {
                throw new Error(`Expected HTTP 200 OK, got HTTP ${res.statusCode}`);
            }

            const json = JSON.parse(res.body);
            if (json.status !== 'healthy') {
                throw new Error(`Expected status 'healthy', got '${json.status}'`);
            }
            if (!json.version || !json.version.startsWith('v')) {
                throw new Error(`Invalid version format: '${json.version}'`);
            }
            if (typeof json.uptime_seconds !== 'number') {
                throw new Error(`Invalid uptime field in health response`);
            }

            logPass("Health Check Endpoint (GET /health)", `Status: 200 OK, Service: '${json.service}', Version: '${json.version}'`);
        } catch (err) {
            logFail("Health Check Endpoint (GET /health)", err.message);
        }

        /* ==========================================================
           TEST 2: Application Root & Dashboard UI Content (GET /)
           ========================================================== */
        try {
            const res = await httpGet('/');
            if (res.statusCode !== 200) {
                throw new Error(`Expected HTTP 200 OK, got HTTP ${res.statusCode}`);
            }

            const html = res.body;
            if (!html.includes('CloudDeploy')) {
                throw new Error("HTML response missing expected brand name 'CloudDeploy'");
            }
            if (!html.includes('CI/CD Dashboard')) {
                throw new Error("HTML response missing heading 'CI/CD Dashboard'");
            }
            if (!html.includes('id="btn-trigger-pipeline-demo"')) {
                throw new Error("HTML response missing interactive pipeline simulation trigger");
            }
            if (!html.includes('id="health-http-code"')) {
                throw new Error("HTML response missing health status container");
            }

            logPass("Application Dashboard UI Content (GET /)", "HTML served successfully with complete DOM structure");
        } catch (err) {
            logFail("Application Dashboard UI Content (GET /)", err.message);
        }

        /* ==========================================================
           TEST 3: API Status & Pipeline Metadata Endpoint (GET /api/status)
           ========================================================== */
        try {
            const res = await httpGet('/api/status');
            if (res.statusCode !== 200) {
                throw new Error(`Expected HTTP 200 OK, got HTTP ${res.statusCode}`);
            }

            const json = JSON.parse(res.body);
            if (json.application.status !== 'ONLINE') {
                throw new Error(`Expected app status 'ONLINE', got '${json.application.status}'`);
            }
            if (json.pipeline.status !== 'SUCCESS') {
                throw new Error(`Expected pipeline status 'SUCCESS', got '${json.pipeline.status}'`);
            }
            if (!json.docker || !json.docker.containerized) {
                throw new Error("Docker container configuration flag missing");
            }

            logPass("DevOps Status API (GET /api/status)", `Application: ${json.application.status}, Pipeline: ${json.pipeline.status}`);
        } catch (err) {
            logFail("DevOps Status API (GET /api/status)", err.message);
        }

        /* ==========================================================
           TEST 4: Static File System Integrity Check
           ========================================================== */
        try {
            const indexPath = path.join(__dirname, '..', 'app', 'index.html');
            const stylePath = path.join(__dirname, '..', 'app', 'style.css');
            const scriptPath = path.join(__dirname, '..', 'app', 'script.js');
            const dockerPath = path.join(__dirname, '..', 'Dockerfile');
            const buildspecPath = path.join(__dirname, '..', 'buildspec.yml');

            if (!fs.existsSync(indexPath)) throw new Error("Missing app/index.html");
            if (!fs.existsSync(stylePath)) throw new Error("Missing app/style.css");
            if (!fs.existsSync(scriptPath)) throw new Error("Missing app/script.js");
            if (!fs.existsSync(dockerPath)) throw new Error("Missing Dockerfile");
            if (!fs.existsSync(buildspecPath)) throw new Error("Missing buildspec.yml");

            logPass("Project File System Integrity", "All core source files, Dockerfile, and buildspec.yml verified");
        } catch (err) {
            logFail("Project File System Integrity", err.message);
        }

        /* =========================================================================
           [DEMONSTRATION ONLY] INTENTIONAL PIPELINE FAILURE HOOK:
           To demonstrate a failed build in AWS CodePipeline during your viva/demo:
           Uncomment the line below, commit, and push. 
           AWS CodeBuild will fail during the pre_build phase and abort the pipeline!
           ========================================================================= */
        // throw new Error("DEMO ERROR: Intentional failure to test AWS CodeBuild rejection!");

    } finally {
        // Shutdown test server
        server.close();
    }

    // Print Summary Report
    console.log(`\n${colors.cyan}------------------------------------------------------${colors.reset}`);
    console.log(`${colors.bold}Test Results Summary:${colors.reset}`);
    console.log(`Passed: ${colors.green}${passedCount}${colors.reset} | Failed: ${failedCount > 0 ? colors.red + failedCount : colors.green + "0"}${colors.reset}`);
    console.log(`${colors.cyan}------------------------------------------------------${colors.reset}\n`);

    if (failedCount > 0) {
        console.error(`${colors.red}${colors.bold}🚨 BUILD FAILED: Automated tests failed. Exiting with code 1.${colors.reset}\n`);
        process.exit(1);
    } else {
        console.log(`${colors.green}${colors.bold}🎉 BUILD SUCCESS: All automated tests passed. Ready for deployment.${colors.reset}\n`);
        process.exit(0);
    }
}

// Execute
runTestSuite();
