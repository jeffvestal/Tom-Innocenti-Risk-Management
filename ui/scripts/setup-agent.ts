/**
 * Innocenti Risk Management - Agent Builder Setup Script
 *
 * Provisions an EU AI Act compliance agent via the Kibana Agent Builder API.
 *
 * 1. Creates an ES|QL tool with semantic search via MATCH on semantic_text
 * 2. Creates/updates the compliance advisor agent with system instructions
 *
 * Usage: npm run setup:agent
 * Requires: ELASTICSEARCH_URL (or KIBANA_URL), ELASTIC_API_KEY in .env.local
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const TOOL_ID = 'eu-ai-act-search';
const AGENT_ID = 'eu-ai-act-compliance-agent';
const INDEX_NAME = 'search-eu-ai-act-demo';

function getKibanaUrl(): string {
  const explicit = process.env.KIBANA_URL;
  if (explicit) return explicit.replace(/\/+$/, '');

  const esUrl = process.env.ELASTICSEARCH_URL;
  if (!esUrl) {
    console.error('❌ Missing ELASTICSEARCH_URL (or KIBANA_URL) environment variable');
    process.exit(1);
  }

  const kibanaUrl = esUrl.replace(/\.es\./, '.kb.');
  if (kibanaUrl === esUrl) {
    console.error('❌ Could not derive Kibana URL from ELASTICSEARCH_URL.');
    console.error('   Set KIBANA_URL explicitly in .env.local');
    process.exit(1);
  }

  return kibanaUrl.replace(/\/+$/, '');
}

function getHeaders(): Record<string, string> {
  const apiKey = process.env.ELASTIC_API_KEY;
  if (!apiKey) {
    console.error('❌ Missing ELASTIC_API_KEY environment variable');
    process.exit(1);
  }

  return {
    Authorization: `ApiKey ${apiKey}`,
    'Content-Type': 'application/json',
    'kbn-xsrf': 'true',
    'x-elastic-internal-origin': 'kibana',
  };
}

async function resourceExists(url: string, headers: Record<string, string>): Promise<boolean> {
  try {
    const resp = await fetch(url, { headers });
    return resp.ok;
  } catch {
    return false;
  }
}

const ESQL_QUERY = `FROM ${INDEX_NAME} METADATA _score
| WHERE MATCH(text, ?query) AND language == ?language
| SORT _score DESC
| KEEP article_number, title, url, text
| LIMIT 5`;

async function createTool(kibanaUrl: string, headers: Record<string, string>): Promise<void> {
  const url = `${kibanaUrl}/api/agent_builder/tools`;
  const getUrl = `${kibanaUrl}/api/agent_builder/tools/${TOOL_ID}`;

  if (await resourceExists(getUrl, headers)) {
    console.log(`  Deleting old tool to replace with ES|QL version...`);
    const delResp = await fetch(getUrl, { method: 'DELETE', headers });
    if (!delResp.ok) {
      const body = await delResp.text();
      throw new Error(`Failed to delete old tool (${delResp.status}): ${body}`);
    }
    console.log(`  ✓ Deleted old tool`);
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: TOOL_ID,
      type: 'esql',
      description:
        'Semantic search over the EU AI Act regulation. Returns article number, title, source URL, and article text. Use when answering any question about EU AI Act compliance, risk categories, obligations, or prohibited practices.',
      tags: ['eu-ai-act', 'compliance'],
      configuration: {
        query: ESQL_QUERY,
        params: {
          query: {
            type: 'string',
            description: 'Natural language search query about EU AI Act topics',
          },
          language: {
            type: 'string',
            description: 'Language code for article results: "en" for English or "de" for German. Check the conversation for a [Language: ...] instruction to determine which to use. Default to "en" if not specified.',
          },
        },
      },
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Failed to create tool (${resp.status}): ${body}`);
  }

  console.log(`✓ Created ES|QL tool: ${TOOL_ID}`);
}

async function createAgent(kibanaUrl: string, headers: Record<string, string>): Promise<void> {
  const url = `${kibanaUrl}/api/agent_builder/agents`;
  const getUrl = `${kibanaUrl}/api/agent_builder/agents/${AGENT_ID}`;

  const exists = await resourceExists(getUrl, headers);

  const instructions = [
    'You are an EU AI Act compliance advisor for a law firm called Innocenti & Associates.',
    'Your job is to help users understand the EU AI Act regulation.',
    '',
    'ALWAYS use the eu-ai-act-search tool to find relevant articles before answering.',
    'The tool accepts a "query" and a "language" parameter ("en" or "de").',
    'If the conversation contains a [Language: ...] instruction, use that language code. Otherwise default to "en".',
    'The tool returns article_number, title, url, and text for each matching article.',
    'When language is "de", respond in German. When language is "en", respond in English.',
    'Be precise and reference the actual regulatory text.',
    'If multiple articles are relevant, mention all of them.',
    'When the user asks about a concept, search for it and explain what the regulation says.',
    '',
    'ARCHITECTURE ANALYSIS RULES:',
    '- When the user message contains [Architecture Diagram Analysis], perform a structured compliance assessment.',
    '- Identify ALL AI/ML services described in the analysis. For each one, make MULTIPLE searches to cover prohibited practices, high-risk classification, and transparency obligations.',
    '- For each AI service, make a DEFINITIVE classification: prohibited (Article 5), high-risk (Article 6 + Annex III), limited risk (Article 50), or minimal risk.',
    '- Do NOT hedge with "could" or "depending on usage" when the architecture description makes the capability clear. If the system CAN perform biometric identification, classify it as biometric identification.',
    '- Structure your response as: 1) One-sentence summary finding, 2) Service-by-service analysis with classification and article citations, 3) Required compliance actions.',
    '- After classification, list the specific obligations that apply (risk management, data governance, transparency, human oversight, conformity assessment, etc.).',
    '',
    'CONVERSATION CONTINUITY:',
    '- When continuing a conversation about an architecture, refer back to your previous classifications rather than re-hedging.',
    '- If the user asks about a specific component you already analyzed, give a direct, definitive answer.',
    '- Make MULTIPLE searches when needed to cover different regulatory aspects rather than relying on a single search.',
    '',
    'CITATION RULES:',
    '- When citing an article, use a markdown link with the url from the search results.',
    '- Format: [Article N](url) where N is the article number and url is the exact url field value.',
    '- Example: [Article 5](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689#Art5)',
    '- ALWAYS link to the source — this lets users verify the regulation directly.',
    '',
    'FORMATTING RULES:',
    '- Start with a one-sentence summary of the answer.',
    '- Use bullet points for lists. Keep each bullet to 1-2 sentences max.',
    '- Lead each bullet with the key concept in **bold**, then a brief plain-language explanation.',
    '- Put the linked article citation at the end of each bullet.',
    '- Do NOT copy long passages of regulatory text verbatim. Summarize in plain language.',
    '- If the search returns no relevant results, say so honestly.',
  ].join('\n');

  const agentBody = {
    id: AGENT_ID,
    name: 'EU AI Act Compliance Advisor',
    description:
      'I help you understand the EU AI Act. Ask me about compliance requirements, risk classifications, prohibited practices, and more.',
    labels: ['eu-ai-act', 'compliance', 'innocenti'],
    avatar_color: '#F59E0B',
    avatar_symbol: 'CA',
    configuration: {
      instructions,
      tools: [{ tool_ids: [TOOL_ID] }],
    },
  };

  const { id: _id, ...updateBody } = agentBody;
  const resp = await fetch(exists ? getUrl : url, {
    method: exists ? 'PUT' : 'POST',
    headers,
    body: JSON.stringify(exists ? updateBody : agentBody),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Failed to ${exists ? 'update' : 'create'} agent (${resp.status}): ${body}`);
  }

  console.log(`✓ ${exists ? 'Updated' : 'Created'} agent: ${AGENT_ID}`);
}

async function main(): Promise<void> {
  console.log('');
  console.log('═'.repeat(60));
  console.log('  Innocenti Risk Management - Agent Setup');
  console.log('═'.repeat(60));
  console.log('');

  const kibanaUrl = getKibanaUrl();
  const headers = getHeaders();

  console.log(`  Kibana: ${kibanaUrl}`);
  console.log('');

  await createTool(kibanaUrl, headers);
  await createAgent(kibanaUrl, headers);

  console.log('');
  console.log('═'.repeat(60));
  console.log('  Agent Setup Complete!');
  console.log('═'.repeat(60));
  console.log('');
  console.log('  The agent is ready. Run "npm run dev" and switch to Agent mode.');
  console.log('');
}

main().catch((error) => {
  console.error('');
  console.error('❌ Agent setup failed:', error.message || error);
  process.exit(1);
});
