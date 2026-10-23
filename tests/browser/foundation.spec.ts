import { expect, test } from "@playwright/test";

test("product landing renders with real account entry and illustrative demonstrations", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle("Watchtower — Private beta");
  await expect(page.getByRole("heading", { name: "Seu site caiu às 03:12. Você soube às 03:12.", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Crie seu workspace" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.locator("form")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({ path: `docs/evidence/landing/home-${info.project.name}.png`, fullPage: true });
  await page.screenshot({ path: `docs/evidence/landing/hero-${info.project.name}.png` });
  await page.locator("#incidente").screenshot({ path: `docs/evidence/landing/incident-${info.project.name}.png` });
});

test("design system and raw references are not public production routes", async ({ request }) => {
  expect((await request.get("/design-system")).status()).toBe(404);
  expect((await request.get("/design-system/references/playground/index.html")).status()).toBe(404);
});

test("landing demos are local, keyboard accessible and clearly illustrative", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const externalRequests: string[] = [];
  page.on("request", request => { if (new URL(request.url()).origin !== "http://127.0.0.1:3137") externalRequests.push(request.url()); });
  await page.goto("/");
  await page.getByLabel("Endereço do site ou API").first().fill("https://example.invalid/private?token=not-a-real-secret");
  await page.getByRole("button", { name: "Ver demonstração" }).first().click();
  await expect(page.getByRole("status").filter({ hasText: "EXEMPLO ILUSTRATIVO" })).toContainText("não corresponde ao endereço digitado");
  expect(externalRequests).toEqual([]);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  await expect(page.locator('a[href="/signup"]').first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Criar conta", exact: true }).first()).toHaveAttribute("href", "/signup");

  const firstTab = page.getByRole("tab", { name: /Detecção/ });
  await firstTab.focus();
  await expect(page.getByRole("tablist", { name: "Fases do incidente" })).toHaveAttribute("aria-orientation", "vertical");
  await firstTab.press("ArrowDown");
  await expect(page.getByRole("tab", { name: /Notificação/ })).toBeFocused();
  await page.getByRole("tab", { name: /Notificação/ }).press("ArrowUp");
  await expect(firstTab).toBeFocused();
  await firstTab.press("ArrowDown");
  await expect(page.getByRole("tabpanel").filter({ visible: true })).toContainText("nenhum alerta é enviado");
  await page.getByRole("tab", { name: /Notificação/ }).press("End");
  await expect(page.getByRole("tab", { name: /Recuperação/ })).toHaveAttribute("aria-selected", "true");

  const slider = page.getByRole("slider", { name: "Dia do histórico" });
  await slider.focus(); await slider.press("Home");
  await expect(slider).toHaveAttribute("aria-valuetext", "Dia 1 de 90: Sem dados");
  await slider.press("End");
  await expect(slider).toHaveAttribute("aria-valuetext", "Dia 90 de 90: Up");
  await page.getByText("A demonstração verifica meu site de verdade?", { exact: true }).click();
  await expect(page.locator("details[open]").filter({ hasText: "A demonstração verifica" })).toContainText("não é acessado, enviado ou salvo");
  expect(await page.locator('a[href^="#"]').evaluateAll(links => links.every(link => document.getElementById(link.getAttribute("href")!.slice(1))))).toBe(true);
});

test("motion controls stop animation and incident autoplay", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pausar farol" }).click();
  await expect.poll(() => page.locator('[data-paused="true"]').evaluate(element => element.getAnimations({ subtree: true }).every(animation => animation.playState === "paused"))).toBe(true);
  await page.getByRole("button", { name: "Pausar etapas" }).click();
  await page.clock.install();
  const selected = page.getByRole("tab", { selected: true });
  const label = await selected.textContent();
  await page.clock.fastForward(18_000);
  await expect(selected).toHaveText(label!);
  await page.getByRole("button", { name: "Reproduzir etapas" }).click();
  await page.clock.fastForward(6100);
  await expect(page.getByRole("tab", { selected: true })).not.toHaveText(label!);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("button", { name: "Movimento reduzido" })).toHaveCount(2);
  await expect.poll(() => page.locator('[data-paused="true"]').evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
  const stopped = await page.getByRole("tab", { selected: true }).textContent();
  await page.clock.fastForward(18_000);
  await expect(page.getByRole("tab", { selected: true })).toHaveText(stopped!);
});

test("tablet and narrow layouts retain content without horizontal overflow", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [768, 700, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole("heading", { name: /Seu site caiu/ })).toBeVisible();
    expect(await page.locator('[role="tab"], [role="tabpanel"]:not([hidden])').evaluateAll(tabs => tabs.every(tab => tab.scrollWidth <= tab.clientWidth + 1 && tab.getBoundingClientRect().right <= innerWidth))).toBe(true);
    await page.screenshot({ path: `docs/evidence/landing/home-${width}-${info.project.name}.png`, fullPage: true });
  }
});
