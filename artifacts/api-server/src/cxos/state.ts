import { randomUUID } from "node:crypto";
import { asc, desc, eq } from "drizzle-orm";
import { cxosAuditLogsTable, cxosDemoStateTable, db, type CxosDemoState } from "@workspace/db";
import { makeInitialDemoState } from "./seed";

export type AuditDraft = Omit<
  typeof cxosAuditLogsTable.$inferInsert,
  "id" | "timestamp"
> & { id?: string };

function auditRow(entry: AuditDraft) {
  return {
    ...entry,
    id: entry.id ?? randomUUID(),
    timestamp: new Date(),
  };
}

export async function ensureDemoState(): Promise<CxosDemoState> {
  const inserted = await db
    .insert(cxosDemoStateTable)
    .values({ id: "demo", payload: makeInitialDemoState() })
    .onConflictDoNothing()
    .returning({ id: cxosDemoStateTable.id });

  if (inserted.length > 0) {
    await db.insert(cxosAuditLogsTable).values([
      auditRow({
        actor: "CXOS Demo",
        action: "Synthetic dataset seeded",
        subject: "Demo workspace",
        detail:
          "Synthetic demo data initialized; no real customer records are used.",
        category: "system",
      }),
      auditRow({
        actor: "CXOS Demo",
        action: "Prompt injection fixture contained",
        subject: "Sarah Williams",
        detail:
          "Untrusted customer content was flagged; no policy change or refund action was performed.",
        category: "safety",
      }),
    ]);
  }

  const [row] = await db
    .select({ payload: cxosDemoStateTable.payload })
    .from(cxosDemoStateTable)
    .where(eq(cxosDemoStateTable.id, "demo"))
    .limit(1);

  if (!row) {
    throw new Error("CXOS demo state could not be initialized.");
  }

  return row.payload;
}

export async function readDemoState(): Promise<CxosDemoState> {
  return ensureDemoState();
}

export async function mutateDemoState<T>(
  mutate: (state: CxosDemoState) => T,
  audit?: AuditDraft | ((result: T) => AuditDraft | null),
): Promise<T> {
  await ensureDemoState();
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(cxosDemoStateTable)
      .where(eq(cxosDemoStateTable.id, "demo"))
      .for("update")
      .limit(1);
    if (!row) {
      throw new Error("CXOS demo state is unavailable.");
    }

    const state = row.payload;
    const result = mutate(state);
    await tx
      .update(cxosDemoStateTable)
      .set({ payload: state })
      .where(eq(cxosDemoStateTable.id, "demo"));
    const auditEntry = typeof audit === "function" ? audit(result) : audit;
    if (auditEntry) {
      await tx.insert(cxosAuditLogsTable).values(auditRow(auditEntry));
    }
    return result;
  });
}

export async function recordAudit(entry: AuditDraft): Promise<void> {
  await db.insert(cxosAuditLogsTable).values(auditRow(entry));
}

export async function readAudit() {
  const entries = await db
    .select()
    .from(cxosAuditLogsTable)
    .orderBy(desc(cxosAuditLogsTable.timestamp), asc(cxosAuditLogsTable.id))
    .limit(100);
  return entries.map((entry) => ({
    ...entry,
    timestamp: entry.timestamp.toISOString(),
  }));
}

export async function resetDemoState() {
  await ensureDemoState();
  const initialState = makeInitialDemoState();
  await db.transaction(async (tx) => {
    await tx
      .update(cxosDemoStateTable)
      .set({ payload: initialState })
      .where(eq(cxosDemoStateTable.id, "demo"));
    await tx.insert(cxosAuditLogsTable).values(
      auditRow({
        actor: "CXOS Demo",
        action: "Demo reset",
        subject: "Demo workspace",
        detail: "Synthetic customer data and recommendations restored to baseline.",
        category: "system",
      }),
    );
  });
  return initialState;
}