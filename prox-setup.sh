#!/bin/bash
# =============================================================================
# Prox Product Discovery - Development Environment Setup Script
# =============================================================================
# This script connects you to all services needed to work on the Prox website.
# Run with: ./prox-setup.sh [command]
#
# Commands:
#   check     - Check all prerequisites and connections (default)
#   start     - Start local development servers
#   stop      - Stop local development servers
#   test-apis - Test all API connections
#   status    - Show status of all services
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="$HOME/cloud-projects/prox-product-discovery"
BACKEND_DIR="$PROJECT_ROOT/prox_autonomous_discovery"
FRONTEND_DIR="$PROJECT_ROOT/prox-frontend-v2"

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

check_ok() {
    echo -e "  ${GREEN}✓${NC} $1"
}

check_warn() {
    echo -e "  ${YELLOW}⚠${NC} $1"
}

check_fail() {
    echo -e "  ${RED}✗${NC} $1"
}

check_info() {
    echo -e "  ${BLUE}ℹ${NC} $1"
}

# =============================================================================
# Check Prerequisites
# =============================================================================

check_prerequisites() {
    print_header "Checking Prerequisites"

    local all_good=true

    # Check Homebrew
    if command -v brew &> /dev/null; then
        check_ok "Homebrew installed"
    else
        check_fail "Homebrew not installed - run: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        all_good=false
    fi

    # Check Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        check_ok "Node.js installed ($node_version)"
    else
        check_fail "Node.js not installed - run: brew install node"
        all_good=false
    fi

    # Check npm
    if command -v npm &> /dev/null; then
        check_ok "npm installed ($(npm --version))"
    else
        check_fail "npm not installed"
        all_good=false
    fi

    # Check Python
    if command -v python3 &> /dev/null; then
        local python_version=$(python3 --version)
        check_ok "Python installed ($python_version)"
    else
        check_fail "Python not installed - run: brew install python"
        all_good=false
    fi

    # Check pip
    if command -v pip3 &> /dev/null; then
        check_ok "pip installed"
    else
        check_fail "pip not installed"
        all_good=false
    fi

    # Check PostgreSQL
    if command -v psql &> /dev/null; then
        check_ok "PostgreSQL client installed"
    else
        check_warn "PostgreSQL client not installed - run: brew install postgresql"
    fi

    # Check if PostgreSQL is running
    if pg_isready &> /dev/null; then
        check_ok "PostgreSQL server running"
    else
        check_warn "PostgreSQL server not running - run: brew services start postgresql"
    fi

    # Check Redis (optional)
    if command -v redis-cli &> /dev/null; then
        check_ok "Redis client installed"
        if redis-cli ping &> /dev/null 2>&1; then
            check_ok "Redis server running"
        else
            check_warn "Redis server not running - run: brew services start redis"
        fi
    else
        check_warn "Redis not installed (optional) - run: brew install redis"
    fi

    # Check Git
    if command -v git &> /dev/null; then
        check_ok "Git installed"
    else
        check_fail "Git not installed - run: brew install git"
        all_good=false
    fi

    echo ""
    if [ "$all_good" = true ]; then
        check_ok "All required prerequisites installed"
    else
        check_fail "Some prerequisites missing - install them before continuing"
    fi
}

# =============================================================================
# Check Environment Files
# =============================================================================

check_env_files() {
    print_header "Checking Environment Files"

    # Backend .env
    if [ -f "$BACKEND_DIR/.env" ]; then
        check_ok "Backend .env exists"

        # Check for key variables
        if grep -q "ANTHROPIC_API_KEY=sk-" "$BACKEND_DIR/.env"; then
            check_ok "Anthropic API key configured"
        else
            check_warn "Anthropic API key not configured"
        fi

        if grep -q "YOUTUBE_API_KEY=" "$BACKEND_DIR/.env" && ! grep -q "YOUTUBE_API_KEY=your_" "$BACKEND_DIR/.env"; then
            check_ok "YouTube API key configured"
        else
            check_warn "YouTube API key not configured"
        fi

        if grep -q "DATABASE_URL=" "$BACKEND_DIR/.env"; then
            check_ok "Database URL configured"
        else
            check_warn "Database URL not configured"
        fi
    else
        check_fail "Backend .env missing - copy from .env.example"
    fi

    # Frontend .env.local
    if [ -f "$FRONTEND_DIR/.env.local" ]; then
        check_ok "Frontend .env.local exists"

        if grep -q "NEXT_PUBLIC_API_URL=" "$FRONTEND_DIR/.env.local"; then
            local api_url=$(grep "NEXT_PUBLIC_API_URL=" "$FRONTEND_DIR/.env.local" | cut -d'=' -f2)
            check_ok "API URL configured: $api_url"
        fi

        if grep -q "CANOPY_API_KEY=" "$FRONTEND_DIR/.env.local"; then
            check_ok "Canopy API key configured"
        else
            check_warn "Canopy API key not configured"
        fi
    else
        check_fail "Frontend .env.local missing - copy from .env.example"
    fi
}

