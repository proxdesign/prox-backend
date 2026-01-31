# AI Chat Churn Analysis Test Plan

## Objective
Identify friction points in the "Solve a Problem" and "Buy a Gift" conversational flows that cause users to abandon before reaching product recommendations.

---

## Test Naming Convention

```
[LAYER]-[CATEGORY]-[##]
```

### Layers (What's Being Tested)

| Code | Layer | Description |
|------|-------|-------------|
| `UI` | Interface | Visual elements, buttons, loading states, layout |
| `LLM` | AI/Language Model | Response quality, inference, understanding |
| `FLOW` | Conversation Flow | Turn structure, slot filling, journey design |
| `MOB` | Mobile | Touch, keyboard, viewport, responsive |
| `DATA` | Context/State | Memory, session, data retention |

### Categories

| Layer | Category Code | What It Tests |
|-------|---------------|---------------|
| UI | `UI-LOAD` | Loading/feedback indicators |
| UI | `UI-INPUT` | Input fields, send buttons, quick replies |
| UI | `UI-PROG` | Progress indicators |
| UI | `UI-PREV` | Product previews during chat |
| LLM | `LLM-INF` | Implicit inference from natural language |
| LLM | `LLM-REP` | Turn repair / error recovery |
| LLM | `LLM-ESC` | Escape hatch recognition |
| LLM | `LLM-MOM` | Conversational momentum |
| LLM | `LLM-QQ` | Question quality (clarity, specificity) |
| FLOW | `FLOW-TTV` | Time to value metrics |
| FLOW | `FLOW-SLOT` | Slot filling efficiency |
| FLOW | `FLOW-DISC` | Progressive disclosure |
| FLOW | `FLOW-PATH` | Response path handling |
| MOB | `MOB-KB` | Keyboard behavior |
| MOB | `MOB-TOUCH` | Touch targets |
| MOB | `MOB-VP` | Viewport handling |
| DATA | `DATA-CTX` | Context retention |
| DATA | `DATA-MEM` | Conversation memory |

---

## Understanding Time-to-Value

Time-to-value in conversational AI is multi-dimensional:

| Metric | What It Measures | Target |
|--------|------------------|--------|
| **Turns to completion** | Back-and-forth exchanges | ≤3 turns |
| **Words typed by user** | Effort required | <20 words total |
| **Time elapsed** | Wall clock time to value | <60 seconds |
| **Cognitive decisions** | Choices user must make | ≤3 decisions |
| **Perceived progress** | Does user feel closer to goal? | Progress visible each turn |

---

## Test Categories

### 1. Conversation Flow Tests (FLOW-*)

#### FLOW-TTV: Time to Value
**Goal:** Measure how many exchanges it takes before users see products.

| Test ID | Description | What to Measure | Target |
|---------|-------------|-----------------|--------|
| `FLOW-TTV-01` | Solve flow: Minimal user responses | Exchanges until products | ≤3 |
| `FLOW-TTV-02` | Solve flow: Detailed user responses | Exchanges until products | ≤3 |
| `FLOW-TTV-03` | Gift flow: Minimal responses | Exchanges until products | ≤3 |
| `FLOW-TTV-04` | Gift flow: Detailed responses | Exchanges until products | ≤3 |
| `FLOW-TTV-05` | Total words typed by user | Sum across all exchanges | <20 |
| `FLOW-TTV-06` | Wall clock time to first product | Seconds elapsed | <60s |

**Why This Matters:**
- Industry benchmark: Users expect value within 2-3 interactions (Nielsen Norman Group)
- Each additional question increases abandonment by ~10-15% (Baymard Institute)
- Mobile users have even lower patience - typing is 3x slower than desktop

---

#### FLOW-SLOT: Slot Filling Efficiency
**Goal:** Determine minimum information needed before recommending products.

| Test ID | Description | What to Measure |
|---------|-------------|-----------------|
| `FLOW-SLOT-01` | Minimum required slots for Solve flow | Which slots are truly necessary? |
| `FLOW-SLOT-02` | Minimum required slots for Gift flow | Which slots are truly necessary? |
| `FLOW-SLOT-03` | Optional slots impact on recommendation quality | Do extra slots improve results? |

