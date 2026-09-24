# =============================================================================
# Task 14.9 — AWS Secrets Manager
# =============================================================================

resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${local.prefix}-app-secrets"
  description             = "MarketMind AI application secrets (DB URL, JWT, Razorpay)"
  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = { Name = "${local.prefix}-app-secrets" }
}

# Initial secret version — values must be updated via AWS Console or CI/CD
resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id

  secret_string = jsonencode({
    DATABASE_URL           = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/marketmind?schema=public"
    JWT_ACCESS_SECRET      = "REPLACE_WITH_SECURE_RANDOM_256BIT_KEY"
    JWT_REFRESH_SECRET     = "REPLACE_WITH_SECURE_RANDOM_256BIT_KEY"
    RAZORPAY_KEY_ID        = "REPLACE_WITH_RAZORPAY_KEY_ID"
    RAZORPAY_KEY_SECRET    = "REPLACE_WITH_RAZORPAY_KEY_SECRET"
    RAZORPAY_WEBHOOK_SECRET = "REPLACE_WITH_RAZORPAY_WEBHOOK_SECRET"
    REDIS_URL              = "redis://marketmind-redis.internal:6379"
  })

  lifecycle {
    # Prevent Terraform from overwriting manually updated secrets
    ignore_changes = [secret_string]
  }
}
