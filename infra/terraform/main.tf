# =============================================================================
# MarketMind AI — Terraform Root Configuration
# =============================================================================
# Backend: S3 state with DynamoDB locking for team collaboration
# Provider: AWS ~> 5.0
# Architecture: ECS Fargate on private subnets, ALB on public subnets, 
#               RDS PostgreSQL on isolated subnets, SQS with DLQ
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment after initial `terraform apply` creates the S3 bucket
  # backend "s3" {
  #   bucket         = "marketmind-terraform-state"
  #   key            = "infra/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "marketmind-terraform-lock"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "MarketMind-AI"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Common data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  prefix     = "marketmind-${var.environment}"
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
}
