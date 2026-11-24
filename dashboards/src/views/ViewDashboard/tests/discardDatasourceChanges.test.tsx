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

import type { DashboardResource } from '@perses-dev/client';
import { TimeRangeProviderBasic, useDatasourceStore } from '@perses-dev/plugin-system';
import type { DatasourceSpec } from '@perses-dev/spec';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import {
  AnnotationProvider,
  DashboardProvider,
  DatasourceStoreProvider,
  useDashboard,
  VariableProvider,
} from '../../../context';
import { defaultDatasourceProps, getTestDashboard, renderWithContext } from '../../../test';
import { DashboardApp } from '../DashboardApp';

// A dashboard without panels keeps the rendered tree small, so the test stays fast
function getDashboardWithoutPanels(): DashboardResource {
  const dashboard = getTestDashboard();
  return { ...dashboard, spec: { ...dashboard.spec, panels: {}, layouts: [] } };
}

const newDatasource: DatasourceSpec = {
  default: false,
  plugin: {
    kind: 'PrometheusDatasource',
    spec: { directUrl: 'http://localhost:9090' },
  },
};

// Applies a datasource change the same way the datasource editor does when its "Apply" button is clicked.
// The test plugin registry has no datasource plugin, so the editor itself cannot add one.
function ApplyNewDatasourceButton(): ReactElement {
  const { getLocalDatasources, setLocalDatasources, setSavedDatasources } = useDatasourceStore();
  const { dashboard, setDashboard } = useDashboard();

  const applyNewDatasource = (): void => {
    const datasources = { ...getLocalDatasources(), NewDatasource: newDatasource };
    setDashboard({ ...dashboard, spec: { ...dashboard.spec, datasources } });
    setSavedDatasources(datasources);
    setLocalDatasources(datasources);
  };

  return (
    <button type="button" onClick={applyNewDatasource}>
      Apply new datasource
    </button>
  );
}

function DashboardViewUnderTest(): ReactElement {
  const dashboardResource = getDashboardWithoutPanels();
  return (
    <DatasourceStoreProvider {...defaultDatasourceProps} dashboardResource={dashboardResource}>
      <TimeRangeProviderBasic initialRefreshInterval="0s" initialTimeRange={{ pastDuration: '30m' }}>
        <VariableProvider>
          <AnnotationProvider initialAnnotationSpecs={[]}>
            <DashboardProvider initialState={{ dashboardResource, isEditMode: false }}>
              <DashboardApp
                dashboardResource={dashboardResource}
                isReadonly={false}
                isVariableEnabled={true}
                isAnnotationEnabled={true}
                isDatasourceEnabled={true}
              />
              <ApplyNewDatasourceButton />
            </DashboardProvider>
          </AnnotationProvider>
        </VariableProvider>
      </TimeRangeProviderBasic>
    </DatasourceStoreProvider>
  );
}

describe('Discarding dashboard changes', () => {
  beforeAll(() => {
    // The toolbar only shows the "Edit" button on screens wider than the `sm` breakpoint.
    // Each test file runs in its own environment, so no teardown is needed.
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  it('rolls back datasources added in edit mode', async () => {
    renderWithContext(<DashboardViewUnderTest />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.click(screen.getByRole('button', { name: 'Apply new datasource' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Discard Changes' }));

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.click(screen.getByRole('button', { name: 'Edit datasources' }));
    const editor = await screen.findByTestId('datasource-editor');
    expect(within(editor).queryByRole('rowheader', { name: 'NewDatasource' })).not.toBeInTheDocument();
  }, 30_000);
});
