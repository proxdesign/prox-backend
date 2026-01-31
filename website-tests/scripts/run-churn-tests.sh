#!/bin/bash

# Churn Analysis Test Runner
# Automatically executes all tests from CHURN_ANALYSIS_TEST_PLAN.md and generates a scored report

set -e

API_URL="${API_URL:-http://localhost:3000}"
REPORT_FILE="test-results-$(date +%Y%m%d-%H%M%S).md"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
PARTIAL=0
FAIL=0

echo "# Churn Analysis Test Results" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**Run Date:** $(date)" >> "$REPORT_FILE"
echo "**API URL:** $API_URL" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

log_result() {
    local test_id="$1"
    local description="$2"
    local result="$3"
    local details="$4"

    case $result in
        "PASS")
            echo -e "${GREEN}✓ $test_id: PASS${NC}"
            ((PASS++))
            ;;
        "PARTIAL")
            echo -e "${YELLOW}~ $test_id: PARTIAL${NC}"
            ((PARTIAL++))
            ;;
        "FAIL")
            echo -e "${RED}✗ $test_id: FAIL${NC}"
            ((FAIL++))
            ;;
    esac

    echo "| $test_id | $description | **$result** | $details |" >> "$REPORT_FILE"
}

# Helper function to make API calls
chat() {
    local message="$1"
    local history="$2"

    if [ -z "$history" ]; then
        history="[]"
    fi

    curl -s -X POST "$API_URL/api/chat" \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"$message\", \"history\": $history}" 2>/dev/null
}

echo "====================================="
echo "Churn Analysis Test Runner"
echo "====================================="
echo ""

# Check API is available
echo "Checking API availability..."
if ! curl -s -o /dev/null -w "%{http_code}" "$API_URL" | grep -q "200"; then
    echo -e "${RED}ERROR: API at $API_URL is not responding${NC}"
    exit 1
fi
echo -e "${GREEN}API is available${NC}"
echo ""

# =============================================================================
# FLOW TESTS
# =============================================================================
echo "## FLOW Tests (Conversation Flow)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| Test ID | Description | Result | Details |" >> "$REPORT_FILE"
echo "|---------|-------------|--------|---------|" >> "$REPORT_FILE"

echo "Running FLOW tests..."

# FLOW-TTV-01: Solve flow minimal input - count turns to products
# Progressive disclosure: counts as PASS if products OR solutions appear
echo "  Testing FLOW-TTV-01: Solve flow turns to products..."
turn_count=0
has_products=false

# Turn 1: Initial problem statement
response=$(chat "I have a problem to solve" "[]")
turn_count=$((turn_count + 1))
ai_response=$(echo "$response" | jq -r '.response // empty')
solutions=$(echo "$response" | jq -r '.solutions // [] | length')
products=$(echo "$response" | jq -r '.products // [] | length')

# Progressive disclosure: products shown alongside questions count as success
if [ "$solutions" -gt 0 ] || [ "$products" -gt 0 ]; then
    has_products=true
fi

# Build history for next turn
history="[{\"role\": \"assistant\", \"content\": $(echo "$ai_response" | jq -Rs .)}]"

# Turn 2: Answer with room
if [ "$has_products" = false ]; then
    response=$(chat "kitchen" "$history")
    turn_count=$((turn_count + 1))
    ai_response2=$(echo "$response" | jq -r '.response // empty')
    solutions=$(echo "$response" | jq -r '.solutions // [] | length')
    products=$(echo "$response" | jq -r '.products // [] | length')

    if [ "$solutions" -gt 0 ] || [ "$products" -gt 0 ]; then
        has_products=true
    fi

    history="[{\"role\": \"assistant\", \"content\": $(echo "$ai_response" | jq -Rs .)}, {\"role\": \"user\", \"content\": \"kitchen\"}, {\"role\": \"assistant\", \"content\": $(echo "$ai_response2" | jq -Rs .)}]"
fi

# Turn 3: Answer with problem type
if [ "$has_products" = false ]; then
    response=$(chat "counter clutter" "$history")
    turn_count=$((turn_count + 1))
    solutions=$(echo "$response" | jq -r '.solutions // [] | length')
    products=$(echo "$response" | jq -r '.products // [] | length')

    if [ "$solutions" -gt 0 ] || [ "$products" -gt 0 ]; then
        has_products=true
    fi
