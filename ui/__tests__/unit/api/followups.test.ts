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

import { POST } from '@/app/api/agent/followups/route';

const mockFetch = vi.fn();

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/agent/followups', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
  vi.stubEnv('AGENT_CONNECTOR_ID', 'test-connector');
});

describe('POST /api/agent/followups', () => {
  it('returns 400 when userMessage is missing', async () => {
    const resp = await POST(makeRequest({ agentResponse: 'some response' }));
    expect(resp.status).toBe(400);
    const data = await resp.json();
    expect(data.error).toMatch(/missing/i);
  });

  it('returns 400 when agentResponse is missing', async () => {
    const resp = await POST(makeRequest({ userMessage: 'some question' }));
    expect(resp.status).toBe(400);
    const data = await resp.json();
    expect(data.error).toMatch(/missing/i);
  });

  it('calls Kibana connector with correct endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { message: '["Q1?", "Q2?", "Q3?"]' },
      }),
    });

    await POST(makeRequest({
      userMessage: 'What about biometric systems?',
      agentResponse: 'The EU AI Act classifies biometric identification as high-risk.',
    }));

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.kb.cloud:443/api/actions/connector/test-connector/_execute',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('parses JSON array from connector response message field', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { message: '["What penalties apply?", "Is this prohibited?", "What about GDPR?"]' },
      }),
    });

    const resp = await POST(makeRequest({
      userMessage: 'Analyze this architecture',
      agentResponse: 'This system uses facial recognition which is classified as high-risk.',
    }));

    const data = await resp.json();
    expect(data.questions).toEqual([
      'What penalties apply?',
      'Is this prohibited?',
      'What about GDPR?',
    ]);
  });

  it('parses JSON array from connector response choices field', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          choices: [{ message: { content: '["Q1?", "Q2?", "Q3?"]' } }],
        },
      }),
    });

    const resp = await POST(makeRequest({
      userMessage: 'test',
      agentResponse: 'test response',
    }));

    const data = await resp.json();
    expect(data.questions).toHaveLength(3);
  });

  it('extracts JSON array embedded in surrounding text', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { message: 'Here are the questions:\n["Q1?", "Q2?", "Q3?"]\nHope that helps!' },
      }),
    });

    const resp = await POST(makeRequest({
      userMessage: 'test',
      agentResponse: 'test response',
    }));

    const data = await resp.json();
    expect(data.questions).toHaveLength(3);
  });

  it('returns empty array when connector fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const resp = await POST(makeRequest({
      userMessage: 'test',
      agentResponse: 'test response',
    }));

    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data.questions).toEqual([]);
  });

  it('returns empty array when connector returns non-JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { message: 'I cannot generate follow-up questions.' },
      }),
    });

    const resp = await POST(makeRequest({
      userMessage: 'test',
      agentResponse: 'test response',
    }));

    const data = await resp.json();
    expect(data.questions).toEqual([]);
  });

  it('limits output to 3 questions', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { message: '["Q1?", "Q2?", "Q3?", "Q4?", "Q5?"]' },
      }),
    });

    const resp = await POST(makeRequest({
      userMessage: 'test',
      agentResponse: 'test response',
    }));

    const data = await resp.json();
    expect(data.questions).toHaveLength(3);
  });

  it('includes German instruction when language is de', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { message: '["Frage 1?", "Frage 2?", "Frage 3?"]' },
      }),
    });

    await POST(makeRequest({
      userMessage: 'Was ist Artikel 5?',
      agentResponse: 'Artikel 5 verbietet...',
      language: 'de',
    }));

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const prompt = callBody.params.subActionParams.body.messages[0].content;
    expect(prompt).toContain('German');
  });

  it('uses unified_completion subAction', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { choices: [{ message: { content: '["Q1?", "Q2?", "Q3?"]' } }] },
      }),
    });

    await POST(makeRequest({
      userMessage: 'test',
      agentResponse: 'test response',
    }));

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.params.subAction).toBe('unified_completion');
    expect(typeof callBody.params.subActionParams.body).toBe('object');
  });

  it('truncates long agent responses', async () => {
    const longResponse = 'x'.repeat(3000);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { message: '["Q1?", "Q2?", "Q3?"]' },
      }),
    });

    await POST(makeRequest({
      userMessage: 'test',
      agentResponse: longResponse,
    }));

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const prompt = callBody.params.subActionParams.body.messages[0].content;
    expect(prompt.length).toBeLessThan(longResponse.length);
    expect(prompt).toContain('...');
  });

  it('returns empty array on unexpected exceptions', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const resp = await POST(makeRequest({
      userMessage: 'test',
      agentResponse: 'test response',
    }));

    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data.questions).toEqual([]);
  });
});
