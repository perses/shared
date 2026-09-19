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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GridTitle } from './GridTitle';

vi.mock('@perses-dev/plugin-system', async (importOriginal) => ({
  ...(await importOriginal<typeof PluginSystemModule>()),
  useReplaceVariablesInString: vi.fn((s: string) => s),
}));

vi.mock('../../context', () => ({
  usePanelGroupActions: vi.fn(() => ({
    openAddPanel: vi.fn(),
    openEditPanelGroup: vi.fn(),
    moveUp: undefined,
    moveDown: undefined,
  })),
  useDeletePanelGroupDialog: vi.fn(() => ({ openDeletePanelGroupDialog: vi.fn() })),
  useEditMode: vi.fn(() => ({ isEditMode: false })),
}));

describe('GridTitle collapsed panel count', () => {
  it('appends panel count when collapsed', () => {
    render(
      <GridTitle
        panelGroupId={0}
        title="Dashboard Info"
        panelCount={3}
        collapse={{ isOpen: false, onToggleOpen: vi.fn() }}
      />,
    );
    expect(screen.getByText('Dashboard Info (3 panels)')).toBeInTheDocument();
  });

  it('uses singular panel when count is 1', () => {
    render(
      <GridTitle
        panelGroupId={0}
        title="Overview"
        panelCount={1}
        collapse={{ isOpen: false, onToggleOpen: vi.fn() }}
      />,
    );
    expect(screen.getByText('Overview (1 panel)')).toBeInTheDocument();
  });

  it('hides count when expanded', () => {
    render(
      <GridTitle
        panelGroupId={0}
        title="Dashboard Info"
        panelCount={3}
        collapse={{ isOpen: true, onToggleOpen: vi.fn() }}
      />,
    );
    expect(screen.getByText('Dashboard Info')).toBeInTheDocument();
    expect(screen.queryByText(/3 panels/)).not.toBeInTheDocument();
  });

  it('hides count when collapse is not used', () => {
    render(<GridTitle panelGroupId={0} title="Always open" panelCount={3} />);
    expect(screen.getByText('Always open')).toBeInTheDocument();
    expect(screen.queryByText(/panels/)).not.toBeInTheDocument();
  });

  it('toggles open on header click', async () => {
    const onToggleOpen = vi.fn();
    render(
      <GridTitle panelGroupId={0} title="Dashboard Info" panelCount={2} collapse={{ isOpen: false, onToggleOpen }} />,
    );
    await userEvent.click(screen.getByTestId('panel-group-header'));
    expect(onToggleOpen).toHaveBeenCalled();
  });
});
