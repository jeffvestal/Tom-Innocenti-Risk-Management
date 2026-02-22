import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/kibana', () => ({
  getKibanaUrl: () => 'https://test.kb.cloud:443',
  getKibanaHeaders: () => ({
    Authorization: 'ApiKey test-key',
    'Content-Type': 'application/json',
    'kbn-xsrf': 'true',
    'x-elastic-internal-origin': 'kibana',
  }),
}));

import { POST, GET } from '@/app/api/agent/route';

const mockFetch = vi.fn();

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/agent', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

describe('POST /api/agent', () => {
  it('returns 400 when message is missing', async () => {
    const resp = await POST(makeRequest({}));
    expect(resp.status).toBe(400);
    const data = await resp.json();
    expect(data.error).toMatch(/missing/i);
  });

  it('returns 400 when message is not a string', async () => {
    const resp = await POST(makeRequest({ message: 123 }));
    expect(resp.status).toBe(400);
  });

  it('calls Kibana agent builder with correct payload', async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    mockFetch.mockResolvedValue({ ok: true, body });

    await POST(makeRequest({ message: 'What are prohibited practices?' }));

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.kb.cloud:443/api/agent_builder/converse/async',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('What are prohibited practices?'),
      }),
    );

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.agent_id).toBe('eu-ai-act-compliance-agent');
    expect(callBody.input).toBe('What are prohibited practices?');
  });

  it('prepends German instruction when language is de', async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    mockFetch.mockResolvedValue({ ok: true, body });

    await POST(makeRequest({ message: 'test', language: 'de' }));

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.input).toContain('[Language: German / Deutsch');
    expect(callBody.input).toContain('test');
  });

  it('does not prepend instruction when language is en', async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    mockFetch.mockResolvedValue({ ok: true, body });

    await POST(makeRequest({ message: 'test', language: 'en' }));

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.input).toBe('test');
  });

  it('passes conversationId when provided', async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });
    mockFetch.mockResolvedValue({ ok: true, body });

    await POST(makeRequest({ message: 'follow-up', conversationId: 'conv-123' }));

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.conversation_id).toBe('conv-123');
  });

  it('returns SSE stream with correct headers', async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"text": "hello"}\n\n'));
        controller.close();
      },
    });
    mockFetch.mockResolvedValue({ ok: true, body });

    const resp = await POST(makeRequest({ message: 'test' }));
    expect(resp.headers.get('Content-Type')).toBe('text/event-stream');
    expect(resp.headers.get('Cache-Control')).toBe('no-cache');
  });

  it('returns error when Kibana responds with non-ok status', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal error',
    });

    const resp = await POST(makeRequest({ message: 'test' }));
    expect(resp.status).toBe(502);
    const data = await resp.json();
    expect(data.error).toMatch(/failed.*500/i);
  });

  it('returns 502 when Kibana response has no body', async () => {
    mockFetch.mockResolvedValue({ ok: true, body: null });

    const resp = await POST(makeRequest({ message: 'test' }));
    expect(resp.status).toBe(502);
  });
});

describe('GET /api/agent', () => {
  it('returns 405', async () => {
    const resp = await GET();
    expect(resp.status).toBe(405);
  });
});
