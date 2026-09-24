# =============================================================================
# Task 14.10 — Outputs
# =============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name (API endpoint)"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB hosted zone ID (for Route53 alias records)"
  value       = aws_lb.main.zone_id
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.postgres.db_name
}

output "sqs_order_queue_url" {
  description = "SQS Order Queue URL"
  value       = aws_sqs_queue.order_queue.url
}

output "sqs_order_queue_arn" {
  description = "SQS Order Queue ARN"
  value       = aws_sqs_queue.order_queue.arn
}

output "sqs_dlq_url" {
  description = "SQS Dead Letter Queue URL"
  value       = aws_sqs_queue.order_queue_dlq.url
}

output "ecr_server_url" {
  description = "ECR repository URL for server image"
  value       = aws_ecr_repository.server.repository_url
}

output "ecr_client_url" {
  description = "ECR repository URL for client image"
  value       = aws_ecr_repository.client.repository_url
}

output "s3_assets_bucket" {
  description = "S3 bucket name for product assets and Bedrock KB docs"
  value       = aws_s3_bucket.assets.id
}

output "s3_assets_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.assets.arn
}

output "ecs_cluster_name" {
  description = "ECS Fargate cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name (for CI/CD force-deploy)"
  value       = aws_ecs_service.server.name
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for ECS tasks"
  value       = aws_cloudwatch_log_group.ecs_logs.name
}

output "secrets_manager_arn" {
  description = "Secrets Manager ARN for app secrets"
  value       = aws_secretsmanager_secret.app_secrets.arn
  sensitive   = true
}
