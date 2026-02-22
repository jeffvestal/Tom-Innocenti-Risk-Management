import { test, expect } from '@playwright/test';

test.describe('Modals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('EU AI Act Modal', () => {
    test('opens when EU AI Act button is clicked', async ({ page }) => {
      await page.getByRole('button', { name: 'EU AI Act' }).click();
      await expect(page.getByRole('heading', { name: 'The EU AI Act' })).toBeVisible();
      await expect(page.getByText('What it is')).toBeVisible();
      await expect(page.getByText('Why keyword search fails')).toBeVisible();
      await expect(page.getByText('What this demo solves')).toBeVisible();
    });

    test('contains EUR-Lex link', async ({ page }) => {
      await page.getByRole('button', { name: 'EU AI Act' }).click();
      const link = page.getByRole('link', { name: /EUR-Lex/ });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute(
        'href',
        'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689',
      );
    });

    test('closes with close button', async ({ page }) => {
      await page.getByRole('button', { name: 'EU AI Act' }).click();
      await expect(page.getByRole('heading', { name: 'The EU AI Act' })).toBeVisible();

      await page.getByLabel('Close').click();
      await expect(page.getByRole('heading', { name: 'The EU AI Act' })).not.toBeVisible();
    });

    test('closes with Escape key', async ({ page }) => {
      await page.getByRole('button', { name: 'EU AI Act' }).click();
      await expect(page.getByRole('heading', { name: 'The EU AI Act' })).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.getByRole('heading', { name: 'The EU AI Act' })).not.toBeVisible();
    });
  });

  test.describe('Tom Innocenti Modal', () => {
    test('opens when logo icon is clicked', async ({ page }) => {
      const logoButton = page.locator('header button').first();
      await logoButton.click();

      await expect(page.getByText('Tom Innocenti')).toBeVisible();
      await expect(page.getByText('Managing Partner')).toBeVisible();
      await expect(page.getByText(/If you don.t sue/)).toBeVisible();
    });

    test('closes with close button', async ({ page }) => {
      await page.locator('header button').first().click();
      await expect(page.getByText('Tom Innocenti')).toBeVisible();

      await page.getByLabel('Close').click();
      await expect(page.getByText('Tom Innocenti')).not.toBeVisible();
    });

    test('closes with Escape key', async ({ page }) => {
      await page.locator('header button').first().click();
      await expect(page.getByText('Tom Innocenti')).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.getByText('Tom Innocenti')).not.toBeVisible();
    });
  });
});
