# Automated CI/CD Pipeline for Cloud-Native Web Application Deployment

🎓 **University DevOps Project | B.Tech Computer Science & Engineering**

---

## 1. Abstract

Modern cloud engineering relies on automation to rapidly deliver software features while maintaining high system reliability. This project presents a complete, production-ready **Automated Continuous Integration and Continuous Deployment (CI/CD) Pipeline** for a cloud-native web application called **CloudDeploy**.

The pipeline automates the complete release lifecycle:
$$\text{Developer} \longrightarrow \text{GitHub} \longrightarrow \text{AWS CodePipeline} \longrightarrow \text{AWS CodeBuild} \longrightarrow \text{Docker Container} \longrightarrow \text{AWS Elastic Beanstalk Deployment}$$

Once initial AWS cloud infrastructure is provisioned, whenever a developer pushes code updates to GitHub, the pipeline automatically detects the commit, runs automated unit tests, builds a standardized Docker container image, and deploys the running application to AWS Elastic Beanstalk with zero human intervention.

---

## 2. Objectives

* **Automated Version Control:** Track application changes seamlessly using Git and GitHub.
* **Continuous Integration (CI):** Trigger automatic builds and automated unit tests upon code pushes.
* **Automated Quality Gate:** Block faulty code from reaching production if unit tests fail.
* **Docker Containerization:** Package the web application into lightweight, portable Docker containers.
* **Continuous Delivery/Deployment (CD):** Deploy containerized web applications automatically to AWS Elastic Beanstalk cloud infrastructure.
* **User Authentication System:** Integrated identity management featuring Login, Sign Up, Email Verification, Forgot/Reset Password, Profile, and Protected Dashboard state management.
* **Pipeline Visibility:** Display stage-by-stage pipeline health status (SUCCESS / FAILURE) on an interactive dashboard.
* **DevOps Security Practices:** Implement IAM least-privilege roles, `.gitignore`, `.dockerignore`, and unprivileged container users.

---

## 3. Technologies Used

| Technology | Purpose in Project |
| :--- | :--- |
| **HTML5 / CSS3 / Vanilla JS** | Front-end CloudDeploy DevOps Dashboard & Auth UI |
| **Node.js 20 & Express** | Lightweight backend web server hosting app, API status & Auth endpoints |
| **Git & GitHub** | Version control, source code management, and Webhook trigger |
| **Docker** | Containerization platform packaging app runtime (`node:20-alpine`) |
| **AWS CodePipeline** | Multi-stage continuous delivery orchestrator |
| **AWS CodeBuild** | Managed cloud build engine executing `buildspec.yml` & unit tests |
| **AWS Elastic Beanstalk** | Cloud hosting target running Docker containers |
| **AWS IAM** | Identity and Access Management securing service execution roles |

---

## 4. System Architecture

```text
+----------------------------------------------------------------------------------------------------+
|                                    DEVELOPMENT & SOURCE CONTROL                                    |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|    +--------------------+       git push       +------------------------+                          |
|    | Developer Workstation | -----------------> |   GitHub Repository    |                          |
|    | (VS Code / Terminal) |                    | (main / master branch) |                          |
|    +--------------------+                      +------------------------+                          |
|                                                            |                                       |
+------------------------------------------------------------|---------------------------------------+
                                                             | GitHub Webhook / CodeStar Connection
                                                             v
+----------------------------------------------------------------------------------------------------+
|                                      AWS CI/CD ORCHESTRATION                                       |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  |                                     AWS CodePipeline                                         |  |
|  |  +-----------------------+     +----------------------------------+     +------------------+  |  |
|  |  | Stage 1: Source       | --> | Stage 2: Build                   | --> | Stage 3: Deploy  |  |  |
|  |  | (Fetch GitHub commit) |     | (AWS CodeBuild execution)        |     | (Push to AWS)    |  |  |
|  |  +-----------------------+     +----------------------------------+     +------------------+  |  |
|  +------------------------------------------------|---------------------------------------------+  |
|                                                   |                                                |
|                                                   v                                                |
|                                   +--------------------------------+                               |
|                                   |         AWS CodeBuild          |                               |
|                                   |  (Containerized Build Server)  |                               |
|                                   |  1. Install Node.js deps       |                               |
|                                   |  2. Execute `npm test`         |                               |
|                                   |  3. Build Docker Container     |                               |
|                                   |  4. Package Deployment Bundle  |                               |
|                                   +--------------------------------+                               |
|                                                   |                                                |
+---------------------------------------------------|------------------------------------------------+
                                                    | Deploy Artifacts
                                                    v
+----------------------------------------------------------------------------------------------------+
|                                    AWS CLOUD HOSTING ENVIRONMENT                                   |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   +--------------------------------------------------------------------------------------------+   |
|   | AWS Elastic Beanstalk (Single Container Docker Host)                                       |   |
|   |   +------------------------------------------------------------------------------------+   |   |
|   |   | Docker Engine (`clouddeploy-app:latest` on Port 8080)                              |   |   |
|   |   | Endpoints: GET / , GET /health , GET /api/status , /api/auth/*                     |   |   |
|   |   +------------------------------------------------------------------------------------+   |   |
|   +------------------------------------------------|-------------------------------------------+   |
|                                                    |                                               |
+----------------------------------------------------|-----------------------------------------------+
                                                     | HTTP GET /
                                                     v
                                          +---------------------+
                                          | End User Browser    |
                                          +---------------------+
```

