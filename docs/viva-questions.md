# University Viva & Examination Questions — CloudDeploy CI/CD Project

## Topic: Automated CI/CD Pipeline for Cloud-Native Web Application Deployment

This document contains **35 Viva Questions and Answers** tailored specifically for B.Tech Domain Project students defending their DevOps project.

---

### Section 1: Core DevOps & Cloud Concepts

#### Q1: What is DevOps?
**Answer:** DevOps is a combination of cultural philosophies, practices, and tools that increases an organization's ability to deliver applications and services at high velocity, combining Software Development (Dev) and IT Operations (Ops).

#### Q2: What is a Cloud-Native application?
**Answer:** A cloud-native application is an application specifically designed and built to run in cloud environment leveraging microservices, containerization (Docker), dynamic orchestration, and automated CI/CD pipelines.

#### Q3: What is the main difference between traditional deployment and CI/CD deployment?
**Answer:** In traditional deployment, developers manually compile, test, FTP/SSH upload files to servers, which is error-prone and slow. In CI/CD deployment, code push automatically triggers automated builds, tests, container packaging, and cloud deployment in minutes with zero manual intervention.

#### Q4: What is Continuous Integration (CI)?
**Answer:** CI is the DevOps practice of frequently merging developer code changes into a central repository, followed by automated building and automated testing to catch errors early.

#### Q5: What is Continuous Delivery vs Continuous Deployment (CD)?
**Answer:** 
- **Continuous Delivery:** Code is automatically built, tested, and staged for release, but manual approval is needed to push to production.
- **Continuous Deployment:** Every code change that passes automated testing is automatically released directly to production without human intervention.

---

### Section 2: Version Control & Git

#### Q6: What is Git and why is it used?
**Answer:** Git is a distributed Version Control System (VCS) that tracks changes in source code during software development, allowing multiple developers to collaborate without overwriting each other's code.

#### Q7: What is GitHub?
**Answer:** GitHub is a cloud-based hosting service for Git repositories that provides web graphical interface, access control, and automation features like Webhooks and Actions.

#### Q8: How does GitHub trigger AWS CodePipeline automatically?
**Answer:** GitHub uses AWS CodeStar Connections (or Webhooks). When a developer executes `git push`, GitHub sends an HTTP POST event payload to AWS CodePipeline, which automatically starts the pipeline execution.

#### Q9: What is `.gitignore` and why is it essential for DevOps security?
**Answer:** `.gitignore` is a text file telling Git which files/folders to exclude from version control. It prevents sensitive keys, environment files (`.env`), and heavy dependencies (`node_modules`) from leaking into public repositories.

---

### Section 3: AWS CodePipeline & AWS CodeBuild

#### Q10: What is AWS CodePipeline?
**Answer:** AWS CodePipeline is a fully managed Continuous Delivery service that models, visualizes, and automates software release steps whenever code changes occur.

#### Q11: What is AWS CodeBuild?
**Answer:** AWS CodeBuild is a fully managed build service in the cloud that compiles source code, runs unit tests, and produces deployable software packages or Docker container images.

#### Q12: What is `buildspec.yml`?
**Answer:** `buildspec.yml` is a YAML file placed in the project root directory that defines the build commands and environment settings used by AWS CodeBuild during its execution phases.

#### Q13: What are the phases defined in our `buildspec.yml`?
**Answer:** 
1. `install`: Installs runtime dependencies (`npm install`).
2. `pre_build`: Runs unit tests (`npm test`).
3. `build`: Builds the Docker container image (`docker build`).
4. `post_build`: Prepares deployment artifacts for AWS Elastic Beanstalk.

#### Q14: What happens if an automated test fails during the `pre_build` phase in CodeBuild?
**Answer:** Node.js returns exit code 1. CodeBuild immediately flags the build as `FAILED`, and AWS CodePipeline aborts execution, preventing broken code from reaching production.

#### Q15: What is an S3 Artifact Bucket in CodePipeline?
**Answer:** It is an Amazon S3 bucket automatically created by CodePipeline to store intermediate build artifacts (source code zip, compiled output, deployment manifests) between pipeline stages.

---

### Section 4: Docker & Containerization

#### Q16: What is Docker?
**Answer:** Docker is an open-source platform that uses OS-level virtualization to deliver software in packages called containers, isolating application code, dependencies, and configuration.

