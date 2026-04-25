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

import { createTheme } from '@mui/material';
import { TableColumnConfig, getTableCellLayout, persesColumnsToTanstackColumns } from './table-model';

const mockMuiTheme = createTheme({});

describe('getTableCellLayout', () => {
  describe.each(['compact', 'standard'] as const)('gets layout for %s density', (density) => {
    test.each([
      { name: 'first column', opts: { isFirstColumn: true } },
      { name: 'center column', opts: {} },
      { name: 'last column', opts: { isLastColumn: true } },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ])(`in $name`, ({ name, opts }) => {
      expect(getTableCellLayout(mockMuiTheme, density, opts)).toMatchSnapshot();
    });
  });

  describe('computes cell height', () => {
    test.each([
      { name: 'using defaults', opts: {}, expected: 17.5 },
      { name: 'using auto', opts: { defaultColumnHeight: 'auto' as const }, expected: 17.5 },
      { name: 'ignoring header row', opts: { defaultColumnHeight: 50, isHeader: true }, expected: 17.5 },
      { name: 'using a custom height', opts: { defaultColumnHeight: 50 }, expected: 50 },
    ])('$name', ({ opts, expected }) => {
      expect(getTableCellLayout(mockMuiTheme, 'standard', opts).height).toEqual(expected);
    });
  });
});

type MockTableData = {
  id: string;
  label: string;
  value: number;
};

