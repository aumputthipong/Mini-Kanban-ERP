/**
 * Sentry browser integration — lazy, env-gated, no-op without a DSN.
 *
 * Why lazy: the SDK adds ~30 KB to the bundle. Without `NEXT_PUBLIC_SENTRY_DSN`
 * we never import it, so dev / CI / portfolio demo builds stay slim.
 *
 * Wire-up: error boundaries (`app/error.tsx`, `app/global-error.tsx`) and the
 * apiClient should call `captureException` for unexpected failures. When a DSN
 * is provided the first call also lazily initialises the SDK.
 */

import { logger } from "@/lib/logger";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment =
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development";
const release = process.env.NEXT_PUBLIC_SENTRY_RELEASE;

type SentryModule = typeof import("@sentry/browser");

let cached: Promise<SentryModule | null> | null = null;

function load(): Promise<SentryModule | null> {
  if (!dsn) return Promise.resolve(null);
  if (cached) return cached;
  cached = import("@sentry/browser")
    .then((mod) => {
      mod.init({
        dsn,
        environment,
        release,
        tracesSampleRate: 0,
      });
      return mod;
    })
    .catch((err) => {
      logger.error("[sentry] init failed", err);
      return null;
    });
  return cached;
}

/**
 * Report an unexpected error to Sentry. No-op when SENTRY_DSN is not set —
 * safe to call from any boundary. Returns void; never throws.
 */
export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (!dsn) return;
  load().then((Sentry) => {
    if (!Sentry) return;
    if (context) {
      Sentry.withScope((scope) => {
        scope.setExtras(context);
        Sentry.captureException(err);
      });
    } else {
      Sentry.captureException(err);
    }
  });
}

/**
 * Whether Sentry will actually ship this event. Useful for conditional UI like
 * "report this error" buttons.
 */
export const sentryEnabled = Boolean(dsn);
