import type {
  CxosAction,
  CxosCustomer,
  CxosDemoState,
  CxosProfile,
  CxosTheme,
} from "@workspace/db";

const firstNames = [
  "Avery",
  "Jordan",
  "Riley",
  "Morgan",
  "Taylor",
  "Casey",
  "Quinn",
  "Jamie",
  "Cameron",
  "Skyler",
];
const lastNames = [
  "Brooks",
  "Chen",
  "Patel",
  "Reed",
  "Kim",
  "Morgan",
  "Diaz",
  "Wright",
  "Park",
  "Bennett",
  "Rivera",
  "Foster",
  "Hayes",
  "Collins",
  "Price",
];
const issues = [
  "Delivery delay",
  "Billing clarification",
  "Account access",
  "Product defect",
  "Slow response",
  "Order change",
  "Subscription question",
  "Return request",
];
const channels = ["Web chat", "Email", "WhatsApp", "Phone", "Social", "Ticket"];
const plans = ["Growth", "Business", "Enterprise", "Essentials"];
const companies = [
  "Northstar Studio",
  "Fieldnote Labs",
  "Juniper Works",
  "Bluebird Market",
  "Cedar & Coast",
  "Orbit Goods",
  "Daybreak Supply",
  "Common Thread",
  "Kindred House",
  "Morrow Collective",
];

function dateAgo(days: number, hour = 10): string {
  const base = Date.UTC(2026, 9, 1, hour);
  return new Date(base - days * 86_400_000).toISOString();
}

function buildCustomer(index: number): CxosCustomer {
  if (index === 0) {
    return {
      id: "cust_sarah",
      name: "Sarah Williams",
      company: "Northstar Studio",
      plan: "Business",
      lifetimeValue: 12480,
      health: 41,
      churnProbability: 82,
      sentiment: "Frustrated",
      channel: "Web chat",
      issue: "Order delayed; refund requested",
      priority: "Critical",
      lastContact: dateAgo(0, 8),
      recommendation: "Senior-agent rescue with delivery resolution and scheduled follow-up",
      riskFactors: [
        "Three unresolved contacts in 9 days",
        "Sentiment declined from neutral to frustrated",
        "Engagement is down 38% this month",
        "Recent refund request",
        "Suspicious content blocked: attempted policy override",
      ],
    };
  }

  const risk = 28 + ((index * 37) % 67);
  const issue = issues[(index * 3) % issues.length]!;
  const sentiment =
    risk >= 76
      ? "Frustrated"
      : risk >= 60
        ? "Confused"
        : risk <= 36
          ? "Happy"
          : "Neutral";
  return {
    id: `cust_${String(index + 1).padStart(3, "0")}`,
    name: `${firstNames[(index - 1) % firstNames.length]} ${lastNames[(index * 7) % lastNames.length]}`,
    company: companies[(index * 2) % companies.length]!,
    plan: plans[(index * 3) % plans.length]!,
    lifetimeValue: 840 + ((index * 863) % 19800),
    health: Math.max(18, 100 - risk + ((index * 11) % 14)),
    churnProbability: risk,
    sentiment,
    channel: channels[(index * 5) % channels.length]!,
    issue,
    priority: risk >= 76 ? "High" : risk >= 55 ? "Medium" : "Normal",
    lastContact: dateAgo(index % 3 === 0 ? 0 : (index % 6) + 1),
    recommendation:
      risk >= 76
        ? "Assign a senior agent and send a personalized check-in"
        : risk >= 55
          ? "Follow up with a clear next step"
          : "Continue proactive onboarding",
    riskFactors:
      risk >= 76
        ? ["Repeated contact", "Negative sentiment", "Engagement decline"]
        : risk >= 55
          ? ["Open issue", "Response delay"]
          : ["No material risk signal detected"],
  };
}

