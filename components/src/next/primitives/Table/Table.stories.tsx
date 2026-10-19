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
import { Fragment, useCallback, useMemo, useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';

import { Sample, Stack } from '../../stories/Sample';
import { Checkbox } from '../Checkbox';
import type { Size } from '../types';
import { Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow } from './Table';
import type { SortDirection } from './Table';
import { TablePagination } from './TablePagination';
import { TableRowExpandButton } from './TableRowExpandButton';
import { TableSortLabel } from './TableSortLabel';

interface MetricRow {
  name: string;
  value: number;
  unit: string;
}

const rows: MetricRow[] = [
  { name: 'cpu_usage', value: 42.1, unit: '%' },
  { name: 'memory_usage', value: 78.4, unit: '%' },
  { name: 'disk_io', value: 12.9, unit: 'MB/s' },
];

const sizes: Size[] = ['xs', 'sm', 'md', 'lg'];
const grid: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--perses-spacing-xl)',
};

const panelBackgrounds: Record<Size, string> = {
  xs: 'var(--perses-status-bg-info)',
  sm: 'var(--perses-status-bg-success)',
  md: 'var(--perses-status-bg-secondary)',
  lg: 'var(--perses-status-bg-warning)',
};
const panel = (size: Size): CSSProperties => ({
  backgroundColor: panelBackgrounds[size],
  borderRadius: 'var(--perses-radius-md)',
  padding: 'var(--perses-spacing-sm)',
});
const sizeLabelColor = 'var(--perses-text-secondary)';
const sizeLabels: Record<Size, CSSProperties> = {
  xs: {
    fontSize: 'var(--perses-font-size-xs)',
    paddingInline: 'var(--perses-spacing-xs)',
    color: sizeLabelColor,
  },
  sm: {
    fontSize: 'var(--perses-font-size-xs)',
    paddingInline: 'var(--perses-spacing-sm)',
    color: sizeLabelColor,
  },
  md: {
    fontSize: 'var(--perses-font-size-sm)',
    paddingInline: 'var(--perses-spacing-md)',
    color: sizeLabelColor,
  },
  lg: {
    fontSize: 'var(--perses-font-size-md)',
    paddingInline: 'var(--perses-spacing-lg)',
    color: sizeLabelColor,
  },
};
const shortContainer: CSSProperties = { maxHeight: '16rem' };
const narrowContainer: CSSProperties = { maxWidth: '24rem' };
const noPadding: CSSProperties = { padding: 0 };
const paginationRowsPerPageOptions = [1, 2, 3];

function MetricRows(): ReactElement {
  return (
    <>
      {rows.map((row) => (
        <TableRow key={row.name}>
          <TableCell>{row.name}</TableCell>
          <TableCell align="right">{row.value}</TableCell>
          <TableCell>{row.unit}</TableCell>
        </TableRow>
      ))}
    </>
  );
}

const basicCode = `<Table>
  <TableHead>
    <TableRow>
      <TableCell header>Name</TableCell>
      <TableCell header align="right">Value</TableCell>
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
</Table>`;

const tableSize = `// size: 'xs' | 'sm' | 'md' | 'lg' — set on Table for every cell, or on a single TableCell
<Table size="sm">
  <TableBody>
    <TableRow>
      <TableCell>Inherits sm</TableCell>
      <TableCell size="lg">MB/s</TableCell>
    </TableRow>
  </TableBody>
</Table>`;

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>Table</code> renders a native <code>&lt;table&gt;</code>. Compose it from <code>TableHead</code>,{' '}
      <code>TableBody</code>, <code>TableFooter</code>, <code>TableRow</code> and <code>TableCell</code>; pass{' '}
      <code>header</code> to a cell to render a <code>&lt;th scope=&quot;col&quot;&gt;</code>. Wrap it in{' '}
      <code>TableContainer</code> when it needs to scroll.
    </p>
    <Sample title="Minimal usage" code={basicCode}>
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
          <MetricRows />
        </TableBody>
      </Table>
    </Sample>
    <Sample title="Table Size" code={tableSize}>
      <div style={grid}>
        {sizes.map((size) => (
          <div key={size} style={panel(size)}>
            <span style={sizeLabels[size]}>
              size=&quot;{size}&quot;{size === 'md' ? ' (default)' : ''}
            </span>
            <Table size={size}>
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
                <TableRow>
                  <TableCell>cpu_usage</TableCell>
                  <TableCell align="right">42.1</TableCell>
                  <TableCell>MB/s</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>memory_usage</TableCell>
                  <TableCell align="right">78.4</TableCell>
                  <TableCell>%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ))}
      </div>
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

