// @vitest-environment node
import { describe, it, expect } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";

const supabase = createServiceRoleClient();

async function getPolicyNames(table: string): Promise<string[]> {
  const { data, error } = await supabase.rpc("list_policies", { p_table: table });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => r.policyname);
}

describe("admin RLS policies", () => {
  it("proposals: insert + update policies for operators", async () => {
    const names = await getPolicyNames("proposals");
    expect(names).toContain("proposals_insert_operators");
    expect(names).toContain("proposals_update_operators");
  });

  it("events: insert policy for operators", async () => {
    const names = await getPolicyNames("events");
    expect(names).toContain("events_insert_operators");
  });

  it("leads: update policy for operators", async () => {
    const names = await getPolicyNames("leads");
    expect(names).toContain("leads_update_operators");
  });

  it("profiles: insert self policy", async () => {
    const names = await getPolicyNames("profiles");
    expect(names).toContain("profiles_insert_self");
  });
});
