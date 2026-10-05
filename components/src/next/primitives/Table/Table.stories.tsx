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

export const Basic: Story = () => (
  <Table>
    <TableHead>
      <TableRow>
        <TableCell header>Name</TableCell>
        <TableCell header align="right">
          Value
        </TableCell>
        <TableCell header>Unit</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.name} hover>
          <TableCell>{row.name}</TableCell>
          <TableCell align="right">{row.value}</TableCell>
          <TableCell>{row.unit}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export const SelectedRow: Story = () => (
  <Table>
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.name} selected={row.name === 'memory_usage'}>
          <TableCell>{row.name}</TableCell>
          <TableCell align="right">{row.value}</TableCell>
          <TableCell>{row.unit}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export const WithFooter: Story = () => (
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
      {rows.map((row) => (
        <TableRow key={row.name}>
          <TableCell>{row.name}</TableCell>
          <TableCell align="right">{row.value}</TableCell>
        </TableRow>
      ))}
    </TableBody>
    <TableFooter>
      <TableRow>
        <TableCell header>Total</TableCell>
        <TableCell align="right">{rows.reduce((sum, row) => sum + row.value, 0).toFixed(1)}</TableCell>
      </TableRow>
    </TableFooter>
  </Table>
);

export const Density: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    {(['sm', 'md', 'lg'] as const).map((size) => (
      <Table key={size} size={size}>
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
    ))}
  </div>
);

export const StickyHeader: Story = () => (
  <TableContainer style={{ maxHeight: '8rem' }}>
    <Table stickyHeader>
      <TableHead>
        <TableRow>
          <TableCell header>Name</TableCell>
          <TableCell header align="right">
            Value
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {[...rows, ...rows, ...rows].map((row, index) => (
          <TableRow key={`${row.name}-${index}`}>
            <TableCell>{row.name}</TableCell>
            <TableCell align="right">{row.value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export const SortableHeader: Story = () => {
  const [direction, setDirection] = useState<SortDirection>('asc');
  const sorted = useMemo(
    () => [...rows].sort((a, b) => (direction === 'asc' ? a.value - b.value : b.value - a.value)),
    [direction],
  );
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell header sortDirection={direction}>
            <TableSortLabel
              active
              direction={direction}
              onClick={() => setDirection(direction === 'asc' ? 'desc' : 'asc')}
            >
              Value
            </TableSortLabel>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.map((row) => (
          <TableRow key={row.name}>
            <TableCell align="right">{row.value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export const ResizableColumns: Story = () => {
  const [nameWidth, setNameWidth] = useState(160);
  return (
    <Table tableLayout="fixed">
      <TableHead>
        <TableRow>
          <TableCell header resizable onResize={setNameWidth} style={{ width: nameWidth }}>
            Name
          </TableCell>
          <TableCell header align="right">
            Value
          </TableCell>
          <TableCell header>Unit</TableCell>
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
  );
};

export const RowSelection: Story = () => {
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
            <TableCheckbox
              aria-label="Select all rows"
              checked={allSelected}
              indeterminate={someSelected}
              onChange={toggleAll}
            />
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

export const ExpandableRows: Story = () => {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
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
  );
};

// Resize the preview below 600px wide to see the Unit column disappear.
export const ResponsiveColumns: Story = () => (
  <Table>
    <TableHead>
      <TableRow>
        <TableCell header>Name</TableCell>
        <TableCell header align="right">
          Value
        </TableCell>
        <TableCell header display={{ default: 'table-cell', xs: 'none' }}>
          Unit
        </TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.name}>
          <TableCell>{row.name}</TableCell>
          <TableCell align="right">{row.value}</TableCell>
          <TableCell display={{ default: 'table-cell', xs: 'none' }}>{row.unit}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const serverRows = [
  {
    name: 'web-01',
    cpu: '42%',
    memory: '78%',
    disk: '61%',
    network: '12 Mb/s',
    region: 'us-east-1',
    zone: 'us-east-1a',
    status: 'Healthy',
    owner: 'platform-team',
    updated: '2m ago',
  },
  {
    name: 'web-02',
    cpu: '55%',
    memory: '64%',
    disk: '48%',
    network: '9 Mb/s',
    region: 'us-east-1',
    zone: 'us-east-1b',
    status: 'Healthy',
    owner: 'platform-team',
    updated: '5m ago',
  },
  {
    name: 'db-01',
    cpu: '81%',
    memory: '90%',
    disk: '73%',
    network: '34 Mb/s',
    region: 'us-west-2',
    zone: 'us-west-2a',
    status: 'Degraded',
    owner: 'data-team',
    updated: '1m ago',
  },
];

export const ManyColumns: Story = () => (
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
          <TableCell header>Zone</TableCell>
          <TableCell header>Owner</TableCell>
          <TableCell header>Updated</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {serverRows.map((row) => (
          <TableRow key={row.name} hover>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.cpu}</TableCell>
            <TableCell>{row.memory}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell>{row.disk}</TableCell>
            <TableCell>{row.network}</TableCell>
            <TableCell>{row.region}</TableCell>
            <TableCell>{row.zone}</TableCell>
            <TableCell>{row.owner}</TableCell>
            <TableCell>{row.updated}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// Scroll the preview horizontally to see the Name column stay pinned.
export const StickyColumns: Story = () => (
  <TableContainer style={{ maxWidth: '24rem' }}>
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
        {serverRows.map((row) => (
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
);

const manyRows = Array.from({ length: 50 }, (_, index) => ({
  name: `server-${index + 1}`,
  cpu: `${20 + (index % 70)}%`,
  memory: `${30 + (index % 60)}%`,
  status: index % 7 === 0 ? 'Degraded' : 'Healthy',
}));

export const ManyRows: Story = () => (
  <TableContainer style={{ maxHeight: '16rem' }}>
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
);

export const Paginated: Story = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(1);
  const pageRows = rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  return (
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
      </Table>
      <TablePagination
        count={rows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[1, 2, 3]}
        onPageChange={setPage}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPage(0);
        }}
      />
    </TableContainer>
  );
};

// Mirrors MUI's pattern of rendering TablePagination inside a <tr>/<td colSpan> footer row.
export const PaginatedFooter: Story = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(1);
  const pageRows = rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  return (
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
            <TableCell colSpan={2} style={{ padding: 0 }}>
              <TablePagination
                count={rows.length}
                page={page}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[1, 2, 3]}
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
  );
};
