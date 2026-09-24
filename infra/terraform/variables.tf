# =============================================================================
# Variables — MarketMind AI Terraform Configuration
# =============================================================================

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be 'staging' or 'production'."
  }
}

variable "db_password" {
  description = "RDS PostgreSQL master password"
  type        = string
  sensitive   = true
}

variable "db_username" {
  description = "RDS PostgreSQL master username"
  type        = string
  default     = "marketmind_admin"
  sensitive   = true
}

variable "app_port" {
  description = "Container port for the backend API"
  type        = number
  default     = 5000
}

variable "server_cpu" {
  description = "Fargate task CPU units (256 = 0.25 vCPU)"
  type        = number
  default     = 512
}

variable "server_memory" {
  description = "Fargate task memory in MiB"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "min_capacity" {
  description = "Minimum auto-scaling capacity"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum auto-scaling capacity"
  type        = number
  default     = 4
}

variable "domain_name" {
  description = "Optional custom domain for ALB (leave empty to skip)"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (required if domain_name is set)"
  type        = string
  default     = ""
}
