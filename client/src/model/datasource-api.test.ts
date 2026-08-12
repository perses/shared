// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { DatasourceSpec, UnknownSpec } from '@perses-dev/spec';

import { buildProxyUrl, createTestDatasourceConnection, hasHTTPProxy } from './datasource-api';

describe('buildProxyUrl', () => {
  beforeEach(() => {
    delete window.PERSES_APP_CONFIG;
  });

  test.each([
    {
      title: 'should build global datasource proxy url',
      input: { name: 'datasourceA' },
      expected: '/proxy/globaldatasources/datasourceA',
    },
    {
      title: 'should build unsaved global datasource proxy url',
      input: {},
      expected: '/proxy/unsaved/globaldatasources',
    },
    {
      title: 'should build project datasource proxy url',
      input: { project: 'projectA', name: 'datasourceA' },
      expected: '/proxy/projects/projectA/datasources/datasourceA',
    },
    {
      title: 'should build unsaved project datasource proxy url',
      input: { project: 'projectA' },
      expected: '/proxy/unsaved/projects/projectA/datasources',
    },
    {
      title: 'should build dashboard datasource proxy url',
      input: { project: 'projectA', dashboard: 'dashboardA', name: 'datasourceA' },
      expected: '/proxy/projects/projectA/dashboards/dashboardA/datasources/datasourceA',
    },
    {
      title: 'should build unsaved dashboard datasource proxy url',
      input: { project: 'projectA', dashboard: 'dashboardA' },
      expected: '/proxy/unsaved/projects/projectA/dashboards/dashboardA/datasources',
    },
  ])('$title', ({ input, expected }) => {
    expect(buildProxyUrl(input)).toEqual(expected);
  });

  it('should URL-encode special characters in project, dashboard, and name', () => {
    expect(buildProxyUrl({ project: 'my project', dashboard: 'my/dashboard', name: 'my datasource' })).toEqual(
      '/proxy/projects/my%20project/dashboards/my%2Fdashboard/datasources/my%20datasource',
    );
  });

  it('should prepend api_prefix from window.PERSES_APP_CONFIG', () => {
    window.PERSES_APP_CONFIG = { api_prefix: '/api/v1' };
    expect(buildProxyUrl({ name: 'datasourceA' })).toEqual('/api/v1/proxy/globaldatasources/datasourceA');
  });

  it('should use empty prefix when api_prefix is absent', () => {
    window.PERSES_APP_CONFIG = {};
    expect(buildProxyUrl({ name: 'datasourceA' })).toEqual('/proxy/globaldatasources/datasourceA');
  });
});

describe('hasHTTPProxy', () => {
  it('returns true for a valid HTTPProxy spec', () => {
    expect(hasHTTPProxy({ proxy: { kind: 'HTTPProxy', spec: { url: 'http://localhost:9090' } } })).toBe(true);
  });

  it('returns false when proxy kind is not HTTPProxy', () => {
    expect(hasHTTPProxy({ proxy: { kind: 'SQLProxy', spec: { url: 'http://localhost:9090' } } })).toBe(false);
  });

  it('returns false when proxy spec url is missing', () => {
    expect(hasHTTPProxy({ proxy: { kind: 'HTTPProxy', spec: {} } })).toBe(false);
  });

  it('returns false when proxy spec url is not a string', () => {
    expect(hasHTTPProxy({ proxy: { kind: 'HTTPProxy', spec: { url: 9090 } } })).toBe(false);
  });

  it('returns false when proxy is not an object', () => {
    expect(hasHTTPProxy({ proxy: 'HTTPProxy' })).toBe(false);
  });

  it('returns false when proxy is absent', () => {
    expect(hasHTTPProxy({ directUrl: 'http://localhost:9090' })).toBe(false);
  });

  it('returns false for an empty spec', () => {
    expect(hasHTTPProxy({})).toBe(false);
  });

  it('returns false for a non-object spec', () => {
    expect(hasHTTPProxy('not-an-object' as unknown as UnknownSpec)).toBe(false);
  });
});

