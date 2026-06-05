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

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeRangeProviderBasic } from '@perses-dev/plugin-system';
import { ReactElement, useState } from 'react';
import { useHotkeyRegistrations } from '@tanstack/react-hotkeys';
import { DashboardProvider, DatasourceStoreProvider, VariableProvider } from '../../../context';
import { defaultDatasourceProps, getTestDashboard, renderWithContext } from '../../../test';
import { DashboardApp } from '../DashboardApp';

function ShortcutRegistrationProbe(): ReactElement {
  const { hotkeys, sequences } = useHotkeyRegistrations();
  const categories = new Set<string>();

  hotkeys.forEach((registration) => {
    const category = registration.options.meta?.category;
    if (typeof category === 'string') {
      categories.add(category);
    }
  });

  sequences.forEach((registration) => {
    const category = registration.options.meta?.category;
    if (typeof category === 'string') {
      categories.add(category);
    }
  });

  return <div data-testid="registered-shortcut-categories">{Array.from(categories).sort().join(',')}</div>;
}

function DashboardViewUnderTest(): ReactElement {
  return (
    <DatasourceStoreProvider {...defaultDatasourceProps}>
      <TimeRangeProviderBasic initialRefreshInterval="0s" initialTimeRange={{ pastDuration: '30m' }}>
        <VariableProvider>
          <DashboardProvider initialState={{ dashboardResource: getTestDashboard(), isEditMode: false }}>
            <DashboardApp
              dashboardResource={getTestDashboard()}
              isReadonly={false}
              isVariableEnabled={true}
              isDatasourceEnabled={true}
            />
            <ShortcutRegistrationProbe />
          </DashboardProvider>
        </VariableProvider>
      </TimeRangeProviderBasic>
    </DatasourceStoreProvider>
  );
}

describe('Dashboard shortcuts registration', () => {
  it('registers dashboard, time-range, and focused-panel shortcuts when dashboard is mounted', async () => {
    renderWithContext(<DashboardViewUnderTest />);

    await waitFor(() => {
      const categories = screen.getByTestId('registered-shortcut-categories').textContent ?? '';
      expect(categories).toContain('dashboard');
      expect(categories).toContain('time-range');
      expect(categories).toContain('focused-panel');
    });
  });

  it('unregisters dashboard shortcuts when dashboard is unmounted', async () => {
    function ToggleDashboard(): ReactElement {
      const [isMounted, setIsMounted] = useState(true);

      return (
        <DatasourceStoreProvider {...defaultDatasourceProps}>
          <TimeRangeProviderBasic initialRefreshInterval="0s" initialTimeRange={{ pastDuration: '30m' }}>
            <VariableProvider>
              <DashboardProvider initialState={{ dashboardResource: getTestDashboard(), isEditMode: false }}>
                {isMounted && (
                  <DashboardApp
                    dashboardResource={getTestDashboard()}
                    isReadonly={false}
                    isVariableEnabled={true}
                    isDatasourceEnabled={true}
                  />
                )}
                <ShortcutRegistrationProbe />
                <button onClick={() => setIsMounted(false)} type="button">
                  Unmount Dashboard
                </button>
              </DashboardProvider>
            </VariableProvider>
          </TimeRangeProviderBasic>
        </DatasourceStoreProvider>
      );
    }

    renderWithContext(<ToggleDashboard />);

    await waitFor(() => {
      const categories = screen.getByTestId('registered-shortcut-categories').textContent ?? '';
      expect(categories).toContain('dashboard');
      expect(categories).toContain('time-range');
      expect(categories).toContain('focused-panel');
    });

    await userEvent.click(screen.getByRole('button', { name: 'Unmount Dashboard' }));

    await waitFor(() => {
      const categories = screen.getByTestId('registered-shortcut-categories').textContent ?? '';
      expect(categories).not.toContain('dashboard');
      expect(categories).not.toContain('time-range');
      expect(categories).not.toContain('focused-panel');
    });
  });
});
