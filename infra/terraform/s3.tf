# =============================================================================
# Task 14.8 — S3 Bucket (Product Images, Bedrock KB Docs, Static Assets)
# =============================================================================

resource "aws_s3_bucket" "assets" {
  bucket        = "${local.prefix}-assets-${local.account_id}"
  force_destroy = var.environment != "production"

  tags = { Name = "${local.prefix}-assets" }
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"] # Restrict to domain in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# --- Lifecycle rules for cost optimization ---
resource "aws_s3_bucket_lifecycle_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    id     = "archive-old-versions"
    status = "Enabled"

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# --- SQS Queues (moved from old main.tf) ---
resource "aws_sqs_queue" "order_queue_dlq" {
  name                      = "${local.prefix}-order-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = { Name = "${local.prefix}-order-dlq" }
}

resource "aws_sqs_queue" "order_queue" {
  name                      = "${local.prefix}-order-queue"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 864000  # 10 days
  receive_wait_time_seconds = 20      # Long polling
  visibility_timeout_seconds = 300    # 5 min processing window

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.order_queue_dlq.arn
    maxReceiveCount     = 5
  })

  tags = { Name = "${local.prefix}-order-queue" }
}

# --- RDS PostgreSQL (moved from old main.tf) ---
resource "aws_db_subnet_group" "main" {
  name       = "${local.prefix}-rds-subnet-group"
  subnet_ids = aws_subnet.isolated[*].id

  tags = { Name = "${local.prefix}-rds-subnet-group" }
}

resource "aws_db_instance" "postgres" {
  identifier             = "${local.prefix}-postgres"
  allocated_storage      = 20
  max_allocated_storage  = 100
  engine                 = "postgres"
  engine_version         = "16.4"
  instance_class         = "db.t4g.micro"
  db_name                = "marketmind"
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  skip_final_snapshot    = var.environment != "production"
  publicly_accessible    = false
  storage_encrypted      = true
  multi_az               = var.environment == "production"

  backup_retention_period = var.environment == "production" ? 7 : 1
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:05:00-sun:06:00"

  performance_insights_enabled = true

  tags = { Name = "${local.prefix}-postgres" }
}

# --- CloudWatch Log Group ---
resource "aws_cloudwatch_log_group" "ecs_logs" {
  name              = "/ecs/${local.prefix}-api"
  retention_in_days = var.environment == "production" ? 90 : 30

  tags = { Name = "${local.prefix}-ecs-logs" }
}
