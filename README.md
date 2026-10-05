# 🚀 Automated CI/CD Pipeline for Cloud-Native Web Application

**B.Tech Domain Project | Computer Science & Engineering**

CloudDeploy is a cloud-native web application demonstrating an automated **CI/CD pipeline** using GitHub, AWS CodePipeline, AWS CodeBuild, Docker, and AWS Elastic Beanstalk.

The project automates the software delivery process from source-code changes to cloud deployment.

---

## 📌 Project Overview

The complete CI/CD workflow is:

```text
Developer
   ↓
GitHub
   ↓
AWS CodePipeline
   ↓
AWS CodeBuild
   ↓
Automated Tests
   ↓
Docker Build
   ↓
AWS Elastic Beanstalk
   ↓
Live Web Application
```

Whenever new code is pushed to the `main` branch, the pipeline automatically:

* Detects the new GitHub commit
* Starts the CI/CD pipeline
* Installs project dependencies
* Runs automated tests
* Builds the Docker container
* Packages the deployment
* Deploys the application to AWS Elastic Beanstalk

---

## 🎯 Key Features

* ✅ Automated CI/CD pipeline
* ✅ GitHub source control
* ✅ AWS CodePipeline orchestration
* ✅ AWS CodeBuild automated testing
* ✅ Docker containerization
* ✅ AWS Elastic Beanstalk deployment
* ✅ Automated quality gate using tests
* ✅ Health-check API
* ✅ Application status API
* ✅ User authentication UI
* ✅ Login / Sign Up / Logout
* ✅ Email verification workflow
* ✅ Forgot / Reset password workflow
* ✅ Protected dashboard
* ✅ Responsive DevOps dashboard
* ✅ Non-root Docker container
* ✅ `.gitignore` and `.dockerignore` security practices

---

## 🛠️ Technologies Used

| Technology                | Purpose             |
| ------------------------- | ------------------- |
| HTML5 / CSS3 / JavaScript | Frontend            |
| Node.js 20                | Application runtime |
| Express.js                | Backend web server  |
| Git & GitHub              | Version control     |
| Docker                    | Containerization    |
| AWS CodePipeline          | CI/CD orchestration |
| AWS CodeBuild             | Build & testing     |
| AWS Elastic Beanstalk     | Cloud deployment    |
| AWS IAM                   | Access control      |

---

## 🏗️ Architecture

```text
┌──────────────┐
│  Developer   │
└──────┬───────┘
       │ git push
       ▼
┌──────────────┐
│    GitHub    │
└──────┬───────┘
       │
       ▼
┌────────────────────┐
│  AWS CodePipeline  │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│    AWS CodeBuild   │
│                    │
│  • npm install     │
│  • npm test        │
│  • Docker build    │
└─────────┬──────────┘
          │
          ▼
┌──────────────────────────┐
│ AWS Elastic Beanstalk    │
│                          │
│   Docker Container       │
│   CloudDeploy App        │
└────────────┬─────────────┘
             │
             ▼
       ┌─────────────┐
       │    User     │
       │   Browser   │
       └─────────────┘
```

---

## 📁 Project Structure

```text
cloud-native-cicd-project/
│
├── app/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── tests/
│   └── test.js
│
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   ├── ci-cd-pipeline.md
│   └── viva-questions.md
│
├── screenshots/
│   └── README.md
│
├── Dockerfile
├── .dockerignore
├── .gitignore
├── buildspec.yml
├── Dockerrun.aws.json
├── server.js
├── package.json
└── README.md
```

---

# ▶️ How to Run the Project Locally

## 1. Prerequisites

Install the following:

* **Node.js 20 or later**
* **npm**
* **Git**
* **Docker** *(only required for Docker execution)*
* **Chrome / any modern web browser**

Check installations:

```bash
node --version
npm --version
git --version
docker --version
```

---

## 2. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

Example:

```bash
git clone https://github.com/YOUR_USERNAME/cloud-native-cicd-project.git
```

Move into the project:

```bash
cd cloud-native-cicd-project
```

---

## 3. Install Dependencies

```bash
npm install
```

