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

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { DashboardLink } from '../LinksDisplay/dashboard-link';
import { DashboardLinksEditor } from './DashboardLinksEditor';

vi.mock('../../context', () => ({
  useDiscardChangesConfirmationDialog: (): {
    discardChangesConfirmationDialog: undefined;
    openDiscardChangesConfirmationDialog: ReturnType<typeof vi.fn>;
    closeDiscardChangesConfirmationDialog: ReturnType<typeof vi.fn>;
  } => ({
    discardChangesConfirmationDialog: undefined,
    openDiscardChangesConfirmationDialog: vi.fn(),
    closeDiscardChangesConfirmationDialog: vi.fn(),
  }),
}));

const links: DashboardLink[] = [
  { url: 'https://example.com/first', name: 'First' },
  { url: 'https://example.com/second', name: 'Second' },
];

function rowByName(name: string): HTMLElement {
  const cell = screen.getByRole('rowheader', { name });
  const row = cell.closest('tr');
  if (row === null) {
    throw new Error(`no row for ${name}`);
  }
  return row;
}

describe('DashboardLinksEditor', () => {
  test('keeps the tag draft on the same link when the row moves', async () => {
    render(<DashboardLinksEditor links={links} onChange={vi.fn()} onCancel={vi.fn()} />);

    const editButtons = screen.getAllByRole('button', { name: 'Edit link' });
    const firstEdit = editButtons[0];
    if (firstEdit === undefined) {
      throw new Error('missing edit button');
    }
    userEvent.click(firstEdit);
    userEvent.click(await screen.findByRole('combobox', { name: 'Kind' }));
    userEvent.click(await screen.findByRole('option', { name: 'Dashboards by tag' }));
    userEvent.type(await screen.findByRole('textbox', { name: 'Tags' }), 'foo,');

    expect(await screen.findByRole('textbox', { name: 'Tags' })).toHaveValue('foo,');

    const moveDown = screen.getAllByRole('button', { name: 'Move link down' })[0];
    if (moveDown === undefined) {
      throw new Error('missing move button');
    }
    userEvent.click(moveDown);

    expect(screen.getAllByRole('rowheader').map((cell) => cell.textContent)).toEqual(['Second', 'First']);
    expect(within(rowByName('First')).getByText('foo')).toBeInTheDocument();
    expect(within(rowByName('Second')).getByText('https://example.com/second')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Tags' })).toHaveValue('foo,');
  });
});