---

## 5. User Authentication System

The CloudDeploy application includes a complete, production-style User Authentication and Identity Management System:

* **Login:** User authentication with email and password.
* **Sign Up:** New user registration with profile details.
* **Email Verification:** Account verification via 6-digit verification code.
* **Forgot Password:** Password recovery request workflow.
* **Reset Password:** Password update workflow.
* **Logout:** Safe session termination and token clearing.
* **User Profile:** Interactive profile view showing user details, role, and verification status.
* **Protected Dashboard:** Authentication state management controlling user access.

> [!NOTE]
> AWS Cognito configuration is prepared as a manual AWS setup step for production cloud identity integration.

---

## 6. Clean Project Structure

```text
cloud-native-cicd-project/
│
├── app/                        # Web application front-end files
│   ├── index.html              # Main DevOps Dashboard & Auth UI
│   ├── style.css              # Glassmorphism dark-theme dashboard styles
│   └── script.js               # Client interactive script, API polling & auth state
│
├── tests/                      # Automated test suite
│   └── test.js                 # HTTP health, API status & DOM integrity assertions
│
├── docs/                       # University submission documentation
│   ├── architecture.md         # Detailed system architecture & network topology
│   ├── deployment.md           # Step-by-step AWS deployment guide
│   ├── ci-cd-pipeline.md       # Technical CI/CD & buildspec specification
│   └── viva-questions.md       # 35 Viva Q&A with student-friendly answers
│
├── screenshots/                # Viva demonstration image guide
│   └── README.md               # Recommended screenshot capture checklist
│
├── Dockerfile                  # Container build instructions (node:20-alpine)
├── .dockerignore               # Container build exclusion list
├── buildspec.yml               # AWS CodeBuild phase lifecycle specification
├── Dockerrun.aws.json          # AWS Elastic Beanstalk container manifest
├── server.js                   # Node.js Express application web server & auth API
├── package.json                # Dependencies and npm scripts
├── .gitignore                  # Git repository exclusion list
└── README.md                   # Project documentation master file
```

---

## 7. Local Setup & Execution Guide

### Prerequisites
* **Node.js 20+**
* **npm**
* **Git**
* **Chrome or another web browser**

### Installation
```bash
git clone <repository-url>
cd cloud-native-cicd-project
npm install
```

