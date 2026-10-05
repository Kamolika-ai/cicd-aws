# Technical Specification — Automated CI/CD Pipeline Architecture

## Topic: Automated CI/CD Pipeline for Cloud-Native Web Application Deployment

This document explains the core principles of Continuous Integration (CI) and Continuous Delivery/Deployment (CD) as implemented in this repository.

---

## 1. What is CI/CD?

### Continuous Integration (CI)
Continuous Integration is the practice of automatically integrating code changes from multiple contributors into a single central repository. In this project:
- Every `git push` to the `main` branch triggers an automated build.
- Dependencies are automatically resolved and installed in an isolated environment.
- Automated tests (`tests/test.js`) are executed immediately to validate code correctness.

### Continuous Delivery / Deployment (CD)
Continuous Deployment extends CI by automatically deploying all code changes to a testing or production environment after the build and test stages pass.
- CodeBuild packages the application into a Docker container image.
- CodePipeline forwards deployment manifests (`Dockerrun.aws.json`) to AWS Elastic Beanstalk / App Runner.
- Zero human intervention is required between code push and live production deployment.

---

## 2. Pipeline Stages Breakdown

```text
+-------------------+      +--------------------+      +-------------------+
|  1. SOURCE STAGE  | ---> |   2. BUILD STAGE   | ---> |  3. DEPLOY STAGE  |
|  AWS CodeStar     |      |   AWS CodeBuild    |      |  AWS Beanstalk    |
|  GitHub Webhook   |      |   buildspec.yml    |      |  Docker Container |
+-------------------+      +--------------------+      +-------------------+
```

### Stage 1: Source
- **Provider:** GitHub (via AWS CodeStar Connection).
- **Trigger:** GitHub Push Webhook on `refs/heads/main`.
- **Output Artifact:** Zip archive of the repository commit passed to S3.

### Stage 2: Build & Test
- **Provider:** AWS CodeBuild.
- **Environment:** Ubuntu Linux runtime with Docker daemon active.
- **Lifecycle phases (defined in `buildspec.yml`):**
  1. **Install:** `npm install` installs application runtime and testing libraries.
  2. **Pre-build:** Executes `npm test`. If any assertion fails, process returns Exit Code 1.
  3. **Build:** Runs `docker build -t clouddeploy-app:latest .` to create standardized image.
  4. **Post-build:** Generates deployment manifest output zip for AWS Elastic Beanstalk.

### Stage 3: Deployment
- **Provider:** AWS Elastic Beanstalk (Single Container Docker platform).
- **Action:** Pulls artifact manifest (`Dockerrun.aws.json`), pulls/builds container image, performs zero-downtime rolling update of live container.

---

## 3. Automated Testing & Failure Strategy

To ensure production stability, **automated quality gates** are strictly enforced.

```text
                   +------------------------+
                   |  Code Push to GitHub   |
                   +-----------+------------+
                               |
                               v
                   +------------------------+
                   | AWS CodeBuild Trigger  |
                   +-----------+------------+
                               |
                               v
                   +------------------------+
                   |   Execute `npm test`   |
                   +-----------+------------+
                               |
                   +-----------+-----------+
                   |                       |
           [Tests Passed]           [Tests Failed]
                   |                       |
                   v                       v
      +------------------------+  +------------------------+
      | Proceed Docker Build   |  | PIPELINE ABORTED!      |
      | & Live Deployment      |  | Status: FAILED         |
      +------------------------+  | Bad code blocked!      |
                                  +------------------------+
```

### Failure Proof Demonstration
To prove to an examiner that automated testing works:
1. Open `tests/test.js`.
2. Uncomment line 171:
   ```javascript
   throw new Error("DEMO ERROR: Intentional failure to test AWS CodeBuild rejection!");
   ```
3. Commit and push:
   ```bash
   git commit -am "test: introduce intentional build failure"
   git push
   ```
4. Observe in AWS CodePipeline:
   - Stage 1 (Source): **SUCCESS**
   - Stage 2 (Build): **FAILED** (Exit code 1 in CodeBuild logs)
   - Stage 3 (Deploy): **NEVER EXECUTED**

---

## 4. Semantic Versioning Workflow

The application tracks release versions dynamically in `server.js` and `package.json`.

- **Initial State:** `v1.0.0`
- **Developer Update Procedure:**
  1. Change `APP_VERSION` in `server.js` to `v1.0.1`.
  2. Update `"version": "1.0.1"` in `package.json`.
  3. Commit and push changes:
     ```bash
     git commit -am "feat: bump application version to v1.0.1"
     git push
     ```
  4. AWS CodePipeline automatically triggers.
  5. Open browser -> Dashboard reflects **v1.0.1** live online!
