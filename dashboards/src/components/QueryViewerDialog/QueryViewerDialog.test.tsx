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
import { PanelDefinition, QueryDefinition } from '@perses-dev/spec';
import { TimeRangeProviderBasic, TimeSeriesQueryPlugin } from '@perses-dev/plugin-system';
import { ReactElement, useState } from 'react';
import { renderWithContext } from '../../test';
import { MOCK_PLUGINS } from '../../test/plugin-registry';
import { VariableProvider } from '../../context';
import { QueryViewerDialog } from './QueryViewerDialog';

const queryDefinitions: QueryDefinition[] = [
  {
    kind: 'TimeSeriesQuery',
    spec: { plugin: { kind: 'PrometheusTimeSeriesQuery', spec: { query: 'up' } } },
  },
];

const panelDefinition: PanelDefinition = {
  kind: 'Panel',
  spec: {
    display: { name: 'My Panel' },
    plugin: { kind: 'TimeSeriesChart', spec: {} },
    queries: queryDefinitions,
  },
};

function Harness({ withPanelDefinition = true }: { withPanelDefinition?: boolean }): ReactElement {
  const [open, setOpen] = useState(true);
  return (
    <TimeRangeProviderBasic initialTimeRange={{ pastDuration: '1h' }}>
      <VariableProvider>
        <button onClick={(): void => setOpen((prev) => !prev)}>toggle dialog</button>
        <QueryViewerDialog
          open={open}
          queryDefinitions={queryDefinitions}
          panelDefinition={withPanelDefinition ? panelDefinition : undefined}
          onClose={(): void => setOpen(false)}
        />
      </VariableProvider>
    </TimeRangeProviderBasic>
  );
}

describe('QueryViewerDialog', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders editable queries and a live panel preview when panelDefinition is provided', async () => {
    renderWithContext(<Harness />);

    expect(await screen.findByText('TimeSeriesChart panel')).toBeInTheDocument();
    const input = await screen.findByLabelText('query expression');
    expect(input).toHaveValue('up');
    expect(input).toBeEnabled();
    expect(await screen.findByTestId('run_query_button')).toBeInTheDocument();
  });

  it('runs an edited query against the preview without mutating the original definition', async () => {
    const timeSeriesQueryPlugin = MOCK_PLUGINS.find((plugin) => plugin.kind === 'TimeSeriesQuery');
    if (timeSeriesQueryPlugin?.kind !== 'TimeSeriesQuery') {
      throw new Error('missing TimeSeriesQuery mock plugin');
    }
    const getTimeSeriesDataSpy = jest.spyOn(timeSeriesQueryPlugin.plugin as TimeSeriesQueryPlugin, 'getTimeSeriesData');

    renderWithContext(<Harness />);
    const input = await screen.findByLabelText('query expression');
    userEvent.clear(input);
    userEvent.type(input, 'up == 1');
    userEvent.click(screen.getByTestId('run_query_button'));

    await waitFor(() => {
      const queriedSpecs = getTimeSeriesDataSpy.mock.calls.map((call) => call[0] as { query?: string });
      expect(queriedSpecs.some((spec) => spec.query === 'up == 1')).toBe(true);
    });
    // The panel's original definition must never be touched by playground edits.
    expect(queryDefinitions[0]?.spec.plugin.spec).toEqual({ query: 'up' });
  });

  it('drops edits when the dialog is closed and reopened', async () => {
    renderWithContext(<Harness />);
    const input = await screen.findByLabelText('query expression');
    userEvent.clear(input);
    userEvent.type(input, 'sum(up)');
    expect(input).toHaveValue('sum(up)');

    userEvent.click(screen.getByText('toggle dialog'));
    await waitFor(() => {
      expect(screen.queryByLabelText('query expression')).not.toBeInTheDocument();
    });
    userEvent.click(screen.getByText('toggle dialog'));

    expect(await screen.findByLabelText('query expression')).toHaveValue('up');
  });

  it('renders read-only queries when panelDefinition is not provided', async () => {
    renderWithContext(<Harness withPanelDefinition={false} />);

    const input = await screen.findByLabelText('query expression');
    expect(input).toBeDisabled();
    expect(screen.queryByText('TimeSeriesChart panel')).not.toBeInTheDocument();
  });
});
