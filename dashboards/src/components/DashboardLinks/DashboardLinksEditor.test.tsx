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

import type { Link } from '@perses-dev/spec';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DashboardLinksEditor } from './DashboardLinksEditor';

vi.mock('../../context', () => ({
  useDiscardChangesConfirmationDialog: vi.fn(() => ({
    openDiscardChangesConfirmationDialog: vi.fn(),
    closeDiscardChangesConfirmationDialog: vi.fn(),
  })),
}));

function renderEditor(links: Link[]): { onChange: ReturnType<typeof vi.fn> } {
  const onChange = vi.fn();
  render(<DashboardLinksEditor links={links} onChange={onChange} onCancel={vi.fn()} />);
  return { onChange };
}

describe('DashboardLinksEditor', () => {
  it('lists a tag link read-only and keeps it unchanged when applying', async () => {
    const tagLink: Link = { name: 'Related', tags: ['team-a', 'prod'], targetBlank: true };
    const { onChange } = renderEditor([tagLink]);

    expect(screen.getByText('Related')).toBeInTheDocument();
    expect(screen.getByText('Tags: team-a, prod')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit link' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onChange).toHaveBeenCalledWith([tagLink]);
  });

  it('blocks applying a URL link with an empty URL', () => {
    renderEditor([{ name: 'Empty', url: '' }]);

    expect(screen.getByText('(no URL)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('does not crash on a link with neither a URL nor tags', () => {
    renderEditor([{ name: 'Legacy' } as unknown as Link]);

    expect(screen.getByText('Legacy')).toBeInTheDocument();
    expect(screen.getByText('(no URL)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });
});
