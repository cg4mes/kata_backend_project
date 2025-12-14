# QA Indicators Management System - Backend

A robust NestJS-based REST API for managing QA projects, test run indicators, and metrics across multiple pipeline types (regression, performance, security).

## 🚀 Features

- **Project Management**: Create, read, update, and delete QA projects
- **Multi-Pipeline Support**: Handle regression, performance, and security test indicators
- **Metrics Calculation**: Automatic calculation of success rates, coverage, error rates, and security scores
- **User Authentication**: JWT-based authentication with role-based access control (Admin/Viewer)
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Data Validation**: Comprehensive input validation using class-validator
- **Error Handling**: Global exception filter for consistent error responses
- **Modular Architecture**: Clean separation of concerns with NestJS modules

## 🏗️ Architecture

### Modules
- **Projects Module**: Manages QA projects and their metrics
- **Indicators Module**: Handles test run indicators from different pipelines
- **Users Module**: User authentication and authorization

### Key Technologies
- **NestJS**: Progressive Node.js framework
- **TypeORM**: ORM for database management
- **SQLite**: Lightweight database (easily switchable to PostgreSQL/MySQL)
- **JWT**: Secure authentication
- **Swagger**: API documentation
- **class-validator**: DTO validation

## 📋 Prerequisites

- Node.js (v20 or higher)
- npm or yarn
- Docker (for local containerization)
- AWS CLI (for cloud deployment)

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Run tests
npm run test

# Build for production
npm run build
```

### Using Docker

```bash
# Build Docker image
docker build -t kata-backend:local .

# Run container
docker run -p 3000:3000 --env-file .env.qa kata-backend:local

# Access API
open http://localhost:3000/api
```

### Environment Configuration

Create environment files for each environment:

```bash
# .env.qa - QA environment
# .env.staging - Staging environment  
# .env.production - Production environment
```

See `.env.qa` for example configuration.

## 🏃 Running the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 📦 Deployment

This project is configured for deployment to AWS ECS/Fargate with support for multiple environments (QA, Staging, Production).

### Deployment Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Comprehensive deployment guide with AWS setup
- **[AWS_SETUP.md](./AWS_SETUP.md)** - Quick reference for AWS configuration

### Quick Deploy

```bash
# Local build and test
./ci-cd/local-build.sh qa

# Deploy to environment (creates git tag and triggers pipeline)
./ci-cd/deploy.sh
```

### Manual Deployment Steps

1. **Configure AWS Resources** (first time only)
   - See [AWS_SETUP.md](./AWS_SETUP.md) for detailed instructions
   - Set up VPC, RDS, ECS, ECR, IAM roles
   - Configure SSM parameters with secrets

2. **Build and Push Docker Image**
   ```bash
   docker build -t kata-backend .
   docker tag kata-backend:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/kata-backend:qa-latest
   docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/kata-backend:qa-latest
   ```

3. **Deploy to ECS**
   - Pipeline automatically deploys on git tag push
   - Or manually update ECS service via AWS Console

### Environment-Specific Buildspecs

- `buildspec.yml` - Production deployment
- `pipeline/buildspecs/buildspec.qa.yml` - QA deployment
- `pipeline/buildspecs/buildspec.staging.yml` - Staging deployment

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