type SortKey = keyof MetricRow;

const sortableColumns: Array<{ key: SortKey; label: string }> = [
  { key: 'name', label: 'Name' },
  { key: 'value', label: 'Value' },
  { key: 'unit', label: 'Unit' },
];

const sortingCode = `const [sortBy, setSortBy] = useState<'name' | 'value' | 'unit'>('value');
const [direction, setDirection] = useState<SortDirection>('asc');

<TableCell header sortDirection={sortBy === 'name' ? direction : false}>
  <TableSortLabel active={sortBy === 'name'} direction={direction} onClick={() => toggleSort('name')}>
    Name
  </TableSortLabel>
</TableCell>`;

function SortableHeaderCell({
  column,
  sortBy,
  direction,
  onSort,
}: {
  column: (typeof sortableColumns)[number];
  sortBy: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
}): ReactElement {
  const active = sortBy === column.key;
  const handleClick = useCallback(() => onSort(column.key), [onSort, column.key]);
  return (
    <TableCell header align={column.key === 'value' ? 'right' : 'left'} sortDirection={active ? direction : false}>
      <TableSortLabel active={active} direction={active ? direction : 'asc'} onClick={handleClick}>
        {column.label}
      </TableSortLabel>
    </TableCell>
  );
}

function SortableTable(): ReactElement {
  const [sortBy, setSortBy] = useState<SortKey>('value');
  const [direction, setDirection] = useState<SortDirection>('asc');

  const handleSort = useCallback(
    (key: SortKey): void => {
      if (key === sortBy) {
        setDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortBy(key);
        setDirection('asc');
      }
    },
    [sortBy],
  );

  const sorted = useMemo(() => {
    const compare = (a: MetricRow, b: MetricRow): number => {
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
    <Table>
      <TableHead>
        <TableRow>
          {sortableColumns.map((column) => (
            <SortableHeaderCell
              key={column.key}
              column={column}
              sortBy={sortBy}
              direction={direction}
              onSort={handleSort}
            />
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
  );
}

export const Sorting: Story = () => (
  <Stack>
    <p>
      <code>TableSortLabel</code> is a button for a sortable column header. Pass <code>sortDirection</code> to the
      header cell so it exposes <code>aria-sort</code>, and <code>active</code>/<code>direction</code> to the label so
      the arrow reflects the current sort. Click a header to sort by it; click again to reverse.
    </p>
    <Sample title="Sortable headers" code={sortingCode}>
      <SortableTable />
    </Sample>
  </Stack>
);
Sorting.storyName = 'Sorting';

const selectionCode = `const [selected, setSelected] = useState<string[]>([]);
const allSelected = selected.length === rows.length;
const someSelected = selected.length > 0 && !allSelected;

<TableCell header>
  <Checkbox
    aria-label="Select all rows"
    checked={allSelected}
    indeterminate={someSelected}
    onCheckedChange={toggleAll}
  />
</TableCell>
...
<TableRow selected={selected.includes(row.name)} hover>
  <TableCell>
    <Checkbox
      aria-label={\`Select \${row.name}\`}
      checked={selected.includes(row.name)}
      onCheckedChange={() => toggleRow(row.name)}
    />
  </TableCell>
</TableRow>`;

function SelectableRow({
  row,
  selected,
  onToggle,
}: {
  row: MetricRow;
  selected: boolean;
  onToggle: (name: string) => void;
}): ReactElement {
  const handleChange = useCallback(() => onToggle(row.name), [onToggle, row.name]);
  return (
    <TableRow selected={selected} hover>
      <TableCell>
        <Checkbox aria-label={`Select ${row.name}`} checked={selected} onCheckedChange={handleChange} />
      </TableCell>
      <TableCell>{row.name}</TableCell>
      <TableCell align="right">{row.value}</TableCell>
    </TableRow>
  );
}

function SelectableTable(): ReactElement {
  const [selected, setSelected] = useState<string[]>([]);
  const allSelected = selected.length === rows.length;
  const someSelected = selected.length > 0 && !allSelected;

  const toggleAll = useCallback((): void => {
    setSelected(allSelected ? [] : rows.map((row) => row.name));
  }, [allSelected]);

  const toggleRow = useCallback((name: string): void => {
    setSelected((current) => (current.includes(name) ? current.filter((n) => n !== name) : [...current, name]));
  }, []);

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell header>
            <Checkbox
              aria-label="Select all rows"
              checked={allSelected}
              indeterminate={someSelected}
              onCheckedChange={toggleAll}
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
          <SelectableRow key={row.name} row={row} selected={selected.includes(row.name)} onToggle={toggleRow} />
        ))}
      </TableBody>
    </Table>
  );
}

const expandCode = `const [expanded, setExpanded] = useState<string | null>(null);

<TableCell>
  <TableRowExpandButton
    aria-label={isExpanded ? \`Collapse \${row.name}\` : \`Expand \${row.name}\`}
    expanded={isExpanded}
    onClick={() => setExpanded(isExpanded ? null : row.name)}
  />
</TableCell>`;

function ExpandableRow({
  row,
  expanded,
  onToggle,
}: {
  row: MetricRow;
  expanded: boolean;
  onToggle: (name: string) => void;
}): ReactElement {
  const handleClick = useCallback(() => onToggle(row.name), [onToggle, row.name]);
  return (
    <Fragment>
      <TableRow>
        <TableCell>
          <TableRowExpandButton
            aria-label={expanded ? `Collapse ${row.name}` : `Expand ${row.name}`}
            expanded={expanded}
            onClick={handleClick}
          />
        </TableCell>
        <TableCell>{row.name}</TableCell>
        <TableCell align="right">{row.value}</TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell />
          <TableCell colSpan={2}>Unit: {row.unit}</TableCell>
        </TableRow>
      )}
    </Fragment>
  );
}

