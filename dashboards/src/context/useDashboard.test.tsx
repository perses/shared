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
import { TimeRangeProviderBasic } from '@perses-dev/plugin-system';
import { waitFor } from '@testing-library/react';

import { getTestDashboard, renderWithContext } from '../test';
import { DashboardProviderWithQueryParams } from './DashboardProvider/DashboardProviderWithQueryParams';
import { useDashboard } from './useDashboard';
import { VariableProviderWithQueryParams } from './VariableProvider';

const visibility = { variable: 'phase', operator: '!=' as const, value: ['PRD'] };
const initialTimeRange = { pastDuration: '30m' as const };
const captured: { dashboard?: DashboardResource } = {};

const testDashboard = getTestDashboard();
const [firstLayout] = testDashboard.spec.layouts;
if (firstLayout?.kind !== 'Grid') throw new Error('Test dashboard must start with a Grid layout');
const dashboardResource: DashboardResource = {
  ...testDashboard,
  spec: {
    ...testDashboard.spec,
    layouts: [
      { ...firstLayout, spec: { ...firstLayout.spec, display: { title: 'Workers', visibility } } },
      ...testDashboard.spec.layouts.slice(1),
    ],
  },
};
const initialState = { dashboardResource };

function capture(dashboard: DashboardResource): void {
  captured.dashboard = dashboard;
}

function DashboardCapture(): null {
  capture(useDashboard().dashboard as DashboardResource);
  return null;
}

describe('useDashboard layout visibility', () => {
  it('keeps the visibility of a grid layout when the dashboard is saved', async () => {
    renderWithContext(
      <TimeRangeProviderBasic initialTimeRange={initialTimeRange}>
        <VariableProviderWithQueryParams initialVariableDefinitions={dashboardResource.spec.variables}>
          <DashboardProviderWithQueryParams initialState={initialState}>
            <DashboardCapture />
          </DashboardProviderWithQueryParams>
        </VariableProviderWithQueryParams>
      </TimeRangeProviderBasic>,
    );

    await waitFor(() => expect(captured.dashboard).toBeDefined());
    const [savedLayout] = captured.dashboard?.spec.layouts ?? [];
    expect(savedLayout?.kind === 'Grid' && savedLayout.spec.display?.visibility).toEqual(visibility);
  });
});
