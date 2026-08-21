# ==============================================================================
# CloudDeploy - Dockerfile
# Base Image: Lightweight Node.js 20 Alpine Linux
# Topic: Automated CI/CD Pipeline for Cloud-Native Web Application Deployment
# ==============================================================================

FROM node:20-alpine

# Set application metadata labels
LABEL maintainer="DevOps Student <student@university.edu>" \
      project="CloudDeploy CI/CD Pipeline" \
      version="1.0.0" \
      description="Cloud-native web dashboard for automated AWS CI/CD pipeline"

# Set working directory inside container
WORKDIR /usr/src/app

# Set production environment variables
ENV NODE_ENV=production \
    PORT=8080 \
    APP_VERSION=v1.0.0

# Install dependencies first to leverage Docker layer caching
COPY package*.json ./
RUN npm install --omit=dev --silent

# Copy application source code
COPY server.js ./
COPY app ./app

# Use built-in unprivileged non-root user 'node' for enhanced security
USER node

# Expose web application port (8080 is standard for AWS Elastic Beanstalk & App Runner)
EXPOSE 8080

# Configure container health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# Define default startup command
CMD ["npm", "start"]
