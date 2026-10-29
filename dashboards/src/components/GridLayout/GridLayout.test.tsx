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
import { useVariableValues } from '@perses-dev/plugin-system';
import { render } from '@testing-library/react';

import { useEditMode, usePanelGroup } from '../../context';
import type { PanelGroupDefinition } from '../../model';
import { GridLayout } from './GridLayout';
import { Row } from './Row';

vi.mock('@perses-dev/plugin-system', async (importOriginal) => ({
  ...(await importOriginal<typeof PluginSystemModule>()),
  useVariableValues: vi.fn(),
}));
vi.mock('../../context', () => ({
  useEditMode: vi.fn(),
  usePanelGroup: vi.fn(),
  usePanelGroupActions: vi.fn(() => ({ updatePanelGroupLayouts: vi.fn() })),
  useViewPanelGroup: vi.fn(),
}));
vi.mock('./Row', () => ({ Row: vi.fn(() => null) }));

const group: PanelGroupDefinition = {
  id: 0,
  isCollapsed: false,
  visibility: { variable: 'phase', value: ['DEV'] },
  itemLayouts: [],
  itemPanelKeys: {},
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(usePanelGroup).mockReturnValue(group);
  vi.mocked(useEditMode).mockReturnValue({ isEditMode: false } as ReturnType<typeof useEditMode>);
});

describe('GridLayout visibility', () => {
  it('renders the group when the variable matches', () => {
    vi.mocked(useVariableValues).mockReturnValue({ phase: { value: 'DEV', loading: false } });
    render(<GridLayout panelGroupId={0} />);
    expect(Row).toHaveBeenCalled();
  });

  it('does not render the group when the variable does not match', () => {
    vi.mocked(useVariableValues).mockReturnValue({ phase: { value: 'PRD', loading: false } });
    render(<GridLayout panelGroupId={0} />);
    expect(Row).not.toHaveBeenCalled();
  });

  it('renders a non matching group in edit mode', () => {
    vi.mocked(useVariableValues).mockReturnValue({ phase: { value: 'PRD', loading: false } });
    vi.mocked(useEditMode).mockReturnValue({ isEditMode: true } as ReturnType<typeof useEditMode>);
    render(<GridLayout panelGroupId={0} />);
    expect(Row).toHaveBeenCalledWith(
      expect.objectContaining({
        visibilityNotice: { hidden: true, description: 'Shown when phase = DEV' },
      }),
      {},
    );
  });

  it('marks a matching group as shown in edit mode', () => {
    vi.mocked(useVariableValues).mockReturnValue({ phase: { value: 'DEV', loading: false } });
    vi.mocked(useEditMode).mockReturnValue({ isEditMode: true } as ReturnType<typeof useEditMode>);
    render(<GridLayout panelGroupId={0} />);
    expect(Row).toHaveBeenCalledWith(
      expect.objectContaining({
        visibilityNotice: { hidden: false, description: 'Shown when phase = DEV' },
      }),
      {},
    );
  });

  it('renders a group without visibility whatever the variables', () => {
    vi.mocked(usePanelGroup).mockReturnValue({ ...group, visibility: undefined });
    vi.mocked(useVariableValues).mockReturnValue({});
    render(<GridLayout panelGroupId={0} />);
    expect(Row).toHaveBeenCalled();
  });
});
