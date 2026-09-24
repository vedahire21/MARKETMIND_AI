# =============================================================================
# Task 14.1 — VPC Networking (Public, Private, Isolated Subnets across 2 AZs)
# =============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

# --- VPC ---
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "${local.prefix}-vpc" }
}

# --- Internet Gateway ---
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${local.prefix}-igw" }
}

# --- Elastic IPs for NAT Gateways ---
resource "aws_eip" "nat_1" {
  domain = "vpc"
  tags   = { Name = "${local.prefix}-nat-eip-1" }
}

resource "aws_eip" "nat_2" {
  domain = "vpc"
  tags   = { Name = "${local.prefix}-nat-eip-2" }
}

# --- NAT Gateways (one per AZ for HA) ---
resource "aws_nat_gateway" "az1" {
  allocation_id = aws_eip.nat_1.id
  subnet_id     = aws_subnet.public[0].id
  tags          = { Name = "${local.prefix}-nat-az1" }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "az2" {
  allocation_id = aws_eip.nat_2.id
  subnet_id     = aws_subnet.public[1].id
  tags          = { Name = "${local.prefix}-nat-az2" }

  depends_on = [aws_internet_gateway.main]
}

# --- Public Subnets (ALB) ---
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "${local.prefix}-public-${count.index + 1}" }
}

# --- Private Subnets (ECS Fargate Tasks) ---
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = { Name = "${local.prefix}-private-${count.index + 1}" }
}

# --- Isolated Subnets (RDS — no internet access) ---
resource "aws_subnet" "isolated" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 20)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = { Name = "${local.prefix}-isolated-${count.index + 1}" }
}

# --- Route Tables ---

# Public route table → Internet Gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${local.prefix}-public-rt" }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private route tables → NAT Gateways (one per AZ)
resource "aws_route_table" "private_1" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${local.prefix}-private-rt-1" }
}

resource "aws_route" "private_nat_1" {
  route_table_id         = aws_route_table.private_1.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.az1.id
}

resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private[0].id
  route_table_id = aws_route_table.private_1.id
}

resource "aws_route_table" "private_2" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${local.prefix}-private-rt-2" }
}

resource "aws_route" "private_nat_2" {
  route_table_id         = aws_route_table.private_2.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.az2.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private[1].id
  route_table_id = aws_route_table.private_2.id
}

# Isolated route table (no routes to internet — RDS only)
resource "aws_route_table" "isolated" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${local.prefix}-isolated-rt" }
}

resource "aws_route_table_association" "isolated" {
  count          = 2
  subnet_id      = aws_subnet.isolated[count.index].id
  route_table_id = aws_route_table.isolated.id
}
