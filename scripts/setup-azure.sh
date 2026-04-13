#!/bin/bash

# Azure Static Web Apps Setup Script for CogniCare
# This script creates Azure resources and provides deployment configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="cognicare-rg"
LOCATION="westeurope"
APP_NAME="cognicare-web"

# Backend origin (Render)
BACKEND_ORIGIN="https://cognicare-api.onrender.com"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  CogniCare Azure Deployment Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI (az) is not installed.${NC}"
    echo "Install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if user is logged in
echo -e "${YELLOW}Checking Azure login...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}Not logged in. Running 'az login'...${NC}"
    az login
fi

# Get subscription info
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
echo -e "${GREEN}✓ Using subscription: $SUBSCRIPTION_NAME ($SUBSCRIPTION_ID)${NC}"
echo ""

# Create resource group
echo -e "${YELLOW}Creating resource group: $RESOURCE_GROUP...${NC}"
az group create \
    --name $RESOURCE_GROUP \
    --location $LOCATION \
    --tags "Project=CogniCare" "Environment=Production" \
    2>/dev/null || echo -e "${GREEN}✓ Resource group already exists${NC}"

# Create Static Web App
echo -e "${YELLOW}Creating Static Web App: $APP_NAME...${NC}"
az staticwebapp create \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku Free \
    2>/dev/null || echo -e "${GREEN}✓ Static Web App already exists${NC}"

# Get deployment token
echo -e "${YELLOW}Retrieving deployment token...${NC}"
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query "properties.apiKey" \
    -o tsv)

if [ -z "$DEPLOYMENT_TOKEN" ]; then
    echo -e "${RED}Error: Could not retrieve deployment token${NC}"
    exit 1
fi

# Get the default hostname
DEFAULT_HOSTNAME=$(az staticwebapp show \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query "defaultHostname" \
    -o tsv)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Resource Details:${NC}"
echo "  - Resource Group: $RESOURCE_GROUP"
echo "  - Static Web App: $APP_NAME"
echo "  - Default URL: https://$DEFAULT_HOSTNAME"
echo "  - Location: $LOCATION"
echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  GitHub Secrets Required${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "Add these secrets to your GitHub repository:"
echo "  (Settings > Secrets and variables > Actions > New repository secret)"
echo ""
echo -e "${BLUE}Secret 1: AZURE_STATIC_WEB_APPS_API_TOKEN${NC}"
echo "$DEPLOYMENT_TOKEN"
echo ""
echo -e "${BLUE}Secret 2: VITE_BACKEND_ORIGIN${NC}"
echo "$BACKEND_ORIGIN"
echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Next Steps${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "1. Go to: https://github.com/NourAllahMaamar/Cognicare_Web_Dashboard/settings/secrets/actions"
echo "2. Add the two secrets above"
echo "3. Push to main branch to trigger deployment"
echo "4. Monitor deployment at: https://github.com/NourAllahMaamar/Cognicare_Web_Dashboard/actions"
echo ""
echo -e "${GREEN}Your site will be live at: https://$DEFAULT_HOSTNAME${NC}"
echo ""

# Save to file for reference
cat > azure-deployment-config.txt << EOF
Azure Deployment Configuration
==============================
Resource Group: $RESOURCE_GROUP
Static Web App: $APP_NAME
Default URL: https://$DEFAULT_HOSTNAME
Location: $LOCATION

GitHub Secrets:
--------------
AZURE_STATIC_WEB_APPS_API_TOKEN=$DEPLOYMENT_TOKEN
VITE_BACKEND_ORIGIN=$BACKEND_ORIGIN

Created: $(date)
EOF

echo -e "${BLUE}Configuration saved to: azure-deployment-config.txt${NC}"
