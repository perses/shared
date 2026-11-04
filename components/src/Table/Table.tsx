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

import { Stack, useTheme } from '@mui/material';
import type {
  ColumnDef,
  ColumnVisibilityState,
  ExpandedState,
  OnChangeFn,
  Row,
  RowData,
  RowSelectionState,
  SortingState,
  Table as TanstackTable,
} from '@tanstack/react-table';
import { useTable } from '@tanstack/react-table';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { useFuzzySearch } from './hooks/useFuzzySearch';
import type { TableProps, TableFeatures } from './model/table-model';
import { DEFAULT_COLUMN_WIDTH, persesColumnsToTanstackColumns, TABLE_FEATURES } from './model/table-model';
export type { TableFeatures } from './model/table-model';
import { TableCheckbox } from './TableCheckbox';
import { VirtualizedTable } from './VirtualizedTable';

const DEFAULT_GET_ROW_ID = (data: unknown, index: number): string => {
  return `${index}`;
};

// Setting these defaults one enables them to be consistent across renders instead
// of being recreated every time, which can be important for perf because react
// does not do deep equality checking for objects and arrays.
const DEFAULT_ROW_SELECTION: NonNullable<TableProps<Record<string, unknown>>['rowSelection']> = {};
const DEFAULT_SORTING: NonNullable<TableProps<Record<string, unknown>>['sorting']> = [];

/**
 * Component used to render tabular data in Perses use cases. This component is
 * **not** intended to be a general use data table for use cases unrelated to Perses.
 *
 * **Note: This component is currently experimental and is likely to have significant breaking changes in the near future. Use with caution outside of the core Perses codebase.**
 */
