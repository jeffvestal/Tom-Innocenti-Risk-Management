import { NextRequest, NextResponse } from 'next/server';
import { getKibanaUrl, getKibanaHeaders } from '@/lib/kibana';

const MAX_RESPONSE_CHARS = 1500;

function buildPrompt(userMessage: string, agentResponse: string, language: string): string {
  const truncated = agentResponse.length > MAX_RESPONSE_CHARS
    ? agentResponse.slice(0, MAX_RESPONSE_CHARS) + '...'
    : agentResponse;

  return [
    'Based on this conversation about EU AI Act compliance:',
    '',
    `User asked: "${userMessage}"`,
    '',
    `Advisor responded: "${truncated}"`,
    '',
    'Generate exactly 3 short follow-up questions the user might want to ask next.',
    'Each question should be specific to the topics, services, or articles discussed — not generic.',
    'Return ONLY a JSON array of 3 strings, no other text.',
    language === 'de' ? 'Write the questions in German.' : '',
  ].filter(Boolean).join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const { userMessage, agentResponse, language = 'en' } = await request.json();

    if (!userMessage || !agentResponse) {
      return NextResponse.json(
        { error: 'Missing required fields: userMessage, agentResponse' },
        { status: 400 },
      );
    }

    const connectorId = process.env.AGENT_CONNECTOR_ID || 'OpenAI-GPT-4-1-Mini';
    const kibanaUrl = getKibanaUrl();
    const headers = getKibanaHeaders();

    const prompt = buildPrompt(userMessage, agentResponse, language);

    const resp = await fetch(
      `${kibanaUrl}/api/actions/connector/${encodeURIComponent(connectorId)}/_execute`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          params: {
            subAction: 'unified_completion',
            subActionParams: {
              body: {
                messages: [{ role: 'user', content: prompt }],
              },
            },
          },
        }),
      },
    );

    if (!resp.ok) {
      console.error(`Followups connector error ${resp.status}`);
      return NextResponse.json({ questions: [] });
    }

    const data = await resp.json();
    const content = data?.data?.message ?? data?.data?.choices?.[0]?.message?.content ?? '';

    if (!content) {
      console.error('Followups: connector returned ok but no content extracted', JSON.stringify(data).slice(0, 500));
    }

    const match = content.match(/\[[\s\S]*\]/);
    if (!match) {
      return NextResponse.json({ questions: [] });
    }

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) {
      return NextResponse.json({ questions: [] });
    }

    const questions = parsed
      .filter((q: unknown) => typeof q === 'string' && q.trim().length > 0)
      .slice(0, 3);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Followups route error:', error);
    return NextResponse.json({ questions: [] });
  }
}
