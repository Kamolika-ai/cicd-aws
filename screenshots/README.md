# Project Screenshots & Viva Demonstration Assets

This directory contains recommended screenshot places and descriptions for your university project report, slide presentation, or lab manual submission.

## Recommended Screenshots to Capture for Your Viva Report:

1. `01-github-repository.png`
   - **Description:** GitHub repository main page showing project files (`Dockerfile`, `buildspec.yml`, `server.js`, `app/`).

2. `02-codepipeline-success.png`
   - **Description:** AWS CodePipeline execution dashboard showing green checkmarks for **Source (GitHub)**, **Build (CodeBuild)**, and **Deploy (Elastic Beanstalk)** stages.

3. `03-codebuild-logs.png`
   - **Description:** AWS CodeBuild build log terminal showing `npm test` passing with 4/4 tests and `docker build` completing successfully.

4. `04-local-docker-running.png`
   - **Description:** Terminal output showing `docker build -t clouddeploy-app .` and `docker run -p 8080:8080 clouddeploy-app`.

5. `05-live-dashboard-ui.png`
   - **Description:** Browser window showing **CloudDeploy — CI/CD Dashboard** running live at AWS Elastic Beanstalk URL.

6. `06-health-endpoint-json.png`
   - **Description:** Browser window or Postman showing `GET /health` returning HTTP 200 OK with `status: "healthy"`.

7. `07-pipeline-failure-demo.png`
   - **Description:** AWS CodePipeline dashboard showing Stage 2 (Build) **RED / FAILED** due to intentional test rejection in `tests/test.js`.
