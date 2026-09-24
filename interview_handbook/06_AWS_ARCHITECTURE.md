# MarketMind AI — AWS Cloud Architecture & Infrastructure as Code

## 1. AWS Services Actually Used

| AWS Service | Role in MarketMind AI | Configuration Reference |
| :--- | :--- | :--- |
| **AWS VPC** | 3-tier isolated network across 2 Availability Zones (`us-east-1a`, `us-east-1b`). | `infra/terraform/networking.tf` |
| **Application Load Balancer (ALB)** | Public ingress, SSL/TLS termination, HTTP→HTTPS redirect, health checks. | `infra/terraform/alb.tf` |
| **Amazon ECS (Fargate)** | Serverless container compute running the Node.js/Express backend. | `infra/terraform/ecs_service.tf`, `ecs_task.tf` |
| **Amazon ECR** | Private Docker registry with automated scan-on-push and lifecycle rules. | `infra/terraform/ecr.tf` |
| **Amazon RDS (PostgreSQL)** | Managed relational database engine running PostgreSQL 16 on isolated subnets. | `infra/terraform/s3.tf` |
| **Amazon S3** | Storage bucket for product images, Bedrock Knowledge Base docs, and static assets. | `infra/terraform/s3.tf` |
| **Amazon SQS** | Decoupled event queues (`order-events.fifo` & `order-dlq.fifo`) for asynchronous processing. | `infra/terraform/s3.tf` |
| **AWS Secrets Manager** | Secure storage and runtime injection of `DATABASE_URL`, JWT, and Razorpay secrets. | `infra/terraform/secrets.tf` |
| **Amazon CloudWatch** | Centralized structured log driver (`awslogs`) for container logs and health metrics. | `infra/terraform/s3.tf`, `ecs_task.tf` |
| **AWS IAM** | Granular execution and task roles following least-privilege security standards. | `infra/terraform/iam.tf` |
| **Amazon Bedrock** | GenAI foundation model hosting (Claude 3 Haiku/Sonnet), Guardrails, and RAG Knowledge Bases. | `server/src/modules/ai/` |

---

## 2. Network Topology & Subnet Isolation

```mermaid
graph TD
    subgraph VPC ["AWS VPC (10.0.0.0/16) across 2 Availability Zones"]
        subgraph PublicSubnets ["Public Subnets (10.0.1.0/24 & 10.0.2.0/24)"]
            IGW["Internet Gateway"]
            ALB["Application Load Balancer"]
            NAT1["NAT Gateway (AZ1)"]
            NAT2["NAT Gateway (AZ2)"]
        end

        subgraph PrivateSubnets ["Private Subnets — ECS Compute (10.0.10.0/24 & 10.0.20.0/24)"]
            ECS1["ECS Task Container 1"]
            ECS2["ECS Task Container 2"]
            AutoScaler["Auto-Scaling Target Tracking (CPU 70% / RAM 80%)"]
        end

        subgraph IsolatedSubnets ["Isolated Subnets — Database (10.0.100.0/24 & 10.0.200.0/24)"]
            RDSPrimary["RDS PostgreSQL 16 (Primary)"]
            RDSStandby["RDS PostgreSQL 16 (Standby Multi-AZ)"]
        end
    end

    %% Network Routing
    IGW <--> ALB
    ALB -->|Port 4000 (ECS SG only)| ECS1
    ALB -->|Port 4000 (ECS SG only)| ECS2

    ECS1 -->|Outbound HTTPS via NAT| NAT1
    ECS2 -->|Outbound HTTPS via NAT| NAT2
    NAT1 --> IGW
    NAT2 --> IGW

    ECS1 -->|Port 5432 (ECS SG only)| RDSPrimary
    ECS2 -->|Port 5432 (ECS SG only)| RDSPrimary
    RDSPrimary -.->|Synchronous Replication| RDSStandby
```

---

## 3. Security Groups Defense-in-Depth

1. **ALB Security Group (`marketmind-prod-alb-sg`)**:
   - Inbound: Ports `80` (HTTP) and `443` (HTTPS) from `0.0.0.0/0`.
   - Outbound: Port `4000` to `marketmind-prod-ecs-tasks-sg`.
2. **ECS Task Security Group (`marketmind-prod-ecs-tasks-sg`)**:
   - Inbound: Port `4000` ONLY from `marketmind-prod-alb-sg`. (Public internet cannot directly touch containers).
   - Outbound: Port `5432` to RDS Security Group; Port `443` for AWS Bedrock, SQS, S3, Secrets Manager.
3. **RDS Database Security Group (`marketmind-prod-rds-sg`)**:
   - Inbound: Port `5432` ONLY from `marketmind-prod-ecs-tasks-sg`.
   - Outbound: None (Isolated subnets have zero internet route).
