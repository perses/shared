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
import { Fragment, useMemo, useState } from 'react';
import type { ReactElement } from 'react';

import { Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow } from './Table';
import type { SortDirection } from './Table';
import { TableCheckbox } from './TableCheckbox';
import { TablePagination } from './TablePagination';
import { TableRowExpandButton } from './TableRowExpandButton';
import { TableSortLabel } from './TableSortLabel';

const rows = [
  { name: 'cpu_usage', value: 42.1, unit: '%' },
  { name: 'memory_usage', value: 78.4, unit: '%' },
  { name: 'disk_io', value: 12.9, unit: 'MB/s' },
];

const columnStack = { display: 'flex', flexDirection: 'column' as const, gap: '1rem' };
const shortContainer = { maxHeight: '16rem' };
const narrowContainer = { maxWidth: '24rem' };
const paginationRowsPerPageOptions = [1, 2, 3];
const noPadding = { padding: 0 };

export const Density: Story = () => (
  <div style={columnStack}>
    <h3>Compare row padding and font size across the four cell sizes.</h3>
    {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
      <div key={size}>
        <h3>
          size=&quot;{size}&quot;{size === 'md' ? ' (default)' : ''}
        </h3>
        <Table size={size}>
          <TableHead>
            <TableRow>
              <TableCell header>Name</TableCell>
              <TableCell header align="right">
                Value
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell>{row.name}</TableCell>
                <TableCell align="right">{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    ))}
  </div>
);

const sortableColumns = [
  { key: 'name', label: 'Name' },
  { key: 'value', label: 'Value' },
  { key: 'unit', label: 'Unit' },
] as const;

