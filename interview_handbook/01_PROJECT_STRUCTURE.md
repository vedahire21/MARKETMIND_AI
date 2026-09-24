# MarketMind AI — Project Structure & Repository Map

## 1. Executive Overview
MarketMind AI is an enterprise-grade AI-powered marketplace and autonomous business operations platform. The project is organized as a **Modular Monolith** backend (`server/`), a **Single-Page Application** frontend (`client/`), and declarative **Infrastructure as Code** (`infra/terraform/`).

---

## 2. Directory Tree & Layer Mapping

```
MarketMindAI/
├── .agents/
│   └── rules/                          # Governance & Architecture constraints
│       ├── ai.md                       # AI state isolation (ADR-009) rules
│       ├── architecture.md             # Modular monolith & ACID transaction guidelines
│       ├── database.md                 # PostgreSQL & Prisma data integrity rules
│       ├── security.md                 # Timing-safe cryptography & RBAC rules
│       └── testing.md                  # Test coverage requirements
├── .github/
│   └── workflows/
│       └── ci-cd.yml                   # Production GitHub Actions CI/CD pipeline
├── AGENTS.md                           # Master governance & development standards
├── docker-compose.yml                  # Local development infrastructure (Postgres 16, Redis 7, LocalStack)
├── docs/                               # Architectural Decision Records (ADRs) & Specs
│   ├── ADR/                            # ADR-001 through ADR-009
│   ├── AGENT_WORKFLOWS.md              # Multi-agent prompt engineering & orchestration
│   ├── API_SPEC.md                     # REST API schemas & error conventions
│   ├── AWS_DEVOPS.md                   # Cloud topology & deployment runbooks
│   ├── DATABASE.md                     # Schema indexes, relations & locking model
│   ├── INTERVIEW_DEFENSE.md            # Architectural tradeoff defense
│   ├── PAYMENTS_RAZORPAY.md            # Razorpay integration specifications
│   ├── PRD.md / DRD.md                 # Product and Data requirements
│   ├── REQUIREMENTS_AUDIT.md           # Engineering audit report
│   ├── ROADMAP.md                      # 16-phase milestone tracker
│   ├── SECURITY.md                     # Threat modeling & OWASP Top 10 mitigations
│   └── TEST_PLAN.md                    # Master QA & concurrency test strategy
├── infra/
│   └── terraform/                      # AWS Infrastructure as Code (11 modules)
│       ├── alb.tf                      # Application Load Balancer & TLS 1.3 listener
│       ├── ecr.tf                      # ECR container repositories & lifecycle policies
│       ├── ecs_service.tf              # ECS Fargate service & target-tracking auto-scaling
│       ├── ecs_task.tf                 # Task definitions, logging & secrets injection
│       ├── iam.tf                      # Least-privilege IAM task & execution roles
│       ├── main.tf                     # Provider & S3 remote state backend
│       ├── networking.tf               # 3-tier VPC (Public, Private, Isolated subnets, 2 AZs, Dual NAT)
│       ├── outputs.tf                  # Infrastructure endpoints & ARNs
│       ├── s3.tf                       # S3 bucket, SQS queues (Order + DLQ), RDS Multi-AZ, CloudWatch
│       ├── secrets.tf                  # AWS Secrets Manager with auto-populated DATABASE_URL
│       ├── security_groups.tf          # 3-layer security group network isolation
│       ├── terraform.tfvars.example    # Configuration variables template
│       └── variables.tf                # Input variable declarations
├── server/                             # Backend Application (Node.js 20/24, Express, TypeScript, Prisma)
│   ├── prisma/
│   │   └── schema.prisma               # 15 Prisma relational models & enums
│   ├── src/
│   │   ├── index.ts                    # Express entrypoint, rate limiters, routes
│   │   ├── modules/                    # 9 Domain Modules
│   │   │   ├── ai/                     # Copilot, Bedrock RAG support, Recommendations, Forecasting, Anomalies
│   │   │   ├── analytics/              # Allowlisted queries & Business Analyst NLP
│   │   │   ├── auth/                   # JWT HS256 auth, bcryptjs, RBAC hierarchy
│   │   │   ├── cart/                   # Cart management & quantity checks
│   │   │   ├── catalog/                # Categories, products, variants, slugs
│   │   │   ├── inventory/              # Pessimistic stock locking & reservation
│   │   │   ├── orders/                 # Checkout pipeline & transactional outbox
│   │   │   ├── payments/               # Razorpay order & timing-safe HMAC SHA256
│   │   │   └── reviews/                # Reviews, sentiment events, intelligence
│   │   ├── queue/                      # OutboxPublisher, SQS client, Idempotent SQSWorker
│   │   ├── shared/                     # Pino audit logger, JWT, Hash, RateLimiter, Prisma
│   │   ├── load-test/                  # Synthetic benchmarks (HMAC throughput, concurrency)
│   │   └── __tests__/                  # 17 Vitest test suites (180 passing tests)
│   ├── Dockerfile                      # Multi-stage production build (Node Alpine slim)
│   └── package.json
└── client/                             # Frontend Application (React 18, TypeScript, Vite 5)
    ├── src/
    │   ├── App.tsx                     # Main layout, tab navigation, cart drawer
    │   ├── components/
    │   │   ├── AnomalyInvestigatorView.tsx # Metric monitoring & AI diagnostic UI
    │   │   ├── InventoryIntelligenceView.tsx # Stockout risk & reorder advice UI
    │   │   ├── Navbar.tsx              # Top bar, role selector, cart counter
    │   │   ├── ProductCatalog.tsx      # Product cards, category filter, search
    │   │   ├── SellerCopilotModal.tsx  # AI listing generator & draft approval modal
    │   │   └── SupportBotModal.tsx     # Bedrock RAG support chatbot modal
    │   ├── index.css                   # Custom CSS tokens & dark-mode styling
    │   └── main.tsx                    # React DOM entrypoint
    ├── Dockerfile                      # Multi-stage client build (Vite -> Nginx Alpine)
    └── package.json
```

