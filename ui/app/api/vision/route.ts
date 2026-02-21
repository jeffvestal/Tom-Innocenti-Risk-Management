import { NextRequest, NextResponse } from 'next/server';

const JINA_VLM_URL = 'https://api-beta-vlm.jina.ai/v1/chat/completions';
const RETRY_DELAYS = [15_000, 30_000];
const RETRY_STATUS_CODES = new Set([502, 503, 429]);

const SYSTEM_PROMPT =
  'You are a Senior Cloud Architect. Your job is to analyze this system architecture diagram and write a dense, highly detailed technical summary of how data flows through the system. Provide your output as a single, detailed paragraph. You MUST explicitly name every Machine Learning service shown. More importantly, you MUST transcribe any text on the diagram that describes the specific types of data, metadata, labels, or user inputs being processed (for example, if a step says \'extracts X and Y metadata\', you must include X and Y in your summary). Do not classify the system or mention regulations. Just describe exactly what the system does and what specific data it touches based on the text in the diagram.';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided. Include a file field named "image".' },
        { status: 400 },
      );
    }

    const apiKey = process.env.JINA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'JINA_API_KEY is not configured on the server.' },
        { status: 503 },
      );
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = file.type || 'image/png';

    const payload = {
      model: 'jina-vlm',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: SYSTEM_PROMPT },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
    };

    let lastResponse: Response | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      lastResponse = await fetch(JINA_VLM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!RETRY_STATUS_CODES.has(lastResponse.status)) {
        break;
      }

      console.log(
        `Jina VLM returned ${lastResponse.status} on attempt ${attempt + 1}/3` +
          (attempt < RETRY_DELAYS.length ? `, retrying in ${RETRY_DELAYS[attempt] / 1000}s...` : ''),
      );

      if (attempt < RETRY_DELAYS.length) {
        await sleep(RETRY_DELAYS[attempt]);
      }
    }

    if (!lastResponse || RETRY_STATUS_CODES.has(lastResponse.status)) {
      return NextResponse.json(
        {
          error: 'The Vision AI service is warming up. Please try again in about 30 seconds.',
          coldStart: true,
        },
        { status: 502 },
      );
    }

    if (!lastResponse.ok) {
      const errorBody = await lastResponse.text().catch(() => 'Unknown error');
      console.error(`Jina VLM error ${lastResponse.status}:`, errorBody);
      return NextResponse.json(
        { error: `Vision analysis failed (${lastResponse.status}).` },
        { status: 500 },
      );
    }

    const data = await lastResponse.json();
    const analysis = data?.choices?.[0]?.message?.content;

    if (!analysis || typeof analysis !== 'string') {
      console.error('Unexpected Jina VLM response shape:', JSON.stringify(data).slice(0, 500));
      return NextResponse.json(
        { error: 'Vision model returned an empty or unexpected response.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Vision route error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during vision analysis.' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST with multipart/form-data.' },
    { status: 405 },
  );
}
