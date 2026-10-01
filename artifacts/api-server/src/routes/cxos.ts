import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import {
  AskCxosCopilotBody,
  AskCxosCopilotResponse,
  DecideCxosActionBody,
  DecideCxosActionParams,
  DecideCxosActionResponse,
  EscalateCxosCustomerParams,
  EscalateCxosCustomerResponse,
  ExecuteCxosRescueParams,
  ExecuteCxosRescueResponse,
  GetCxosActionsResponse,
  GetCxosAuditResponse,
  GetCxosCustomerParams,
  GetCxosCustomerResponse,
  GetCxosCustomersQueryParams,
  GetCxosCustomersResponse,
  GetCxosIntelligenceResponse,
  GetCxosOverviewResponse,
  ResolveCxosCustomerParams,
  ResolveCxosCustomerResponse,
  ResetCxosDemoResponse,
} from "@workspace/api-zod";
import type { CxosAction, CxosCustomer, CxosDemoState } from "@workspace/db";
import { journeyStages, weeklyTrend } from "../cxos/seed";
import {
  mutateDemoState,
  readAudit,
  readDemoState,
  recordAudit,
  resetDemoState,
} from "../cxos/state";

const router: IRouter = Router();

const emotionPalette: Record<string, string> = {
  Happy: "#34d399",
  Positive: "#34d399",
  Neutral: "#93a4bd",
  Confused: "#fbbf24",
  Frustrated: "#fb923c",
  Angry: "#f87171",
  "At risk": "#a78bfa",
};

function getOverview(state: CxosDemoState) {
  const avgHealth =
    state.customers.reduce((sum, customer) => sum + customer.health, 0) /
    Math.max(state.customers.length, 1);
  const atRisk = state.customers.filter(
    (customer) => customer.churnProbability >= 70,
  );
  const openIssues = state.conversations.filter(
    (conversation) => conversation.status === "Open",
  ).length;
  const resolvedCount = state.conversations.length - openIssues;
  const negativeShare = Math.round(
    (state.customers.filter((customer) =>
      ["Frustrated", "Angry"].includes(customer.sentiment),
    ).length /
      Math.max(state.customers.length, 1)) *
      100,
  );
  const isSarahRescued =
    state.customers.find((customer) => customer.id === "cust_sarah")
      ?.churnProbability === 24;

  return {
    healthScore: Math.round(avgHealth),
    csat: Number((isSarahRescued ? 4.3 : 4.1).toFixed(1)),
    nps: isSarahRescued ? 42 : 38,
    effortScore: isSarahRescued ? 2.6 : 3.1,
    churnRisk: Math.round(
      state.customers.reduce(
        (sum, customer) => sum + customer.churnProbability,
        0,
      ) / Math.max(state.customers.length, 1),
    ),
    openIssues,
    resolutionHours: isSarahRescued ? 4.2 : 5.6,
    aiResolutions: 128 + resolvedCount,
    atRiskCustomers: atRisk.length,
    weeklyTrend: weeklyTrend.map((point, index) => ({
      ...point,
      sentiment:
        isSarahRescued && index === weeklyTrend.length - 1
          ? Math.min(100, point.sentiment + 3)
          : point.sentiment,
    })),
    healthFactors: [
      {
        label: "Customer sentiment",
        value: `${100 - negativeShare}% positive or neutral`,
        change: "up 6.2%",
        direction: "up" as const,
      },
      {
        label: "At-risk accounts",
        value: String(atRisk.length),
        change: "estimated from demo signals",
        direction: atRisk.length > 10 ? ("down" as const) : ("up" as const),
      },
      {
        label: "First response time",
        value: "2.4 hours",
        change: "down 18%",
        direction: "up" as const,
      },
      {
        label: "Repeat contact rate",
        value: "14.8%",
        change: "down 3.1%",
        direction: "up" as const,
      },
    ],
  };
}