---

## 3. Detailed Component Breakdown

### 3.1 Backend Modules (`server/src/modules/`)

| Module Folder | Layer | Why It Exists | Dependencies | Depended On By |
| :--- | :--- | :--- | :--- | :--- |
| `auth/` | Domain / Security | Manages user registration, credential verification, JWT issuance, and RBAC enforcement. | `shared/prisma`, `shared/jwt`, `shared/hash`, `shared/validate` | `index.ts`, `shared/authMiddleware` |
| `catalog/` | Domain / Commerce | Manages categories, products, multi-sku variants, and URL slug generation with collision resistance. | `shared/prisma`, `shared/validate` | `cart`, `orders`, `ai`, `reviews` |
| `cart/` | Domain / Commerce | Maintains user shopping baskets and validates available item quantities. | `shared/prisma`, `catalog` | `orders` |
| `inventory/` | Domain / Core ACID | Manages stock counters with pessimistic reservation locking (`available = quantity - reservedQuantity >= requested`). | `shared/prisma` | `orders`, `payments`, `ai/inventoryIntelligence` |
| `orders/` | Domain / Core ACID | Executes multi-item checkouts inside interactive transactions; writes Outbox events atomically. | `inventory`, `shared/prisma`, `queue/outboxPublisher` | `payments`, `ai/supportAgent` |
| `payments/` | Domain / Financial | Integrates Razorpay; validates webhook and client payment signatures using `crypto.timingSafeEqual`. | `orders`, `inventory`, `shared/prisma` | `index.ts` |
| `reviews/` | Domain / Social | Records user ratings and reviews; emits SQS events for sentiment batching; computes intelligence scores. | `shared/prisma`, `queue/outboxPublisher` | `index.ts` |
| `analytics/` | Domain / Intelligence | Executes allowlisted read-only aggregate queries; provides natural-language business analyst insights without raw SQL. | `shared/prisma`, `catalog` | `index.ts` |
| `ai/` | Domain / GenAI | Hosts the 4 AI agent engines: Seller Copilot (DRAFT-only), Bedrock RAG Support Agent, Recommendation Engine, Inventory Forecaster, and Anomaly Investigator. | `shared/prisma`, AWS Bedrock SDK | `index.ts` |

### 3.2 Infrastructure & DevOps Layer (`infra/` & `.github/`)

| Component | Layer | Why It Exists | Depends On | Depended On By |
| :--- | :--- | :--- | :--- | :--- |
| `infra/terraform/` | Cloud IaC | Provisions isolated production AWS infrastructure with zero manual console configuration. | AWS Provider | CI/CD GitHub Actions |
| `.github/workflows/ci-cd.yml` | Automation / CI/CD | Automates typechecking, unit/integration testing, multi-stage Docker builds, ECR pushing, and rolling ECS deployments. | GitHub Actions Runners | Development Team |
| `docker-compose.yml` | Local Dev Stack | Spawns PostgreSQL 16, Redis 7, and LocalStack (SQS/S3) for local offline development. | Docker Engine | Developers running local services |