fi

# Continue up to 6 turns
for i in 4 5 6; do
    if [ "$has_products" = false ]; then
        response=$(chat "yes" "$history")
        turn_count=$((turn_count + 1))
        solutions=$(echo "$response" | jq -r '.solutions // [] | length')
        products=$(echo "$response" | jq -r '.products // [] | length')

        if [ "$solutions" -gt 0 ] || [ "$products" -gt 0 ]; then
            has_products=true
            break
        fi
    fi
done

if [ "$turn_count" -le 3 ]; then
    log_result "FLOW-TTV-01" "Solve flow turns to products" "PASS" "$turn_count turns (target ≤3)"
elif [ "$turn_count" -le 4 ]; then
    log_result "FLOW-TTV-01" "Solve flow turns to products" "PARTIAL" "$turn_count turns (target ≤3)"
else
    log_result "FLOW-TTV-01" "Solve flow turns to products" "FAIL" "$turn_count turns (target ≤3)"
fi

# FLOW-TTV-03: Gift flow minimal input
# Progressive disclosure: counts as PASS if products OR solutions appear
echo "  Testing FLOW-TTV-03: Gift flow turns to products..."
turn_count=0
has_products=false

response=$(chat "I am looking for a gift" "[]")
turn_count=$((turn_count + 1))
ai_response=$(echo "$response" | jq -r '.response // empty')
solutions=$(echo "$response" | jq -r '.solutions // [] | length')
products=$(echo "$response" | jq -r '.products // [] | length')

if [ "$solutions" -gt 0 ] || [ "$products" -gt 0 ]; then
    has_products=true
fi

history="[{\"role\": \"assistant\", \"content\": $(echo "$ai_response" | jq -Rs .)}]"

if [ "$has_products" = false ]; then
    response=$(chat "mom, around 40 dollars" "$history")
    turn_count=$((turn_count + 1))
    ai_response2=$(echo "$response" | jq -r '.response // empty')
    solutions=$(echo "$response" | jq -r '.solutions // [] | length')
    products=$(echo "$response" | jq -r '.products // [] | length')

    if [ "$solutions" -gt 0 ] || [ "$products" -gt 0 ]; then
        has_products=true
    fi

    history="[{\"role\": \"assistant\", \"content\": $(echo "$ai_response" | jq -Rs .)}, {\"role\": \"user\", \"content\": \"mom, around 40 dollars\"}, {\"role\": \"assistant\", \"content\": $(echo "$ai_response2" | jq -Rs .)}]"
fi

if [ "$has_products" = false ]; then
    response=$(chat "cooking and baking" "$history")
    turn_count=$((turn_count + 1))
    solutions=$(echo "$response" | jq -r '.solutions // [] | length')
    products=$(echo "$response" | jq -r '.products // [] | length')

    if [ "$solutions" -gt 0 ] || [ "$products" -gt 0 ]; then
        has_products=true
    fi
fi

for i in 4 5 6; do
    if [ "$has_products" = false ]; then
        response=$(chat "bread making" "$history")
        turn_count=$((turn_count + 1))
        solutions=$(echo "$response" | jq -r '.solutions // [] | length')
        products=$(echo "$response" | jq -r '.products // [] | length')

        if [ "$solutions" -gt 0 ] || [ "$products" -gt 0 ]; then
            has_products=true
            break
        fi
    fi
done

if [ "$turn_count" -le 3 ]; then
    log_result "FLOW-TTV-03" "Gift flow turns to products" "PASS" "$turn_count turns (target ≤3)"
elif [ "$turn_count" -le 4 ]; then
    log_result "FLOW-TTV-03" "Gift flow turns to products" "PARTIAL" "$turn_count turns (target ≤3)"
else
    log_result "FLOW-TTV-03" "Gift flow turns to products" "FAIL" "$turn_count turns (target ≤3)"
fi

# FLOW-PATH-01: One-word answer handling
echo "  Testing FLOW-PATH-01: One-word answer handling..."
response=$(chat "kitchen" "[{\"role\": \"assistant\", \"content\": \"I'd love to help! What room or space is giving you trouble?\"}]")
ai_response=$(echo "$response" | jq -r '.response // empty')

