import { expect, test } from "@playwright/test";

test("private beta foundation renders without enabling signup or monitoring", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle("Watchtower — Private beta");
  await expect(page.getByRole("heading", { name: "Watchtower", level: 1 })).toBeVisible();
  await expect(page.getByText("Your systems. One command center.")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("form")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
