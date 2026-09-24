# =============================================================================
# Task 14.6 — ECS Task Definition
# =============================================================================

resource "aws_ecs_task_definition" "server" {
  family                   = "${local.prefix}-server"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.server_cpu
  memory                   = var.server_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "marketmind-server"
    image     = "${aws_ecr_repository.server.repository_url}:latest"
    essential = true

    portMappings = [{
      containerPort = var.app_port
      hostPort      = var.app_port
      protocol      = "tcp"
    }]

    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = tostring(var.app_port) },
      { name = "AWS_REGION", value = local.region },
      { name = "AWS_SQS_ORDER_QUEUE_URL", value = aws_sqs_queue.order_queue.url }
    ]

    secrets = [
      {
        name      = "DATABASE_URL"
        valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:DATABASE_URL::"
      },
      {
        name      = "JWT_ACCESS_SECRET"
        valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:JWT_ACCESS_SECRET::"
      },
      {
        name      = "JWT_REFRESH_SECRET"
        valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:JWT_REFRESH_SECRET::"
      },
      {
        name      = "RAZORPAY_KEY_ID"
        valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:RAZORPAY_KEY_ID::"
      },
      {
        name      = "RAZORPAY_KEY_SECRET"
        valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:RAZORPAY_KEY_SECRET::"
      },
      {
        name      = "RAZORPAY_WEBHOOK_SECRET"
        valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:RAZORPAY_WEBHOOK_SECRET::"
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs_logs.name
        "awslogs-region"        = local.region
        "awslogs-stream-prefix" = "server"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:${var.app_port}/health || exit 1"]
      interval    = 30
      timeout     = 10
      retries     = 3
      startPeriod = 60
    }
  }])

  tags = { Name = "${local.prefix}-server-task" }
}
