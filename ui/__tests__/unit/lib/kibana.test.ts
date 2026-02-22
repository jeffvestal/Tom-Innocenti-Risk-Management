import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('ELASTICSEARCH_URL', 'https://my-deploy.es.us-east-1.aws.elastic.cloud:443');
  vi.stubEnv('ELASTIC_API_KEY', 'test-api-key');
  delete process.env.KIBANA_URL;
});

async function loadModule() {
  return await import('@/lib/kibana');
}

describe('getKibanaUrl', () => {
  it('derives Kibana URL by swapping .es. for .kb.', async () => {
    const { getKibanaUrl } = await loadModule();
    expect(getKibanaUrl()).toBe('https://my-deploy.kb.us-east-1.aws.elastic.cloud:443');
  });

  it('uses explicit KIBANA_URL when set', async () => {
    vi.stubEnv('KIBANA_URL', 'https://custom-kibana.example.com/');
    const { getKibanaUrl } = await loadModule();
    expect(getKibanaUrl()).toBe('https://custom-kibana.example.com');
  });

  it('strips trailing slashes from explicit KIBANA_URL', async () => {
    vi.stubEnv('KIBANA_URL', 'https://kb.example.com///');
    const { getKibanaUrl } = await loadModule();
    expect(getKibanaUrl()).toBe('https://kb.example.com');
  });

  it('throws when ELASTICSEARCH_URL has no .es. segment and no KIBANA_URL', async () => {
    vi.stubEnv('ELASTICSEARCH_URL', 'https://localhost:9200');
    const { getKibanaUrl } = await loadModule();
    expect(() => getKibanaUrl()).toThrow('Could not derive Kibana URL');
  });

  it('throws when neither URL is set', async () => {
    vi.stubEnv('ELASTICSEARCH_URL', '');
    const { getKibanaUrl } = await loadModule();
    expect(() => getKibanaUrl()).toThrow('Missing ELASTICSEARCH_URL');
  });
});

describe('getKibanaHeaders', () => {
  it('returns correct authorization and Kibana headers', async () => {
    const { getKibanaHeaders } = await loadModule();
    const headers = getKibanaHeaders();
    expect(headers).toEqual({
      Authorization: 'ApiKey test-api-key',
      'Content-Type': 'application/json',
      'kbn-xsrf': 'true',
      'x-elastic-internal-origin': 'kibana',
    });
  });

  it('throws when ELASTIC_API_KEY is missing', async () => {
    vi.stubEnv('ELASTIC_API_KEY', '');
    const { getKibanaHeaders } = await loadModule();
    expect(() => getKibanaHeaders()).toThrow('Missing ELASTIC_API_KEY');
  });
});
