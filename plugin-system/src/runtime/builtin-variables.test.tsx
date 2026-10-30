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

import type { BuiltinVariableDefinition } from '@perses-dev/spec';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import type { BuiltinVariableSrv } from './builtin-variables';
import { BuiltinVariableContext, useBuiltinVariableDefinitions } from './builtin-variables';
import type { PluginRegistryContextType } from './plugin-registry';
import { PluginRegistryContext } from './plugin-registry';

function builtinVariable(name: string, source: string): BuiltinVariableDefinition {
  return { kind: 'BuiltinVariable', spec: { name, value: () => name, source, display: { name } } };
}

function registryWithDatasource(source: string): PluginRegistryContextType {
  return {
    listPluginMetadata: vi.fn().mockResolvedValue([{ kind: 'Datasource', spec: { name: `${source}Datasource` } }]),
    getPlugin: vi.fn().mockResolvedValue({
      getBuiltinVariableDefinitions: (): BuiltinVariableDefinition[] => [builtinVariable('__interval', source)],
    }),
  } as unknown as PluginRegistryContextType;
}

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function TestProviders({
  registry,
  builtinVariables,
  queryClient,
  children,
}: {
  registry: PluginRegistryContextType;
  builtinVariables: BuiltinVariableSrv;
  queryClient: QueryClient;
  children: ReactNode;
}): ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <PluginRegistryContext.Provider value={registry}>
        <BuiltinVariableContext.Provider value={builtinVariables}>{children}</BuiltinVariableContext.Provider>
      </PluginRegistryContext.Provider>
    </QueryClientProvider>
  );
}

describe('useBuiltinVariableDefinitions', () => {
  it('adds the builtin variables of the datasource plugins to the ones of the context', async () => {
    const dashboardVariable = builtinVariable('__dashboard', 'Dashboard');
    const contextVariable = builtinVariable('__interval', 'Context');
    const registry = {
      listPluginMetadata: vi.fn().mockResolvedValue([
        { kind: 'Datasource', spec: { name: 'PrometheusDatasource' } },
        { kind: 'Datasource', spec: { name: 'LokiDatasource' } },
      ]),
      getPlugin: vi.fn(({ name }: { name: string }) =>
        Promise.resolve(
          name === 'PrometheusDatasource'
            ? {
                getBuiltinVariableDefinitions: (): BuiltinVariableDefinition[] => [
                  builtinVariable('__interval', 'Prometheus'),
                  builtinVariable('__rate_interval', 'Prometheus'),
                ],
              }
            : {},
        ),
      ),
    } as unknown as PluginRegistryContextType;
    const builtinVariables = { variables: [dashboardVariable, contextVariable] };
    const queryClient = createQueryClient();

    const { result } = renderHook(() => useBuiltinVariableDefinitions(), {
      wrapper: ({ children }) => (
        <TestProviders registry={registry} builtinVariables={builtinVariables} queryClient={queryClient}>
          {children}
        </TestProviders>
      ),
    });

    expect(result.current).toEqual([dashboardVariable, contextVariable]);
    // The variables of the context win over the ones of the plugins with the same name.
    await waitFor(() =>
      expect(result.current.map((variable) => `${variable.spec.source}:${variable.spec.name}`)).toEqual([
        'Dashboard:__dashboard',
        'Context:__interval',
        'Prometheus:__rate_interval',
      ]),
    );
    expect(registry.getPlugin).toHaveBeenCalledTimes(2);
  });

  it('keeps the builtin variables of the datasource plugins that load when another one fails', async () => {
    const registry = {
      listPluginMetadata: vi.fn().mockResolvedValue([
        { kind: 'Datasource', spec: { name: 'BrokenDatasource' } },
        { kind: 'Datasource', spec: { name: 'PrometheusDatasource' } },
      ]),
      getPlugin: vi.fn(({ name }: { name: string }) =>
        name === 'BrokenDatasource'
          ? Promise.reject(new Error('Unable to load the plugin'))
          : Promise.resolve({
              getBuiltinVariableDefinitions: (): BuiltinVariableDefinition[] => [
                builtinVariable('__interval', 'Prometheus'),
              ],
            }),
      ),
    } as unknown as PluginRegistryContextType;
    const queryClient = createQueryClient();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useBuiltinVariableDefinitions(), {
      wrapper: ({ children }) => (
        <TestProviders registry={registry} builtinVariables={{ variables: [] }} queryClient={queryClient}>
          {children}
        </TestProviders>
      ),
    });

    await waitFor(() => expect(result.current.map((variable) => variable.spec.name)).toEqual(['__interval']));
    expect(warn).toHaveBeenCalledWith(
      "Unable to load the builtin variables of the datasource plugin 'BrokenDatasource'",
      expect.any(Error),
    );
    warn.mockRestore();
  });

  it('does not share the builtin variables of the datasource plugins between registries', async () => {
    const queryClient = createQueryClient();

    const renderWithRegistry = (registry: PluginRegistryContextType): { current: BuiltinVariableDefinition[] } =>
      renderHook(() => useBuiltinVariableDefinitions(), {
        wrapper: ({ children }) => (
          <TestProviders registry={registry} builtinVariables={{ variables: [] }} queryClient={queryClient}>
            {children}
          </TestProviders>
        ),
      }).result;

    const prometheus = renderWithRegistry(registryWithDatasource('Prometheus'));
    await waitFor(() => expect(prometheus.current.map((variable) => variable.spec.source)).toEqual(['Prometheus']));

    const loki = renderWithRegistry(registryWithDatasource('Loki'));
    await waitFor(() => expect(loki.current.map((variable) => variable.spec.source)).toEqual(['Loki']));
  });
});