function getCopilotAnswer(message: string, state: CxosDemoState) {
  const normalized = message.toLowerCase();
  const injectionPattern =
    /(ignore|disregard|override).{0,50}(rule|instruction|policy)|system prompt|reveal.*prompt|refund.{0,20}\$?\s*5,?000|act as.*admin/i;

  if (injectionPattern.test(message)) {
    return {
      answer:
        "I treated that request as untrusted text and did not follow it. I can summarize customer evidence or draft a response, but I cannot authorize a refund or change policy.",
      evidence: ["Prompt-injection safety fixture", "Human approval policy"],
      confidence: 99,
      limitation:
        "Demo AI uses deterministic rules and does not execute customer-facing actions.",
    };
  }

  if (
    normalized.includes("sarah") ||
    normalized.includes("unhappy") ||
    normalized.includes("rescue")
  ) {
    return {
      answer:
        "Sarah is at elevated risk because the same delivery issue generated three unresolved contacts across web chat and email. Her sentiment moved from neutral to frustrated, engagement is down 38%, and she recently asked for a refund. The safest next step is a senior-agent handoff, a verified delivery update, and a human-reviewed recovery option.",
      evidence: [
        "Sarah's 5-event cross-channel timeline",
        "3 unresolved contacts in 9 days",
        "Sentiment: Neutral → Frustrated",
        "Recent refund request",
      ],
      confidence: 93,
      limitation:
        "Risk is an estimate from synthetic demo data, not a guarantee. No refund or offer has been authorized.",
    };
  }

  if (
    normalized.includes("risk") ||
    normalized.includes("churn") ||
    normalized.includes("at risk")
  ) {
    const atRisk = state.customers
      .filter((customer) => customer.churnProbability >= 70)
      .sort((left, right) => right.churnProbability - left.churnProbability)
      .slice(0, 3);
    return {
      answer: `${atRisk.length} high-risk examples are currently ranked for review. Start with ${atRisk.map((customer) => `${customer.name} (${customer.churnProbability}%)`).join(", ")}. These are prioritization estimates; a human should validate the context before action.`,
      evidence: atRisk.map(
        (customer) =>
          `${customer.name}: ${customer.riskFactors.slice(0, 2).join("; ")}`,
      ),
      confidence: 86,
      limitation:
        "The ranked list is a deterministic demo estimate and should not be treated as a guarantee.",
    };
  }

  if (
    normalized.includes("complaint") ||
    normalized.includes("root cause") ||
    normalized.includes("this week")
  ) {
    const topTheme = state.themes[0];
    return {
      answer: `${topTheme?.name ?? "Delivery delays"} is the largest demo theme, accounting for ${topTheme?.share ?? 28}% of tagged feedback and trending ${topTheme?.trend ?? 18}% higher. The leading likely cause is ${topTheme?.causes[0]?.label ?? "carrier handoff delays"}; the evidence points to stalled tracking updates and late proactive notices.`,
      evidence: [
        `${topTheme?.count ?? 34} tagged delivery-delay records`,
        topTheme?.causes[0]?.evidence ?? "Synthetic feedback sample",
      ],
      confidence: topTheme?.causes[0]?.confidence ?? 88,
      limitation:
        "Root-cause ranking is an estimate from synthetic feedback and needs operational validation.",
    };
  }

  if (
    normalized.includes("draft") ||
    normalized.includes("reply") ||
    normalized.includes("response")
  ) {
    return {
      answer:
        "I’m sorry you have had to contact us more than once. I understand that the delivery delay and the lack of a clear update have made this harder than it should be. I’m checking the latest shipment status now and will share a specific next step as soon as it is confirmed.",
      evidence: [
        "Repeated-contact pattern in the synthetic conversation",
        "Delivery-delay theme",
        "Empathetic response policy",
      ],
      confidence: 88,
      limitation:
        "Draft only. Verify the shipment details and approved recovery policy before sending.",
    };
  }

  return {
    answer:
      "CXOS Demo AI can summarize Sarah's risk, rank synthetic at-risk accounts, explain complaint themes, or draft a human-reviewed response. Ask one of those questions to see the supporting evidence.",
    evidence: ["Synthetic demo workspace", `${state.customers.length} customers loaded`],
    confidence: 76,
    limitation:
      "This is a deterministic demo assistant; it is not connected to a live model.",
  };
}

function riskMatches(customer: CxosCustomer, risk: string): boolean {
  if (risk === "high") return customer.churnProbability >= 70;
  if (risk === "medium")
    return customer.churnProbability >= 45 && customer.churnProbability < 70;
  if (risk === "low") return customer.churnProbability < 45;
  return true;
}

