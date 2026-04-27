import { describe, it, expect } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";

describe("supabase service role client", () => {
  it("returns a client", () => {
    const client = createServiceRoleClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe("function");
  });
});