describe('persesColumnToTanstackColumn', () => {
  test('maps "auto" width to all zero `size` values', () => {
    const persesColumns: Array<TableColumnConfig<MockTableData>> = [
      {
        accessorKey: 'label',
        header: 'Name',
        width: 'auto',
      },
    ];
    const tanstackColumns = persesColumnsToTanstackColumns(persesColumns);
    expect(tanstackColumns[0]).toEqual(
      expect.objectContaining({
        size: 0,
        minSize: 0,
        maxSize: 0,
      })
    );
  });

  test('persists numeric width value as `size`', () => {
    const persesColumns: Array<TableColumnConfig<MockTableData>> = [
      {
        accessorKey: 'label',
        header: 'Name',
        width: 100,
      },
    ];
    const tanstackColumns = persesColumnsToTanstackColumns(persesColumns);
    expect(tanstackColumns[0]).toEqual(
      expect.objectContaining({
        size: 100,
      })
    );
  });

  test('maps `align` prop to associated `meta` property`', () => {
    const persesColumns: Array<TableColumnConfig<MockTableData>> = [
      {
        accessorKey: 'label',
        header: 'Name',
        align: 'center',
      },
    ];
    const tanstackColumns = persesColumnsToTanstackColumns(persesColumns);
    expect(tanstackColumns[0]).toEqual(
      expect.objectContaining({
        meta: {
          align: 'center',
        },
      })
    );
  });

  test('maps `headerDescription` prop to associated `meta` property`', () => {
    const persesColumns: Array<TableColumnConfig<MockTableData>> = [
      {
        accessorKey: 'label',
        header: 'Name',
        headerDescription: 'The name',
      },
    ];
    const tanstackColumns = persesColumnsToTanstackColumns(persesColumns);
    expect(tanstackColumns[0]).toEqual(
      expect.objectContaining({
        meta: {
          headerDescription: 'The name',
        },
      })
    );
  });

  test('maps `cellDescription` prop to associated `meta` property`', () => {
    const persesColumns: Array<TableColumnConfig<MockTableData>> = [
      {
        accessorKey: 'label',
        header: 'Name',
        cellDescription: true,
      },
    ];
    const tanstackColumns = persesColumnsToTanstackColumns(persesColumns);
    expect(tanstackColumns[0]).toEqual(
      expect.objectContaining({
        meta: {
          cellDescription: true,
        },
      })
    );
  });

  test('defaults `enableSorting` to `false`', () => {
    const persesColumns: Array<TableColumnConfig<MockTableData>> = [
      {
        accessorKey: 'label',
        header: 'Name',
        width: 100,
      },
    ];
    const tanstackColumns = persesColumnsToTanstackColumns(persesColumns);
    expect(tanstackColumns[0]).toEqual(
      expect.objectContaining({
        enableSorting: false,
      })
    );
  });

  test('can set `enableSorting` to `true`', () => {
    const persesColumns: Array<TableColumnConfig<MockTableData>> = [
      {
        accessorKey: 'label',
        header: 'Name',
        width: 100,
        enableSorting: true,
      },
    ];
    const tanstackColumns = persesColumnsToTanstackColumns(persesColumns);
    expect(tanstackColumns[0]).toEqual(
      expect.objectContaining({
        enableSorting: true,
      })
    );
  });

  describe('with defaultColumn config', () => {
    test('applies `enableResizing` from defaultColumn when not set on column', () => {
      const persesColumns: Array<TableColumnConfig<MockTableData>> = [{ accessorKey: 'label', header: 'Name' }];
      const tanstackColumns = persesColumnsToTanstackColumns(persesColumns, { enableResizing: true });
      expect(tanstackColumns[0]).toEqual(
        expect.objectContaining({
          enableResizing: true,
        })
      );
    });

    test('column-level `enableResizing` overrides defaultColumn', () => {
      const persesColumns: Array<TableColumnConfig<MockTableData>> = [
        { accessorKey: 'label', header: 'Name', enableResizing: false },
      ];
      const tanstackColumns = persesColumnsToTanstackColumns(persesColumns, { enableResizing: true });
      expect(tanstackColumns[0]).toEqual(
        expect.objectContaining({
          enableResizing: false,
        })
      );
    });

    test('applies `minWidth` and `maxWidth` from defaultColumn when resizing is enabled', () => {
      const persesColumns: Array<TableColumnConfig<MockTableData>> = [{ accessorKey: 'label', header: 'Name' }];
      const tanstackColumns = persesColumnsToTanstackColumns(persesColumns, {
        enableResizing: true,
        minWidth: 80,
        maxWidth: 500,
      });
      expect(tanstackColumns[0]).toEqual(
        expect.objectContaining({
          minSize: 80,
          maxSize: 500,
        })
      );
    });

    test('uses default min/max widths when resizing is enabled but none are provided in defaultColumn', () => {
      const persesColumns: Array<TableColumnConfig<MockTableData>> = [{ accessorKey: 'label', header: 'Name' }];
      const tanstackColumns = persesColumnsToTanstackColumns(persesColumns, { enableResizing: true });
      expect(tanstackColumns[0]).toEqual(
        expect.objectContaining({
          minSize: 60,
          maxSize: 1000,
        })
      );
    });

    test('uses zero size props for auto-width columns when resizing is disabled (defaultColumn provided)', () => {
      const persesColumns: Array<TableColumnConfig<MockTableData>> = [
        { accessorKey: 'label', header: 'Name', width: 'auto' },
      ];
      const tanstackColumns = persesColumnsToTanstackColumns(persesColumns, { enableResizing: false });
      expect(tanstackColumns[0]).toEqual(
        expect.objectContaining({
          size: 0,
          minSize: 0,
          maxSize: 0,
        })
      );
    });

    test('applies numeric width with min/max from defaultColumn when resizing is enabled', () => {
      const persesColumns: Array<TableColumnConfig<MockTableData>> = [
        { accessorKey: 'value', header: 'Count', width: 200 },
      ];
      const tanstackColumns = persesColumnsToTanstackColumns(persesColumns, {
        enableResizing: true,
        minWidth: 100,
        maxWidth: 400,
      });
      expect(tanstackColumns[0]).toEqual(
        expect.objectContaining({
          size: 200,
          minSize: 100,
          maxSize: 400,
        })
      );
    });
  });

  test('transforms perses columns to tanstack columns', () => {
    const persesColumns: Array<TableColumnConfig<MockTableData>> = [
      {
        accessorKey: 'label',
        header: 'Name',
        width: 'auto',
        align: 'right',
        dataLink: undefined,
      },
      {
        accessorKey: 'value',
        header: 'Count',
        headerDescription: 'The total number of values.',
        width: 120,
        dataLink: undefined,
        cell: (data) => <strong>{data.getValue()}</strong>,
        cellDescription: (data) => `Desc for ${data.getValue()}`,
      },
    ];
    expect(persesColumnsToTanstackColumns(persesColumns)).toMatchSnapshot();
  });
});