function ExpandableTable(): ReactElement {
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = useCallback((name: string): void => {
    setExpanded((current) => (current === name ? null : name));
  }, []);
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
        {rows.map((row) => (
          <ExpandableRow key={row.name} row={row} expanded={expanded === row.name} onToggle={toggle} />
        ))}
      </TableBody>
    </Table>
  );
}

export const Selection: Story = () => (
  <Stack>
    <p>
      Row selection is composed from the <code>Checkbox</code> primitive inside a <code>TableCell</code>; the header
      checkbox uses <code>indeterminate</code> while only some rows are selected. <code>TableRow</code> accepts{' '}
      <code>selected</code> to highlight a row and <code>hover</code> to tint it on pointer hover.{' '}
      <code>TableRowExpandButton</code> toggles a detail row and exposes <code>aria-expanded</code>.
    </p>
    <Sample title="Selectable rows with a select-all header" code={selectionCode}>
      <SelectableTable />
    </Sample>
    <Sample title="Expandable rows" code={expandCode}>
      <ExpandableTable />
    </Sample>
  </Stack>
);
Selection.storyName = 'Selection';

const manyRows = Array.from({ length: 50 }, (_, index) => ({
  name: `server-${index + 1}`,
  cpu: `${20 + (index % 70)}%`,
  memory: `${30 + (index % 60)}%`,
  disk: `${10 + (index % 80)}%`,
  network: `${5 + (index % 40)} Mb/s`,
  region: index % 2 === 0 ? 'us-east-1' : 'us-west-2',
  status: index % 7 === 0 ? 'Degraded' : 'Healthy',
}));

const stickyCode = `<TableContainer style={{ maxHeight: '16rem' }}>
  <Table stickyHeader>
    <TableHead>
      <TableRow>
        <TableCell header sticky="left">Name</TableCell>
        <TableCell header>CPU</TableCell>
        ...
      </TableRow>
    </TableHead>
    <TableBody>
      <TableRow hover>
        <TableCell sticky="left">server-1</TableCell>
        ...
      </TableRow>
    </TableBody>
  </Table>
</TableContainer>`;

const resizableCode = `
const [widths, setWidths] = useState({ name: 160, value: 96, unit: 96 });

<TableContainer>
  <Table tableLayout="fixed">
    <TableHead>
      <TableRow>
      <TableCell
        header
        resizable
        onResize={(width) => setWidths({ ...widths, name: width })}
        minResizeWidth={80}
        maxResizeWidth={320}
        resizeHandleAriaLabel="Resize Name column"
        style={{ width: widths.name }}
      >
        Name
      </TableCell>
      <TableCell header resizable onResize={...} minResizeWidth={80} maxResizeWidth={320} resizeHandleAriaLabel="Resize Value column" style={{ width: widths.value }}>
        Value
      </TableCell>
      <TableCell header resizable onResize={...} minResizeWidth={80} maxResizeWidth={320} resizeHandleAriaLabel="Resize Unit column" style={{ width: widths.unit }}>
        Unit
      </TableCell>
      <TableCell header aria-hidden />
    </TableRow>
  </TableHead>
</Table>
</TableContainer>`;

