# System Architecture — CloudDeploy CI/CD Pipeline

## Topic: Automated CI/CD Pipeline for Cloud-Native Web Application Deployment

This document provides a comprehensive technical overview of the system architecture, component integrations, network topologies, and security boundaries implemented in the **CloudDeploy** automated DevOps project.

---

## 1. High-Level System Architecture Diagram

The end-to-end automated deployment workflow transitions code from a local developer environment to a live AWS cloud environment without manual intervention.

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
|  |                                                                                              |  |
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
|                                   |                                |                               |
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
|   |                                                                                            |   |
|   |   +------------------------------------------------------------------------------------+   |   |
|   |   | Docker Engine Runtime Host                                                         |   |   |
|   |   |                                                                                    |   |   |
|   |   |   +----------------------------------------------------------------------------+   |   |   |
|   |   |   | CloudDeploy Container (`clouddeploy-app:latest`)                           |   |   |   |
|   |   |   | Node.js 20 Alpine Base | Exposed Port: 8080                                |   |   |   |
|   |   |   | Endpoints: GET / , GET /health , GET /api/status                           |   |   |   |
|   |   |   +----------------------------------------------------------------------------+   |   |   |
|   |   +------------------------------------------------------------------------------------+   |   |
|   +------------------------------------------------|-------------------------------------------+   |
|                                                    |                                               |
+----------------------------------------------------|-----------------------------------------------+
                                                     | HTTP GET /
                                                     v
                                          +---------------------+
                                          | End User Browser    |
                                          | (DevOps Dashboard)  |
                                          +---------------------+
```

---

## 2. Component Detailed Breakdown

### A. Developer Workstation
- **Role:** Local workspace where application updates, feature additions, or bug fixes are authored.
- **Key Tools:** Git CLI, Node.js runtime, Docker Desktop.
- **Workflow:** Developer commits changes locally and pushes code using `git push origin main`.

### B. GitHub Repository
- **Role:** Source code management and Version Control System (VCS).
- **Trigger Mechanism:** Emits a secure Webhook payload or notifies AWS via **AWS CodeStar Connections** whenever new commits land on the target branch (`main`).

### C. AWS CodePipeline
- **Role:** Fully managed continuous delivery service that automates release pipelines.
- **Stages:**
  1. **Source Stage:** Connects to GitHub, polls or receives notifications, downloads source code zip bundle into an Amazon S3 Artifact Bucket.
  2. **Build Stage:** Invokes AWS CodeBuild, monitors execution progress, receives build output artifacts.
  3. **Deploy Stage:** Hands over packaged container deployment artifacts (`Dockerrun.aws.json` / `Dockerfile`) to AWS Elastic Beanstalk.

### D. AWS CodeBuild
- **Role:** Fully managed build service that compiles source code, runs unit tests, and builds Docker container images.
- **Configuration:** Reads build instructions directly from `buildspec.yml` in the root repository.
- **Build Execution Phases:**
  - `install`: Prepares runtime environment (Node.js 20).
  - `pre_build`: Executes automated unit test suite (`npm test`). **If tests fail, pipeline stops immediately.**
  - `build`: Builds production Docker image (`docker build -t clouddeploy-app:latest .`).
  - `post_build`: Prepares deployment manifest for AWS Elastic Beanstalk.

### E. Docker Container Engine
- **Role:** Standardized application runtime container.
- **Image:** `node:20-alpine` (Minimal footprint, high security, non-root user execution).
- **Exposed Port:** `8080`.
- **Health Check:** Standardized container health probe via `wget --spider http://localhost:8080/health`.

### F. AWS Deployment Target (Elastic Beanstalk)
- **Role:** Cloud compute infrastructure hosting the live containerized web application.
- **Features:** Auto-provisioning, load balancing, environment health monitoring, and automatic container restarts.

---

## 3. End-to-End Execution Sequence Diagram

```text
Developer            GitHub          CodePipeline         CodeBuild           Docker           AWS Deploy
    |                   |                 |                   |                 |                  |
    |--- git push ----->|                 |                   |                 |                  |
    |                   |--- Webhook ---->|                   |                 |                  |
    |                   |                 |--- Start Build -->|                 |                  |
    |                   |                 |                   |--- npm test --->|                  |
    |                   |                 |                   |   (Pass / Fail) |                  |
    |                   |                 |                   |--- Build Img -->|                  |
    |                   |                 |                   |<-- Img Ready ---|                  |
    |                   |                 |<-- Build Success -|                                    |
    |                   |                 |----------------------- Deploy Artifacts -------------->|
    |                   |                 |                                                        |--- Live Update
```

---

## 4. Security & IAM Architecture

1. **Least Privilege IAM Roles:**
   - **CodePipeline Role:** Grants permission strictly to read source from S3/CodeStar, trigger CodeBuild projects, and deploy to Elastic Beanstalk.
   - **CodeBuild Service Role:** Grants access to write logs to Amazon CloudWatch and upload build output to S3.
2. **Secrets Prevention:**
   - No hardcoded AWS credentials in source code.
   - `.gitignore` and `.dockerignore` exclude `.env`, AWS credentials, and `node_modules`.
3. **Container Security:**
   - Non-root user (`USER node`) defined in `Dockerfile` to prevent privilege escalation attacks.