describe('createTestDatasourceConnection', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    delete window.PERSES_APP_CONFIG;
    globalThis.fetch = mockFetch;
  });

  const makeSpec = (pluginSpec: UnknownSpec): DatasourceSpec => ({
    default: false,
    plugin: { kind: 'TestDatasource', spec: pluginSpec },
  });

  describe('direct URL mode', () => {
    it('calls the directUrl + healthCheckPath with GET', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const testConnection = createTestDatasourceConnection();
      const spec = makeSpec({ directUrl: 'http://localhost:9090' });

      await testConnection(spec, '/api/v1/query');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:9090/api/v1/query', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('resolves correctly when directUrl has a trailing slash', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const testConnection = createTestDatasourceConnection();
      const spec = makeSpec({ directUrl: 'http://localhost:9090/' });

      await testConnection(spec, '/api/v1/query');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:9090/api/v1/query', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('normalizes healthCheckPath that lacks a leading slash', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const testConnection = createTestDatasourceConnection();
      const spec = makeSpec({ directUrl: 'http://localhost:9090' });

      await testConnection(spec, 'api/v1/query');

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/query'), expect.anything());
    });

    it('throws when directUrl is not a valid URL', async () => {
      const testConnection = createTestDatasourceConnection();
      const spec = makeSpec({ directUrl: 'not-a-valid-url' });

      await expect(testConnection(spec, '/health')).rejects.toThrow();
    });
  });

  describe('proxy mode', () => {
    it('POSTs to the unsaved global proxy endpoint', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const testConnection = createTestDatasourceConnection();
      const spec = makeSpec({ proxy: { kind: 'HTTPProxy', spec: { url: 'http://localhost:9090' } } });

      await testConnection(spec, '/api/v1/query');

      expect(mockFetch).toHaveBeenCalledWith(
        '/proxy/unsaved/globaldatasources/api/v1/query',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('POSTs to the unsaved project proxy endpoint', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const testConnection = createTestDatasourceConnection({ project: 'myProject' });
      const spec = makeSpec({ proxy: { kind: 'HTTPProxy', spec: { url: 'http://localhost:9090' } } });

      await testConnection(spec, '/api/v1/query');

      expect(mockFetch).toHaveBeenCalledWith(
        '/proxy/unsaved/projects/myProject/datasources/api/v1/query',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('POSTs to the unsaved dashboard proxy endpoint', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const testConnection = createTestDatasourceConnection({ project: 'myProject', dashboard: 'myDashboard' });
      const spec = makeSpec({ proxy: { kind: 'HTTPProxy', spec: { url: 'http://localhost:9090' } } });

      await testConnection(spec, '/api/v1/query');

      expect(mockFetch).toHaveBeenCalledWith(
        '/proxy/unsaved/projects/myProject/dashboards/myDashboard/datasources/api/v1/query',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('includes the full spec in the POST body', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const testConnection = createTestDatasourceConnection();
      const spec = makeSpec({ proxy: { kind: 'HTTPProxy', spec: { url: 'http://localhost:9090' } } });

      await testConnection(spec, '/api/v1/query');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody).toMatchObject({ method: 'GET', body: null, spec });
    });
  });

  describe('unsupported spec', () => {
    it('throws for a spec with neither directUrl nor proxy', async () => {
      const testConnection = createTestDatasourceConnection();
      const spec = makeSpec({ someOtherField: 'value' });

      await expect(testConnection(spec, '/health')).rejects.toThrow(/unsupported datasource spec type/i);
    });

    it('throws for an empty HTTP spec (directUrl undefined, no proxy)', async () => {
      const testConnection = createTestDatasourceConnection();
      const spec = makeSpec({});

      await expect(testConnection(spec, '/health')).rejects.toThrow(/unsupported datasource spec type/i);
    });

    it('throws for a spec with directUrl set to undefined', async () => {
      const testConnection = createTestDatasourceConnection();
      const spec = makeSpec({ directUrl: undefined });

      await expect(testConnection(spec, '/health')).rejects.toThrow(/unsupported datasource spec type/i);
    });

    it('throws for a non-object spec', async () => {
      const testConnection = createTestDatasourceConnection();
      const spec = makeSpec('not-an-object' as unknown as UnknownSpec);

      await expect(testConnection(spec, '/health')).rejects.toThrow(/unsupported datasource spec type/i);
    });
  });
});
