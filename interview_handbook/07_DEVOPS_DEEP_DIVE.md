# MarketMind AI — DevOps & CI/CD Pipeline Deep Dive

## 1. Complete CI/CD Lifecycle Diagram

```mermaid
flowchart LR
    Dev["Developer (Git Push main)"] --> GH["GitHub Repository"]
    
    subgraph CI ["Continuous Integration (Parallel Quality Gates)"]
        ServerCI["Job: server-ci"]
        ClientCI["Job: client-ci"]
        
        ServerCI --> SC1["npm ci"]
        SC1 --> SC2["npx prisma generate"]
        SC2 --> SC3["Vitest Test Suite (180 Tests)"]
        SC3 --> SC4["TypeScript strict build (tsc)"]

        ClientCI --> CC1["npm ci"]
        CC1 --> CC2["Client Vite build (tsc && vite build)"]
    end

    subgraph CD ["Continuous Delivery & Deployment"]
        BuildDocker["Job: build-and-push"]
        ECR["AWS ECR Private Registry"]
        DeployECS["Job: deploy-ecs"]
        Fargate["Amazon ECS Fargate Rolling Update"]
        CircuitBreaker["Circuit Breaker & Rollback"]
    end

    GH --> ServerCI
    GH --> ClientCI
    ServerCI & ClientCI --> BuildDocker
    BuildDocker -->|Docker Buildx (Multi-Stage)| ECR
    ECR --> DeployECS
    DeployECS -->|aws ecs update-service| Fargate
    Fargate -.->|Health Check Fails| CircuitBreaker
```

---

## 2. Docker Multi-Stage Optimization

### Server Dockerfile (`server/Dockerfile`)
```dockerfile
# Stage 1: Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: Runtime Stage (Lightweight Production)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/dist ./dist
USER appuser
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1
CMD ["node", "dist/index.js"]
```

### Why This is Production-Grade
1. **Minimal Attack Surface**: The runtime image uses `node:20-alpine` without TypeScript compilers, git, or build tools.
2. **Non-Root User Execution**: Runs as unprivileged `appuser`, preventing container breakout vulnerabilities.
3. **Layer Caching**: `package*.json` and `prisma/` are copied and installed first, allowing Docker layer caching across code changes.
4. **Native Health Check**: Probes `/health` endpoint directly inside the container using `wget` (Alpine-compatible).

---

## 3. Deployment Strategy & Rollback (ECS Circuit Breaker)

In `infra/terraform/ecs_service.tf`:
```hcl
deployment_circuit_breaker {
  enable   = true
  rollback = true
}

deployment_controller {
  type = "ECS"
}
```
- **How Rolling Updates Work**: ECS starts new container instances with the updated ECR image tag. The ALB sends health check requests (`/health`). Only when new tasks report `HEALTHY` does the ALB redirect live customer traffic and drain old container instances.
- **Automated Rollback**: If the new tasks fail their health check threshold within 5 minutes, ECS terminates the new tasks and rolls back to the previous stable revision with zero downtime.