if echo "$ai_response" | grep -qi "kitchen\|counter\|clutter\|help"; then
    log_result "FLOW-PATH-01" "One-word answer handling" "PASS" "AI understood 'kitchen'"
else
    log_result "FLOW-PATH-01" "One-word answer handling" "FAIL" "AI didn't understand context"
fi

# FLOW-PATH-02: Typo handling
echo "  Testing FLOW-PATH-02: Typo handling..."
response=$(chat "kitchn is messy" "[{\"role\": \"assistant\", \"content\": \"I'd love to help! What room or space is giving you trouble?\"}]")
ai_response=$(echo "$response" | jq -r '.response // empty')

if echo "$ai_response" | grep -qi "kitchen\|clutter\|messy\|help"; then
    log_result "FLOW-PATH-02" "Typo handling" "PASS" "AI understood 'kitchn'"
else
    log_result "FLOW-PATH-02" "Typo handling" "FAIL" "AI confused by typo"
fi

echo "" >> "$REPORT_FILE"

# =============================================================================
# LLM TESTS
# =============================================================================
echo "## LLM Tests (AI/Language Model)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| Test ID | Description | Result | Details |" >> "$REPORT_FILE"
echo "|---------|-------------|--------|---------|" >> "$REPORT_FILE"

echo "Running LLM tests..."

# LLM-QQ-02: Single question per response
echo "  Testing LLM-QQ-02: Single question per response..."
response=$(chat "my kitchen counters are cluttered" "[]")
ai_response=$(echo "$response" | jq -r '.response // empty')
question_count=$(echo "$ai_response" | grep -o "?" | wc -l | tr -d ' ')

if [ "$question_count" -le 1 ]; then
    log_result "LLM-QQ-02" "Single question per response" "PASS" "$question_count question(s)"
elif [ "$question_count" -eq 2 ]; then
    log_result "LLM-QQ-02" "Single question per response" "PARTIAL" "$question_count questions (target 1)"
else
    log_result "LLM-QQ-02" "Single question per response" "FAIL" "$question_count questions (target 1)"
fi

# LLM-QQ-02b: Gift flow - single question check
echo "  Testing LLM-QQ-02b: Gift flow single question..."
response=$(chat "I am looking for a gift" "[]")
ai_response=$(echo "$response" | jq -r '.response // empty')
question_count=$(echo "$ai_response" | grep -o "?" | wc -l | tr -d ' ')

if [ "$question_count" -le 1 ]; then
    log_result "LLM-QQ-02b" "Gift flow single question" "PASS" "$question_count question(s)"
elif [ "$question_count" -eq 2 ]; then
    log_result "LLM-QQ-02b" "Gift flow single question" "PARTIAL" "$question_count questions (target 1)"
else
    log_result "LLM-QQ-02b" "Gift flow single question" "FAIL" "$question_count questions (target 1)"
fi

# LLM-INF-01: Implicit inference - size + renting
echo "  Testing LLM-INF-01: Implicit inference (apartment = renting + small)..."
response=$(chat "my tiny apartment kitchen is a disaster" "[]")
ai_response=$(echo "$response" | jq -r '.response // empty')

# Should NOT ask about size or renting since it's implied
if echo "$ai_response" | grep -qi "renting\|rent\|apartment.*size\|how big\|how large"; then
    log_result "LLM-INF-01" "Implicit inference" "FAIL" "Asked about already-implied info"
else
    log_result "LLM-INF-01" "Implicit inference" "PASS" "Did not re-ask implied info"
fi

# LLM-INF-03: Infers budget from text
echo "  Testing LLM-INF-03: Budget inference..."
response=$(chat "need something under 30 dollars" "[{\"role\": \"assistant\", \"content\": \"What's your budget for this?\"}]")
ai_response=$(echo "$response" | jq -r '.response // empty')

if echo "$ai_response" | grep -qi "budget\|how much\|price range"; then
    log_result "LLM-INF-03" "Budget inference" "FAIL" "Asked about budget again"
else
    log_result "LLM-INF-03" "Budget inference" "PASS" "Budget understood"
fi

