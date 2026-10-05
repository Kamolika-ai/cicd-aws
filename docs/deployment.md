# Complete AWS Deployment Guide — CloudDeploy CI/CD Pipeline

## Topic: Automated CI/CD Pipeline for Cloud-Native Web Application Deployment

This step-by-step guide provides instructions for deploying the **CloudDeploy** web application to AWS using **GitHub**, **AWS CodePipeline**, **AWS CodeBuild**, **Docker**, and **AWS Elastic Beanstalk / AWS App Runner**.

> [!IMPORTANT]
> All steps requiring interaction with the AWS Management Console or GitHub web UI are explicitly marked as **`[MANUAL AWS CONSOLE STEP]`**.

---

## 1. Prerequisites

Before starting, ensure you have:
1. A **GitHub Account** (Free).
2. An **AWS Account** (AWS Free Tier compatible).
3. **Git CLI** installed locally on your system.
4. **Node.js 20+** installed locally for testing.

---

## 2. Step 1: GitHub Repository Setup `[MANUAL AWS CONSOLE STEP]`

1. Open your browser and log into [GitHub](https://github.com).
2. Click **New Repository** (or **+** -> **New repository**).
3. Set Repository Name: `cloud-native-cicd-project`.
4. Choose **Public** (or Private).
5. Do **NOT** initialize with README/gitignore (we already have them in our local codebase).
6. Click **Create repository**.
7. In your local terminal inside the project directory, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - CloudDeploy CI/CD Pipeline Project"
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/cloud-native-cicd-project.git
   git push -u origin main
   ```

---

## 3. Step 2: AWS Elastic Beanstalk Environment Setup `[MANUAL AWS CONSOLE STEP]`

1. Log into the **AWS Management Console** and search for **Elastic Beanstalk**.
2. Click **Create Application**.
3. **Application Name:** `clouddeploy-app`.
4. **Platform:** Select **Docker**.
5. **Platform Branch:** Select **Docker running on 64bit Amazon Linux 2023** (or Amazon Linux 2).
6. **Application code:** Select **Sample application** (CodePipeline will overwrite this automatically on first deployment).
7. **Presets:** Select **Single instance (free tier eligible)**.
8. Click **Next**.
9. **Service Role:** Choose existing or create a new default Elastic Beanstalk Service Role.
10. Click **Skip to Review** -> **Submit**.
11. Wait 2-3 minutes for the environment (`Clouddeploy-app-env`) to launch. Note down the public URL (e.g., `http://clouddeploy-app-env.xxx.ap-south-1.elasticbeanstalk.com`).

---

## 4. Step 3: AWS CodeBuild Project Setup `[MANUAL AWS CONSOLE STEP]`

1. In AWS Console, search for **CodeBuild**.
2. Click **Create build project**.
3. **Project Name:** `clouddeploy-build`.
4. **Source:**
   - **Source Provider:** GitHub.
   - **Repository:** Connect via OAuth or GitHub App Connection.
   - Select **Repository in my GitHub account**.
   - Select `cloud-native-cicd-project`.
5. **Environment:**
   - **Environment image:** Managed image.
   - **Operating system:** Ubuntu.
   - **Runtime(s):** Standard.
   - **Image:** `aws/codebuild/amazonlinux2-x86_64-standard:5.0` (or `aws/codebuild/standard:7.0`).
   - **Privileged:** Check **Enable this flag if you want to build Docker images or give your builds elevated privileges** (CRITICAL for Docker build!).
6. **Buildspec:**
   - Select **Use a buildspec file** (it automatically picks up `buildspec.yml` in project root).
7. Click **Create build project**.

---

## 5. Step 4: AWS CodePipeline Setup `[MANUAL AWS CONSOLE STEP]`

1. In AWS Console, search for **CodePipeline**.
2. Click **Create pipeline**.
3. **Pipeline Name:** `clouddeploy-pipeline`.
4. **Service Role:** Select **New service role** (CodePipeline will auto-generate IAM policy).
5. Click **Next**.

### Stage 1: Source
- **Source Provider:** GitHub (Version 2) via AWS CodeStar Connections.
- **Connection:** Click **Connect to GitHub**, authorize AWS, and select your connection.
- **Repository Name:** `<YOUR_GITHUB_USERNAME>/cloud-native-cicd-project`.
- **Branch Name:** `main`.
- **Output Artifact Format:** CodePipeline default.
- Click **Next**.

### Stage 2: Build
- **Build Provider:** AWS CodeBuild.
- **Region:** Your active AWS Region (e.g., `ap-south-1`).
- **Project Name:** Select `clouddeploy-build`.
- **Build Type:** Single build.
- Click **Next**.

### Stage 3: Deploy
- **Deploy Provider:** AWS Elastic Beanstalk.
- **Application Name:** `clouddeploy-app`.
- **Environment Name:** `Clouddeploy-app-env`.
- Click **Next**.

### Review & Create
- Review all 3 stages: **Source (GitHub) -> Build (AWS CodeBuild) -> Deploy (AWS Elastic Beanstalk)**.
- Click **Create pipeline**.

---

## 6. Step 5: Verification & Testing

1. Once the pipeline completes all 3 stages, open your browser.
2. Navigate to your Elastic Beanstalk URL.
3. Verify:
   - Dashboard loads with title **CloudDeploy — CI/CD Dashboard**.
   - Application status displays **ONLINE**.
   - Pipeline status displays **SUCCESS**.
   - Visit `http://<YOUR_EB_URL>/health` -> Verify JSON output:
     ```json
     {
       "status": "healthy",
       "service": "CloudDeploy DevOps Dashboard",
       "version": "v1.0.0"
     }
     ```

---

## 7. Step 6: AWS Resource Cleanup `[CRITICAL FOR COST SAVINGS]`

To avoid incurring unexpected AWS charges after your project demonstration:

1. **Delete Elastic Beanstalk Environment:**
   - Go to Elastic Beanstalk Console -> Select `clouddeploy-app` -> **Actions** -> **Delete Application**.
2. **Delete CodePipeline:**
   - Go to CodePipeline Console -> Select `clouddeploy-pipeline` -> **Delete**.
3. **Delete CodeBuild Project:**
   - Go to CodeBuild Console -> Select `clouddeploy-build` -> **Delete project**.
4. **Delete Amazon S3 Artifact Buckets:**
   - Go to S3 Console -> Find buckets starting with `codepipeline-` -> Empty and Delete.
