import { test, expect } from '@playwright/test';

function enButton(page: import('@playwright/test').Page) {
  return page.locator('button:text-is("EN")');
}

function deButton(page: import('@playwright/test').Page) {
  return page.locator('button:text-is("DE")');
}

test.describe('Language Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/search', async (route) => {
      await route.fulfill({
        json: { results: [], query: 'test', reranked: false, took: 10 },
      });
    });
    await page.goto('/');
  });

  test('starts with EN selected', async ({ page }) => {
    await expect(enButton(page)).toHaveClass(/text-amber-400/);
  });

  test('switches search suggestions to German when DE is clicked', async ({ page }) => {
    await deButton(page).click();
    await expect(page.getByText('Darf die Polizei Gesichtserkennung einsetzen?')).toBeVisible();
  });

  test('switches back to English suggestions when EN is clicked', async ({ page }) => {
    await deButton(page).click();
    await expect(page.getByText('Darf die Polizei Gesichtserkennung einsetzen?')).toBeVisible();

    await enButton(page).click();
    await expect(page.getByText('Can law enforcement use facial recognition?')).toBeVisible();
  });

  test('switches agent suggestions to German', async ({ page }) => {
    await page.getByText('Agent').click();
    await deButton(page).click();
    await expect(page.getByText('Welche KI-Praktiken sind verboten?')).toBeVisible();
  });

  test('German search suggestions have English tooltips', async ({ page }) => {
    await deButton(page).click();

    const germanPill = page.getByText('Darf die Polizei Gesichtserkennung einsetzen?');
    await expect(germanPill).toHaveAttribute('title', 'Can law enforcement use facial recognition?');
  });

  test('German agent suggestions have English tooltips', async ({ page }) => {
    await page.getByText('Agent').click();
    await deButton(page).click();

    const germanPill = page.getByText('Welche KI-Praktiken sind verboten?');
    await expect(germanPill).toHaveAttribute('title', 'What are the prohibited AI practices?');
  });

  test('English suggestions do not have tooltips', async ({ page }) => {
    const pill = page.getByText('Can law enforcement use facial recognition?');
    await expect(pill).not.toHaveAttribute('title');
  });
});
