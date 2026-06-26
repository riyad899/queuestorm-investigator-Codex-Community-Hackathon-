import { z } from "zod";

// =====================================================
// Enums — MUST match the problem statement exactly.
// Variants differ in case / pluralization are scored as
// schema violations.
// =====================================================

// Severity (Section 6.1): one of low | medium | high | critical
export const severityEnum = z.enum(["low", "medium", "high", "critical"]);

// Evidence verdict (Section 5 / 6.1)
export const evidenceVerdictEnum = z.enum([
  "consistent",
  "inconsistent",
  "insufficient_data",
]);

// case_type taxonomy (Section 7.1)
export const caseTypeEnum = z.enum([
  "wrong_transfer",
  "payment_failed",
  "refund_request",
  "duplicate_payment",
  "merchant_settlement_delay",
  "agent_cash_in_issue",
  "phishing_or_social_engineering",
  "other",
]);

// department taxonomy (Section 7.2)
export const departmentEnum = z.enum([
  "customer_support",
  "dispute_resolution",
  "payments_ops",
  "merchant_operations",
  "agent_operations",
  "fraud_risk",
]);

// language hint (Section 5.1)
export const languageEnum = z.enum(["en", "bn", "mixed"]);

// channel hint (Section 5.1)
export const channelEnum = z.enum([
  "in_app_chat",
  "call_center",
  "email",
  "merchant_portal",
  "field_agent",
]);

// user_type hint (Section 5.1)
export const userTypeEnum = z.enum(["customer", "merchant", "agent", "unknown"]);

// Transaction history enum values (Section 5.2)
export const transactionTypeEnum = z.enum([
  "transfer",
  "payment",
  "cash_in",
  "cash_out",
  "settlement",
  "refund",
]);

export const transactionStatusEnum = z.enum([
  "completed",
  "failed",
  "pending",
  "reversed",
]);

// =====================================================
// Transaction history entry (Section 5.2)
// =====================================================
export const transactionHistoryItemZodSchema = z.object({
  transaction_id: z.string().trim().min(1).max(200),
  timestamp: z.string().trim().min(1).max(50), // ISO 8601
  type: transactionTypeEnum,
  amount: z.number().nonnegative(),
  counterparty: z.string().trim().min(1).max(200),
  status: transactionStatusEnum,
});

// =====================================================
// Request body for POST /analyze-ticket (Section 5)
// =====================================================
export const analyzeTicketZodSchema = z.object({
  body: z.object({
    ticket_id: z.string().trim().min(1, "ticket_id is required").max(200),
    complaint: z.string().trim().min(1, "complaint is required").max(5000),
    language: languageEnum.optional(),
    channel: channelEnum.optional(),
    user_type: userTypeEnum.optional(),
    campaign_context: z.string().trim().min(1).max(200).optional(),
    transaction_history: z
      .array(transactionHistoryItemZodSchema)
      .max(50)
      .optional()
      .default([]),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

// =====================================================
// Response shape for POST /analyze-ticket (Section 6)
// =====================================================
export const analyzeTicketResponseZodSchema = z.object({
  ticket_id: z.string().trim().min(1),
  relevant_transaction_id: z.string().trim().min(1).nullable(),
  evidence_verdict: evidenceVerdictEnum,
  case_type: caseTypeEnum,
  severity: severityEnum,
  department: departmentEnum,
  agent_summary: z.string().trim().min(1).max(2000),
  recommended_next_action: z.string().trim().min(1).max(2000),
  customer_reply: z.string().trim().min(1).max(2000),
  human_review_required: z.boolean(),
  confidence: z.number().min(0).max(1),
  reason_codes: z.array(z.string().trim().min(1).max(100)).max(50),
});

export type AnalyzeTicketInput = z.infer<typeof analyzeTicketZodSchema>["body"];
export type AnalyzeTicketResponse = z.infer<typeof analyzeTicketResponseZodSchema>;
export type TransactionHistoryItem = z.infer<
  typeof transactionHistoryItemZodSchema
>;
export type EvidenceVerdict = z.infer<typeof evidenceVerdictEnum>;
export type CaseType = z.infer<typeof caseTypeEnum>;
export type Department = z.infer<typeof departmentEnum>;
export type Severity = z.infer<typeof severityEnum>;
export type Language = z.infer<typeof languageEnum>;
export type Channel = z.infer<typeof channelEnum>;
export type UserType = z.infer<typeof userTypeEnum>;