**Current Solve Flow Slots:**
- Room/space (required?)
- Problem type (required?)
- Renting vs owning (optional?)
- Space size (optional?)
- Budget (optional?)

**Key Question:** Are all these slots necessary before showing products?

**Why This Matters:**
- Amazon Lex best practice: Confirm slots implicitly, not explicitly
- Voiceflow research: 3 turns max for simple tasks
- Each slot = one more chance to abandon

---

#### FLOW-DISC: Progressive Disclosure
**Goal:** Show something early, refine with more info.

| Test ID | Description | Expected Behavior |
|---------|-------------|-------------------|
| `FLOW-DISC-01` | Products shown after first substantive exchange | Broad results appear, then refine |
| `FLOW-DISC-02` | Visual product preview during chat | Maintain engagement with visuals |
| `FLOW-DISC-03` | "Here's what I'm thinking" mid-conversation | AI shows reasoning before final recs |

**Anti-pattern:**
```
BAD:  Question → Question → Question → Question → Products
GOOD: Question → Products (broad) → Question → Products (refined)
```

**Why This Matters:**
- IBM Watson guidelines: Progressive disclosure > interrogation
- Visual rewards maintain engagement during multi-turn conversations
- Users need to see they're making progress

---

#### FLOW-PATH: Response Path Handling
**Goal:** Test how AI handles different user response styles.

| Test ID | User Input Style | Expected Behavior |
|---------|------------------|-------------------|
| `FLOW-PATH-01` | One-word answers ("kitchen") | AI should not punish brevity |
| `FLOW-PATH-02` | Typos/informal ("kitchn is messy lol") | AI should understand intent |
| `FLOW-PATH-03` | Multiple topics ("kitchen and bathroom") | AI should focus or acknowledge both |
| `FLOW-PATH-04` | Off-topic ("what's the weather") | Graceful redirect to products |
| `FLOW-PATH-05` | User provides extra info upfront | AI should not re-ask answered questions |

