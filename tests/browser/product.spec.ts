import { test, expect } from "@playwright/test";

test("login has labelled credentials, recovery navigation and no invented metrics", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Entrar", exact: true })).toBeVisible();
  await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute("type", "password");
  await expect(page.getByText("99.98% uptime")).toHaveCount(0);
  await page.getByRole("link", { name: "Esqueci a senha" }).click();
  await expect(page).toHaveURL(/reset-password/);
  await expect(page.getByRole("heading", { name: "Redefinir senha" })).toBeVisible();
});

test("signup enforces password length and supports English", async ({ page }) => {
  await page.goto("/signup");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("minlength", "10");
  await expect(page.getByLabel("Name", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("unauthenticated dashboard redirects to login", async ({ page }) => {
  await page.goto("/dashboard/monitors");
  await expect(page).toHaveURL(/\/login$/);
});
