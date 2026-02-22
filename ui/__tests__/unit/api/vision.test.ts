import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const realSetTimeout = globalThis.setTimeout;
vi.stubGlobal('setTimeout', (fn: () => void) => realSetTimeout(fn, 0));

import { POST, GET } from '@/app/api/vision/route';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
  vi.stubEnv('JINA_API_KEY', 'test-jina-key');
});

function makeFormDataRequest(file?: File): NextRequest {
  const formData = new FormData();
  if (file) {
    formData.append('image', file);
  }
  return new NextRequest('http://localhost:3000/api/vision', {
    method: 'POST',
    body: formData,
  });
}

describe('POST /api/vision', () => {
  it('returns 400 when no image is provided', async () => {
    const resp = await POST(makeFormDataRequest());
    expect(resp.status).toBe(400);
    const data = await resp.json();
    expect(data.error).toMatch(/no image/i);
  });

  it('returns 503 when JINA_API_KEY is not set', async () => {
    vi.stubEnv('JINA_API_KEY', '');
    const file = new File(['image-data'], 'test.png', { type: 'image/png' });
    const resp = await POST(makeFormDataRequest(file));
    expect(resp.status).toBe(503);
    const data = await resp.json();
    expect(data.error).toMatch(/JINA_API_KEY/i);
  });

  it('sends correct payload to Jina VLM', async () => {
    const file = new File(['fake-image'], 'diagram.png', { type: 'image/png' });

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'Architecture analysis result' } }],
      }),
    });

    const resp = await POST(makeFormDataRequest(file));
    expect(resp.status).toBe(200);

    const data = await resp.json();
    expect(data.analysis).toBe('Architecture analysis result');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-beta-vlm.jina.ai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-jina-key',
        }),
      }),
    );
  });

  it('retries on 502/503/429 status codes', async () => {
    const file = new File(['data'], 'test.png', { type: 'image/png' });

    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'Analysis after retry' } }],
        }),
      });

    const resp = await POST(makeFormDataRequest(file));
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data.analysis).toBe('Analysis after retry');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('returns 502 with coldStart after exhausting retries', async () => {
    const file = new File(['data'], 'test.png', { type: 'image/png' });

    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: false, status: 503 });

    const resp = await POST(makeFormDataRequest(file));
    expect(resp.status).toBe(502);
    const data = await resp.json();
    expect(data.coldStart).toBe(true);
  });

  it('returns 500 when VLM returns unexpected response shape', async () => {
    const file = new File(['data'], 'test.png', { type: 'image/png' });

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [] }),
    });

    const resp = await POST(makeFormDataRequest(file));
    expect(resp.status).toBe(500);
  });

  it('returns 500 on non-retryable error status', async () => {
    const file = new File(['data'], 'test.png', { type: 'image/png' });

    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad request',
    });

    const resp = await POST(makeFormDataRequest(file));
    expect(resp.status).toBe(500);
  });
});

describe('GET /api/vision', () => {
  it('returns 405', async () => {
    const resp = await GET();
    expect(resp.status).toBe(405);
  });
});