const themes: CxosTheme[] = [
  {
    name: "Delivery delays",
    share: 28,
    trend: 18,
    sentiment: "Frustrated",
    count: 34,
    examples: [
      "Tracking stopped updating after the parcel left the depot.",
      "The new delivery date arrived after the original window had passed.",
    ],
    causes: [
      {
        label: "Carrier handoff delays",
        confidence: 88,
        evidence: "22 of 34 examples mention a 48+ hour gap after carrier pickup.",
      },
      {
        label: "Late proactive notifications",
        confidence: 72,
        evidence: "Repeated-contact customers were more likely to receive an update only after asking.",
      },
      {
        label: "Inventory promise mismatch",
        confidence: 54,
        evidence: "Several delayed orders had a shorter estimated window at checkout.",
      },
    ],
  },
  {
    name: "Billing confusion",
    share: 21,
    trend: 7,
    sentiment: "Confused",
    count: 26,
    examples: [
      "I can't tell which seats are included in this renewal.",
      "The invoice changed after we added a teammate.",
    ],
    causes: [
      {
        label: "Plan language is unclear",
        confidence: 82,
        evidence: "Customers ask the same seat and renewal questions before paying.",
      },
      {
        label: "Proration is hard to explain",
        confidence: 67,
        evidence: "Billing contacts mention mid-cycle changes in 16 feedback records.",
      },
    ],
  },
  {
    name: "Login problems",
    share: 18,
    trend: -4,
    sentiment: "Frustrated",
    count: 22,
    examples: [
      "The sign-in link expired before I could finish setup.",
      "I was sent back to the login screen after verification.",
    ],
    causes: [
      {
        label: "Expired verification links",
        confidence: 79,
        evidence: "Most examples arrive within an hour of a new account invite.",
      },
      {
        label: "Session handoff failure",
        confidence: 63,
        evidence: "The issue is concentrated on cross-device sign-in attempts.",
      },
    ],
  },
  {
    name: "Product defects",
    share: 17,
    trend: 12,
    sentiment: "Angry",
    count: 20,
    examples: [
      "The replacement has the same issue as the first item.",
      "The latch won't stay closed when the case is full.",
    ],
    causes: [
      {
        label: "Batch quality variation",
        confidence: 74,
        evidence: "Defect reports are clustered around two shipment batches.",
      },
      {
        label: "Replacement checks are incomplete",
        confidence: 58,
        evidence: "Repeat returns cite the same defect after an exchange.",
      },
    ],
  },
  {
    name: "Long wait times",
    share: 16,
    trend: -2,
    sentiment: "Neutral",
    count: 19,
    examples: [
      "I waited all morning to get a simple status update.",
      "The handoff meant I had to explain the issue again.",
    ],
    causes: [
      {
        label: "Peak-hour staffing gaps",
        confidence: 81,
        evidence: "First response times rise on Monday and Thursday afternoons.",
      },
      {
        label: "Context lost between queues",
        confidence: 69,
        evidence: "Customers repeat order details after a channel handoff.",
      },
    ],
  },
];

