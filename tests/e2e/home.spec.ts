import { test, expect } from "@playwright/test";

test.describe("Página Principal", () => {
	test("debe cargar la página de inicio correctamente", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle(/Cuna|UNAL|Visor/i);
	});
});
