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
import { waitFor } from '@testing-library/react';
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

jest.mock('../../runtime', () => ({
  ...jest.requireActual('../../runtime'),
  usePlugin: jest.fn(),
  usePlugins: jest.fn(),
  useDatasourceStore: jest.fn().mockReturnValue({}),
  useAllVariableValues: jest.fn(),
  useTimeRange: jest.fn().mockReturnValue({
    absoluteTimeRange: { start: new Date('2023-01-01T00:00:00Z'), end: new Date('2023-01-02T00:00:00Z') },
    refreshKey: 'refresh-key',
  }),
}));

describe('useListVariablePluginValues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('should filter self variable from deps and ctx when dependsOn is not passed', () => {
    const variables: VariableStateMap = {
      NewVariable: { loading: false, value: [] },
      NewVariable2: { loading: false, value: [] },
      NewVariable3: { loading: false, value: [] },
    };

    const getVariableOptionsMock = jest.fn();

    (usePlugin as jest.Mock).mockReturnValue({
      data: { getVariableOptions: getVariableOptionsMock },
    });

    (useAllVariableValues as jest.Mock).mockImplementation((names?: string[]) =>
      names ? Object.fromEntries(Object.entries(variables).filter(([k]) => names.includes(k))) : variables
    );

    renderHookWithContext(() => useListVariablePluginValues(definition));

    const allVariablesWithoutSelf = Object.fromEntries(
      Object.entries(variables).filter(([key]) => key !== definition.spec.name)
    );

    const expectedCtx = {
      datasourceStore: {},
      variables: allVariablesWithoutSelf,
      timeRange: expect.any(Object),
    };

    expect(getVariableOptionsMock).toHaveBeenCalledWith(
      definition.spec.plugin.spec,
      expectedCtx,
      expect.any(AbortSignal)
    );
  });

  it('should filter self variable from deps and ctx when dependsOn is passed', () => {
    const getVariableOptionsMock = jest.fn();
    const variables: VariableStateMap = {
      NewVariable: { loading: false, value: [] },
      NewVariable2: { loading: false, value: [] },
      NewVariable3: { loading: false, value: [] },
      NewVariable4: { loading: false, value: [] },
    };

    const dependsOnVariables = Object.keys(variables).slice(0, 2);

    (usePlugin as jest.Mock).mockReturnValue({
      data: {
        getVariableOptions: getVariableOptionsMock,
        dependsOn: jest.fn().mockReturnValue({ variables: dependsOnVariables }),
      },
    });

    (useAllVariableValues as jest.Mock).mockImplementation((names?: string[]) =>
      names ? Object.fromEntries(Object.entries(variables).filter(([k]) => names.includes(k))) : variables
    );

    renderHookWithContext(() => useListVariablePluginValues(definition));

    const allVariableDepsWithoutSelf = Object.fromEntries(
      Object.entries(variables).filter(([key]) => dependsOnVariables.includes(key) && key !== definition.spec.name)
    );

    const expectedCtx = {
      datasourceStore: {},
      variables: allVariableDepsWithoutSelf,
      timeRange: expect.any(Object),
    };

    expect(getVariableOptionsMock).toHaveBeenCalledWith(
      definition.spec.plugin.spec,
      expectedCtx,
      expect.any(AbortSignal)
    );
  });
});