# LLM-ESC-01: "Just show me products" escape hatch
echo "  Testing LLM-ESC-01: Escape hatch - 'just show me products'..."
response=$(chat "just show me kitchen products" "[{\"role\": \"assistant\", \"content\": \"I'd love to help! What room or space is giving you trouble?\"}]")
solutions=$(echo "$response" | jq -r '.solutions // [] | length')
products=$(echo "$response" | jq -r '.products // [] | length')
total=$((solutions + products))

if [ "$total" -gt 0 ]; then
    log_result "LLM-ESC-01" "Escape hatch recognition" "PASS" "Returned $total products"
else
    log_result "LLM-ESC-01" "Escape hatch recognition" "FAIL" "No products returned"
fi

# LLM-ESC-03: Direct product name search
echo "  Testing LLM-ESC-03: Direct product name search..."
response=$(chat "spice rack" "[{\"role\": \"assistant\", \"content\": \"I'd love to help! What room or space is giving you trouble?\"}]")
solutions=$(echo "$response" | jq -r '.solutions // [] | length')
products=$(echo "$response" | jq -r '.products // [] | length')
total=$((solutions + products))

if [ "$total" -gt 0 ]; then
    log_result "LLM-ESC-03" "Direct product name search" "PASS" "Found products for 'spice rack'"
else
    ai_response=$(echo "$response" | jq -r '.response // empty')
    if echo "$ai_response" | grep -qi "spice"; then
        log_result "LLM-ESC-03" "Direct product name search" "PARTIAL" "Understood but continued conversation"
    else
        log_result "LLM-ESC-03" "Direct product name search" "FAIL" "Did not understand product search"
    fi
fi

# LLM-REP-01: Topic change handling
echo "  Testing LLM-REP-01: Topic change handling..."
response=$(chat "actually forget kitchen, help me with my closet instead" "[{\"role\": \"assistant\", \"content\": \"Counter clutter - super common. Is it mostly appliances or random stuff?\"}, {\"role\": \"user\", \"content\": \"random stuff\"}]")
ai_response=$(echo "$response" | jq -r '.response // empty')

if echo "$ai_response" | grep -qi "closet"; then
    log_result "LLM-REP-01" "Topic change handling" "PASS" "Switched to closet"
else
    log_result "LLM-REP-01" "Topic change handling" "FAIL" "Didn't switch topics"
fi

# LLM-REP-02: Correction handling
echo "  Testing LLM-REP-02: Correction handling..."
response=$(chat "wait, I meant bathroom not kitchen" "[{\"role\": \"assistant\", \"content\": \"Kitchen organization - I can help! What's the main issue?\"}, {\"role\": \"user\", \"content\": \"clutter on counters\"}]")
ai_response=$(echo "$response" | jq -r '.response // empty')

if echo "$ai_response" | grep -qi "bathroom"; then
    log_result "LLM-REP-02" "Correction handling" "PASS" "Corrected to bathroom"
else
    log_result "LLM-REP-02" "Correction handling" "FAIL" "Didn't accept correction"
fi

# LLM-MOM-01: No "tell me more"
echo "  Testing LLM-MOM-01: No vague 'tell me more' responses..."
response=$(chat "kitchen" "[{\"role\": \"assistant\", \"content\": \"I'd love to help! What room or space is giving you trouble?\"}]")
ai_response=$(echo "$response" | jq -r '.response // empty')

if echo "$ai_response" | grep -qi "tell me more"; then
    log_result "LLM-MOM-01" "No 'tell me more'" "FAIL" "Used vague 'tell me more'"
else
    log_result "LLM-MOM-01" "No 'tell me more'" "PASS" "Asked specific question"
fi

# LLM-MOM-05: Short, scannable responses
echo "  Testing LLM-MOM-05: Short responses..."
response=$(chat "my kitchen counters are cluttered" "[]")
ai_response=$(echo "$response" | jq -r '.response // empty')
word_count=$(echo "$ai_response" | wc -w | tr -d ' ')

if [ "$word_count" -le 40 ]; then
    log_result "LLM-MOM-05" "Short responses" "PASS" "$word_count words"
elif [ "$word_count" -le 60 ]; then
    log_result "LLM-MOM-05" "Short responses" "PARTIAL" "$word_count words (target ≤40)"