### Start Development Server (Recommended)
```bash
npm run dev
```
- `npm run dev` starts the CloudDeploy development server on port **8080** and automatically opens the application in your default browser/Chrome.
- **Local URL:** [http://localhost:8080](http://localhost:8080)

### Production-Style Start
```bash
npm start
```
- **Difference:** `npm run dev` is designed for development and automatically opens the browser. `npm start` starts the application server for production environments without requiring automatic browser launching.

---

## 8. Docker Local Execution Guide

### Build the Docker Image
```bash
docker build -t clouddeploy-app:latest .
```

### Run the Docker Container
```bash
docker run -d -p 8080:8080 --name clouddeploy-container clouddeploy-app:latest
```

### Test Container Health
```bash
curl http://localhost:8080/health
```

### Stop & Remove Container
```bash
docker stop clouddeploy-container
docker rm clouddeploy-container
```

---

## 9. GitHub Repository Setup

Execute these commands to initialize and push to your GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit - CloudDeploy CI/CD Pipeline Project"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/cloud-native-cicd-project.git
git push -u origin main
```

---

## 10. Complete AWS Setup Instructions `[MANUAL AWS CONSOLE STEPS]`

### A. AWS Elastic Beanstalk Environment
1. Open AWS Console -> Search **Elastic Beanstalk** -> Click **Create Application**.
2. **Name:** `clouddeploy-app`.
3. **Platform:** **Docker** (Amazon Linux 2023 / Amazon Linux 2).
4. **Preset:** **Single Instance (Free Tier Eligible)**.
5. Click **Create Application** and wait for environment status: **Green / Ready**.

### B. AWS CodeBuild Project
1. Open AWS Console -> Search **CodeBuild** -> Click **Create build project**.
2. **Project Name:** `clouddeploy-build`.
3. **Source:** Select **GitHub** -> Choose repository `cloud-native-cicd-project`.
4. **Environment Image:** Managed Image -> Ubuntu -> Standard (`aws/codebuild/standard:7.0`).
5. **Privileged Mode:** Check **Enable this flag if you want to build Docker images** `[CRITICAL]`.
6. **Buildspec:** Select **Use a buildspec file**.
7. Click **Create build project**.

### C. AWS CodePipeline
1. Open AWS Console -> Search **CodePipeline** -> Click **Create pipeline**.
2. **Pipeline Name:** `clouddeploy-pipeline`.
3. **Stage 1 (Source):** GitHub (Version 2) -> Select repository & `main` branch.
4. **Stage 2 (Build):** AWS CodeBuild -> Select `clouddeploy-build`.
5. **Stage 3 (Deploy):** AWS Elastic Beanstalk -> Application `clouddeploy-app` -> Environment `Clouddeploy-app-env`.
6. Click **Create Pipeline**.

---

## 11. Automated Testing Procedure

Automated tests execute locally or inside AWS CodeBuild via:
```bash
npm test
```

### Test Suite Execution Summary:
- **Test 1:** GET `/health` returns HTTP 200 OK with `status: "healthy"`.
- **Test 2:** GET `/` verifies HTML content contains `CloudDeploy` brand and DOM elements.
- **Test 3:** GET `/api/status` verifies JSON metrics format and `status: "ONLINE"`.
- **Test 4:** File System Integrity checks presence of `Dockerfile`, `buildspec.yml`, `app/index.html`.

---

## 12. Demonstrating Versioning & Intentional Pipeline Failure

### A. Version Update Demonstration (Success Path)
1. Open `server.js` and change `APP_VERSION` from `v1.0.0` to `v1.0.1`.
2. Commit and push:
   ```bash
   git commit -am "chore: bump application version to v1.0.1"
   git push
   ```
3. AWS CodePipeline automatically triggers, builds, and deploys. The live dashboard will now show **v1.0.1**!

### B. Intentional Failure Demonstration (Quality Gate Rejection)
1. Open `tests/test.js`.
2. Uncomment line 171:
   ```javascript
   throw new Error("DEMO ERROR: Intentional failure to test AWS CodeBuild rejection!");
   ```
3. Commit and push:
   ```bash
   git commit -am "test: introduce build failure"
   git push
   ```
4. Observe in AWS CodePipeline console: **Stage 2 (Build) FAILED**. Code is blocked from deployment.
5. Re-comment line 171 in `tests/test.js`, commit and push to restore green pipeline state.

---

## 13. 5–10 Minute Viva Presentation Guide

1. **Introduction (1 min):** State topic: *"Automated CI/CD Pipeline for Cloud-Native Web Application Deployment"*. Explain how GitOps eliminates manual server deployments.
2. **Architecture Overview (2 mins):** Explain Developer -> GitHub Webhook -> CodePipeline -> CodeBuild -> Docker -> Elastic Beanstalk.
3. **Live Dashboard & Auth Walkthrough (2 mins):** Show the CloudDeploy UI dashboard, test `/health` endpoint, open User Authentication modal (Login/Sign Up/Profile), click **Simulate Pipeline Run**.
4. **Code & Buildspec Explanation (2 mins):** Open `Dockerfile` (explain base image, non-root user) and `buildspec.yml` (explain 4 phases: install, pre_build, build, post_build).
5. **Quality Gate Demo (2 mins):** Demonstrate how an intentional test failure stops the AWS pipeline.
6. **Conclusion (1 min):** Summarize key takeaways: zero downtime, high security, complete automation.

---

## 14. Troubleshooting Common Issues

| Issue / Error | Root Cause | Solution |
| :--- | :--- | :--- |
| `Cannot connect to Docker daemon` in CodeBuild | Privileged flag not set | Edit CodeBuild project -> Environment -> Check **Privileged Mode**. |
| CodePipeline fail at Source Stage | GitHub authorization token expired | Re-authenticate AWS CodeStar Connection to GitHub in AWS Console. |
| Elastic Beanstalk Health Warning | Container port mismatch | Ensure Dockerfile `EXPOSE 8080` matches `Dockerrun.aws.json` `ContainerPort: "8080"`. |

---

## 15. AWS Resource Cleanup Guide `[IMPORTANT]`

To avoid unexpected charges after completing your practical exam:

1. **Delete Elastic Beanstalk Application:** Elastic Beanstalk Console -> Select `clouddeploy-app` -> **Actions** -> **Delete Application**.
2. **Delete CodePipeline:** CodePipeline Console -> Select `clouddeploy-pipeline` -> **Delete**.
3. **Delete CodeBuild Project:** CodeBuild Console -> Select `clouddeploy-build` -> **Delete project**.
4. **Delete S3 Buckets:** S3 Console -> Empty and delete `codepipeline-*` buckets.