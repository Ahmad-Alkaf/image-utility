import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RATE_LIMITS } from "@/lib/constants";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

let n = 0;
/** Fresh identifier per test so the module-level store does not leak between tests. */
const id = () => `test-${Date.now()}-${n++}`;

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-05T10:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to the anonymous limit and then blocks", () => {
    const key = id();
    const { maxRequests, windowMs } = RATE_LIMITS.anonymous;
    const start = Date.now();
    for (let i = 1; i <= maxRequests; i++) {
      const result = checkRateLimit(key, false);
      expect(result.allowed, `request ${i}`).toBe(true);
      expect(result.remaining).toBe(maxRequests - i);
      expect(result.resetAt).toBe(start + windowMs);
    }
    const blocked = checkRateLimit(key, false);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetAt).toBe(start + windowMs);
  });

  it("gives signed-in users the higher limit", () => {
    const key = id();
    const { maxRequests } = RATE_LIMITS.authenticated;
    for (let i = 0; i < maxRequests; i++) expect(checkRateLimit(key, true).allowed).toBe(true);
    expect(checkRateLimit(key, true).allowed).toBe(false);
  });

  it("keeps anonymous and authenticated counters apart", () => {
    const key = id();
    for (let i = 0; i < RATE_LIMITS.anonymous.maxRequests; i++) checkRateLimit(key, false);
    expect(checkRateLimit(key, false).allowed).toBe(false);
    expect(checkRateLimit(key, true).allowed).toBe(true);
  });

  it("resets after the window has passed", () => {
    const key = id();
    const { maxRequests, windowMs } = RATE_LIMITS.anonymous;
    for (let i = 0; i < maxRequests; i++) checkRateLimit(key, false);
    expect(checkRateLimit(key, false).allowed).toBe(false);

    vi.setSystemTime(Date.now() + windowMs + 1);
    const fresh = checkRateLimit(key, false);
    expect(fresh.allowed).toBe(true);
    expect(fresh.remaining).toBe(maxRequests - 1);
  });
});

describe("getClientIp", () => {
  const req = (headers: Record<string, string>) => new Request("http://localhost/api", { headers });

  it("takes the first x-forwarded-for entry", () => {
    expect(getClientIp(req({ "x-forwarded-for": " 198.51.100.1 , 10.0.0.1" }))).toBe("198.51.100.1");
  });

  it("falls back to x-real-ip and then to 'unknown'", () => {
    expect(getClientIp(req({ "x-real-ip": "192.0.2.1" }))).toBe("192.0.2.1");
    expect(getClientIp(req({}))).toBe("unknown");
  });
});