---

## 4. Start the Application

### Development Mode

```bash
npm run dev
```

The application runs on:

```text
http://localhost:8080
```

Open Chrome and visit:

```text
http://localhost:8080
```

### Production-Style Mode

You can also run:

```bash
npm start
```

Then open:

```text
http://localhost:8080
```

---

# 🧪 Run Automated Tests

Run the complete test suite:

```bash
npm test
```

The tests verify important parts of the application, including:

* `/health` endpoint
* `/api/status` endpoint
* Main application page
* CloudDeploy branding
* Required project files

A successful test run should show all tests passing.

---

# 🐳 Run Using Docker

## 1. Build Docker Image

From the project root:

```bash
docker build -t clouddeploy-app:latest .
```

## 2. Start Container

```bash
docker run -d -p 8080:8080 --name clouddeploy-container clouddeploy-app:latest
```

## 3. Open Application

Visit:

```text
http://localhost:8080
```

## 4. Test Health Endpoint

```text
http://localhost:8080/health
```

Or use:

```bash
curl http://localhost:8080/health
```

## 5. Stop Container

```bash
docker stop clouddeploy-container
```

## 6. Remove Container

```bash
docker rm clouddeploy-container
```

---

# ☁️ AWS CI/CD Deployment

The project can be connected to AWS using:

```text
GitHub
   ↓
AWS CodePipeline
   ↓
AWS CodeBuild
   ↓
Docker
   ↓
AWS Elastic Beanstalk
```

### Required AWS Services

* AWS CodePipeline
* AWS CodeBuild
* AWS Elastic Beanstalk
* AWS IAM
* Amazon S3 *(used by CodePipeline for artifacts)*

### Main AWS Configuration

Create:

```text
Elastic Beanstalk Application
        ↓
CodeBuild Project
        ↓
CodePipeline
```

The CodeBuild project uses:

```text
buildspec.yml
```

to install dependencies, run tests, and perform the Docker build.

After a successful build, CodePipeline deploys the application to Elastic Beanstalk.

---

# 🔄 CI/CD Workflow

After the initial AWS configuration:

```text
1. Developer modifies code
          ↓
2. git add .
          ↓
3. git commit
          ↓
4. git push
          ↓
5. GitHub detects commit
          ↓
6. CodePipeline starts
          ↓
7. CodeBuild runs
          ↓
8. npm test
          ↓
9. Docker build
          ↓
10. Deployment
          ↓
11. Elastic Beanstalk
          ↓
12. Updated application is live
```

If the automated tests fail:

```text
GitHub
   ↓
CodePipeline
   ↓
CodeBuild
   ↓
❌ Tests Failed
   ↓
Deployment STOPPED
```

This demonstrates the project's **automated quality gate**.

---

# 🔐 Security Practices

The project follows basic DevOps security practices:

* IAM-based AWS permissions
* Least-privilege access
* `.gitignore` for sensitive/local files
* `.dockerignore` for unnecessary files
* Non-root Docker container user
* Automated testing before deployment
* No AWS credentials stored inside the GitHub repository

> Never commit AWS access keys, passwords, tokens, or other secrets to GitHub.

---

# 📊 Important Application Endpoints

| Endpoint      | Purpose                           |
| ------------- | --------------------------------- |
| `/`           | Main CloudDeploy application      |
| `/health`     | Application health check          |
| `/api/status` | Application/pipeline status       |
| `/api/auth/*` | Authentication-related API routes |

---

# 🧹 AWS Cleanup

After completing the project demonstration, delete unused AWS resources to avoid unnecessary charges.

Main resources to check:

```text
AWS Elastic Beanstalk
AWS CodePipeline
AWS CodeBuild
Amazon S3
CloudWatch Logs
```

Delete resources that are no longer required.

---

# 🎓 Project Purpose

This project demonstrates practical knowledge of:

* Continuous Integration
* Continuous Deployment
* GitHub-based development
* Automated testing
* Docker containerization
* AWS cloud deployment
* Infrastructure security
* DevOps automation
* Cloud-native application deployment

---


**B.Tech Domain Project**
