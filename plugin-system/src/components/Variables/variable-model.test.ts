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

import {
  useAllVariableValues,
  usePlugin,
  usePlugins,
  VariableOption,
  VariableStateMap,
} from '@perses-dev/plugin-system';
import { ListVariableDefinition, VariableDefinition } from '@perses-dev/spec';
import type { UseQueryResult } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';

import type { VariablePlugin } from '../../model';
import { renderHookWithContext } from '../../test/render-hook';
import { filterVariableList, useListVariablePluginValues, useResolveListVariableValues } from './variable-model';

describe('filterVariableList', () => {
  const testSuite = [
    {
      title: 'basic case',
      capturingRegexp: /([^-]*)-host-([^-]*)/g,
      originalValues: [
        { label: 'l1', value: 'us1-host-ahdix' },
        { label: 'l2', value: 'us1-host-diua' },
        { label: 'l3', value: 'eu1-host-adf' },
        { label: 'l4', value: 'bar' },
      ] as VariableOption[],
      result: [
        { label: 'l1', value: 'us1ahdix' },
        { label: 'l2', value: 'us1diua' },
        { label: 'l3', value: 'eu1adf' },
      ],
    },
    {
      title: 'duplicate captured value',
      capturingRegexp: /prometheus-(.+):\d+/g,
      originalValues: [
        { label: 'l1', value: 'prometheus-app:9090' },
        { label: 'l2', value: 'prometheus-app:9091' },
        { label: 'l3', value: 'prometheus-platform:9091' },
        { label: 'l4', value: 'prometheus-database:9091' },
        { label: 'l5', value: 'prometheus-perses:9091' },
      ] as VariableOption[],
      result: [
        { label: 'l1', value: 'app' },
        { label: 'l3', value: 'platform' },
        { label: 'l4', value: 'database' },
        { label: 'l5', value: 'perses' },
      ],
    },
  ];
  testSuite.forEach(({ title, capturingRegexp, originalValues, result }) => {
    it(title, () => {
      expect(filterVariableList(originalValues, capturingRegexp)).toEqual(result);
    });
  });
});

function makeVariablePlugin(overrides: Partial<VariablePlugin> = {}): VariablePlugin {
  return {
    createInitialOptions: () => ({}),
    getVariableOptions: vi.fn().mockResolvedValue({ data: [] }),
    ...overrides,
  };
}

function makePluginQueryResult(
  data: VariablePlugin | undefined,
  isLoading = false,
): UseQueryResult<VariablePlugin, Error> {
  return {
    data,
    isLoading,
  } as UseQueryResult<VariablePlugin, Error>;
}

vi.mock('../../runtime', async () => {
  const actual = await vi.importActual<typeof import('../../runtime')>('../../runtime');
  return {
    ...actual,
    usePlugin: vi.fn(),
    usePlugins: vi.fn(),
    useDatasourceStore: vi.fn().mockReturnValue({}),
    useAllVariableValues: vi.fn(),
    useTimeRange: vi.fn().mockReturnValue({
      absoluteTimeRange: { start: new Date('2023-01-01T00:00:00Z'), end: new Date('2023-01-02T00:00:00Z') },
      refreshKey: 'refresh-key',
    }),
  };
});

