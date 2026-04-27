import { test, expect } from "@playwright/test";

test("submit lead happy path", async ({ page }) => {
  await page.goto("/");

  // CTA on landing — there are multiple "Começar avaliação" links; click the first one
  const cta = page
    .getByRole("link", { name: /começar avaliação|avaliar/i })
    .first();
  await cta.click();

  await expect(page).toHaveURL(/\/avaliar/);

  // ── Step 1 — Identificação ──────────────────────────────────────────────
  // matricula: plain label + input with id="matricula"
  await page.getByLabel(/matrícula/i).fill("CC-33-DD");

  // Marca: Popover combobox — the trigger has role="combobox" + data-slot="popover-trigger"
  // disambiguate from the Ano <select> which also resolves to role="combobox"
  await page.locator('[data-slot="popover-trigger"]').click();
  const commandInput = page.getByPlaceholder(/pesquisar marca/i);
  await commandInput.fill("Tesla");
  // Tesla is in the predefined list — click the matching CommandItem
  await page.getByRole("option", { name: "Tesla" }).first().click();

  // Modelo: regular input with id="modelo"
  await page.locator("#modelo").fill("Model 3");

  // Ano: native <select> — use selectOption
  await page.selectOption('select#ano', "2022");

  // Next step
  await page.getByRole("button", { name: /seguinte/i }).click();

  // ── Step 2 — Estado ─────────────────────────────────────────────────────
  await expect(page.getByText(/estado do carro/i)).toBeVisible();

  // km — no explicit id, use placeholder
  await page.getByPlaceholder(/ex: 45000/i).fill("45000");
  // num_donos_anteriores — no explicit id, use placeholder "1"
  await page.getByPlaceholder(/^1$/).fill("1");

  // estado_geral pills — click "Bom" (role="radio")
  await page
    .getByRole("radiogroup", { name: /estado geral/i })
    .getByRole("radio", { name: /^bom$/i })
    .click();

  // sinistros pills — click "Nunca"
  await page
    .getByRole("radiogroup", { name: /sinistros/i })
    .getByRole("radio", { name: /^nunca$/i })
    .click();

  // livro_manutencao BoolPillToggle — click "Sim"
  // Locate the FormItem that contains "Livro de manutenção" text, then click Sim within it
  const livroSection = page.locator('[data-slot="form-item"]').filter({ hasText: /livro de manuten/i });
  await livroSection.getByRole("radio", { name: /^sim$/i }).click();

  await page.getByRole("button", { name: /seguinte/i }).click();

  // ── Step 3 — Bateria ────────────────────────────────────────────────────
  await expect(page.getByText(/bateria e ev/i)).toBeVisible();

  // bateria_soh_pct — no explicit id, use placeholder "90"
  await page.getByPlaceholder(/^90$/).fill("90");
  // autonomia_real_km — no explicit id, use placeholder "ex: 350"
  await page.getByPlaceholder(/ex: 350/i).fill("400");

  // carregador_incluido — "Sim"
  const carregadorSection = page
    .locator('[data-slot="form-item"]')
    .filter({ hasText: /carregador portátil/i });
  await carregadorSection.getByRole("radio", { name: /^sim$/i }).click();

  await page.getByRole("button", { name: /seguinte/i }).click();

  // ── Step 4 — Contacto ───────────────────────────────────────────────────
  await expect(page.getByText(/onde te encontramos/i)).toBeVisible();

  // nome — explicit id="nome"
  await page.locator("#nome").fill("E2E Test");

  // telefone — InputGroupInput with id="telefone"
  await page.locator("#telefone").fill("912000099");

  // email — explicit id="email"
  await page.locator("#email").fill("e2e@test.com");

  // RGPD checkbox — base-ui checkbox, the native input is aria-hidden
  // Click the visible checkbox button element (data-slot="checkbox") which is a <button role="checkbox">
  await page.locator('[data-slot="checkbox"]').click();

  // Submit
  await page.getByRole("button", { name: /receber proposta/i }).click();

  // Wait for redirect to /avaliar/obrigado
  await expect(page).toHaveURL(/\/avaliar\/obrigado/, { timeout: 15000 });
  await expect(page.getByText(/recebemos a tua avaliação/i)).toBeVisible();
});