router.get("/cxos/overview", async (_req, res): Promise<void> => {
  const data = GetCxosOverviewResponse.parse(getOverview(await readDemoState()));
  res.json(data);
});

router.get("/cxos/customers", async (req, res): Promise<void> => {
  const query = GetCxosCustomersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid customer filters." });
    return;
  }
  const state = await readDemoState();
  const search = query.data.search?.trim().toLowerCase();
  const customers = state.customers
    .filter((customer) => riskMatches(customer, query.data.risk))
    .filter(
      (customer) =>
        !search ||
        [customer.name, customer.company, customer.issue, customer.plan]
          .join(" ")
          .toLowerCase()
          .includes(search),
    )
    .sort((left, right) => right.churnProbability - left.churnProbability);
  res.json(GetCxosCustomersResponse.parse(customers));
});

router.get("/cxos/customers/:customerId", async (req, res): Promise<void> => {
  const params = GetCxosCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid customer identifier." });
    return;
  }
  const state = await readDemoState();
  const profile = state.profiles[params.data.customerId];
  if (!profile) {
    res.status(404).json({ error: "Customer not found." });
    return;
  }
  res.json(GetCxosCustomerResponse.parse(profile));
});

router.post(
  "/cxos/customers/:customerId/resolve",
  async (req, res): Promise<void> => {
    const params = ResolveCxosCustomerParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid customer identifier." });
      return;
    }
    const outcome = await mutateDemoState(
      (state) => {
        const profile = state.profiles[params.data.customerId];
        const customer = state.customers.find(
          (item) => item.id === params.data.customerId,
        );
        if (!profile || !customer) return { kind: "missing" as const };
        profile.customer = customer;
        const conversation = state.conversations.find(
          (item) =>
            item.customerId === params.data.customerId &&
            item.status === "Open",
        );
        if (!conversation) return { kind: "no-open-issue" as const };
        conversation.status = "Resolved";
        customer.health = Math.min(100, customer.health + 4);
        customer.churnProbability = Math.max(0, customer.churnProbability - 3);
        customer.sentiment =
          customer.churnProbability >= 70 ? "Frustrated" : "Neutral";
        customer.issue = `Resolved: ${conversation.issue}`;
        customer.priority =
          customer.churnProbability >= 76
            ? "High"
            : customer.churnProbability >= 55
              ? "Medium"
              : "Normal";
        customer.recommendation = "Check in within 48 hours";
        profile.summary = `${profile.summary} A support agent marked one issue resolved in the demo workspace; the health and risk changes are simulated.`;
        profile.timeline.push({
          id: `resolve-${randomUUID()}`,
          type: "resolution",
          channel: "Support",
          title: "Issue marked resolved by agent",
          detail:
            "A synthetic open conversation was resolved. Follow-up remains recommended.",
          date: new Date().toISOString(),
          sentiment: customer.sentiment,
        });
        return { kind: "updated" as const, profile };
      },
      (result) =>
        result.kind === "updated"
          ? {
              actor: "Demo operator",
              action: "Customer issue resolved",
              subject: params.data.customerId,
              detail:
                "One synthetic open issue was marked resolved by a human-initiated demo action.",
              category: "resolution",
            }
          : null,
    );
    if (outcome.kind === "missing") {
      res.status(404).json({ error: "Customer not found." });
      return;
    }
    if (outcome.kind === "no-open-issue") {
      res.status(409).json({ error: "No open issue is available to resolve." });
      return;
    }
    res.json(ResolveCxosCustomerResponse.parse(outcome.profile));
  },
);

