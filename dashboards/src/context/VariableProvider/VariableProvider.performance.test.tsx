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

import type * as PluginSystem from '@perses-dev/plugin-system';
import { TimeRangeProviderBasic, useVariableValues } from '@perses-dev/plugin-system';
import type { VariableDefinition } from '@perses-dev/spec';
import { DEFAULT_ALL_VALUE } from '@perses-dev/spec';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { Suspense, useState } from 'react';

import { Variable } from '../../components/Variables/Variable';
import type * as QueryParams from './query-params';
import {
  useVariableDefinitionStoreCtx,
  useVariableDefinitionActions,
  useVariableDefinitionAndState,
  useVariableDefinitionStates,
  VariableProvider,
  VariableProviderWithQueryParams,
} from './VariableProvider';

const options = [
  { value: 'dev', label: 'Development' },
  { value: 'prod', label: 'Production' },
];
const variableQuery = { data: options, isFetching: false };
vi.mock('@perses-dev/plugin-system', async (importOriginal) => ({
  ...(await importOriginal<typeof PluginSystem>()),
  useListVariablePluginValues: (): typeof variableQuery => variableQuery,
}));

const setQueryParams = vi.fn();
const emptyQueryValues = {};
vi.mock('./query-params', async (importOriginal) => ({
  ...(await importOriginal<typeof QueryParams>()),
  useVariableQueryParams: (): ReturnType<typeof QueryParams.useVariableQueryParams> => [
    emptyQueryValues,
    setQueryParams,
  ],
}));
const chartFallback = <div>Loading chart</div>;

const definitions: VariableDefinition[] = [
  { kind: 'TextVariable', spec: { name: 'region', value: 'west' } },
  {
    kind: 'ListVariable',
    spec: {
      name: 'environment',
      defaultValue: 'dev',
      allowAllValue: true,
      allowMultiple: false,
      plugin: { kind: 'StaticListVariable', spec: {} },
    },
  },
];
const initialTimeRange = { pastDuration: '30m' } as const;

function Wrapper({ children, queryParams = false }: { children: ReactNode; queryParams?: boolean }): ReactElement {
  const Provider = queryParams ? VariableProviderWithQueryParams : VariableProvider;
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <TimeRangeProviderBasic initialTimeRange={initialTimeRange}>
        <Provider initialVariableDefinitions={definitions}>{children}</Provider>
      </TimeRangeProviderBasic>
    </QueryClientProvider>
  );
}

function QueryParamsWrapper({ children }: { children: ReactNode }): ReactElement {
  return <Wrapper queryParams>{children}</Wrapper>;
}

function SlowVariableConsumer({ read }: { read: (value: string) => void }): ReactElement {
  const values = useVariableValues();
  const value = values.environment?.value as string;
  read(value);
  return <div>Chart: {value}</div>;
}

it('does not notify subscribers or rewrite the URL for identical normalized values', () => {
  setQueryParams.mockClear();
  const { result } = renderHook(() => useVariableDefinitionStoreCtx(), { wrapper: QueryParamsWrapper });
  const store = result.current;
  const onChange = vi.fn();
  store.subscribe(onChange);
  const actions = store.getState();

  act(() => actions.setVariableValue('environment', 'dev'));
  expect(onChange).not.toHaveBeenCalled();
  expect(setQueryParams).not.toHaveBeenCalled();

  act(() => actions.setVariableValue('environment', ['prod']));
  act(() => actions.setVariableValue('environment', ['prod']));
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(setQueryParams).toHaveBeenCalledTimes(1);

  act(() => actions.setVariableValue('environment', ['prod', DEFAULT_ALL_VALUE]));
  act(() => actions.setVariableValue('environment', [DEFAULT_ALL_VALUE]));
  expect(store.getState().variableState.get({ name: 'environment' })?.value).toBe(DEFAULT_ALL_VALUE);
  expect(onChange).toHaveBeenCalledTimes(2);
  expect(setQueryParams).toHaveBeenCalledTimes(2);

  act(() => actions.setVariableValue('environment', [DEFAULT_ALL_VALUE, 'prod']));
  expect(store.getState().variableState.get({ name: 'environment' })?.value).toEqual(['prod']);
  expect(setQueryParams).toHaveBeenLastCalledWith({ 'var-environment': ['prod'] });
});

it('does not publish identical options or loading state again', () => {
  const { result } = renderHook(() => useVariableDefinitionStoreCtx(), { wrapper: Wrapper });
  const store = result.current;
  const actions = store.getState();
  act(() => actions.setVariableOptions('environment', options));
  const previous = store.getState();
  const onChange = vi.fn();
  store.subscribe(onChange);

  act(() =>
    actions.setVariableOptions(
      'environment',
      options.map((option) => Object.assign({}, option)),
    ),
  );
  act(() => actions.setVariableLoading('environment', false));
  expect(store.getState()).toBe(previous);
  expect(onChange).not.toHaveBeenCalled();

  act(() => actions.setVariableOptions('environment', [{ value: 'dev', label: 'Renamed development' }]));
  expect(onChange).toHaveBeenCalledTimes(1);
});

it('keeps unrelated input and variable-state subscriptions unchanged', () => {
  const { result } = renderHook(
    () => ({
      variable: useVariableDefinitionAndState('environment'),
      states: useVariableDefinitionStates(['environment']),
      actions: useVariableDefinitionActions(),
    }),
    { wrapper: Wrapper },
  );
  const previous = result.current;

  act(() => result.current.actions.setVariableValue('region', 'east'));
  expect(result.current).toBe(previous);

  act(() => result.current.actions.setVariableValue('environment', 'prod'));
  expect(result.current.variable.state?.value).toBe('prod');
  expect(result.current.states.environment?.value).toBe('prod');
});

it('updates the selected input while a chart is still rendering the new variable value', async () => {
  let ready = false;
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const read = vi.fn((value: string): void => {
    if (value === 'prod' && !ready) throw pending;
  });
  render(
    <Wrapper>
      <Variable name="environment" />
      <Suspense fallback={chartFallback}>
        <SlowVariableConsumer read={read} />
      </Suspense>
    </Wrapper>,
  );
  const input = screen.getByRole('combobox', { name: 'environment' });
  expect(input).toHaveValue('Development');
  const initialReads = read.mock.calls.filter(([value]) => value === 'dev').length;
  fireEvent.mouseDown(input);
  fireEvent.click(screen.getByRole('option', { name: 'Production' }));

  expect(input).toHaveValue('Production');
  expect(read.mock.calls.filter(([value]) => value === 'dev')).toHaveLength(initialReads);
  expect(screen.getByText('Chart: dev')).toBeInTheDocument();
  expect(screen.queryByText('Loading chart')).not.toBeInTheDocument();

  await act(async () => {
    ready = true;
    finish();
    await pending;
  });
  expect(screen.getByText('Chart: prod')).toBeInTheDocument();
});
