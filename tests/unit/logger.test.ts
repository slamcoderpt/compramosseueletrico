import { describe, it, expect, vi } from "vitest";
import { logger, withRequestId } from "@/lib/logger";

describe("logger", () => {
  it("logs structured JSON to console", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("hello", { foo: "bar" });
    expect(spy).toHaveBeenCalledOnce();
    const arg = spy.mock.calls[0][0];
    const parsed = JSON.parse(arg as string);
    expect(parsed.level).toBe("info");
    expect(parsed.message).toBe("hello");
    expect(parsed.foo).toBe("bar");
    expect(parsed.timestamp).toBeDefined();
    spy.mockRestore();
  });

  it("withRequestId prefixes logs", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const child = withRequestId("req-abc");
    child.info("event");
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(parsed.requestId).toBe("req-abc");
    spy.mockRestore();
  });
});
