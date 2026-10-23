import { test, expect } from "@playwright/test";
const monitors = [{ id: "visual-api", name: "API de exemplo", target: "https://api.example.test", type: "http", interval_seconds: 60, state: "down", paused: false }, { id: "visual-site", name: "Site de exemplo", target: "https://example.test", type: "http", interval_seconds: 60, state: "unknown", paused: false }];
test("reference composition, responsive navigation and monitor filtering with isolated visual fixtures", async ({ page }, testInfo) => {
  const desktop = testInfo.project.name === "desktop";
  if (desktop) await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/login");
  await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
  if (desktop) expect(Math.round((await page.locator("form").boundingBox())!.width)).toBe(400);
  await page.screenshot({ path: testInfo.outputPath("login.png"), fullPage: true });
  // Browser-only fixtures exercise rendering; they never create accounts or observations.
  await page.route("**/api/auth/get-session**", route => route.fulfill({ json: { session: { id: "visual-session", userId: "visual-user", expiresAt: "2099-01-01T00:00:00Z" }, user: { id: "visual-user", name: "Bruno Visual", email: "visual@example.test", emailVerified: true } } }));
  await page.route("**/api/workspaces**", route => {
    const path = new URL(route.request().url()).pathname;
    const data = path === "/api/workspaces" ? [{ id: "visual-workspace", name: "Workspace visual", role: "owner" }] : path.endsWith("/settings") ? { language: "pt", timezone: "UTC", dateFormat: "DD/MM/YYYY" } : path.endsWith("/monitors") ? monitors : { workspace: { id: "visual-workspace", name: "Workspace visual", plan: "Free" }, summary: { uptime: 99.8, p95: 180, openIncidents: 1, mttr: null, checks: 120, observedChecks: 120, expectedChecks: 150, coveragePercent: 80 }, monitors, incidents: [{ id: "visual-incident", title: "API indisponível", monitor_name: "API de exemplo", opened_at: "2026-10-22T12:00:00Z", resolved_at: null }], channels: [], trends: Array.from({ length: 24 }, (_, i) => ({ id: String(i), time: `2026-10-22T${String(i).padStart(2, "0")}:00:00Z`, duration_ms: 90 + (i % 5) * 22 })), regions: [{ region: "us-east", checks: 0, observedChecks: 0, expectedChecks: 150, coveragePercent: 0, lastObservedAt: null, uptime: null, p95: null }], expiries: [], deliveries: [], usage: { monitors: 2, limit: 5 }, capabilities: {} };
    return route.fulfill({ json: { data } });
  });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Olá, Bruno" })).toBeVisible();
  await expect(page.locator(".ds-card:has(.ds-stat-label)")).toHaveCount(5);
  await expect(page.getByText("Workspace visual · 2 monitores · Aguardando observações", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (desktop) {
    const sidebar = await page.locator("aside").boundingBox(); expect(sidebar!.width).toBe(248); expect(sidebar!.x).toBe(20);
    const cards = await page.locator(".ds-card:has(.ds-stat-label)").evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().top)); expect(new Set(cards).size).toBe(1);
    await page.getByRole("button", { name: "Recolher navegação" }).click();
    await expect(page.locator("aside").getByLabel("Workspace", { exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Expandir navegação" }).click();
  } else {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("button", { name: "Sair", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
  }
  await page.screenshot({ path: testInfo.outputPath("overview-fixture.png"), fullPage: true });
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Relatório" }).click(); expect((await download).suggestedFilename()).toBe("watchtower-7d.csv");
  await page.goto("/dashboard/monitors");
  await expect(page.getByRole("link", { name: "API de exemplo", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Sem observações/ }).click();
  await expect(page.getByRole("link", { name: "API de exemplo", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Site de exemplo", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Todos/ }).click();
  await page.getByLabel("Buscar monitores").fill("api.example");
  await expect(page.getByRole("link", { name: "Site de exemplo", exact: true })).toHaveCount(0);
  await page.getByLabel("Buscar monitores").fill("");
  await page.screenshot({ path: testInfo.outputPath("monitors-fixture.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (desktop) {
    await page.setViewportSize({ width: 768, height: 1024 }); await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Olá, Bruno" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("overview-tablet-fixture.png"), fullPage: true });
  }
});
