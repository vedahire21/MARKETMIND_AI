terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Network
resource "aws_vpc" "marketmind_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "marketmind-vpc-${var.environment}"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.marketmind_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
}

# SQS Standard Queue & DLQ
resource "aws_sqs_queue" "order_queue_dlq" {
  name = "marketmind-order-queue-dlq-${var.environment}"
}

resource "aws_sqs_queue" "order_queue" {
  name                      = "marketmind-order-queue-${var.environment}"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 864000 # 10 days
  receive_wait_time_seconds = 20

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.order_queue_dlq.arn
    maxReceiveCount     = 5
  })
}

# ECS Fargate Cluster
resource "aws_ecs_cluster" "marketmind_cluster" {
  name = "marketmind-cluster-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# RDS PostgreSQL Database
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "marketmind-rds-subnet-group"
  subnet_ids = [aws_subnet.public_subnet_1.id]
}

resource "aws_db_instance" "postgres" {
  identifier             = "marketmind-postgres-${var.environment}"
  allocated_storage      = 20
  max_allocated_storage  = 100
  engine                 = "postgres"
  engine_version         = "16.1"
  instance_class         = "db.t4g.micro"
  db_name                = "marketmind"
  username               = "postgres"
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  skip_final_snapshot    = true
  publicly_accessible    = false
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs_logs" {
  name              = "/ecs/marketmind-api-${var.environment}"
  retention_in_days = 30
}
