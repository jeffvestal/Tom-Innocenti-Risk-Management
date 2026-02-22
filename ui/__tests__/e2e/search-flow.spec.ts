import { test, expect, type Page } from '@playwright/test';

const MOCK_SEARCH_RESPONSE = {
  results: [
    {
      id: 'en_art_5',
      article_number: '5',
      title: 'Prohibited artificial intelligence practices',
      text: 'The following artificial intelligence practices shall be prohibited: (a) the placing on the market, the putting into service, or the use of an AI system that deploys subliminal techniques beyond a person\u2019s consciousness...',
      score: 0.9542,
      language: 'en',
      url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689#Art5',
    },
    {
      id: 'en_art_6',
      article_number: '6',
      title: 'Classification rules for high-risk AI systems',
      text: 'An AI system shall be considered high-risk where it falls under the conditions laid down in paragraph 2 or is referred to in Annex III.',
      score: 0.8823,
      language: 'en',
      url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689#Art6',
    },
    {
      id: 'en_art_9',
      article_number: '9',
      title: 'Risk management system',
      text: 'A risk management system shall be established, implemented, documented and maintained in relation to high-risk AI systems. The system shall be a continuous iterative process planned and run throughout the entire lifecycle of the AI system.',
      score: 0.8541,
      language: 'en',
    },
  ],
  query: 'prohibited AI practices',
  reranked: false,
  took: 342,
};

const MOCK_RERANKED_RESPONSE = {
  results: [
    { ...MOCK_SEARCH_RESPONSE.results[0], score: 0.98 },
    { ...MOCK_SEARCH_RESPONSE.results[2], score: 0.92 },
    {
      id: 'en_art_3',
      article_number: '3',
      title: 'Definitions',
      text: 'For the purposes of this Regulation, the following definitions apply...',
      score: 0.88,
      language: 'en',
    },
  ],
  query: 'prohibited AI practices',
  reranked: true,
  took: 580,
};

async function mockSearchApi(page: Page) {
  let callCount = 0;
  await page.route('**/api/search', async (route) => {
    callCount++;
    const response = callCount === 1 ? MOCK_SEARCH_RESPONSE : MOCK_RERANKED_RESPONSE;
    await route.fulfill({ json: response });
  });
}

test.describe('Search Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockSearchApi(page);
    await page.goto('/');
  });

  test('shows empty state with suggestion pills', async ({ page }) => {
    await expect(page.getByPlaceholder('Search the EU AI Act...')).toBeVisible();
    await expect(page.getByText('Can law enforcement use facial recognition?')).toBeVisible();
  });

  test('clicking a suggestion runs a search and shows results', async ({ page }) => {
    await page.getByText('Can law enforcement use facial recognition?').click();
    await expect(page.getByText('Art. 5')).toBeVisible();
    await expect(page.getByText('Art. 6')).toBeVisible();
    await expect(page.getByText('Art. 9')).toBeVisible();
  });

  test('result cards show rank, title, score, and text', async ({ page }) => {
    await page.getByText('Can law enforcement use facial recognition?').click();

    await expect(page.getByText('Prohibited artificial intelligence practices')).toBeVisible();
    await expect(page.getByText('0.9542')).toBeVisible();
  });

  test('expand and collapse a result card', async ({ page }) => {
    await page.getByText('Can law enforcement use facial recognition?').click();
    await expect(page.getByText('Art. 9')).toBeVisible();

    const showMore = page.getByText('Show more').first();
    if (await showMore.isVisible()) {
      await showMore.click();
      await expect(page.getByText('Show less').first()).toBeVisible();
    }
  });

  test('Deep Analysis triggers reranking comparison', async ({ page }) => {
    await page.getByText('Can law enforcement use facial recognition?').click();
    await expect(page.getByText('Art. 5')).toBeVisible();

    await page.getByText('Deep Analysis').click();
    await expect(page.getByText('Deep Analysis Complete')).toBeVisible();
    await expect(page.getByText(/Jina Reranker/)).toBeVisible();
    await expect(page.getByText('Reranking Impact')).toBeVisible();
  });

  test('source links open in new tab', async ({ page }) => {
    await page.getByText('Can law enforcement use facial recognition?').click();

    const link = page.getByText('View source').first();
    await expect(link).toBeVisible();
    await expect(link.locator('..')).toHaveAttribute('target', '_blank');
  });
});