describe('useListVariablePluginValues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const definition: ListVariableDefinition = {
    kind: 'ListVariable',
    spec: {
      name: 'NewVariable',
      display: {},
      allowAllValue: false,
      allowMultiple: false,
      plugin: {
        kind: 'PrometheusLabelNamesVariable',
        spec: {},
      },
    },
  };

  it('should default to empty dependency array when dependsOn is not passed', () => {
    const variables: VariableStateMap = {
      NewVariable: { loading: false, value: [] },
      NewVariable2: { loading: false, value: [] },
      NewVariable3: { loading: false, value: [] },
    };

    const getVariableOptionsMock = vi.fn();

    vi.mocked(usePlugin).mockReturnValue(
      makePluginQueryResult(makeVariablePlugin({ getVariableOptions: getVariableOptionsMock })),
    );

    vi.mocked(useAllVariableValues).mockImplementation((names?: string[]) =>
      names ? Object.fromEntries(Object.entries(variables).filter(([k]) => names.includes(k))) : variables,
    );

    renderHookWithContext(() => useListVariablePluginValues(definition));

    const expectedCtx = {
      datasourceStore: {},
      variables: {},
      timeRange: expect.any(Object),
    };

    expect(getVariableOptionsMock).toHaveBeenCalledWith(
      definition.spec.plugin.spec,
      expectedCtx,
      expect.any(AbortSignal),
    );
  });

  it('should filter self variable from deps and ctx when dependsOn is passed', () => {
    const getVariableOptionsMock = vi.fn();
    const variables: VariableStateMap = {
      NewVariable: { loading: false, value: [] },
      NewVariable2: { loading: false, value: [] },
      NewVariable3: { loading: false, value: [] },
      NewVariable4: { loading: false, value: [] },
    };

    const dependsOnVariables = Object.keys(variables).slice(0, 2);

    vi.mocked(usePlugin).mockReturnValue(
      makePluginQueryResult(
        makeVariablePlugin({
          getVariableOptions: getVariableOptionsMock,
          dependsOn: vi.fn().mockReturnValue({ variables: dependsOnVariables }),
        }),
      ),
    );

    vi.mocked(useAllVariableValues).mockImplementation((names?: string[]) =>
      names ? Object.fromEntries(Object.entries(variables).filter(([k]) => names.includes(k))) : variables,
    );

    renderHookWithContext(() => useListVariablePluginValues(definition));

    const allVariableDepsWithoutSelf = Object.fromEntries(
      Object.entries(variables).filter(([key]) => dependsOnVariables.includes(key) && key !== definition.spec.name),
    );

    const expectedCtx = {
      datasourceStore: {},
      variables: allVariableDepsWithoutSelf,
      timeRange: expect.any(Object),
    };

    expect(getVariableOptionsMock).toHaveBeenCalledWith(
      definition.spec.plugin.spec,
      expectedCtx,
      expect.any(AbortSignal),
    );
  });
});

