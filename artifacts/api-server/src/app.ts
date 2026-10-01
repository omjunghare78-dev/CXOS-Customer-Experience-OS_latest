import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import type { NextFunction, Request, Response } from "express";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const rateBuckets = new Map<string, { start: number; count: number }>();
const allowedHosts = new Set(
  [
    process.env.REPLIT_DEV_DOMAIN,
    ...(process.env.REPLIT_DOMAINS ?? "").split(","),
    ...(process.env.CXOS_ALLOWED_ORIGINS ?? "").split(","),
  ]
    .map((item) => item?.trim().replace(/^https?:\/\//, "").replace(/\/$/, ""))
    .filter((item): item is string => Boolean(item)),
);

function originMatchesRequest(origin: string, host: string | undefined): boolean {
  try {
    const parsed = new URL(origin);
    const originHost = parsed.host.toLowerCase();
    return (
      originHost === host?.toLowerCase() ||
      [...allowedHosts].some((allowed) => {
        try {
          return new URL(`https://${allowed}`).host.toLowerCase() === originHost;
        } catch {
          return false;
        }
      })
    );
  } catch {
    return false;
  }
}

function securityAndRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cache-Control", "no-store");
  if (req.secure || req.get("x-forwarded-proto") === "https") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  const origin = req.get("origin");
  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  if (isMutation && origin && !originMatchesRequest(origin, req.get("host"))) {
    res.status(403).json({ error: "Cross-origin changes are not allowed." });
    return;
  }

  const isCopilotRequest = req.path.includes("/cxos/copilot");
  const key = `${req.ip ?? "unknown"}:${isCopilotRequest ? "ai" : "api"}`;
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  const max = isCopilotRequest ? 18 : 180;
  const windowMs = 60_000;
  if (!bucket || now - bucket.start >= windowMs) {
    rateBuckets.set(key, { start: now, count: 1 });
  } else if (bucket.count >= max) {
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "Request limit reached. Try again shortly." });
    return;
  } else {
    bucket.count += 1;
  }

  if (rateBuckets.size > 2000) {
    for (const [bucketKey, current] of rateBuckets) {
      if (now - current.start >= windowMs) rateBuckets.delete(bucketKey);
    }
  }
  next();
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      callback(
        null,
        origin && originMatchesRequest(origin, undefined) ? origin : false,
      );
    },
    credentials: false,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    maxAge: 600,
  }),
);
app.use(securityAndRateLimit);
app.use(express.json({ limit: "24kb", strict: true }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use(
  (
    error: unknown,
    req: Request,
    res: Response,
    _next: NextFunction,
  ): void => {
    req.log.error({ error }, "Unhandled request error");
    if (res.headersSent) return;
    res.status(500).json({ error: "The request could not be completed." });
  },
);

export default app;
