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

import type * as PluginSystemModule from '@perses-dev/plugin-system';
import type { DataQueriesProviderProps } from '@perses-dev/plugin-system';
import type { PanelDefinition, QueryDefinition } from '@perses-dev/spec';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { useInView } from 'react-intersection-observer';

import { GridItemContent } from './GridItemContent';

const queries: QueryDefinition[] = [
  { kind: 'TimeSeriesQuery', spec: { plugin: { kind: 'PrometheusTimeSeriesQuery', spec: { query: 'up' } } } },
];
const panel: PanelDefinition = {
  kind: 'Panel',
  spec: { display: { name: 'Panel' }, plugin: { kind: 'TimeSeriesChart', spec: {} }, queries },
};
const receivedDefinitions: QueryDefinition[][] = [];

vi.mock('react-intersection-observer', () => ({ useInView: vi.fn() }));

vi.mock('@perses-dev/plugin-system', async () => {
  const actual = await vi.importActual<typeof PluginSystemModule>('@perses-dev/plugin-system');
  return {
    ...actual,
    usePlugin: vi.fn(() => ({ data: undefined })),
    useSuggestedStepMs: vi.fn(() => 1000),
    DataQueriesProvider: ({ definitions, children }: DataQueriesProviderProps): ReactElement => {
      receivedDefinitions.push(definitions as QueryDefinition[]);
      return <div>{children}</div>;
    },
  };
});

vi.mock('../../context', () => ({
  usePanel: vi.fn(() => panel),
  useEditMode: vi.fn(() => ({ isEditMode: false })),
  usePanelActions: vi.fn(() => ({})),
  useViewPanelGroup: vi.fn(() => undefined),
}));
vi.mock('../../keyboard-shortcuts', () => ({ usePanelFocusHandlers: vi.fn(() => ({})) }));
vi.mock('../Panel', () => ({ Panel: (): ReactElement => <div>panel</div> }));
vi.mock('../QueryViewerDialog', () => ({ QueryViewerDialog: (): null => null }));

function mockInView(inView: boolean): void {
  vi.mocked(useInView).mockReturnValue({ ref: vi.fn(), inView } as unknown as ReturnType<typeof useInView>);
}

function renderGridItemContent(): ReactElement {
  return <GridItemContent panelGroupItemId={{ panelGroupId: 0, panelGroupItemLayoutId: 'panel' }} width={600} />;
}

describe('GridItemContent', () => {
  beforeEach(() => {
    receivedDefinitions.length = 0;
  });

  it('does not register the queries of a panel never displayed', () => {
    mockInView(false);
    render(renderGridItemContent());
    expect(receivedDefinitions.at(-1)).toEqual([]);
  });

  it('registers the queries of a panel once it is displayed', () => {
    mockInView(false);
    const { rerender } = render(renderGridItemContent());
    mockInView(true);
    rerender(renderGridItemContent());
    expect(receivedDefinitions.at(-1)).toBe(queries);
  });
});
