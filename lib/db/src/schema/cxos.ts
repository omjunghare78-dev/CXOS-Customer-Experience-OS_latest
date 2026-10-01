import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export interface CxosCustomer {
  id: string;
  name: string;
  company: string;
  plan: string;
  lifetimeValue: number;
  health: number;
  churnProbability: number;
  sentiment: string;
  channel: string;
  issue: string;
  priority: string;
  lastContact: string;
  recommendation: string;
  riskFactors: string[];
}

export interface CxosTimelineEvent {
  id: string;
  type: string;
  channel: string;
  title: string;
  detail: string;
  date: string;
  sentiment: string;
}

export interface CxosProfile {
  customer: CxosCustomer;
  summary: string;
  timeline: CxosTimelineEvent[];
  conversationCount: number;
}

export interface CxosConversation {
  id: string;
  customerId: string;
  issue: string;
  channel: string;
  priority: string;
  sentiment: string;
  preview: string;
  createdAt: string;
  status: string;
  suspicious: boolean;
}

export interface CxosAction {
  id: string;
  severity: "critical" | "warning" | "opportunity";
  title: string;
  evidence: string;
  recommendation: string;
  impact: string;
  status: "pending" | "approved" | "modified" | "rejected" | "executed";
  customerId: string;
  customerName: string;
}

export interface CxosTheme {
  name: string;
  share: number;
  trend: number;
  sentiment: string;
  count: number;
  examples: string[];
  causes: { label: string; confidence: number; evidence: string }[];
}

export interface CxosDemoState {
  customers: CxosCustomer[];
  profiles: Record<string, CxosProfile>;
  conversations: CxosConversation[];
  supportEvents: {
    id: string;
    customerId: string;
    type: string;
    at: string;
  }[];
  orders: {
    id: string;
    customerId: string;
    total: number;
    status: string;
  }[];
  feedback: {
    id: string;
    customerId: string;
    source: string;
    theme: string;
    quote: string;
    sentiment: string;
  }[];
  themes: CxosTheme[];
  actions: CxosAction[];
}

export const cxosDemoStateTable = pgTable("cxos_demo_state", {
  id: text("id").primaryKey(),
  payload: jsonb("payload").$type<CxosDemoState>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const cxosAuditLogsTable = pgTable(
  "cxos_audit_logs",
  {
    id: text("id").primaryKey(),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    subject: text("subject").notNull(),
    detail: text("detail").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .notNull()
      .defaultNow(),
    category: text("category").notNull(),
  },
  (table) => [index("cxos_audit_timestamp_idx").on(table.timestamp)],
);