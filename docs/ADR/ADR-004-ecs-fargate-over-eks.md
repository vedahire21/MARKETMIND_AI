# ADR-004: Choose ECS Fargate Over Kubernetes (EKS)

## Status
Accepted

## Context
Deploying containers on AWS can be achieved via AWS ECS/Fargate or AWS EKS (Kubernetes). 

## Decision
We select **AWS ECS with Fargate** serverless execution.

## Rationale
- EKS adds significant cluster management overhead, control plane costs, complex ingress controller maintenance, and YAML duplication for a single modular monolith + worker workload.
- ECS Fargate provides native AWS IAM integration, zero node group maintenance, instant auto-scaling, and seamless integration with CloudWatch and ALB.
