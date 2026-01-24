#!/bin/bash

# Warmup script for Prox product categories
# Run this after updating category definitions or adding new affiliate sources

# Configuration
API_URL="${PROX_API_URL:-https://proxdesign.co}"
LOCAL_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse arguments
TYPE="${1:-all}"  # all, quickfix, general
ENV="${2:-production}"  # production, local

if [ "$ENV" == "local" ]; then
  BASE_URL="$LOCAL_URL"
else
  BASE_URL="$API_URL"
fi

echo -e "${YELLOW}🔥 Warming up categories...${NC}"
echo "   Type: $TYPE"
echo "   Environment: $ENV"
echo "   URL: $BASE_URL/api/warmup?type=$TYPE"
echo ""

# Make the request
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/warmup?type=$TYPE")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ Warmup completed successfully${NC}"
  echo ""

  # Parse and display results (requires jq)
  if command -v jq &> /dev/null; then
    echo "Stats:"
    echo "$BODY" | jq -r '.stats | "  Total: \(.total) | Success: \(.success) | Errors: \(.errors) | Cache: \(.cacheSize)"'
    echo ""
    echo "Duration: $(echo "$BODY" | jq -r '.duration')"
    echo ""
    echo "Categories warmed:"
    echo "$BODY" | jq -r '.results[] | "  [\(.source)] \(.category): \(.count) products"'
  else
    echo "$BODY"
  fi
else
  echo -e "${RED}❌ Warmup failed with status $HTTP_CODE${NC}"
  echo "$BODY"
  exit 1
fi