describe('useResolveListVariableValues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    (useAllVariableValues as jest.Mock).mockImplementation((names?: string[]) =>
      names ? Object.fromEntries(Object.entries(variables).filter(([k]) => names.includes(k))) : variables
    );
  }

  it('should resolve independent variables and return their default values', async () => {
    const definitions: VariableDefinition[] = [makeDefinition('VarA'), makeDefinition('VarB')];

    const getVariableOptionsMock = jest.fn().mockResolvedValue({
      data: [
        { label: 'opt1', value: 'opt1' },
        { label: 'opt2', value: 'opt2' },
      ],
    });

    (usePlugins as jest.Mock).mockReturnValue(
      definitions.map(() => ({
        data: { getVariableOptions: getVariableOptionsMock },
        isLoading: false,
      }))
    );

    mockOuterVariables({});

    const { result } = renderHookWithContext(() => useResolveListVariableValues(definitions));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.initialValues).toEqual({
      VarA: 'opt1',
      VarB: 'opt1',
    });
  });

  it('should resolve dependent variable after its dependency resolves', async () => {
    const varA = makeDefinition('VarA');
    const varB = makeDefinition('VarB');
    const definitions: VariableDefinition[] = [varA, varB];

    const getOptionsA = jest.fn().mockResolvedValue({
      data: [{ label: 'a1', value: 'a1' }],
    });
    const getOptionsB = jest.fn().mockResolvedValue({
      data: [{ label: 'b1', value: 'b1' }],
    });

    // VarB depends on VarA
    (usePlugins as jest.Mock).mockReturnValue([
      {
        data: { getVariableOptions: getOptionsA },
        isLoading: false,
      },
      {
        data: {
          getVariableOptions: getOptionsB,
          dependsOn: jest.fn().mockReturnValue({ variables: ['VarA'] }),
        },
        isLoading: false,
      },
    ]);

    mockOuterVariables({});

    const { result } = renderHookWithContext(() => useResolveListVariableValues(definitions));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getOptionsA).toHaveBeenCalled();
    expect(getOptionsB).toHaveBeenCalled();
    expect(result.current.initialValues).toEqual({
      VarA: 'a1',
      VarB: 'b1',
    });
  });

  it('should not fetch when a dependency is still loading', () => {
    const varA = makeDefinition('VarA');
    const varB = makeDefinition('VarB');
    const definitions: VariableDefinition[] = [varA, varB];

    const getOptionsB = jest.fn().mockResolvedValue({ data: [] });
    (usePlugins as jest.Mock).mockReturnValue([
      { data: undefined, isLoading: true },
      {
        data: {
          getVariableOptions: getOptionsB,
          dependsOn: jest.fn().mockReturnValue({ variables: ['VarA'] }),
        },
        isLoading: false,
      },
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

    const getOptionsB = jest.fn().mockResolvedValue({
      data: [{ label: 'b1', value: 'b1' }],
    });

    (usePlugins as jest.Mock).mockReturnValue([
      {
        data: {
          getVariableOptions: getOptionsB,
          dependsOn: jest.fn().mockReturnValue({ variables: ['VarA'] }),
        },
        isLoading: false,
      },
    ]);

    mockOuterVariables(outerVariables);

    const { result } = renderHookWithContext(() => useResolveListVariableValues(definitions));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getOptionsB).toHaveBeenCalled();
    expect(result.current.initialValues).toEqual({
      VarB: 'b1',
    });
  });

  it('should handle multiple variables depending on the same resolved parent', async () => {
    const varA = makeDefinition('VarA');
    const varB = makeDefinition('VarB');
    const varC = makeDefinition('VarC');
    const definitions: VariableDefinition[] = [varA, varB, varC];

    const getOptionsA = jest.fn().mockResolvedValue({ data: [{ label: 'a1', value: 'a1' }] });
    const getOptionsB = jest.fn().mockResolvedValue({ data: [{ label: 'b1', value: 'b1' }] });
    const getOptionsC = jest.fn().mockResolvedValue({ data: [{ label: 'c1', value: 'c1' }] });

    (usePlugins as jest.Mock).mockReturnValue([
      { data: { getVariableOptions: getOptionsA }, isLoading: false },
      {
        data: {
          getVariableOptions: getOptionsB,
          dependsOn: jest.fn().mockReturnValue({ variables: ['VarA'] }),
        },
        isLoading: false,
      },
      {
        data: {
          getVariableOptions: getOptionsC,
          dependsOn: jest.fn().mockReturnValue({ variables: ['VarA'] }),
        },
        isLoading: false,
      },
    ]);

    mockOuterVariables({});

    const { result } = renderHookWithContext(() => useResolveListVariableValues(definitions));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.initialValues).toEqual({
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

    const getOptionsA = jest.fn().mockResolvedValue({ data: [{ label: 'a1', value: 'a1' }] });
    const getOptionsB = jest.fn().mockResolvedValue({ data: [{ label: 'b1', value: 'b1' }] });
    const getOptionsC = jest.fn().mockResolvedValue({ data: [{ label: 'c1', value: 'c1' }] });

    // A → B → C chain
    (usePlugins as jest.Mock).mockReturnValue([
      { data: { getVariableOptions: getOptionsA }, isLoading: false },
      {
        data: {
          getVariableOptions: getOptionsB,
          dependsOn: jest.fn().mockReturnValue({ variables: ['VarA'] }),
        },
        isLoading: false,
      },
      {
        data: {
          getVariableOptions: getOptionsC,
          dependsOn: jest.fn().mockReturnValue({ variables: ['VarB'] }),
        },
        isLoading: false,
      },
    ]);

    mockOuterVariables({});

    const { result } = renderHookWithContext(() => useResolveListVariableValues(definitions));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.initialValues).toEqual({
      VarA: 'a1',
      VarB: 'b1',
      VarC: 'c1',
    });

    expect(getOptionsA).toHaveBeenCalled();
    expect(getOptionsB).toHaveBeenCalled();
    expect(getOptionsC).toHaveBeenCalled();
  });
});