router.post(
  "/cxos/customers/:customerId/escalate",
  async (req, res): Promise<void> => {
    const params = EscalateCxosCustomerParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid customer identifier." });
      return;
    }
    const outcome = await mutateDemoState(
      (state) => {
        const profile = state.profiles[params.data.customerId];
        const customer = state.customers.find(
          (item) => item.id === params.data.customerId,
        );
        if (!profile || !customer) return { kind: "missing" as const };
        profile.customer = customer;
        customer.priority = "Critical";
        customer.recommendation =
          "Senior agent assigned; acknowledge prior contacts and confirm the next step";
        state.conversations
          .filter(
            (item) =>
              item.customerId === params.data.customerId &&
              item.status === "Open",
          )
          .forEach((item) => {
            item.priority = "Critical";
          });
        profile.timeline.push({
          id: `escalate-${randomUUID()}`,
          type: "escalation",
          channel: "Support",
          title: "Escalated to a senior agent",
          detail:
            "A human initiated the escalation; assignment is represented in synthetic demo state only.",
          date: new Date().toISOString(),
          sentiment: customer.sentiment,
        });
        return { kind: "updated" as const, profile };
      },
      (result) =>
        result.kind === "updated"
          ? {
              actor: "Demo operator",
              action: "Customer escalated",
              subject: params.data.customerId,
              detail:
                "A human-initiated escalation was recorded in synthetic demo state.",
              category: "escalation",
            }
          : null,
    );
    if (outcome.kind === "missing") {
      res.status(404).json({ error: "Customer not found." });
      return;
    }
    res.json(EscalateCxosCustomerResponse.parse(outcome.profile));
  },
);

router.get("/cxos/intelligence", async (_req, res): Promise<void> => {
  const state = await readDemoState();
  const emotionCounts = new Map<string, number>();
  for (const customer of state.customers) {
    emotionCounts.set(
      customer.sentiment,
      (emotionCounts.get(customer.sentiment) ?? 0) + 1,
    );
  }
  const total = Math.max(state.customers.length, 1);
  const intelligence = {
    sentimentTrend: weeklyTrend,
    themes: state.themes,
    journey: journeyStages,
    reviews: state.feedback.slice(0, 10).map((feedback, index) => ({
      source: feedback.source,
      quote: feedback.quote,
      theme: feedback.theme,
      sentiment: feedback.sentiment,
      date: new Date(Date.UTC(2026, 9, 1 - index, 10)).toISOString(),
    })),
    emotions: [...emotionCounts.entries()].map(([emotion, count]) => ({
      emotion,
      share: Math.round((count / total) * 100),
      color: emotionPalette[emotion] ?? "#93a4bd",
    })),
  };
  res.json(GetCxosIntelligenceResponse.parse(intelligence));
});

router.get("/cxos/actions", async (_req, res): Promise<void> => {
  const state = await readDemoState();
  res.json(GetCxosActionsResponse.parse(state.actions));
});

router.post(
  "/cxos/actions/:actionId/decision",
  async (req, res): Promise<void> => {
    const params = DecideCxosActionParams.safeParse(req.params);
    const body = DecideCxosActionBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "Invalid action decision." });
      return;
    }
    const decisionStatus = {
      approve: "approved",
      modify: "modified",
      reject: "rejected",
    } as const;
    const changed = await mutateDemoState(
      (state) => {
        const action = state.actions.find(
          (item) => item.id === params.data.actionId,
        );
        if (!action) return { kind: "missing" as const };
        if (action.status !== "pending") {
          return { kind: "already-decided" as const, action };
        }
        action.status = decisionStatus[body.data.decision];
        if (body.data.decision === "modify") {
          action.recommendation = body.data.note?.trim()
            ? `${action.recommendation} Human modification: ${body.data.note.trim()}`
            : `${action.recommendation} Human review requested changes before execution.`;
        }
        return { kind: "changed" as const, action };
      },
      (result) =>
        result.kind === "changed"
          ? {
              actor: "Demo reviewer",
              action: `Recommendation ${body.data.decision}`,
              subject: params.data.actionId,
              detail:
                body.data.decision === "modify"
                  ? "A human reviewer modified the proposed next step; consequential offers remain policy-gated."
                  : `A human reviewer selected ${body.data.decision}.`,
              category: "approval",
            }
          : null,
    );
    if (changed.kind === "missing") {
      res.status(404).json({ error: "Recommended action not found." });
      return;
    }
    if (changed.kind === "already-decided") {
      res.status(409).json({ error: "This recommendation has already been reviewed." });
      return;
    }
    res.json(DecideCxosActionResponse.parse(changed.action));
  },
);

