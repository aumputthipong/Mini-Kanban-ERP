/**
 * Tiny logger wrapper. Use this instead of `console.*` directly so we have a
 * single switch to silence non-essential output in production builds.
 *
 * Behaviour:
 *   - `error` always logs (kept so production users can still see real errors
 *     in DevTools, and so external trackers like Sentry can hook into it).
 *   - `warn` always logs (rare enough that the noise cost is acceptable).
 *   - `info` / `debug` are silenced when `NODE_ENV === "production"` unless
 *     `NEXT_PUBLIC_LOG_LEVEL=debug` is set at build time.
 *
 * No structured logging on the frontend yet — the use case is "tail the dev
 * console and find the bug fast", not "ship to a log aggregator".
 */

const isProduction = process.env.NODE_ENV === "production";
const verbose = process.env.NEXT_PUBLIC_LOG_LEVEL === "debug";

const noop = () => {};

export const logger = {
  debug: isProduction && !verbose ? noop : (...args: unknown[]) => console.debug(...args),
  info: isProduction && !verbose ? noop : (...args: unknown[]) => console.info(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};
