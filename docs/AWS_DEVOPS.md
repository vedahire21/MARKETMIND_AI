# AWS & DevOps Architecture Specification

## 1. Infrastructure Overview (Terraform Managed)

```
AWS Cloud
 ├── VPC (Public & Private Subnets across 2 AZs)
 │    ├── Public Subnet: ALB, NAT Gateway
 │    └── Private Subnet: ECS Fargate (API + Workers), RDS Postgres, ElastiCache Redis
 ├── Amazon SQS Queue & Dead Letter Queue (DLQ)
 ├── Amazon Bedrock Knowledge Bases & Guardrails
 ├── Amazon S3 (Product Media + Outbox Backup)
 ├── Amazon ECR (Docker Image Repository)
 └── AWS CloudWatch (Logs, Metrics, Synthetic Alarms)
```

## 2. CI/CD Pipeline (GitHub Actions)

```yaml
on:
  push:
    branches: [ main ]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install & Run Unit/Integration Tests
        run: |
          npm ci
          npm run test
      - name: Build Docker Images & Push to ECR
        run: |
          docker build -t marketmind-api ./server
          docker tag marketmind-api:latest ${{ secrets.ECR_REGISTRY }}/marketmind-api:latest
          docker push ${{ secrets.ECR_REGISTRY }}/marketmind-api:latest
      - name: Deploy to ECS Fargate
        run: |
          aws ecs update-service --cluster marketmind-cluster --service marketmind-api-service --force-new-deployment
```

## 3. Observability & Telemetry Requirements
- **Logs**: Structured JSON logging (Pino/Winston) with `trace_id`, `user_id`, `request_path`, and `duration_ms`.
- **Metrics**: Standard technical metrics (CPU, Memory, Latency, HTTP 5xx rates) + **Business KPIs** (Orders Created/Min, Payment Conversion Rate, AI Agent Token Usage).