else
    log_result "LLM-MOM-05" "Short responses" "FAIL" "$word_count words (target ≤40)"
fi

echo "" >> "$REPORT_FILE"

# =============================================================================
# DATA TESTS
# =============================================================================
echo "## DATA Tests (Context/State)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| Test ID | Description | Result | Details |" >> "$REPORT_FILE"
echo "|---------|-------------|--------|---------|" >> "$REPORT_FILE"

echo "Running DATA tests..."

# DATA-CTX-01: No re-asking answered questions
echo "  Testing DATA-CTX-01: No re-asking answered questions..."
history='[{"role": "assistant", "content": "What room is giving you trouble?"}, {"role": "user", "content": "kitchen"}, {"role": "assistant", "content": "What is the main problem in your kitchen?"}]'
response=$(chat "counter clutter from appliances" "$history")
ai_response=$(echo "$response" | jq -r '.response // empty')

if echo "$ai_response" | grep -qi "what room\|which room\|which space"; then
    log_result "DATA-CTX-01" "No re-asking answered questions" "FAIL" "Re-asked about room"
else
    log_result "DATA-CTX-01" "No re-asking answered questions" "PASS" "Remembered room"
fi

# DATA-CTX-03: Budget remembered
echo "  Testing DATA-CTX-03: Budget remembered..."
history='[{"role": "assistant", "content": "Who is the gift for?"}, {"role": "user", "content": "my mom, budget is around $50"}]'
response=$(chat "she likes cooking" "$history")
ai_response=$(echo "$response" | jq -r '.response // empty')

if echo "$ai_response" | grep -qi "budget\|how much\|price range\|spend"; then
    log_result "DATA-CTX-03" "Budget remembered" "FAIL" "Re-asked about budget"
else
    log_result "DATA-CTX-03" "Budget remembered" "PASS" "Budget not re-asked"
fi

echo "" >> "$REPORT_FILE"

# =============================================================================
# UI TESTS (API-testable only)
# =============================================================================
echo "## UI Tests (Interface - API Testable)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| Test ID | Description | Result | Details |" >> "$REPORT_FILE"
echo "|---------|-------------|--------|---------|" >> "$REPORT_FILE"

echo "Running UI tests (API-testable)..."

# UI-LOAD-04: Error state handling
echo "  Testing UI-LOAD-04: Error state handling..."
response=$(curl -s -X POST "$API_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d '{"message": "", "history": []}' 2>/dev/null)

if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
    log_result "UI-LOAD-04" "Error state handling" "PASS" "Returns error for empty message"
else
    log_result "UI-LOAD-04" "Error state handling" "PARTIAL" "Should return clear error"
fi

echo "" >> "$REPORT_FILE"

# =============================================================================
# SUMMARY
# =============================================================================
echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| Result | Count |" >> "$REPORT_FILE"
echo "|--------|-------|" >> "$REPORT_FILE"
echo "| PASS | $PASS |" >> "$REPORT_FILE"
echo "| PARTIAL | $PARTIAL |" >> "$REPORT_FILE"
echo "| FAIL | $FAIL |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

total=$((PASS + PARTIAL + FAIL))
score=$((PASS * 2 + PARTIAL))
max_score=$((total * 2))
percentage=$((score * 100 / max_score))

echo "**Score:** $score / $max_score ($percentage%)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Priority recommendations
echo "## Priority Fixes" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
if [ $FAIL -gt 0 ]; then
    echo "### Critical (FAIL)" >> "$REPORT_FILE"
    echo "Review the FAIL results above and prioritize fixes based on traffic impact." >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

if [ $PARTIAL -gt 0 ]; then
    echo "### Medium Priority (PARTIAL)" >> "$REPORT_FILE"
    echo "Review the PARTIAL results above for optimization opportunities." >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "*Generated by run-churn-tests.sh*" >> "$REPORT_FILE"

echo ""
echo "====================================="
echo "Test Run Complete"
echo "====================================="
echo ""
echo -e "Results: ${GREEN}$PASS PASS${NC} | ${YELLOW}$PARTIAL PARTIAL${NC} | ${RED}$FAIL FAIL${NC}"
echo "Score: $score / $max_score ($percentage%)"
echo ""
echo "Full report saved to: $REPORT_FILE"