# =============================================================================
# Test API Connections
# =============================================================================

test_api_connections() {
    print_header "Testing API Connections"

    # Load environment variables
    if [ -f "$BACKEND_DIR/.env" ]; then
        export $(grep -v '^#' "$BACKEND_DIR/.env" | xargs)
    fi

    # Test Anthropic API
    echo ""
    check_info "Testing Anthropic Claude API..."
    if [ -n "$ANTHROPIC_API_KEY" ] && [ "$ANTHROPIC_API_KEY" != "your_claude_api_key" ]; then
        local response=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "x-api-key: $ANTHROPIC_API_KEY" \
            -H "anthropic-version: 2023-06-01" \
            "https://api.anthropic.com/v1/messages" \
            -X POST -d '{"model":"claude-3-haiku-20240307","max_tokens":1,"messages":[{"role":"user","content":"hi"}]}' \
            -H "Content-Type: application/json" 2>/dev/null)
        if [ "$response" = "200" ]; then
            check_ok "Anthropic API connected"
        else
            check_warn "Anthropic API returned $response (may need valid request)"
        fi
    else
        check_fail "Anthropic API key not set"
    fi

    # Test YouTube API
    check_info "Testing YouTube API..."
    if [ -n "$YOUTUBE_API_KEY" ] && [ "$YOUTUBE_API_KEY" != "your_youtube_api_key" ]; then
        local response=$(curl -s -o /dev/null -w "%{http_code}" \
            "https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&key=$YOUTUBE_API_KEY&maxResults=1" 2>/dev/null)
        if [ "$response" = "200" ]; then
            check_ok "YouTube API connected"
        else
            check_warn "YouTube API returned $response"
        fi
    else
        check_fail "YouTube API key not set"
    fi

    # Test Database Connection
    check_info "Testing PostgreSQL connection..."
    if [ -n "$DATABASE_URL" ]; then
        if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
            check_ok "PostgreSQL database connected"
        else
            check_warn "PostgreSQL connection failed - is the server running?"
        fi
    else
        check_warn "DATABASE_URL not set"
    fi

    # Test Production API
    check_info "Testing Production API (Fly.dev)..."
    local prod_response=$(curl -s -o /dev/null -w "%{http_code}" \
        "https://prox-autonomous-discovery.fly.dev/health" 2>/dev/null)
    if [ "$prod_response" = "200" ]; then
        check_ok "Production API healthy"
    else
        check_warn "Production API returned $prod_response"
    fi
}

# =============================================================================
# Check Service Status
# =============================================================================

check_status() {
    print_header "Service Status"

    # PostgreSQL
    if pg_isready &> /dev/null; then
        check_ok "PostgreSQL: Running"
    else
        check_fail "PostgreSQL: Not running"
    fi

    # Redis
    if redis-cli ping &> /dev/null 2>&1; then
        check_ok "Redis: Running"
    else
        check_warn "Redis: Not running"
    fi

    # Check if backend is running locally
    if curl -s "http://localhost:8000/health" &> /dev/null; then
        check_ok "Backend (localhost:8000): Running"
    else
        check_info "Backend (localhost:8000): Not running"
    fi

    # Check if frontend is running locally
    if curl -s "http://localhost:3000" &> /dev/null; then
        check_ok "Frontend (localhost:3000): Running"
    else
        check_info "Frontend (localhost:3000): Not running"
    fi

    # Production services
    echo ""
    check_info "Production Services:"

    local fly_status=$(curl -s -o /dev/null -w "%{http_code}" "https://prox-autonomous-discovery.fly.dev/health" 2>/dev/null)
    if [ "$fly_status" = "200" ]; then
        check_ok "Fly.dev Backend: Healthy"
    else
        check_warn "Fly.dev Backend: Status $fly_status"
    fi
}

