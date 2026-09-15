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

import type { QueryPluginType } from '@perses-dev/spec';
import { render, waitFor, cleanup } from '@testing-library/react';

import { MultiQueryEditor } from './MultiQueryEditor';

// Resolve the default query plugin so useDefaultQueryDefinition() can build a
// complete default query definition (kind + plugin kind + initial options).
vi.mock('../../runtime', () => ({
  useListPluginMetadata: vi.fn(() => ({
    data: [{ kind: 'AlertsQuery', spec: { name: 'AlertManagerAlertsQuery' } }],
    isLoading: false,
  })),
  usePlugin: vi.fn(() => ({
    data: { createInitialOptions: (): { active: boolean } => ({ active: true }) },
    isLoading: false,
  })),
  usePluginRegistry: vi.fn(() => ({ defaultPluginKinds: { AlertsQuery: 'AlertManagerAlertsQuery' } })),
}));

// Keep the test focused on MultiQueryEditor's persistence logic, not the child editor's rendering.
vi.mock('./QueryEditorContainer', () => ({
  QueryEditorContainer: (): null => null,
}));

describe('MultiQueryEditor', () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('persists the default query when the panel has no queries', async () => {
    const onChange = vi.fn();

    render(
      <MultiQueryEditor
        queryTypes={['AlertsQuery'] as QueryPluginType[]}
        queries={[]}
        onChange={onChange}
        onQueryRun={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith([
        {
          kind: 'AlertsQuery',
          spec: {
            plugin: { kind: 'AlertManagerAlertsQuery', spec: { active: true } },
          },
        },
      ]);
    });
  });

  it('does not overwrite queries that already exist', async () => {
    const onChange = vi.fn();
    const existing = {
      kind: 'AlertsQuery',
      spec: { plugin: { kind: 'AlertManagerAlertsQuery', spec: { active: false } } },
    };

    render(
      <MultiQueryEditor
        queryTypes={['AlertsQuery'] as QueryPluginType[]}
        queries={[existing]}
        onChange={onChange}
        onQueryRun={vi.fn()}
      />,
    );

    // Give any effects a chance to run before asserting no persistence happened.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onChange).not.toHaveBeenCalled();
  });
});
