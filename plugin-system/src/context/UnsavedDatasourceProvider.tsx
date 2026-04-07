import { DatasourceApi, DatasourceSpec, fetch } from '@perses-dev/core';
import { ReactElement, ReactNode, useCallback, useMemo } from 'react';
import { UnsavedDatasourceStoreContext } from '../runtime';

interface UnsavedDatasourceProxyBody {
  method: string;
  body?: Uint8Array | null;
  spec: DatasourceSpec;
}

export interface UnsavedDatasourceProviderProps {
  datasourceApi: DatasourceApi;
  dashboard?: string;
  project?: string;
  children: ReactNode;
}

function buildUrl(proxyUrl: string, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${proxyUrl}${normalizedPath}`;
}

export function UnsavedDatasourceProvider({
  datasourceApi,
  dashboard,
  project,
  children,
}: UnsavedDatasourceProviderProps): ReactElement {
  const testProxyConnection = useCallback(
    async function test(spec: DatasourceSpec, healthCheckPath: string): Promise<boolean> {
      const proxyUrl = datasourceApi.buildProxyUrl ? datasourceApi.buildProxyUrl({ dashboard, project }) : '';

      const url = buildUrl(proxyUrl, healthCheckPath);

      const unsavedBody: UnsavedDatasourceProxyBody = {
        method: 'GET',
        spec: spec,
        body: null,
      };

      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(unsavedBody),
        });
        return resp.status === 200;
      } catch {
        return false;
      }
    },
    [dashboard, datasourceApi, project]
  );

  const testDirectConnection = useCallback(async function testDirect(
    directUrl: string,
    healthCheckPath: string
  ): Promise<boolean> {
    const url = buildUrl(directUrl, healthCheckPath);
    try {
      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return resp.status === 200;
    } catch {
      return false;
    }
  }, []);
  const ctxValue = useMemo(
    () => ({ testProxyConnection, testDirectConnection }),
    [testDirectConnection, testProxyConnection]
  );

  return <UnsavedDatasourceStoreContext.Provider value={ctxValue}>{children}</UnsavedDatasourceStoreContext.Provider>;
}
