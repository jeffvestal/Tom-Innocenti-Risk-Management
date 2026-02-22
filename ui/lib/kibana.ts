/**
 * Kibana URL derivation and shared headers for Agent Builder API calls.
 *
 * The Kibana URL is derived from ELASTICSEARCH_URL by swapping the first
 * ".es." segment for ".kb." -- this is the standard pattern for Elastic Cloud
 * and Serverless deployments.
 */

export function getKibanaUrl(): string {
  const explicit = process.env.KIBANA_URL;
  if (explicit) return explicit.replace(/\/+$/, '');

  const esUrl = process.env.ELASTICSEARCH_URL;
  if (!esUrl) {
    throw new Error('Missing ELASTICSEARCH_URL (or KIBANA_URL) environment variable');
  }

  const kibanaUrl = esUrl.replace(/\.es\./, '.kb.');
  if (kibanaUrl === esUrl) {
    throw new Error(
      'Could not derive Kibana URL from ELASTICSEARCH_URL. Set KIBANA_URL explicitly.',
    );
  }

  return kibanaUrl.replace(/\/+$/, '');
}

export function getKibanaHeaders(): Record<string, string> {
  const apiKey = process.env.ELASTIC_API_KEY;
  if (!apiKey) {
    throw new Error('Missing ELASTIC_API_KEY environment variable');
  }

  return {
    Authorization: `ApiKey ${apiKey}`,
    'Content-Type': 'application/json',
    'kbn-xsrf': 'true',
    'x-elastic-internal-origin': 'kibana',
  };
}