export function Table<TableData extends RowData>({
  data,
  columns,
  cellConfigs,
  density = 'standard',
  defaultColumnWidth = DEFAULT_COLUMN_WIDTH,
  defaultColumnHeight = 'auto',
  checkboxSelection,
  onRowSelectionChange,
  onSortingChange,
  getCheckboxColor,
  getRowId = DEFAULT_GET_ROW_ID,
  rowSelection = DEFAULT_ROW_SELECTION,
  sorting = DEFAULT_SORTING,
  getItemActions,
  hasItemActions,
  pagination,
  onPaginationChange,
  rowSelectionVariant = 'standard',
  getSubRows,
  hiddenColumns,
  tableToolbarConfig,
  columnResizeMode = 'onChange',
  defaultColumnConfig,
  ...otherProps
}: TableProps<TableData>): ReactElement {
  const theme = useTheme();

  const hasSubRows = !!getSubRows;

  const [expanded, setExpanded] = useState<ExpandedState>({});

  const { globalFilter, setGlobalFilter, fuzzySearchOptions } = useFuzzySearch<TableData>(
    tableToolbarConfig?.isSearchEnabled,
    tableToolbarConfig?.fuzzyMatchThreshold ?? 'CONTAINS',
    expanded,
    setExpanded,
  );

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>(
    hiddenColumns?.reduce((acc, columnId) => ({ ...acc, [columnId]: false }), {}) ?? {},
  );

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (rowSelectionUpdater) => {
    const newRowSelection =
      typeof rowSelectionUpdater === 'function' ? rowSelectionUpdater(rowSelection) : rowSelectionUpdater;
    onRowSelectionChange?.(newRowSelection);
  };

  const handleRowSelectionEvent = useCallback(
    (table: TanstackTable<TableFeatures, TableData>, row: Row<TableFeatures, TableData>, isModified: boolean) => {
      if (rowSelectionVariant === 'standard' || isModified) {
        row.toggleSelected();
      } else {
        // Legend variant (when action not modified with shift/meta key).
        // Note that this behavior needs to be kept in sync with behavior in
        // the Legend component for list-based legends.
        if (row.getIsSelected() && !table.getIsAllRowsSelected()) {
          // Row was already selected. Revert to select all.
          table.toggleAllRowsSelected();
        } else {
          // Focus the selected row.
          onRowSelectionChange?.({
            [row.id]: true,
          });
        }
      }
    },
    [onRowSelectionChange, rowSelectionVariant],
  );

  const handleCheckboxChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      table: TanstackTable<TableFeatures, TableData>,
      row: Row<TableFeatures, TableData>,
    ) => {
      const nativePointerEvent =
        e.nativeEvent && (e.nativeEvent instanceof MouseEvent || e.nativeEvent instanceof KeyboardEvent)
          ? e.nativeEvent
          : undefined;
      const isModifed = !!nativePointerEvent?.metaKey || !!nativePointerEvent?.shiftKey;
      handleRowSelectionEvent(table, row, isModifed);
    },
    [handleRowSelectionEvent],
  );

  const handleSortingChange: OnChangeFn<SortingState> = (sortingUpdater) => {
    const newSorting = typeof sortingUpdater === 'function' ? sortingUpdater(sorting) : sortingUpdater;
    onSortingChange?.(newSorting);
  };

  const actionsColumn: ColumnDef<TableFeatures, TableData> = useMemo(() => {
    return {
      id: 'itemActions',
      header: 'Actions',
      cell: ({ row }): ReactElement => {
        return (
          <Stack direction="row" alignItems="center">
            {getItemActions?.({ id: row.id, data: row.original })}
          </Stack>
        );
      },
      enableSorting: false,
      enableResizing: false,
    };
  }, [getItemActions]);

  const checkboxColumn: ColumnDef<TableFeatures, TableData> = useMemo(() => {
    return {
      id: 'checkboxRowSelect',
      size: 28,
      header: ({ table }): ReactElement => {
        return (
          <TableCheckbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            color={theme.palette.text.primary}
            density={density}
          />
        );
      },
      cell: ({ row, table }): ReactElement => {
        return (
          <TableCheckbox
            checked={row.getIsSelected()}
            indeterminate={row.getIsSomeSelected()}
            onChange={(e) => {
              handleCheckboxChange(e, table, row);
            }}
            color={getCheckboxColor?.(row.original)}
            density={density}
          />
        );
      },
      enableSorting: false,
      enableResizing: false,
    };
  }, [theme.palette.text.primary, density, getCheckboxColor, handleCheckboxChange]);

  const tableColumns: Array<ColumnDef<TableFeatures, TableData>> = useMemo(() => {
    const initTableColumns = persesColumnsToTanstackColumns(columns, defaultColumnConfig);

    if (hasItemActions) {
      initTableColumns.unshift(actionsColumn);
    }

    if (checkboxSelection) {
      initTableColumns.unshift(checkboxColumn);
    }

    return initTableColumns;
  }, [columns, defaultColumnConfig, hasItemActions, checkboxSelection, actionsColumn, checkboxColumn]);

  const table = useTable({
    features: TABLE_FEATURES,
    ...fuzzySearchOptions,
    data: data,
    columns: tableColumns,
    getRowId: getRowId,
    // manualPagination: true disables the paginated row model for this render,
    // allowing switching between paginated and unpaginated at runtime.
    manualPagination: !pagination,
    enableRowSelection: !!checkboxSelection,
    onRowSelectionChange: handleRowSelectionChange,
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    getSubRows: getSubRows,
    // For now, defaulting to sort by descending first. We can expose the ability
    // to customize it if/when we have use cases for it.
    sortDescFirst: true,
    columnResizeMode,
    onExpandedChange: setExpanded,
    state: {
      rowSelection,
      sorting,
      globalFilter: tableToolbarConfig?.isSearchEnabled ? globalFilter : undefined,
      columnVisibility,
      ...(pagination ? { pagination } : {}),
      expanded,
    },
  });

  // Use the row's stable core table rather than `table`, whose identity changes
  // with every state update and would otherwise remount all virtualized rows.
  const handleRowClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>, row: Row<TableFeatures, TableData>) => {
      const isModifiedClick = e.metaKey || e.shiftKey;
      handleRowSelectionEvent(row.table, row, isModifiedClick);
    },
    [handleRowSelectionEvent],
  );

  return (
    <VirtualizedTable
      {...otherProps}
      density={density}
      defaultColumnWidth={defaultColumnWidth}
      defaultColumnHeight={defaultColumnHeight}
      onRowClick={handleRowClick}
      table={table}
      cellConfigs={cellConfigs}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      toolbarConfig={{
        isSearchEnabled: tableToolbarConfig?.isSearchEnabled,
        globalFilter,
        onGlobalFilterChange: setGlobalFilter,
        isColumnFilterEnabled: tableToolbarConfig?.isColumnFilterEnabled,
        columns: table.getAllColumns(),
        columnFilterMenuMaxHeight: tableToolbarConfig?.columnFilterMenuMaxHeight,
        isExpandAllEnabled: hasSubRows,
        isAllExpanded: table.getIsAllRowsExpanded(),
        onExpandAllChange: table.getToggleAllRowsExpandedHandler(),
      }}
    />
  );
}