**Why This Matters:**
- Error recovery is a core usability heuristic (Nielsen's 10 Heuristics)
- Users should feel in control of the pace (User Autonomy principle)
- Punishing brevity trains users to abandon, not elaborate

---

### 2. AI/Language Model Tests (LLM-*)

#### LLM-QQ: Question Quality
**Goal:** Evaluate if AI questions are clear and easy to answer.

| Test ID | Description | Pass Criteria |
|---------|-------------|---------------|
| `LLM-QQ-01` | First question clarity | Obvious what to type or tap |
| `LLM-QQ-02` | Single question per response | Never >1 question mark |
| `LLM-QQ-03` | Question specificity | Binary or limited options, not open-ended |
| `LLM-QQ-04` | Question relevance | Every question feels necessary |
| `LLM-QQ-05` | Acknowledges previous answer | References what user said |

**Anti-patterns to detect:**
```
BAD:  "Can you tell me more about that?"  (too vague)
GOOD: "Is it mostly appliances or random items?" (specific, binary)

BAD:  "What room, what's the problem, and what's your budget?"  (3 questions)
GOOD: "What room is giving you trouble?" (1 question)
```

**Why This Matters:**
- Hick's Law: More choices = longer decision time = higher abandonment
- Open-ended questions create cognitive load (Don Norman, "Design of Everyday Things")
- Multiple questions at once violate Google Conversation Design Guidelines

---

#### LLM-INF: Implicit Inference
**Goal:** Test if AI extracts information from natural language without asking explicitly.

| Test ID | User Input | What AI Should Infer |
|---------|------------|---------------------|
| `LLM-INF-01` | "my tiny apartment kitchen" | space=kitchen, size=small, renting=likely |
| `LLM-INF-02` | "gift for my dad who loves grilling" | recipient=dad, interest=grilling |
| `LLM-INF-03` | "under $30 please" | budget=30 |
| `LLM-INF-04` | "I rent so nothing permanent" | renting=true, constraints=no drilling |
| `LLM-INF-05` | "my messy closet is driving me crazy" | space=closet, problem=disorganization, emotion=frustrated |

**Why This Matters:**
- Reduces explicit questions needed (faster time-to-value)
- Makes conversation feel natural, not interrogative
- Respects information user already provided
- Dialogflow CX: "Mega agents" fail; extract context implicitly

---

#### LLM-ESC: Escape Hatch Recognition
**Goal:** Test if users can skip the conversation when they want products immediately.

| Test ID | Escape Pattern | Expected Behavior |
|---------|----------------|-------------------|
| `LLM-ESC-01` | "Just show me products" | Skip to product grid immediately |
| `LLM-ESC-02` | "skip" or "browse" | Exit conversation flow |
| `LLM-ESC-03` | "I know what I want: spice rack" | Direct product search |
| `LLM-ESC-04` | User types product name directly | Search, don't ask questions |

**Why This Matters:**
- Some users know exactly what they want
- Forcing conversation on these users causes abandonment
- Power users need shortcuts
- User autonomy is a core UX principle

---

#### LLM-REP: Turn Repair
**Goal:** Test how AI handles mistakes and topic changes.

| Test ID | Scenario | Expected Behavior |
|---------|----------|-------------------|
| `LLM-REP-01` | "actually nevermind, help with closet" | Reset context to closet |
| `LLM-REP-02` | "wait, I meant bathroom not kitchen" | Correct without penalty |
| `LLM-REP-03` | "let's start over" | Fresh start, no frustration |
| `LLM-REP-04` | AI misunderstands, user corrects | Acknowledge mistake gracefully |

**Why This Matters:**
- Errors are inevitable in conversation
- Graceful recovery builds trust
- Punishing mistakes causes abandonment
- Rasa best practice: Slot filling should be interruptible

---

#### LLM-MOM: Conversational Momentum
**Goal:** Ensure each exchange feels like progress toward products.

| Test ID | Momentum Killer | Better Alternative |
|---------|-----------------|-------------------|
| `LLM-MOM-01` | "Can you tell me more?" | "Got it. Is it mostly [A] or [B]?" |
| `LLM-MOM-02` | Ignoring what user said | Reference their previous answer |
| `LLM-MOM-03` | Generic response | Personalized acknowledgment |
| `LLM-MOM-04` | Repeating the same question | Move forward with assumption |
| `LLM-MOM-05` | Long paragraphs | Short, scannable responses |

**Pattern to enforce:**
```
GOOD: "Counter clutter in a small rental kitchen - totally fixable.
       Is it mostly appliances or random stuff without a home?"

BAD:  "Thanks for sharing. Can you tell me more about your situation?"
```

**Why This Matters:**
- Each turn should feel like progress
- Stalled momentum = abandonment
- Users need to feel heard (acknowledgment before question)

---

### 3. Interface Tests (UI-*)

#### UI-LOAD: Loading & Feedback
**Goal:** Verify users see feedback during AI processing.

| Test ID | What to Check | Pass Criteria |
|---------|---------------|---------------|
| `UI-LOAD-01` | Loading indicator appears | Visible within 100ms of send |
| `UI-LOAD-02` | Typing indicator shows AI thinking | Animated dots or similar |
| `UI-LOAD-03` | Message send confirmation | User knows message was received |
| `UI-LOAD-04` | Error state handling | Clear message if API fails |

**Why This Matters:**
- Response time feedback reduces perceived wait time by 40% (UX research)
- Uncertainty about system state causes anxiety and abandonment
- Google Core Web Vitals: Response feedback is critical

---

#### UI-PROG: Progress Indication
**Goal:** User knows how far along they are in the flow.

| Test ID | What to Check | Pass Criteria |
|---------|---------------|---------------|
| `UI-PROG-01` | Progress dots or steps visible | User sees "Step 1 of 3" or similar |
| `UI-PROG-02` | Progress updates each turn | Visual change after each exchange |
| `UI-PROG-03` | Estimated completion indication | "Almost there!" or similar |

**Why This Matters:**
- Progress indicators reduce abandonment in multi-step flows (Cialdini, commitment principle)
- Users tolerate more steps when they see progress
- Eliminates "how much longer?" anxiety

---

#### UI-PREV: Product Preview
**Goal:** Show visual rewards during conversation to maintain engagement.

| Test ID | What to Check | Pass Criteria |
|---------|---------------|---------------|
| `UI-PREV-01` | Product images appear during chat | Not just at the end |
| `UI-PREV-02` | Preview updates as conversation narrows | Refinement visible |
| `UI-PREV-03` | Products are tappable/clickable | Can explore without ending chat |

**Why This Matters:**
- Visual rewards maintain engagement during multi-turn conversations
- Users see they're making progress toward something real
- Reduces perceived effort of conversation

---

#### UI-INPUT: Input & Quick Replies
**Goal:** Make responding as easy as possible.

| Test ID | What to Check | Pass Criteria |
|---------|---------------|---------------|
| `UI-INPUT-01` | Quick reply chips available | Tappable options below AI message |
| `UI-INPUT-02` | Chips match common responses | [Kitchen] [Bathroom] [Bedroom] etc. |
| `UI-INPUT-03` | Yes/No buttons for binary questions | Not just text input |
| `UI-INPUT-04` | Budget slider option | Instead of typing "$50" |
| `UI-INPUT-05` | Text input still works | Chips don't disable typing |

**Why This Matters:**
- Tapping is 5-10x faster than typing on mobile
- Reduces cognitive load (recognition vs recall)
- Standard pattern in modern chat UIs (iMessage, WhatsApp, Intercom)

---

### 4. Mobile Tests (MOB-*)

#### MOB-KB: Keyboard Behavior
**Goal:** Keyboard works smoothly on mobile devices.

| Test ID | What to Check | Pass Criteria |
|---------|---------------|---------------|
| `MOB-KB-01` | Keyboard opens automatically | Input focused on page load |
| `MOB-KB-02` | Input stays visible when keyboard open | No layout shift |
| `MOB-KB-03` | Keyboard doesn't cover input | Can see what you're typing |
| `MOB-KB-04` | Send works with keyboard "Go" button | Enter/return submits |

**Why This Matters:**
- 60%+ of e-commerce traffic is mobile (Statista 2024)
- Keyboard issues are top mobile UX complaint
- Layout shift during keyboard open causes disorientation

---

#### MOB-TOUCH: Touch Targets
**Goal:** All interactive elements are easy to tap.

| Test ID | What to Check | Pass Criteria |
|---------|---------------|---------------|
| `MOB-TOUCH-01` | Send button size | ≥44px (Apple HIG) |
| `MOB-TOUCH-02` | Quick reply chip size | ≥44px height |
| `MOB-TOUCH-03` | Product card tap area | Easy to tap, not just image |
| `MOB-TOUCH-04` | Fat finger tolerance | Adequate spacing between targets |

**Why This Matters:**
- 44px minimum touch target is accessibility requirement (Apple HIG)
- Small targets cause frustration and mis-taps
- Adequate spacing prevents accidental taps

---

#### MOB-VP: Viewport Handling
**Goal:** Content displays correctly on various mobile screens.

| Test ID | What to Check | Pass Criteria |
|---------|---------------|---------------|
| `MOB-VP-01` | Messages scroll correctly | Latest message visible |
| `MOB-VP-02` | Content not cut off by keyboard | Can scroll to see all |
| `MOB-VP-03` | No horizontal scroll | Everything fits in viewport |
| `MOB-VP-04` | Safe area handling (notch) | Content not behind notch |

**Why This Matters:**
- Mobile users have smaller screens and less patience
- Content hidden by keyboard = confusion
- Poor viewport handling looks broken

---

### 5. Data & Context Tests (DATA-*)

#### DATA-CTX: Context Retention
**Goal:** AI remembers what user already said.

| Test ID | What to Check | Pass Criteria |
|---------|---------------|---------------|
| `DATA-CTX-01` | AI doesn't re-ask answered questions | Never asks what user told |
| `DATA-CTX-02` | Context carries across turns | Remembers room, problem, etc. |
| `DATA-CTX-03` | Budget remembered if mentioned | Doesn't ask again |
| `DATA-CTX-04` | Constraints remembered (renting, size) | Applies to recommendations |

**Why This Matters:**
- Re-asking answered questions is frustrating
- Shows AI isn't "listening"
- Destroys trust in the conversation

---

#### DATA-MEM: Conversation Memory
**Goal:** Conversation state is preserved correctly.

| Test ID | What to Check | Pass Criteria |
|---------|---------------|---------------|
| `DATA-MEM-01` | History sent to API correctly | All previous turns included |
| `DATA-MEM-02` | Context survives page scroll | Scrolling doesn't reset |
| `DATA-MEM-03` | Refresh handling | Clear indication if conversation lost |

**Why This Matters:**
- Lost context = user starts over = abandonment
- API needs full history for good responses
- Users expect conversations to persist

---

## Test Execution Commands

```bash
# === FLOW-TTV: Time to Value Tests ===

# FLOW-TTV-01: Minimal Solve Flow - Count exchanges to products
curl -s -X POST "http://localhost:3000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "I have a problem to solve", "history": []}' | jq '.response'

# Continue conversation, counting exchanges until solutions > 0
cat << 'EOF' | curl -s -X POST "http://localhost:3000/api/chat" -H "Content-Type: application/json" -d @- | jq '{response: .response, solutions: .solutions | length}'
{"message": "kitchen", "history": [{"role": "assistant", "content": "I'd love to help! What room or space is giving you trouble?"}]}
EOF

# === LLM-QQ: Question Quality Tests ===

# LLM-QQ-02: Check for multiple questions in one response
cat << 'EOF' | curl -s -X POST "http://localhost:3000/api/chat" -H "Content-Type: application/json" -d @- | jq '.response' | grep -o "?" | wc -l
{"message": "kitchen counter clutter", "history": []}
EOF
# Result > 1 = FAIL (multiple questions)

# === LLM-ESC: Escape Hatch Tests ===

# LLM-ESC-01: "Just show me products" should work
cat << 'EOF' | curl -s -X POST "http://localhost:3000/api/chat" -H "Content-Type: application/json" -d @- | jq '{response: .response, solutions: .solutions | length, products: .products | length}'
{"message": "just show me kitchen products", "history": [{"role": "assistant", "content": "I'd love to help! What room or space is giving you trouble?"}]}
EOF
# Should return products immediately

# === LLM-INF: Implicit Inference Tests ===

# LLM-INF-01: AI should infer multiple slots from natural language
cat << 'EOF' | curl -s -X POST "http://localhost:3000/api/chat" -H "Content-Type: application/json" -d @- | jq '.response'
{"message": "my tiny apartment kitchen is a disaster, stuff everywhere", "history": []}
EOF
# AI should NOT ask about size or renting - already implied

# === LLM-REP: Turn Repair Tests ===

# LLM-REP-01: User changes mind mid-conversation
cat << 'EOF' | curl -s -X POST "http://localhost:3000/api/chat" -H "Content-Type: application/json" -d @- | jq '.response'
{"message": "actually, forget kitchen - help me with my closet instead", "history": [{"role": "assistant", "content": "Counter clutter - super common. Is it mostly appliances or random stuff?"}, {"role": "user", "content": "random stuff"}]}
EOF
# AI should switch to closet, not continue kitchen conversation

# === LLM-MOM: Momentum Tests ===

# LLM-MOM-01: AI should not say "tell me more"
cat << 'EOF' | curl -s -X POST "http://localhost:3000/api/chat" -H "Content-Type: application/json" -d @- | jq '.response' | grep -ci "tell me more"
{"message": "kitchen", "history": [{"role": "assistant", "content": "I'd love to help! What room or space is giving you trouble?"}]}
EOF
# Result > 0 = FAIL
```

---

## Success Metrics

| Metric | Current | Target | Industry Benchmark |
|--------|---------|--------|-------------------|
| Turns to products | 4-5 | 2-3 | 2-3 (chatbot best practice) |
| Questions per AI response | 1-2 | 1 | 1 (Google guidelines) |
| Words typed by user | ~30 | <15 | Minimal (tap > type) |
| Time to first product | ~90s | <45s | <30s ideal |
| Users completing flow | ? | >60% | 50-70% (conversational UI) |
| Mobile completion rate | ? | >50% | 40-60% |
| Escape hatch success | ? | 100% | Must always work |
| Context retention | ? | 100% | AI never re-asks |

---

## Scoring Rubric

For each test, score as:
- **PASS (2):** Meets or exceeds target
- **PARTIAL (1):** Room for improvement
- **FAIL (0):** Needs immediate fix

### Priority Matrix

| Score | Impact | Priority |
|-------|--------|----------|
| FAIL + High Traffic | Critical | Fix immediately |
| FAIL + Low Traffic | High | Fix this sprint |
| PARTIAL + High Traffic | Medium | Optimize soon |
| PARTIAL + Low Traffic | Low | Backlog |

---

## References

### Conversational AI Guidelines
1. **Google Conversation Design** - Best Practices for Actions
2. **Rasa** - Open source chatbot slot filling patterns
3. **Dialogflow CX** - "Mega agents" fail; keep flows short
4. **Amazon Lex** - Confirm slots implicitly, not explicitly
5. **Voiceflow** - 3 turns max for simple tasks
6. **IBM Watson** - Progressive disclosure > interrogation

### General UX Research
7. **Nielsen Norman Group** - Conversation Design Guidelines
8. **Baymard Institute** - E-commerce UX Research (abandonment rates)
9. **Apple Human Interface Guidelines** - Touch Targets (44px minimum)
10. **Don Norman** - "Design of Everyday Things" (Cognitive Load)
11. **Hick's Law** - Decision time increases with choices
12. **Cialdini** - Commitment/Consistency Principle

### Mobile-Specific
13. **Statista** - Mobile commerce statistics
14. **Luke Wroblewski** - Mobile First design principles
15. **Google** - Core Web Vitals (response time expectations)

---

## Quick Reference: All Test IDs

### FLOW (Conversation Flow)
| ID | Description |
|----|-------------|
| `FLOW-TTV-01` | Solve flow: minimal input turns to products |
| `FLOW-TTV-02` | Solve flow: detailed input turns to products |
| `FLOW-TTV-03` | Gift flow: minimal input turns to products |
| `FLOW-TTV-04` | Gift flow: detailed input turns to products |
| `FLOW-TTV-05` | Total words typed by user |
| `FLOW-TTV-06` | Wall clock time to first product |
| `FLOW-SLOT-01` | Minimum slots for Solve flow |
| `FLOW-SLOT-02` | Minimum slots for Gift flow |
| `FLOW-SLOT-03` | Optional slots impact |
| `FLOW-DISC-01` | Products shown early |
| `FLOW-DISC-02` | Visual preview during chat |
| `FLOW-DISC-03` | AI shows reasoning mid-conversation |
| `FLOW-PATH-01` | One-word answer handling |
| `FLOW-PATH-02` | Typo handling |
| `FLOW-PATH-03` | Multiple topic handling |
| `FLOW-PATH-04` | Off-topic redirect |
| `FLOW-PATH-05` | Extra info upfront handling |

### LLM (AI/Language Model)
| ID | Description |
|----|-------------|
| `LLM-QQ-01` | First question clarity |
| `LLM-QQ-02` | Single question per response |
| `LLM-QQ-03` | Question specificity |
| `LLM-QQ-04` | Question relevance |
| `LLM-QQ-05` | Acknowledges previous answer |
| `LLM-INF-01` | Infers room + size + renting |
| `LLM-INF-02` | Infers gift recipient + interest |
| `LLM-INF-03` | Infers budget from text |
| `LLM-INF-04` | Infers constraints |
| `LLM-INF-05` | Infers emotion/urgency |
| `LLM-ESC-01` | "Just show me products" works |
| `LLM-ESC-02` | "skip" or "browse" works |
| `LLM-ESC-03` | Direct product name search |
| `LLM-ESC-04` | Product name = immediate search |
| `LLM-REP-01` | Topic change handled |
| `LLM-REP-02` | Correction handled |
| `LLM-REP-03` | "Start over" handled |
| `LLM-REP-04` | Misunderstanding recovery |
| `LLM-MOM-01` | No "tell me more" |
| `LLM-MOM-02` | References previous answer |
| `LLM-MOM-03` | Personalized acknowledgment |
| `LLM-MOM-04` | No repeated questions |
| `LLM-MOM-05` | Short, scannable responses |

### UI (Interface)
| ID | Description |
|----|-------------|
| `UI-LOAD-01` | Loading indicator visible |
| `UI-LOAD-02` | Typing indicator |
| `UI-LOAD-03` | Send confirmation |
| `UI-LOAD-04` | Error state handling |
| `UI-PROG-01` | Progress dots visible |
| `UI-PROG-02` | Progress updates each turn |
| `UI-PROG-03` | Completion indication |
| `UI-PREV-01` | Products appear during chat |
| `UI-PREV-02` | Preview updates with refinement |
| `UI-PREV-03` | Products tappable during chat |
| `UI-INPUT-01` | Quick reply chips available |
| `UI-INPUT-02` | Chips match common responses |
| `UI-INPUT-03` | Yes/No buttons |
| `UI-INPUT-04` | Budget slider option |
| `UI-INPUT-05` | Text input still works |

### MOB (Mobile)
| ID | Description |
|----|-------------|
| `MOB-KB-01` | Keyboard auto-opens |
| `MOB-KB-02` | Input visible with keyboard |
| `MOB-KB-03` | Input not covered |
| `MOB-KB-04` | Go button submits |
| `MOB-TOUCH-01` | Send button ≥44px |
| `MOB-TOUCH-02` | Quick reply chips ≥44px |
| `MOB-TOUCH-03` | Product card tap area |
| `MOB-TOUCH-04` | Adequate spacing |
| `MOB-VP-01` | Messages scroll correctly |
| `MOB-VP-02` | Content not cut by keyboard |
| `MOB-VP-03` | No horizontal scroll |
| `MOB-VP-04` | Safe area handling |

### DATA (Context/State)
| ID | Description |
|----|-------------|
| `DATA-CTX-01` | No re-asking answered questions |
| `DATA-CTX-02` | Context carries across turns |
| `DATA-CTX-03` | Budget remembered |
| `DATA-CTX-04` | Constraints remembered |
| `DATA-MEM-01` | History sent to API |
| `DATA-MEM-02` | Context survives scroll |
| `DATA-MEM-03` | Refresh handling |

---

## Appendix: Current Flow Analysis

### Solve a Problem Flow (Observed)
```
Turn 1: User clicks tile → "I have a problem to solve"
Turn 2: AI: "What room or space is giving you trouble?"
Turn 3: User: "kitchen" → AI asks about problem type
Turn 4: User: "clutter" → AI asks about specifics
Turn 5: User: answers → AI asks about renting/size
Turn 6: User: answers → FINALLY shows products
```
**Assessment:** 6 turns is too many. Target is 2-3.

### Buy a Gift Flow (Observed)
```
Turn 1: User clicks tile → "I'm looking for a gift"
Turn 2: AI: "Who's the gift for and what's your budget?" (2 questions!)
Turn 3: User: "mom, $50" → AI asks about interests
Turn 4: User: "cooking" → AI asks more specifics
Turn 5: User: answers → Shows products
```
**Assessment:** 5 turns, plus Turn 2 asks 2 questions at once (violates LLM-QQ-02).
