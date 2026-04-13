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

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement, useState } from 'react';
import { TableToolbar, TableToolbarProps } from './TableToolbar';

function TableToolbarWrapper(props: Partial<TableToolbarProps<unknown>> = {}): ReactElement {
  const [globalFilter, setGlobalFilter] = useState('');

  return (
    <TableToolbar
      showSearch
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      columns={[]}
      width={600}
      {...props}
    />
  );
}

function getSearchInput(): HTMLInputElement {
  return screen.getByRole('textbox', { name: 'search table' });
}

async function getClearSearchButton(): Promise<HTMLElement> {
  return waitFor(() => screen.getByRole('button'));
}

describe('TableToolbar', () => {
  describe('search clear button', () => {
    test('clicking the close button clears the input value', async () => {
      render(<TableToolbarWrapper />);

      const input = getSearchInput();

      userEvent.type(input, 'hello');
      expect(input).toHaveValue('hello');

      userEvent.click(await getClearSearchButton());

      const resetInput = getSearchInput();
      expect(resetInput).toHaveValue('');
    });

    test('close button is not visible when search input is empty', () => {
      render(<TableToolbarWrapper />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    test('input value is empty after typing, clearing, and re-checking', async () => {
      render(<TableToolbarWrapper />);

      const input = getSearchInput();

      userEvent.type(input, 'first');
      expect(input).toHaveValue('first');

      userEvent.click(await getClearSearchButton());
      expect(getSearchInput()).toHaveValue('');

      userEvent.type(getSearchInput(), 'second');
      expect(getSearchInput()).toHaveValue('second');

      userEvent.click(await getClearSearchButton());
      expect(getSearchInput()).toHaveValue('');
    });
  });
});