# =============================================================================
# Start Development Servers
# =============================================================================

start_servers() {
    print_header "Starting Development Servers"

    # Start PostgreSQL if not running
    if ! pg_isready &> /dev/null; then
        check_info "Starting PostgreSQL..."
        brew services start postgresql
        sleep 2
    fi
    check_ok "PostgreSQL running"

    # Start Redis if not running
    if ! redis-cli ping &> /dev/null 2>&1; then
        check_info "Starting Redis..."
        brew services start redis 2>/dev/null || true
        sleep 1
    fi

    # Install backend dependencies if needed
    if [ ! -d "$BACKEND_DIR/venv" ]; then
        check_info "Creating Python virtual environment..."
        cd "$BACKEND_DIR"
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
    fi

    # Start backend
    check_info "Starting backend server on port 8000..."
    cd "$BACKEND_DIR"
    source venv/bin/activate 2>/dev/null || true
    nohup python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload > /tmp/prox-backend.log 2>&1 &
    echo $! > /tmp/prox-backend.pid
    check_ok "Backend starting (PID: $(cat /tmp/prox-backend.pid))"

    # Install frontend dependencies if needed
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        check_info "Installing frontend dependencies..."
        cd "$FRONTEND_DIR"
        npm install
    fi

    # Start frontend
    check_info "Starting frontend server on port 3000..."
    cd "$FRONTEND_DIR"
    nohup npm run dev > /tmp/prox-frontend.log 2>&1 &
    echo $! > /tmp/prox-frontend.pid
    check_ok "Frontend starting (PID: $(cat /tmp/prox-frontend.pid))"

    echo ""
    check_ok "Development servers starting..."
    check_info "Backend:  http://localhost:8000"
    check_info "Frontend: http://localhost:3000"
    check_info "Logs: /tmp/prox-backend.log, /tmp/prox-frontend.log"
}

# =============================================================================
# Stop Development Servers
# =============================================================================

stop_servers() {
    print_header "Stopping Development Servers"

    if [ -f /tmp/prox-backend.pid ]; then
        kill $(cat /tmp/prox-backend.pid) 2>/dev/null && check_ok "Backend stopped" || check_info "Backend was not running"
        rm -f /tmp/prox-backend.pid
    fi

    if [ -f /tmp/prox-frontend.pid ]; then
        kill $(cat /tmp/prox-frontend.pid) 2>/dev/null && check_ok "Frontend stopped" || check_info "Frontend was not running"
        rm -f /tmp/prox-frontend.pid
    fi

    # Kill any remaining processes on the ports
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true

    check_ok "All development servers stopped"
}

# =============================================================================
# Print Summary
# =============================================================================

print_summary() {
    print_header "Project Summary"

    echo ""
    echo -e "  ${BLUE}Project Location:${NC}"
    echo "    $PROJECT_ROOT"
    echo ""
    echo -e "  ${BLUE}Key Directories:${NC}"
    echo "    Backend:  $BACKEND_DIR"
    echo "    Frontend: $FRONTEND_DIR"
    echo ""
    echo -e "  ${BLUE}Production URLs:${NC}"
    echo "    Website:  https://proxdesign.co"
    echo "    API:      https://prox-autonomous-discovery.fly.dev"
    echo ""
    echo -e "  ${BLUE}Services Used:${NC}"
    echo "    - Anthropic Claude API (AI chat & analysis)"
    echo "    - YouTube Data API (video collection)"
    echo "    - Pinterest API v5 (pin collection)"
    echo "    - Canopy API (Amazon product search)"
    echo "    - Rainforest API (Amazon product data)"
    echo "    - Resend (magic link emails)"
    echo "    - Google Analytics 4"
    echo "    - Fly.dev (backend hosting)"
    echo "    - Vercel (frontend hosting)"
    echo ""
}

# =============================================================================
# Main
# =============================================================================

main() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           PROX PRODUCT DISCOVERY - Development Setup                      ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"

    local command="${1:-check}"

    case "$command" in
        check)
            check_prerequisites
            check_env_files
            check_status
            print_summary
            ;;
        start)
            start_servers
            ;;
        stop)
            stop_servers
            ;;
        test-apis)
            test_api_connections
            ;;
        status)
            check_status
            ;;
        *)
            echo "Usage: $0 [check|start|stop|test-apis|status]"
            exit 1
            ;;
    esac

    echo ""
}

main "$@"
