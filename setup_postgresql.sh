#!/bin/bash

# Setup PostgreSQL for Template Primărie Digitală
# This script installs PostgreSQL, creates database and user, and sets up the schema

set -e

echo "🏛️  Setting up PostgreSQL for Template Primărie Digitală..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database configuration
DB_NAME="primarie_digital"
DB_USER="primarie_user"
DB_PASSWORD="primarie_secure_password_2024"
DB_HOST="localhost"
DB_PORT="5432"

echo -e "${BLUE}📦 Installing PostgreSQL...${NC}"

# Install PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib python3-psycopg2
    echo -e "${GREEN}✅ PostgreSQL installed successfully${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL already installed${NC}"
fi

# Start PostgreSQL service
echo -e "${BLUE}🚀 Starting PostgreSQL service...${NC}"
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
echo -e "${BLUE}🔧 Creating database and user...${NC}"

# Run as postgres user
sudo -u postgres psql << EOF
-- Create user
DROP USER IF EXISTS $DB_USER;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Create database
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
GRANT ALL ON SCHEMA public TO $DB_USER;

-- Create extensions
\c $DB_NAME;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\q
EOF

echo -e "${GREEN}✅ Database $DB_NAME and user $DB_USER created successfully${NC}"

# Update .env file
echo -e "${BLUE}📝 Updating .env configuration...${NC}"

ENV_FILE="/home/andrei/Documents/aim/aim/.env"

# Update DATABASE_URL in .env
if [ -f "$ENV_FILE" ]; then
    # Backup original .env
    cp "$ENV_FILE" "$ENV_FILE.backup"
    
    # Update DATABASE_URL
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"postgresql+asyncpg://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME\"|" "$ENV_FILE"
    
    # Update other PostgreSQL settings
    sed -i "s|^POSTGRES_DB=.*|POSTGRES_DB=\"$DB_NAME\"|" "$ENV_FILE"
    sed -i "s|^POSTGRES_USER=.*|POSTGRES_USER=\"$DB_USER\"|" "$ENV_FILE"
    sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=\"$DB_PASSWORD\"|" "$ENV_FILE"
    
    echo -e "${GREEN}✅ .env file updated with PostgreSQL configuration${NC}"
else
    echo -e "${RED}❌ .env file not found at $ENV_FILE${NC}"
    exit 1
fi

# Test connection
echo -e "${BLUE}🔍 Testing PostgreSQL connection...${NC}"
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL connection successful${NC}"
else
    echo -e "${RED}❌ Failed to connect to PostgreSQL${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 PostgreSQL setup completed successfully!${NC}"
echo -e "${YELLOW}📋 Database Details:${NC}"
echo -e "   Database: $DB_NAME"
echo -e "   User: $DB_USER"
echo -e "   Host: $DB_HOST"
echo -e "   Port: $DB_PORT"
echo -e "   Connection URL: postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo -e "${BLUE}🔄 Next step: Run the database migration script${NC}"