router.post(
  "/cxos/rescues/:customerId/execute",
  async (req, res): Promise<void> => {
    const params = ExecuteCxosRescueParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid customer identifier." });
      return;
    }
    const auditId = randomUUID();
    const result = await mutateDemoState(
      (state) => {
        const customer = state.customers.find(
          (item) => item.id === params.data.customerId,
        );
        if (!customer) return { kind: "missing" as const };
        const approvedAction = state.actions.find(
          (action) =>
            action.customerId === customer.id &&
            ["approved", "modified"].includes(action.status),
        );
        if (!approvedAction) return { kind: "approval-required" as const };
        if (customer.churnProbability === 24) {
          return { kind: "already-executed" as const };
        }
        const previousHealth = customer.health;
        const previousSentiment = customer.sentiment;
        customer.health = 76;
        customer.churnProbability = 24;
        customer.sentiment = "Positive";
        customer.priority = "Normal";
        customer.issue = "Delivery issue resolved";
        customer.recommendation = "48-hour follow-up scheduled";
        customer.riskFactors = ["Rescue plan completed", "Follow-up scheduled"];
        const profile = state.profiles[customer.id];
        if (profile) {
          profile.customer = customer;
          profile.summary =
            "A human-approved rescue plan was simulated. The delivery issue was marked resolved, a personalized response was generated, and a 48-hour follow-up was scheduled. The health score change is a demo outcome, not a measured business result.";
          profile.timeline.push({
            id: `rescue-${auditId}`,
            type: "resolution",
            channel: "CXOS",
            title: "Human-approved rescue plan executed",
            detail:
              "Delivery issue resolved in demo state; follow-up scheduled and health estimate updated.",
            date: new Date().toISOString(),
            sentiment: "Positive",
          });
        }
        const conversation = state.conversations.find(
          (item) => item.customerId === customer.id && item.status === "Open",
        );
        if (conversation) conversation.status = "Resolved";
        approvedAction.status = "executed";
        return {
          kind: "executed" as const,
          data: {
            customerId: customer.id,
            customerName: customer.name,
            previousHealth,
            health: customer.health,
            previousSentiment,
            sentiment: customer.sentiment,
            steps: [
              "Senior agent assigned",
              "Personalized response generated",
              "Delivery issue marked resolved in demo data",
              "48-hour follow-up scheduled",
              "Customer health estimate updated",
            ],
            impact:
              "Demo outcome: health estimate improved and one synthetic issue was resolved. This is not a measured retention or revenue result.",
            auditId,
          },
        };
      },
      (execution) =>
        execution.kind === "executed"
          ? {
              id: auditId,
              actor: "Demo reviewer",
              action: "Rescue plan executed",
              subject: params.data.customerId,
              detail:
                "Approved deterministic demo rescue steps recorded; no external refund, message, or third-party action was performed.",
              category: "execution",
            }
          : null,
    );

    if (result.kind === "missing") {
      res.status(404).json({ error: "Customer not found." });
      return;
    }
    if (result.kind !== "executed") {
      res.status(409).json({
        error:
          result.kind === "approval-required"
            ? "A human reviewer must approve a rescue action before execution."
            : "A rescue has already been executed for this customer.",
      });
      return;
    }
    res.json(ExecuteCxosRescueResponse.parse(result.data));
  },
);

router.post("/cxos/copilot", async (req, res): Promise<void> => {
  const body = AskCxosCopilotBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Enter a question up to 600 characters." });
    return;
  }
  const state = await readDemoState();
  const result = getCopilotAnswer(body.data.message, state);
  await recordAudit({
    actor: "Demo AI",
    action: "Grounded answer generated",
    subject: "Synthetic CX data",
    detail: "Question content was not stored in the audit log.",
    category: "ai",
  });
  res.json(AskCxosCopilotResponse.parse(result));
});

router.get("/cxos/audit", async (_req, res): Promise<void> => {
  res.json(GetCxosAuditResponse.parse(await readAudit()));
});

router.post("/cxos/demo/reset", async (_req, res): Promise<void> => {
  const state = await resetDemoState();
  const data = ResetCxosDemoResponse.parse({
    message: "Synthetic demo restored.",
    customers: state.customers.length,
    conversations: state.conversations.length,
    feedback: state.feedback.length,
  });
  res.json(data);
});

export default router;

export type { CxosAction };