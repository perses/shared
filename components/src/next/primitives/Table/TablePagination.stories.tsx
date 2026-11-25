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

import type { Story } from '@ladle/react';
import { useCallback, useState } from 'react';

import { Sample, Stack } from '../../stories/Sample';
import { TablePagination } from './TablePagination';
import type { TablePaginationSlotProps } from './TablePagination';

const paginationSlots: TablePaginationSlotProps = {
  rowsPerPage: { style: { fontWeight: 'var(--perses-font-weight-bold)' } },
  select: { className: 'pagination-select', style: { fontFamily: 'monospace' } },
  range: { style: { fontVariantNumeric: 'tabular-nums' } },
  previousButton: { style: { borderRadius: 0 } },
  nextButton: { style: { borderRadius: 0 } },
};
const slotStylingCode = `const paginationSlots: TablePaginationSlotProps = {
  rowsPerPage: { style: { fontWeight: 'var(--perses-font-weight-bold)' } },
  select: { className: 'pagination-select', style: { fontFamily: 'monospace' } },
  range: { style: { fontVariantNumeric: 'tabular-nums' } },
  previousButton: { style: { borderRadius: 0 } },
  nextButton: { style: { borderRadius: 0 } },
};
const [page, setPage] = useState(0);
const [rowsPerPage, setRowsPerPage] = useState(10);
const handleRowsPerPageChange = useCallback((value: number): void => {
  setRowsPerPage(value);
  setPage(0);
}, []);

<TablePagination
  count={42}
  page={page}
  rowsPerPage={rowsPerPage}
  onPageChange={setPage}
  onRowsPerPageChange={handleRowsPerPageChange}
  slotProps={paginationSlots}
/>`;

export const Slots: Story = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const handleRowsPerPageChange = useCallback((value: number): void => {
    setRowsPerPage(value);
    setPage(0);
  }, []);

  return (
    <Stack>
      <p>
        Use <code>slotProps</code> to style internal parts with <code>className</code> or <code>style</code>, without
        changing structure or behavior.
      </p>
      <div>
        <h3>Available slots</h3>
        <ul>
          <li>
            <code>rowsPerPage</code> — Label wrapper, when the rows-per-page callback is provided.
          </li>
          <li>
            <code>select</code> — Native select, when the rows-per-page callback is provided.
          </li>
          <li>
            <code>range</code> — Current row range and total count.
          </li>
          <li>
            <code>previousButton</code> — Previous-page IconButton.
          </li>
          <li>
            <code>nextButton</code> — Next-page IconButton.
          </li>
        </ul>
      </div>
      <Sample title="Styling slots" code={slotStylingCode}>
        <TablePagination
          count={42}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          slotProps={paginationSlots}
        />
      </Sample>
    </Stack>
  );
};
Slots.storyName = 'Slots';
