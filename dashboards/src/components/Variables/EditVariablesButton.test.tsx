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

import type { PluginRegistryContextType } from '@perses-dev/plugin-system';
import { PluginRegistryContext, TimeRangeProviderBasic } from '@perses-dev/plugin-system';
import type { BuiltinVariableDefinition } from '@perses-dev/spec';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';

import { DashboardProvider, VariableProvider } from '../../context';
import { getTestDashboard, renderWithContext } from '../../test';
import { EditVariablesButton } from './EditVariablesButton';

const DATASOURCE_BUILTIN_VARIABLE: BuiltinVariableDefinition = {
  kind: 'BuiltinVariable',
  spec: {
    name: '__datasource_builtin',
    value: () => '$__datasource_builtin',
    source: 'Fake Datasource',
    display: { name: '__datasource_builtin', hidden: true },
  },
};

function WithRegistry({
  registry,
  children,
}: {
  registry: PluginRegistryContextType;
  children: ReactNode;
}): ReactElement {
  return <PluginRegistryContext.Provider value={registry}>{children}</PluginRegistryContext.Provider>;
}

describe('EditVariablesButton', () => {
  it('only loads the builtin variables of the datasource plugins when the variable editor is opened', async () => {
    const getBuiltinVariableDefinitions = vi.fn(() => [DATASOURCE_BUILTIN_VARIABLE]);
    let resolvePlugin!: (plugin: unknown) => void;
    const plugin = new Promise((resolve) => {
      resolvePlugin = resolve;
    });
    const registry = {
      getPlugin: vi.fn(() => plugin),
      listPluginMetadata: vi.fn().mockResolvedValue([{ kind: 'Datasource', spec: { name: 'FakeDatasource' } }]),
    } as unknown as PluginRegistryContextType;

    renderWithContext(
      <WithRegistry registry={registry}>
        <TimeRangeProviderBasic initialTimeRange={{ pastDuration: '1h' }}>
          <VariableProvider>
            <DashboardProvider initialState={{ dashboardResource: getTestDashboard(), isEditMode: true }}>
              <EditVariablesButton />
            </DashboardProvider>
          </VariableProvider>
        </TimeRangeProviderBasic>
      </WithRegistry>,
    );

    // Give a chance to an eager load to happen.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(registry.listPluginMetadata).not.toHaveBeenCalled();
    expect(registry.getPlugin).not.toHaveBeenCalled();

    userEvent.click(screen.getByRole('button', { name: 'Edit variables' }));

    expect(await screen.findByLabelText('Loading built-in variables')).toBeInTheDocument();
    await waitFor(() =>
      expect(registry.getPlugin).toHaveBeenCalledWith({ kind: 'Datasource', name: 'FakeDatasource' }),
    );

    resolvePlugin({ getBuiltinVariableDefinitions });

    expect(await screen.findByText('Fake Datasource Built-in Variables')).toBeInTheDocument();
    expect(screen.queryByLabelText('Loading built-in variables')).not.toBeInTheDocument();
    expect(getBuiltinVariableDefinitions).toHaveBeenCalled();
  });
});