describe('useResolveListVariableValues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeDefinition(name: string, pluginKind = 'PrometheusLabelValuesVariable'): ListVariableDefinition {
    return {
      kind: 'ListVariable',
      spec: {
        name,
        display: {},
        allowAllValue: false,
        allowMultiple: false,
        plugin: { kind: pluginKind, spec: {} },
      },
    };
  }

  function mockOuterVariables(variables: VariableStateMap): void {
    vi.mocked(useAllVariableValues).mockImplementation((names?: string[]) =>
      names ? Object.fromEntries(Object.entries(variables).filter(([k]) => names.includes(k))) : variables,
    );
  }

  it('should resolve independent variables and return their default values', async () => {
    const definitions: VariableDefinition[] = [makeDefinition('VarA'), makeDefinition('VarB')];

    const getVariableOptionsMock = vi.fn().mockResolvedValue({
      data: [
        { label: 'opt1', value: 'opt1' },
        { label: 'opt2', value: 'opt2' },
      ],
    });

    vi.mocked(usePlugins).mockReturnValue(
      definitions.map(() => makePluginQueryResult(makeVariablePlugin({ getVariableOptions: getVariableOptionsMock }))),
    );

    mockOuterVariables({});

    const { result } = renderHookWithContext(() => useResolveListVariableValues(definitions));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.initialVariableValues).toEqual({
      VarA: 'opt1',
      VarB: 'opt1',
    });
  });

  it('should resolve dependent variable after its dependency resolves', async () => {
    const varA = makeDefinition('VarA');
    const varB = makeDefinition('VarB');
    const definitions: VariableDefinition[] = [varA, varB];

    const getOptionsA = vi.fn().mockResolvedValue({
      data: [{ label: 'a1', value: 'a1' }],
    });
    const getOptionsB = vi.fn().mockResolvedValue({
      data: [{ label: 'b1', value: 'b1' }],
    });

    // VarB depends on VarA
    vi.mocked(usePlugins).mockReturnValue([
      makePluginQueryResult(makeVariablePlugin({ getVariableOptions: getOptionsA })),
      makePluginQueryResult(
        makeVariablePlugin({
          getVariableOptions: getOptionsB,
          dependsOn: vi.fn().mockReturnValue({ variables: ['VarA'] }),
        }),
      ),
    ]);

    mockOuterVariables({});

    const { result } = renderHookWithContext(() => useResolveListVariableValues(definitions));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getOptionsA).toHaveBeenCalled();
    expect(getOptionsB).toHaveBeenCalled();
    expect(result.current.initialVariableValues).toEqual({
      VarA: 'a1',
      VarB: 'b1',
    });
  });

  it('should not fetch when a dependency is still loading', () => {
    const varA = makeDefinition('VarA');
    const varB = makeDefinition('VarB');
    const definitions: VariableDefinition[] = [varA, varB];

    const getOptionsB = vi.fn().mockResolvedValue({ data: [] });
    vi.mocked(usePlugins).mockReturnValue([
      makePluginQueryResult(undefined, true),
      makePluginQueryResult(
        makeVariablePlugin({
          getVariableOptions: getOptionsB,
          dependsOn: vi.fn().mockReturnValue({ variables: ['VarA'] }),
        }),
      ),
    ]);

    mockOuterVariables({});

    const { result } = renderHookWithContext(() => useResolveListVariableValues(definitions));

    expect(result.current.isLoading).toBe(true);
    expect(getOptionsB).not.toHaveBeenCalled();
  });

  it('should resolve dependent variables when parent is provided', async () => {
    const definitions: VariableDefinition[] = [makeDefinition('VarB')];

    const outerVariables: VariableStateMap = {
      VarA: { loading: false, value: 'outer-a' },
    };

    const getOptionsB = vi.fn().mockResolvedValue({
      data: [{ label: 'b1', value: 'b1' }],
    });

    vi.mocked(usePlugins).mockReturnValue([
      makePluginQueryResult(
        makeVariablePlugin({
          getVariableOptions: getOptionsB,
          dependsOn: vi.fn().mockReturnValue({ variables: ['VarA'] }),
        }),
      ),
    ]);

    mockOuterVariables(outerVariables);

    const { result } = renderHookWithContext(() => useResolveListVariableValues(definitions));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getOptionsB).toHaveBeenCalled();
    expect(result.current.initialVariableValues).toEqual({
      VarA: 'outer-a',
      VarB: 'b1',
    });
  });

  it('should handle multiple variables depending on the same resolved parent', async () => {
    const varA = makeDefinition('VarA');
    const varB = makeDefinition('VarB');
    const varC = makeDefinition('VarC');
    const definitions: VariableDefinition[] = [varA, varB, varC];

    const getOptionsA = vi.fn().mockResolvedValue({ data: [{ label: 'a1', value: 'a1' }] });
    const getOptionsB = vi.fn().mockResolvedValue({ data: [{ label: 'b1', value: 'b1' }] });
    const getOptionsC = vi.fn().mockResolvedValue({ data: [{ label: 'c1', value: 'c1' }] });

    vi.mocked(usePlugins).mockReturnValue([
      makePluginQueryResult(makeVariablePlugin({ getVariableOptions: getOptionsA })),
      makePluginQueryResult(
        makeVariablePlugin({
          getVariableOptions: getOptionsB,
          dependsOn: vi.fn().mockReturnValue({ variables: ['VarA'] }),
        }),
      ),
      makePluginQueryResult(
        makeVariablePlugin({
          getVariableOptions: getOptionsC,
          dependsOn: vi.fn().mockReturnValue({ variables: ['VarA'] }),
        }),
      ),
    ]);

    mockOuterVariables({});

    const { result } = renderHookWithContext(() => useResolveListVariableValues(definitions));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.initialVariableValues).toEqual({
      VarA: 'a1',
      VarB: 'b1',
      VarC: 'c1',
    });
  });

  it('should handle a chain of three dependent variables in order', async () => {
    const varA = makeDefinition('VarA');
    const varB = makeDefinition('VarB');
    const varC = makeDefinition('VarC');
    const definitions: VariableDefinition[] = [varA, varB, varC];

    const getOptionsA = vi.fn().mockResolvedValue({ data: [{ label: 'a1', value: 'a1' }] });
    const getOptionsB = vi.fn().mockResolvedValue({ data: [{ label: 'b1', value: 'b1' }] });
    const getOptionsC = vi.fn().mockResolvedValue({ data: [{ label: 'c1', value: 'c1' }] });

    // A → B → C chain
    vi.mocked(usePlugins).mockReturnValue([
      makePluginQueryResult(makeVariablePlugin({ getVariableOptions: getOptionsA })),
      makePluginQueryResult(
        makeVariablePlugin({
          getVariableOptions: getOptionsB,
          dependsOn: vi.fn().mockReturnValue({ variables: ['VarA'] }),
        }),
      ),
      makePluginQueryResult(
        makeVariablePlugin({
          getVariableOptions: getOptionsC,
          dependsOn: vi.fn().mockReturnValue({ variables: ['VarB'] }),
        }),
      ),
    ]);

    mockOuterVariables({});

    const { result } = renderHookWithContext(() => useResolveListVariableValues(definitions));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.initialVariableValues).toEqual({
      VarA: 'a1',
      VarB: 'b1',
      VarC: 'c1',
    });

    expect(getOptionsA).toHaveBeenCalled();
    expect(getOptionsB).toHaveBeenCalled();
    expect(getOptionsC).toHaveBeenCalled();
  });
});