const stickyColumnContainer: CSSProperties = {
  ...shortContainer,
  ...narrowContainer,
};

type ResizableColumn = 'name' | 'value' | 'unit';

function ResizableHeaderCell({
  column,
  width,
  align,
  onResize,
  children,
}: {
  column: ResizableColumn;
  width: number;
  align?: 'left' | 'right';
  onResize: (column: ResizableColumn, width: number) => void;
  children: string;
}): ReactElement {
  const handleResize = useCallback((next: number) => onResize(column, next), [onResize, column]);
  const style = useMemo(() => ({ width }), [width]);
  return (
    <TableCell
      header
      align={align}
      resizable
      onResize={handleResize}
      minResizeWidth={80}
      maxResizeWidth={320}
      resizeHandleAriaLabel={`Resize ${children} column`}
      style={style}
    >
      {children}
    </TableCell>
  );
}

function ResizableTable(): ReactElement {
  const [widths, setWidths] = useState<Record<ResizableColumn, number>>({ name: 160, value: 96, unit: 96 });
  const handleResize = useCallback((column: ResizableColumn, width: number): void => {
    setWidths((current) => ({ ...current, [column]: width }));
  }, []);

  return (
    <TableContainer>
      <Table tableLayout="fixed">
        <TableHead>
          <TableRow>
            <ResizableHeaderCell column="name" width={widths.name} onResize={handleResize}>
              Name
            </ResizableHeaderCell>
            <ResizableHeaderCell column="value" width={widths.value} align="right" onResize={handleResize}>
              Value
            </ResizableHeaderCell>
            <ResizableHeaderCell column="unit" width={widths.unit} onResize={handleResize}>
              Unit
            </ResizableHeaderCell>
            <TableCell header aria-hidden />
          </TableRow>
        </TableHead>
        <TableBody>
          <MetricRows />
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export const Layout: Story = () => (
  <Stack>
    <p>
      <code>TableContainer</code> gives the table a scrolling viewport. Inside it, <code>stickyHeader</code> pins the
      header row while scrolling vertically and <code>sticky=&quot;left&quot;</code>/<code>&quot;right&quot;</code> on a
      cell pins a column while scrolling horizontally. With <code>tableLayout=&quot;fixed&quot;</code>, header cells can
      be <code>resizable</code>; drag the handle at a header&apos;s right edge or focus it and press Left/Right to
      resize that column.
    </p>
    <Sample title="Sticky header and sticky first column — scroll both ways" code={stickyCode}>
      <TableContainer style={stickyColumnContainer}>
        <Table stickyHeader>
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
            {manyRows.map((row) => (
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
    </Sample>
    <Sample title="Resizable columns" code={resizableCode}>
      <ResizableTable />
    </Sample>
  </Stack>
);
Layout.storyName = 'Layout';

const paginationCode = `const [page, setPage] = useState(0);
const [rowsPerPage, setRowsPerPage] = useState(1);

<TableFooter>
  <TableRow>
    <TableCell colSpan={3} style={{ padding: 0 }}>
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
</TableFooter>`;

function PaginatedTable(): ReactElement {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(1);
  const pageRows = rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const handleRowsPerPageChange = useCallback((value: number): void => {
    setRowsPerPage(value);
    setPage(0);
  }, []);

  return (
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
        {pageRows.map((row) => (
          <TableRow key={row.name}>
            <TableCell>{row.name}</TableCell>
            <TableCell align="right">{row.value}</TableCell>
            <TableCell>{row.unit}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3} style={noPadding}>
            <TablePagination
              count={rows.length}
              page={page}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={paginationRowsPerPageOptions}
              onPageChange={setPage}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

export const Pagination: Story = () => (
  <Stack>
    <p>
      <code>TablePagination</code> is a fully controlled footer: you own <code>page</code> and <code>rowsPerPage</code>{' '}
      and slice the rows yourself. The rows-per-page select only renders when <code>onRowsPerPageChange</code> is
      provided. Its navigation buttons use the provider&apos;s <code>IconButton</code>.
    </p>
    <Sample title="Paginated table" code={paginationCode}>
      <PaginatedTable />
    </Sample>
  </Stack>
);
Pagination.storyName = 'Pagination';
