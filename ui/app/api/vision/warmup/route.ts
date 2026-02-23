import { NextResponse } from 'next/server';

const JINA_VLM_URL = 'https://api-beta-vlm.jina.ai/v1/chat/completions';

export async function POST() {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ status: 'error', reason: 'no_api_key' }, { status: 503 });
  }

  try {
    const resp = await fetch(JINA_VLM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'jina-vlm',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      }),
    });

    if (resp.status === 502 || resp.status === 503 || resp.status === 429) {
      return NextResponse.json({ status: 'waking' });
    }

    return NextResponse.json({ status: 'warm' });
  } catch {
    return NextResponse.json({ status: 'waking' });
  }
}