export const SortableHeader: Story = () => {
  const [sortBy, setSortBy] = useState<(typeof sortableColumns)[number]['key']>('value');
  const [direction, setDirection] = useState<SortDirection>('asc');

  const handleSort = (key: typeof sortBy): void => {
    if (key === sortBy) {
      setDirection(direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setDirection('asc');
    }
  };

  const sorted = useMemo(() => {
    const compare = (a: (typeof rows)[number], b: (typeof rows)[number]): number => {
      const left = a[sortBy];
      const right = b[sortBy];
      const order =
        typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right));
      return direction === 'asc' ? order : -order;
    };
    return rows.toSorted(compare);
  }, [sortBy, direction]);

  return (
    <div>
      <h3>Click a header to sort by that column; click it again to reverse the sort order.</h3>
      <Table>
        <TableHead>
          <TableRow>
            {sortableColumns.map((column) => (
              <TableCell
                key={column.key}
                header
                align={column.key === 'value' ? 'right' : 'left'}
                sortDirection={sortBy === column.key ? direction : false}
              >
                <TableSortLabel
                  active={sortBy === column.key}
                  direction={sortBy === column.key ? direction : 'asc'}
                  onClick={() => handleSort(column.key)}
                >
                  {column.label}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((row) => (
            <TableRow key={row.name}>
              <TableCell>{row.name}</TableCell>
              <TableCell align="right">{row.value}</TableCell>
              <TableCell>{row.unit}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const denseTable = { minWidth: 0 };

export const ResizableColumns: Story = () => {
  const [widths, setWidths] = useState({ name: 80, value: 56, unit: 48 });

  const resize =
    (key: keyof typeof widths) =>
    (width: number): void =>
      setWidths((current) => ({ ...current, [key]: width }));

  return (
    <div>
      <h3>Drag the right edge of any header left or right to resize that column.</h3>
      <Table tableLayout="fixed" style={denseTable}>
        <TableHead>
          <TableRow>
            <TableCell header resizable onResize={resize('name')} style={{ width: widths.name }}>
              Name
            </TableCell>
            <TableCell header align="right" resizable onResize={resize('value')} style={{ width: widths.value }}>
              Value
            </TableCell>
            <TableCell header resizable onResize={resize('unit')} style={{ width: widths.unit }}>
              Unit
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell>{row.name}</TableCell>
              <TableCell align="right">{row.value}</TableCell>
              <TableCell>{row.unit}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const SelectionExample = ({ selectAll }: { selectAll?: boolean }): ReactElement => {
  const [selected, setSelected] = useState<string[]>([]);
  const allSelected = selected.length === rows.length;
  const someSelected = selected.length > 0 && !allSelected;

  const toggleAll = (): void => {
    setSelected(allSelected ? [] : rows.map((row) => row.name));
  };

  const toggleRow = (name: string): void => {
    setSelected((current) => (current.includes(name) ? current.filter((n) => n !== name) : [...current, name]));
  };

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell header>
            {selectAll && (
              <TableCheckbox
                aria-label="Select all rows"
                checked={allSelected}
                indeterminate={someSelected}
                onChange={toggleAll}
              />
            )}
          </TableCell>
          <TableCell header>Name</TableCell>
          <TableCell header align="right">
            Value
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.name} selected={selected.includes(row.name)}>
            <TableCell>
              <TableCheckbox
                aria-label={`Select ${row.name}`}
                checked={selected.includes(row.name)}
                onChange={() => toggleRow(row.name)}
              />
            </TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell align="right">{row.value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export const RowSelection: Story = () => (
  <div style={columnStack}>
    <h3>
      Click checkboxes to select rows. In the first table, the header checkbox selects all rows and shows an
      indeterminate state while only some rows are selected.
    </h3>
    <h3>With &quot;select all&quot; header (indeterminate state)</h3>
    <SelectionExample selectAll />
    <h3>Per-row checkboxes only</h3>
    <SelectionExample />
  </div>
);

export const ExpandableRows: Story = () => {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <div>
      <h3>Click a chevron button to expand a row and reveal its detail row below.</h3>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell header />
            <TableCell header>Name</TableCell>
            <TableCell header align="right">
              Value
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const isExpanded = expanded === row.name;
            return (
              <Fragment key={row.name}>
                <TableRow>
                  <TableCell>
                    <TableRowExpandButton
                      aria-label={isExpanded ? `Collapse ${row.name}` : `Expand ${row.name}`}
                      expanded={isExpanded}
                      onClick={() => setExpanded(isExpanded ? null : row.name)}
                    />
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell align="right">{row.value}</TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow>
                    <TableCell />
                    <TableCell colSpan={2}>Unit: {row.unit}</TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export const ResponsiveOverflow: Story = () => (
  <div>
    <h3>Resize the browser narrower than the table to see the container scroll horizontally.</h3>
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell header>Name</TableCell>
            <TableCell header>CPU</TableCell>
            <TableCell header>Memory</TableCell>
            <TableCell header>Status</TableCell>
            <TableCell header>Disk</TableCell>
            <TableCell header>Network</TableCell>
            <TableCell header>Region</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {manyRows.slice(0, 5).map((row) => (
            <TableRow key={row.name}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.cpu}</TableCell>
              <TableCell>{row.memory}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>{row.disk}</TableCell>
              <TableCell>{row.network}</TableCell>
              <TableCell>{row.region}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </div>
);

const manyRows = Array.from({ length: 50 }, (_, index) => ({
  name: `server-${index + 1}`,
  cpu: `${20 + (index % 70)}%`,
  memory: `${30 + (index % 60)}%`,
  disk: `${10 + (index % 80)}%`,
  network: `${5 + (index % 40)} Mb/s`,
  region: index % 2 === 0 ? 'us-east-1' : 'us-west-2',
  status: index % 7 === 0 ? 'Degraded' : 'Healthy',
}));

export const StickyHeaderAndColumns: Story = () => (
  <div style={columnStack}>
    <h3>Scroll the first table vertically and the second table horizontally to verify the pinned header and column.</h3>
    <h3>Sticky header — scroll vertically to see it stay pinned</h3>
    <TableContainer style={shortContainer}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell header>Name</TableCell>
            <TableCell header>CPU</TableCell>
            <TableCell header>Memory</TableCell>
            <TableCell header>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {manyRows.map((row) => (
            <TableRow key={row.name} hover>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.cpu}</TableCell>
              <TableCell>{row.memory}</TableCell>
              <TableCell>{row.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    <h3>Sticky column — scroll horizontally to see Name stay pinned</h3>
    <TableContainer style={narrowContainer}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell header sticky="left">
              Name
            </TableCell>
            <TableCell header>CPU</TableCell>
            <TableCell header>Memory</TableCell>
            <TableCell header>Status</TableCell>
            <TableCell header>Disk</TableCell>
            <TableCell header>Network</TableCell>
            <TableCell header>Region</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {manyRows.slice(0, 5).map((row) => (
            <TableRow key={row.name} hover>
              <TableCell sticky="left">{row.name}</TableCell>
              <TableCell>{row.cpu}</TableCell>
              <TableCell>{row.memory}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>{row.disk}</TableCell>
              <TableCell>{row.network}</TableCell>
              <TableCell>{row.region}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </div>
);

// Mirrors MUI's pattern of rendering TablePagination inside a <tr>/<td colSpan> footer row.
export const Paginated: Story = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(1);
  const pageRows = rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  return (
    <div>
      <h3>Use the chevron buttons to move between pages and the select to change how many rows are shown per page.</h3>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell header>Name</TableCell>
              <TableCell header align="right">
                Value
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow key={row.name}>
                <TableCell>{row.name}</TableCell>
                <TableCell align="right">{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} style={noPadding}>
                <TablePagination
                  count={rows.length}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={paginationRowsPerPageOptions}
                  onPageChange={setPage}
                  onRowsPerPageChange={(value) => {
                    setRowsPerPage(value);
                    setPage(0);
                  }}
                />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </div>
  );
};
