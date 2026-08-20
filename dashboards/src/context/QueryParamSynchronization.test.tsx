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

import { TimeRangeProviderBasic } from '@perses-dev/plugin-system';
import { VariableDefinition } from '@perses-dev/spec';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { ReactElement } from 'react';

import { createDashboardProviderSpy, getTestDashboard, renderWithContext } from '../test';
import { DashboardProviderWithQueryParams } from './DashboardProvider/DashboardProviderWithQueryParams';
import {
  useVariableDefinitionActions,
  useVariableDefinitionStates,
  VariableProviderWithQueryParams,
} from './VariableProvider';

const variableDefinitions: VariableDefinition[] = [
  {
    kind: 'TextVariable',
    spec: {
      name: 'traceId',
      value: 'default-trace',
    },
  },
  {
    kind: 'ListVariable',
    spec: {
      name: 'instance',
      allowAllValue: false,
      allowMultiple: true,
      defaultValue: ['default-instance'],
      plugin: {
        kind: 'StaticListVariable',
        spec: {
          values: ['default-instance', 'first-instance', 'second-instance'],
        },
      },
    },
  },
];

function VariableValue(): ReactElement {
  const variables = useVariableDefinitionStates(['traceId']);
  return <div>{variables.traceId?.value}</div>;
}

function MultipleVariableValue(): ReactElement {
  const variables = useVariableDefinitionStates(['instance']);
  const { setVariableValue } = useVariableDefinitionActions();
  return (
    <>
      <div data-testid="instance-value">{JSON.stringify(variables.instance?.value)}</div>
      <button type="button" onClick={() => setVariableValue('instance', ['second-instance'])}>
        Update instance
      </button>
    </>
  );
}

describe('query parameter synchronization', () => {
  test('updates variable values when navigation changes query parameters', async () => {
    const history = createMemoryHistory({ initialEntries: ['/?var-traceId=first-trace'] });
    renderWithContext(
      <TimeRangeProviderBasic initialTimeRange={{ pastDuration: '30m' }}>
        <VariableProviderWithQueryParams initialVariableDefinitions={variableDefinitions}>
          <VariableValue />
        </VariableProviderWithQueryParams>
      </TimeRangeProviderBasic>,
      undefined,
      history,
    );

    expect(await screen.findByText('first-trace')).toBeInTheDocument();

    act(() => history.push('/?var-traceId=second-trace'));
    expect(await screen.findByText('second-trace')).toBeInTheDocument();

    act(() => history.push('/'));
    expect(await screen.findByText('default-trace')).toBeInTheDocument();
  });

  test('preserves array values for allowMultiple variables after URL synchronization', async () => {
    const history = createMemoryHistory({ initialEntries: ['/?var-instance=first-instance'] });
    renderWithContext(
      <TimeRangeProviderBasic initialTimeRange={{ pastDuration: '30m' }}>
        <VariableProviderWithQueryParams initialVariableDefinitions={variableDefinitions}>
          <MultipleVariableValue />
        </VariableProviderWithQueryParams>
      </TimeRangeProviderBasic>,
      undefined,
      history,
    );

    expect(await screen.findByText('["first-instance"]')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Update instance' }));

    await waitFor(() => expect(history.location.search).toContain('var-instance=second-instance'));
    expect(screen.getByTestId('instance-value')).toHaveTextContent('["second-instance"]');

    act(() => history.push('/'));
    expect(await screen.findByText('["default-instance"]')).toBeInTheDocument();

    act(() => history.push('/?var-instance=$__all'));
    expect(await screen.findByText('"$__all"')).toBeInTheDocument();
  });

  test('updates the viewed panel when navigation changes query parameters', async () => {
    const firstPanelRef = { ref: 'cpu' };
    const secondPanelRef = {
      ref: 'memory',
      repeatVariable: { panel: ['instance', 'demo'] as [string, string] },
    };
    const history = createMemoryHistory({
      initialEntries: [`/?viewPanelRef=${encodeURIComponent(JSON.stringify(firstPanelRef))}`],
    });
    const { DashboardProviderSpy, store } = createDashboardProviderSpy();

    renderWithContext(
      <DashboardProviderWithQueryParams initialState={{ dashboardResource: getTestDashboard() }}>
        <DashboardProviderSpy />
      </DashboardProviderWithQueryParams>,
      undefined,
      history,
    );

    await waitFor(() => expect(store.value?.getState().viewPanel.panelRef).toEqual(firstPanelRef));

    act(() => history.push(`/?viewPanelRef=${encodeURIComponent(JSON.stringify(secondPanelRef))}`));
    await waitFor(() => expect(store.value?.getState().viewPanel.panelRef).toEqual(secondPanelRef));

    act(() => history.push('/'));
    await waitFor(() => expect(store.value?.getState().viewPanel.panelRef).toBeUndefined());
  });

  test('preserves the viewed panel when its store update changes query parameters', async () => {
    const history = createMemoryHistory();
    const { DashboardProviderSpy, store } = createDashboardProviderSpy();

    renderWithContext(
      <DashboardProviderWithQueryParams initialState={{ dashboardResource: getTestDashboard() }}>
        <DashboardProviderSpy />
      </DashboardProviderWithQueryParams>,
      undefined,
      history,
    );

    const dashboardState = store.value?.getState();
    const panelGroup = Object.values(dashboardState?.panelGroups ?? {})[0];
    const panelGroupItemLayoutId = Object.keys(panelGroup?.itemPanelKeys ?? {})[0];
    if (!panelGroup || !panelGroupItemLayoutId) {
      throw new Error('Expected the test dashboard to contain a panel');
    }

    const panelGroupItemId = {
      panelGroupId: panelGroup.id,
      panelGroupItemLayoutId,
    };
    act(() => store.value?.getState().setViewPanel(panelGroupItemId));

    await waitFor(() => expect(history.location.search).toContain('viewPanelRef='));
    expect(store.value?.getState().viewPanel.panelGroupItemId).toEqual(panelGroupItemId);
  });
});
