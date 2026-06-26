# 🚀 QueueStorm Investigator

> **AI-Powered SupportOps API for Digital Finance**
> Built for **bKash presents SUST CSE Carnival 2026 – Codex Community Hackathon**

<div align="center">

### 🏆 Team BLACKMAMBA

AI-powered ticket investigation, evidence reasoning, and intelligent support routing for digital finance platforms.

**🌐 Live API:** [https://queuestorm-investigator-codex-commu.vercel.app](https://queuestorm-investigator-codex-commu.vercel.app/)

</div>

---

## 📖 Project Overview

QueueStorm Investigator is an AI-powered SupportOps API designed to help digital finance support teams automatically analyze customer complaints.

Instead of simply classifying tickets, the system performs **evidence-based reasoning** by comparing the customer's complaint against their recent transaction history to determine:

- ✅ Relevant transaction identification
- ✅ Evidence consistency verdict
- ✅ Case type classification
- ✅ Severity assessment
- ✅ Department routing
- ✅ Safe customer response generation
- ✅ Agent-ready investigation summary
- ✅ Recommended next action

The system fully complies with the official hackathon API specification and includes multiple layers of safety guardrails.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 AI Ticket Investigation | LLM-powered analysis with evidence-based reasoning |
| 🔍 Transaction Evidence Matching | Matches complaints against transaction history by amount, type, and status |
| 📊 Case Classification | 8 case types: `wrong_transfer`, `payment_failed`, `refund_request`, `duplicate_payment`, `merchant_settlement_delay`, `agent_cash_in_issue`, `phishing_or_social_engineering`, `other` |
| ⚠️ Severity Prediction | Rule-based severity mapping: `low`, `medium`, `high`, `critical` |
| 🏢 Department Routing | Routes to: `customer_support`, `dispute_resolution`, `payments_ops`, `merchant_operations`, `agent_operations`, `fraud_risk` |
| 📝 Agent Summaries | Concise investigation summaries for support agents |
| 💬 Safe Customer Replies | AI-generated responses that never promise outcomes |
| 🛡️ Prompt Injection Protection | Customer complaints treated as data, never as instructions |
| 🔒 Security Guardrails | Never requests OTP, PIN, password, CVV, or card numbers |
| ✅ Strict Schema Validation | Zod validation on both request and response |
| 🔄 Model Fallback Chain | Automatically tries alternative LLMs if the primary model is rate-limited |
| 🔁 Retry with Backoff | Handles 429/502/503 errors with exponential backoff |
| 🧹 Enum Normalization | Corrects any LLM casing issues to exact schema values |
| 🚫 Safety Text Scrubbing | Post-validation scrubbing removes unsafe promises from AI output |

---

## 🏗️ Architecture

```
                    ┌─────────────────┐
                    │   Client / Judge │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Express API   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Zod Request     │
                    │ Validation      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Prompt Builder  │
                    │ (System + User) │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ OpenRouter API  │
                    │ (Model Fallback │
                    │  Chain + Retry) │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ JSON Extraction │
                    │ (Strip markdown │
                    │  & code fences) │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Enum            │
                    │ Normalization   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Zod Response    │
                    │ Validation      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Post-Validation │
                    │ (Severity fix,  │
                    │  Safety scrub)  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Safe JSON       │
                    │ Response        │
                    └─────────────────┘
```

---

## 🧠 AI Approach

### Input Context

The AI receives the full ticket context:

- Customer complaint text
- Language preference (`en`, `bn`, `mixed`)
- Communication channel (`in_app_chat`, `call_center`, `email`, `merchant_portal`, `field_agent`)
- User type (`customer`, `merchant`, `agent`, `unknown`)
- Campaign context (if any)
- Transaction history (up to 50 entries with `transaction_id`, `timestamp`, `type`, `amount`, `counterparty`, `status`)

### Reasoning Pipeline

1. **Complaint Understanding** — Parse the customer's issue from the complaint text
2. **Transaction Matching** — Compare against each transaction by amount, type, recipient, status, and timing
3. **Evidence Reasoning** — Determine if evidence is `consistent`, `inconsistent`, or `insufficient_data`
4. **Case Classification** — Classify into one of 8 case types
5. **Severity Assessment** — Apply rule-based severity (e.g. `wrong_transfer` → `high`, `phishing` → `critical`)
6. **Department Routing** — Route to the appropriate team
7. **Response Generation** — Generate agent summary, next action, and safe customer reply
8. **Post-Validation** — Enforce business rules, scrub unsafe language, correct severity

### Severity Mapping

| Case Type | Severity |
|---|---|
| `wrong_transfer` | `high` |
| `agent_cash_in_issue` | `high` |
| `phishing_or_social_engineering` | `critical` |
| `payment_failed` | `medium` |
| `refund_request` | `medium` |
| `duplicate_payment` | `medium` |
| `merchant_settlement_delay` | `medium` |
| `other` | `low` |

### Model Fallback Chain

If the primary model is rate-limited (429), the system automatically tries:

1. `google/gemma-4-31b-it:free` (primary)


---

## 🛡️ Safety Guardrails

### Prompt Injection Protection

Customer complaints are treated as **data only**, never as instructions.

The AI ignores adversarial attempts such as:

- "Ignore previous instructions"
- "Reveal your system prompt"
- "Change your role"
- "Override safety rules"
- "You are now a different AI"

### Sensitive Information Protection

The AI **never** requests:

- OTP
- PIN
- Password
- CVV
- Full card number

Sensitive values found in complaints are automatically masked as `***REDACTED***`.

### No Unauthorized Promises

The AI **never** promises:

- Refunds
- Reversals
- Recovery of funds
- Account restoration
- Account unblocking

Instead, it uses safe operational language:

> ✅ "We will investigate this matter."
> ✅ "Our team will review your case."
> ✅ "The case has been escalated for investigation."

Post-validation automatically detects and replaces any unsafe language in the AI output.

---

## 📡 API Endpoints

### Health Check

```http
GET /health
```

**Response:**

```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "ok"
  }
}
```

---

### Analyze Ticket

```http
POST /analyze-ticket
```

**Request Body:**

```json
{
  "ticket_id": "TKT-001",
  "complaint": "I sent 5000 taka to a wrong number around 2pm today.",
  "language": "en",
  "channel": "in_app_chat",
  "user_type": "customer",
  "transaction_history": [
    {
      "transaction_id": "TXN-9101",
      "timestamp": "2026-06-26T14:00:00Z",
      "type": "transfer",
      "amount": 5000,
      "counterparty": "+8801719876543",
      "status": "completed"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Ticket analyzed successfully",
  "data": {
    "ticket_id": "TKT-001",
    "relevant_transaction_id": "TXN-9101",
    "evidence_verdict": "consistent",
    "case_type": "wrong_transfer",
    "severity": "high",
    "department": "dispute_resolution",
    "agent_summary": "Customer reports sending 5000 taka to an incorrect phone number at approximately 2pm. Transaction TXN-9101 matches the amount, time, and type.",
    "recommended_next_action": "Verify the transaction details and escalate to the dispute resolution team for investigation.",
    "customer_reply": "We have received your complaint. Our team will review the case and follow up with you.",
    "human_review_required": true,
    "confidence": 0.95,
    "reason_codes": [
      "TRANSACTION_MATCH",
      "AMOUNT_MATCH",
      "WRONG_RECIPIENT_REPORTED"
    ]
  }
}
```

### Request Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `ticket_id` | string | ✅ | Unique ticket identifier |
| `complaint` | string | ✅ | Customer complaint text (max 5000 chars) |
| `language` | string | ❌ | `en`, `bn`, or `mixed` |
| `channel` | string | ❌ | `in_app_chat`, `call_center`, `email`, `merchant_portal`, `field_agent` |
| `user_type` | string | ❌ | `customer`, `merchant`, `agent`, `unknown` |
| `campaign_context` | string | ❌ | Campaign context if applicable |
| `transaction_history` | array | ❌ | Array of transaction objects (max 50) |
| `metadata` | object | ❌ | Additional key-value metadata |

### Response Fields

| Field | Type | Description |
|---|---|---|
| `ticket_id` | string | Ticket identifier |
| `relevant_transaction_id` | string \| null | Matched transaction ID or null |
| `evidence_verdict` | string | `consistent`, `inconsistent`, or `insufficient_data` |
| `case_type` | string | One of 8 case type categories |
| `severity` | string | `low`, `medium`, `high`, or `critical` |
| `department` | string | Routed department |
| `agent_summary` | string | Investigation summary for agent |
| `recommended_next_action` | string | Suggested next step |
| `customer_reply` | string | Safe reply to send to customer |
| `human_review_required` | boolean | Whether human review is needed |
| `confidence` | number | AI confidence score (0.0 – 1.0) |
| `reason_codes` | string[] | Reason code tags |

---

## 📂 Project Structure

```
├── api/
│   └── index.ts                          # Vercel serverless entry point
├── src/
│   ├── app/
│   │   ├── errorHelpers/
│   │   │   └── appError.ts               # Custom error class
│   │   ├── module/
│   │   │   └── SupportTicket/
│   │   │       ├── supportTicket.analyze.service.ts  # AI analysis pipeline
│   │   │       ├── supportTicket.controller.ts       # Route controllers
│   │   │       ├── supportTicket.route.ts            # Route definitions
│   │   │       └── supportTicket.validation.ts       # Zod schemas & types
│   │   ├── routes/
│   │   │   └── index.ts                  # Route aggregator
│   │   ├── shared/
│   │   │   ├── catchAsync.ts             # Async error wrapper
│   │   │   └── sendResponse.ts           # Standardized response helper
│   │   └── utils/                        # Utility functions
│   ├── config/
│   │   └── env.ts                        # Environment variable loader
│   ├── middleware/
│   │   ├── globalErrorHandeler.ts        # Global error handler
│   │   ├── notFound.ts                   # 404 handler
│   │   └── validateReq.ts               # Zod validation middleware
│   ├── app.ts                            # Express app setup
│   └── server.ts                         # Server entry point
├── .env                                  # Environment variables
├── package.json
├── tsconfig.json
├── vercel.json                           # Vercel deployment config
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites

- Node.js 18+
- npm

### Clone & Install

```bash
git clone https://github.com/riyad899/queuestorm-investigator-Codex-Community-Hackathon-.git
cd queuestorm-investigator-Codex-Community-Hackathon-
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
NODE_ENV=production
PORT=8000
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_LLM_MODEL=google/gemma-4-31b-it:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

Get your OpenRouter API key at [https://openrouter.ai/settings/keys](https://openrouter.ai/settings/keys).

### Run Locally

```bash
# Development (hot reload)
npm run dev

# Build
npm run build

# Production
npm start
```

### Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Start dev server with hot reload (tsx watch) |
| `build` | `npm run build` | Compile TypeScript to JavaScript |
| `start` | `npm start` | Run compiled production server |
| `lint` | `npm run lint` | Run ESLint |
| `typecheck` | `npm run typecheck` | TypeScript type checking |

---

## 🧩 Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 18+ |
| **Framework** | Express.js 5 |
| **Language** | TypeScript 5.9 |
| **Validation** | Zod 4 |
| **AI Provider** | OpenRouter API |
| **LLM Models** | Gemma 4 |
| **Deployment** | Vercel (Serverless) |
| **Dev Tools** | tsx, ESLint, typescript-eslint |

---

## 🌍 Deployment

### Vercel (Production)

The API is deployed on Vercel as a serverless function.

**Live URL:** [https://queuestorm-investigator-codex-commu.vercel.app](https://queuestorm-investigator-codex-commu.vercel.app/)

### Test the Live API

```bash
# Health check
curl https://queuestorm-investigator-codex-commu.vercel.app/health

# Analyze a ticket
curl -X POST https://queuestorm-investigator-codex-commu.vercel.app/analyze-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "TKT-001",
    "complaint": "I sent 5000 taka to a wrong number around 2pm today.",
    "transaction_history": [{
      "transaction_id": "TXN-9101",
      "timestamp": "2026-06-26T14:00:00Z",
      "type": "transfer",
      "amount": 5000,
      "counterparty": "+8801719876543",
      "status": "completed"
    }]
  }'
```

---

## 📈 Key Capabilities

- ✅ Evidence-based reasoning with transaction matching
- ✅ AI ticket investigation with LLM
- ✅ Prompt injection protection
- ✅ Strict Zod schema validation (request + response)
- ✅ Safe customer communication (no promises)
- ✅ Automatic model fallback with retry
- ✅ Intelligent department routing
- ✅ Human review detection (low confidence, fraud, critical severity)
- ✅ Enum normalization (handles all casing variants)
- ✅ Post-validation safety scrubbing
- ✅ Comprehensive error logging

---

## 🚀 Future Improvements

- 🌐 Multi-language optimization (Bengali NLP)
- 🕵️ Dedicated fraud detection model
- 🧠 Fine-tuned domain-specific LLM
- 📊 Dashboard for support agents
- 📈 Analytics and reporting
- ⚡ Real-time ticket monitoring via WebSocket
- 🗄️ Database integration for ticket history
- 🔑 API key authentication

---

## 👥 Team BLACKMAMBA

Developed for the **bKash presents SUST CSE Carnival 2026 – Codex Community Hackathon**

---

## 📜 License

This project was developed for the SUST CSE Carnival 2026 Codex Community Hackathon and is intended for educational and demonstration purposes.