#### Q17: What is the difference between a Virtual Machine (VM) and a Docker Container?
**Answer:** A VM includes a full hypervisor and heavy guest OS (gigabytes in size). A Docker container shares the host OS kernel and packages only application code and dependencies (megabytes in size), starting in seconds.

#### Q18: What is a Dockerfile?
**Answer:** A Dockerfile is a text document containing all instructions a user can call on the command line to assemble a Docker container image.

#### Q19: What is a Docker Image vs a Docker Container?
**Answer:** A Docker Image is a static, read-only template with instructions for creating a container. A Docker Container is a running instance of a Docker Image.

#### Q20: Why did we choose `node:20-alpine` as our base image?
**Answer:** Alpine Linux is an extremely lightweight Linux distribution (~5MB base size). Using `node:20-alpine` reduces container size, speeds up download times, and minimizes security attack surfaces.

#### Q21: What is `.dockerignore`?
**Answer:** Similar to `.gitignore`, `.dockerignore` specifies files and directories to exclude when building a Docker image (e.g., local `node_modules`, `.git`, temporary log files), optimizing build speed and image size.

#### Q22: What does the `EXPOSE 8080` command in a Dockerfile do?
**Answer:** It documents which network port the application inside the container listens on at runtime (port 8080).

#### Q23: Why do we use `USER node` in our Dockerfile?
**Answer:** Running containers as `root` is a security risk. `USER node` switches container execution to a non-privileged user, adhering to the principle of least privilege.

---

### Section 5: Web Application & Testing

#### Q24: What application did we build for this project?
**Answer:** We built **CloudDeploy — CI/CD Dashboard**, a responsive cloud-native web application displaying real-time pipeline status, application uptime, Docker container health, release versions, and automated test diagnostics.

#### Q25: Why is the `/health` endpoint critical for cloud applications?
**Answer:** Load balancers, container orchestrators (ECS, Kubernetes), and monitoring tools ping `/health` continuously. If it returns HTTP 200 OK, the application is healthy; if it fails, AWS automatically restarts the container.

#### Q26: How does our automated test suite (`tests/test.js`) work?
**Answer:** It starts a temporary server on port 8089, executes HTTP GET requests against `/health`, `/api/status`, and `/`, verifies status code 200, checks JSON key formats, validates file system integrity, and exits with code 0 on success or code 1 on failure.

#### Q27: How can we demonstrate pipeline failure to an examiner?
**Answer:** By adding `throw new Error("Intentional Failure")` inside `tests/test.js`, committing, and pushing to GitHub. CodeBuild fails at `pre_build`, halting CodePipeline before deployment.

---

### Section 6: AWS Cloud & Infrastructure

#### Q28: What is AWS Elastic Beanstalk?
**Answer:** AWS Elastic Beanstalk is an easy-to-use Platform as a Service (PaaS) for deploying and scaling web applications and services written with Java, .NET, PHP, Node.js, Python, Ruby, and Docker.

#### Q29: What is `Dockerrun.aws.json`?
**Answer:** It is an AWS Elastic Beanstalk specific manifest file that specifies how to deploy a Docker container on an Elastic Beanstalk environment.

#### Q30: What is IAM (Identity and Access Management)?
**Answer:** IAM is an AWS service that helps administrators securely control access to AWS resources using authentication (who can log in) and authorization (what permissions they have).

#### Q31: What is the Principle of Least Privilege in IAM?
**Answer:** It is the security practice of granting users or AWS service roles only the minimum permissions necessary to perform their specific tasks and nothing more.

#### Q32: Why did we enable "Privileged Mode" in AWS CodeBuild?
**Answer:** Privileged mode gives the CodeBuild container root permissions to access the host system's Docker daemon, which is required to execute `docker build` inside CodeBuild.

#### Q33: How does semantic versioning work in our application?
**Answer:** Version numbers follow `vMAJOR.MINOR.PATCH` (e.g., `v1.0.0`). When we make small feature changes, we increment to `v1.0.1`. Pushing code updates the live dashboard version dynamically.

#### Q34: What AWS resources incur costs in this setup and how do we stop them?
**Answer:** AWS Elastic Beanstalk (EC2 instance & Elastic Load Balancer) and CodeBuild compute time beyond Free Tier limits. We clean up by deleting the Elastic Beanstalk application, CodePipeline, and CodeBuild project after demo.

#### Q35: What is the main outcome of completing this project?
**Answer:** Demonstrating a complete, production-ready GitOps CI/CD workflow that automates testing, container packaging, and cloud deployment, reducing deployment cycle times from days to seconds while eliminating human error.
