import { NextRequest, NextResponse } from 'next/server';
import { getKibanaUrl, getKibanaHeaders } from '@/lib/kibana';

const AGENT_ID = 'eu-ai-act-compliance-agent';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, language = 'en' } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "message" field' },
        { status: 400 },
      );
    }

    const kibanaUrl = getKibanaUrl();
    const headers = getKibanaHeaders();

    let input = message.trim();
    if (language === 'de') {
      input = `[Language: German / Deutsch. Search with language="de" to get German-language EU AI Act articles. Respond in German and cite German article URLs.]\n\n${input}`;
    }

    const payload: Record<string, string> = {
      input,
      agent_id: AGENT_ID,
      connector_id: process.env.AGENT_CONNECTOR_ID || 'OpenAI-GPT-4-1-Mini',
    };

    if (conversationId) {
      payload.conversation_id = conversationId;
    }

    const kibanaResp = await fetch(
      `${kibanaUrl}/api/agent_builder/converse/async`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      },
    );

    if (!kibanaResp.ok) {
      const errorBody = await kibanaResp.text().catch(() => 'Unknown error');
      console.error(`Agent Builder error ${kibanaResp.status}:`, errorBody);
      return NextResponse.json(
        { error: `Agent request failed (${kibanaResp.status}).` },
        { status: kibanaResp.status >= 500 ? 502 : kibanaResp.status },
      );
    }

    if (!kibanaResp.body) {
      return NextResponse.json(
        { error: 'No response stream from Agent Builder.' },
        { status: 502 },
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = kibanaResp.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (err) {
          console.error('Stream read error:', err);
        }
        try {
          controller.close();
        } catch {
          // controller already closed
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Agent route error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 },
  );
}
