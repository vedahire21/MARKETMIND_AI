# =============================================================================
# Task 14.2 — Security Groups
# =============================================================================

# --- ALB Security Group (public HTTP/HTTPS) ---
resource "aws_security_group" "alb" {
  name_prefix = "${local.prefix}-alb-"
  description = "Allow inbound HTTP/HTTPS to Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.prefix}-alb-sg" }

  lifecycle {
    create_before_destroy = true
  }
}

# --- ECS Tasks Security Group (only from ALB) ---
resource "aws_security_group" "ecs_tasks" {
  name_prefix = "${local.prefix}-ecs-"
  description = "Allow inbound from ALB to ECS tasks on app port"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "App port from ALB only"
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound (DB, SQS, AWS APIs, internet via NAT)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.prefix}-ecs-sg" }

  lifecycle {
    create_before_destroy = true
  }
}

# --- RDS Security Group (only from ECS tasks) ---
resource "aws_security_group" "rds" {
  name_prefix = "${local.prefix}-rds-"
  description = "Allow PostgreSQL from ECS tasks only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    description = "No outbound required for RDS"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.prefix}-rds-sg" }

  lifecycle {
    create_before_destroy = true
  }
}
