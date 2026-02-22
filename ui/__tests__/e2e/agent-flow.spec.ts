import { test, expect, type Page } from '@playwright/test';

function makeSSEStream(events: Array<{ event: string; data: Record<string, unknown> }>): string {
  return events.map(e => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`).join('');
}

async function mockAgentApi(page: Page) {
  await page.route('**/api/agent', async (route) => {
    const body = makeSSEStream([
      { event: 'conversation_id_set', data: { conversation_id: 'test-conv-123' } },
      { event: 'reasoning', data: { reasoning: 'Analyzing the query about prohibited AI practices...' } },
      {
        event: 'tool_call',
        data: {
          tool_call_id: 'tc-1',
          tool_id: 'eu-ai-act-search',
          params: { nlQuery: 'prohibited AI practices', language: 'en' },
        },
      },
      {
        event: 'tool_result',
        data: {
          tool_call_id: 'tc-1',
          tool_id: 'eu-ai-act-search',
          results: [
            { type: 'document', data: { article_number: '5', title: 'Prohibited practices' } },
          ],
        },
      },
      { event: 'message_chunk', data: { text_chunk: '## Prohibited AI Practices\n\n' } },
      { event: 'message_chunk', data: { text_chunk: 'According to **Article 5** of the EU AI Act, the following practices are prohibited:\n\n' } },
      { event: 'message_chunk', data: { text_chunk: '1. **Manipulative techniques** that distort behavior\n' } },
      { event: 'message_chunk', data: { text_chunk: '2. **Social scoring** by public authorities\n' } },
    ]);

    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      body,
    });
  });
}

test.describe('Agent Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockAgentApi(page);
    await page.goto('/');
    await page.getByText('Agent').click();
  });

  test('shows agent empty state with suggestions', async ({ page }) => {
    await expect(page.getByText('EU AI Act Compliance Advisor')).toBeVisible();
    await expect(page.getByText('What are the prohibited AI practices?')).toBeVisible();
  });

  test('clicking a suggestion populates the input', async ({ page }) => {
    await page.getByText('What are the prohibited AI practices?').click();
    const input = page.getByPlaceholder('Ask about the EU AI Act...');
    await expect(input).toHaveValue('What are the prohibited AI practices?');
  });

  test('sending a message shows user bubble and agent response', async ({ page }) => {
    await page.getByText('What are the prohibited AI practices?').click();

    const submitButtons = page.locator('form button[type="submit"]');
    await submitButtons.click();

    await expect(page.getByText('What are the prohibited AI practices?').first()).toBeVisible();

    await expect(page.getByText(/Prohibited AI Practices/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Article 5/)).toBeVisible();
    await expect(page.getByText(/Manipulative techniques/)).toBeVisible();
  });

  test('agent response shows collapsible thinking steps', async ({ page }) => {
    const input = page.getByPlaceholder('Ask about the EU AI Act...');
    await input.fill('What is Article 5?');
    await page.locator('form button[type="submit"]').click();

    await expect(page.getByText(/Completed \d+ step/)).toBeVisible({ timeout: 10_000 });
  });

  test('renders image upload button', async ({ page }) => {
    await expect(page.getByTitle('Upload architecture diagram for VLM analysis')).toBeVisible();
  });

  test('image button opens modal with two options', async ({ page }) => {
    await page.getByTitle('Upload architecture diagram for VLM analysis').click();

    await expect(page.getByText('Upload Architecture Diagram')).toBeVisible();
    await expect(page.getByText('Upload File')).toBeVisible();
    await expect(page.getByText('Example Diagram')).toBeVisible();
    await expect(page.getByAltText('Example architecture diagram')).toBeVisible();
  });

  test('loading example image shows preview and suggestions', async ({ page }) => {
    await page.route('**/example-architecture.png', async (route) => {
      const body = Buffer.from('fake-png-data');
      await route.fulfill({ body, contentType: 'image/png' });
    });
    await page.route('**/api/vision', async (route) => {
      await route.fulfill({
        json: { analysis: 'This is a machine learning pipeline on AWS with S3, SageMaker, and Lambda.' },
      });
    });

    await page.getByTitle('Upload architecture diagram for VLM analysis').click();
    await page.getByTestId('load-example-btn').click();

    await expect(page.getByAltText('Selected diagram')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Architecture diagram attached')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Are there any prohibited AI' })).toBeVisible();
  });

  test('image upload modal closes on Escape', async ({ page }) => {
    await page.getByTitle('Upload architecture diagram for VLM analysis').click();
    await expect(page.getByText('Upload Architecture Diagram')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByText('Upload Architecture Diagram')).not.toBeVisible();
  });
});