export function makeInitialDemoState(): CxosDemoState {
  const customers = Array.from({ length: 50 }, (_, index) =>
    buildCustomer(index),
  );
  const profiles: Record<string, CxosProfile> = {};

  for (const [index, customer] of customers.entries()) {
    const isSarah = customer.id === "cust_sarah";
    const timeline = isSarah
      ? [
          {
            id: "sarah-order",
            type: "order",
            channel: "Store",
            title: "Order placed",
            detail: "Order #NS-20418 · delivery window confirmed at checkout",
            date: dateAgo(12),
            sentiment: "Positive",
          },
          {
            id: "sarah-chat",
            type: "conversation",
            channel: "Web chat",
            title: "Asked about delivery",
            detail: "Tracking had not updated after carrier pickup.",
            date: dateAgo(9),
            sentiment: "Neutral",
          },
          {
            id: "sarah-email",
            type: "conversation",
            channel: "Email",
            title: "Follow-up: no delivery update",
            detail: "The customer repeated the order details after a channel change.",
            date: dateAgo(5),
            sentiment: "Frustrated",
          },
          {
            id: "sarah-complaint",
            type: "complaint",
            channel: "Web chat",
            title: "Delivery complaint",
            detail: "A second contact did not resolve the delay.",
            date: dateAgo(2),
            sentiment: "Frustrated",
          },
          {
            id: "sarah-refund",
            type: "refund",
            channel: "Web chat",
            title: "Refund requested",
            detail: "A recovery action needs human review; no refund is promised by AI.",
            date: dateAgo(1),
            sentiment: "Angry",
          },
          {
            id: "sarah-injection",
            type: "security",
            channel: "Web chat",
            title: "Suspicious content blocked",
            detail:
              "A message tried to override safety rules and request an unauthorized $5,000 refund. It was treated as untrusted content; no action was taken.",
            date: dateAgo(1, 11),
            sentiment: "Frustrated",
          },
          {
            id: "sarah-rescue",
            type: "ai",
            channel: "CXOS",
            title: "AI rescue plan recommended",
            detail:
              "Evidence: repeated contacts, sentiment decline, reduced engagement, and a refund request.",
            date: dateAgo(0, 8),
            sentiment: "At risk",
          },
        ]
      : [
          {
            id: `${customer.id}-purchase`,
            type: "order",
            channel: "Store",
            title: "Order placed",
            detail: `${customer.plan} plan · synthetic demo event`,
            date: dateAgo((index % 21) + 8),
            sentiment: "Positive",
          },
          {
            id: `${customer.id}-contact`,
            type: "conversation",
            channel: customer.channel,
            title: customer.issue,
            detail: "Conversation summarized from synthetic demo data.",
            date: dateAgo((index % 5) + 1),
            sentiment: customer.sentiment,
          },
          {
            id: `${customer.id}-follow-up`,
            type: "follow-up",
            channel: "CXOS",
            title: "Next step identified",
            detail: customer.recommendation,
            date: dateAgo(index % 2),
            sentiment: customer.sentiment,
          },
        ];
    profiles[customer.id] = {
      customer,
      summary: isSarah
        ? "Sarah is a long-term Business customer whose delivery issue crossed three contacts and two channels. Sentiment and engagement declined before the refund request. CXOS recommends a senior-agent handoff and a clear delivery resolution; any recovery offer remains subject to human review and company policy."
        : `${customer.name} is on the ${customer.plan} plan with a ${customer.issue.toLowerCase()} signal. The suggested next step is based on ${customer.riskFactors.join(" and ").toLowerCase()}; estimates are generated from synthetic demo data.`,
      timeline,
      conversationCount: isSarah ? 5 : 1 + (index % 5),
    };
  }

  const conversations = Array.from({ length: 110 }, (_, index) => {
    const customer = customers[index % customers.length]!;
    const isSuspicious = index === 7;
    return {
      id: `conv_${String(index + 1).padStart(3, "0")}`,
      customerId: isSuspicious ? "cust_sarah" : customer.id,
      issue: isSuspicious ? "Suspicious refund request" : customer.issue,
      channel: isSuspicious ? "Web chat" : channels[index % channels.length]!,
      priority: isSuspicious ? "Critical" : customer.priority,
      sentiment: isSuspicious ? "Frustrated" : customer.sentiment,
      preview: isSuspicious
        ? "Untrusted text attempted a policy override and unauthorized compensation request."
        : `Customer asked for help with ${customer.issue.toLowerCase()}.`,
      createdAt: dateAgo(index % 30, 9 + (index % 8)),
      status: index % 4 === 0 ? "Resolved" : "Open",
      suspicious: isSuspicious,
    };
  });

  const actions: CxosAction[] = [
    {
      id: "action_sarah_rescue",
      severity: "critical",
      title: "Sarah Williams may churn",
      evidence:
        "3 unresolved contacts in 9 days · sentiment fell to frustrated · engagement down 38% · refund request",
      recommendation:
        "Assign a senior agent, resolve delivery status, acknowledge repeat contacts, and schedule a 48-hour follow-up.",
      impact: "Potentially retain $12,480 in lifetime value; estimate only",
      status: "pending",
      customerId: "cust_sarah",
      customerName: "Sarah Williams",
    },
    ...customers.slice(1, 4).map((customer, index) => ({
      id: `action_${customer.id}`,
      severity: (index === 0 ? "warning" : "opportunity") as CxosAction["severity"],
      title: `${customer.name} needs a proactive check-in`,
      evidence: `${customer.issue} · ${customer.churnProbability}% estimated churn risk · ${customer.sentiment.toLowerCase()} sentiment`,
      recommendation: customer.recommendation,
      impact: "Improve resolution speed and reduce repeat contacts; estimate only",
      status: "pending" as const,
      customerId: customer.id,
      customerName: customer.name,
    })),
  ];

  return {
    customers,
    profiles,
    conversations,
    supportEvents: Array.from({ length: 120 }, (_, index) => ({
      id: `event_${String(index + 1).padStart(3, "0")}`,
      customerId: customers[index % customers.length]!.id,
      type: ["contact", "handoff", "resolution", "follow-up"][index % 4]!,
      at: dateAgo(index % 45, 9 + (index % 8)),
    })),
    orders: Array.from({ length: 35 }, (_, index) => ({
      id: `order_${String(index + 1).padStart(3, "0")}`,
      customerId: customers[index % customers.length]!.id,
      total: 44 + ((index * 127) % 740),
      status: index % 8 === 0 ? "Delayed" : index % 9 === 0 ? "Returned" : "Delivered",
    })),
    feedback: Array.from({ length: 55 }, (_, index) => {
      const theme = themes[index % themes.length]!;
      return {
        id: `feedback_${String(index + 1).padStart(3, "0")}`,
        customerId: customers[index % customers.length]!.id,
        source: ["Survey", "Review", "Social", "Conversation"][index % 4]!,
        theme: theme.name,
        quote: theme.examples[index % theme.examples.length]!,
        sentiment: theme.sentiment,
      };
    }),
    themes,
    actions,
  };
}

export const weeklyTrend = [
  { day: "Mon", sentiment: 62, csat: 74 },
  { day: "Tue", sentiment: 64, csat: 76 },
  { day: "Wed", sentiment: 61, csat: 73 },
  { day: "Thu", sentiment: 68, csat: 78 },
  { day: "Fri", sentiment: 66, csat: 79 },
  { day: "Sat", sentiment: 72, csat: 81 },
  { day: "Sun", sentiment: 76, csat: 84 },
];

export const journeyStages = [
  { name: "Awareness", sentiment: 82, friction: 18, conversion: 68, complaints: 4, opportunity: "Answer fit questions with a clear comparison." },
  { name: "Purchase", sentiment: 76, friction: 29, conversion: 54, complaints: 8, opportunity: "Clarify delivery windows before checkout." },
  { name: "Onboarding", sentiment: 72, friction: 38, conversion: 76, complaints: 11, opportunity: "Catch expired invitation links before the first session." },
  { name: "Usage", sentiment: 78, friction: 24, conversion: 84, complaints: 7, opportunity: "Offer contextual help when a customer repeats a task." },
  { name: "Support", sentiment: 59, friction: 72, conversion: 62, complaints: 31, opportunity: "Keep order context across channels and handoffs." },
  { name: "Renewal", sentiment: 71, friction: 41, conversion: 73, complaints: 15, opportunity: "Resolve open issues before a renewal reminder." },
];