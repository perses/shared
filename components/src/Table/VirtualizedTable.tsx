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

import { Box, TableRow as MuiTableRow, TablePagination } from '@mui/material';
import { Column, HeaderGroup, Row, flexRender } from '@tanstack/react-table';
import { ReactElement, useMemo, useRef } from 'react';
import { TableComponents, TableVirtuoso, TableVirtuosoHandle, TableVirtuosoProps } from 'react-virtuoso';
import { SelectionActionError, SelectionErrorIndicator } from '../SelectionActions';
import { useVirtualizedTableKeyboardNav } from './hooks/useVirtualizedTableKeyboardNav';
import { InnerTable } from './InnerTable';
import { TableCellConfigs, TableProps, TableRowEventOpts } from './model/table-model';
import { TableBody } from './TableBody';
import { TableCell, TableCellProps } from './TableCell';
import { TableFoot } from './TableFoot';
import { TableHead } from './TableHead';
import { TableHeaderCell } from './TableHeaderCell';
import { TableRow } from './TableRow';
import { VirtualizedTableContainer } from './VirtualizedTableContainer';

type TableCellPosition = {
  row: number;
  column: number;
};

export type VirtualizedTableProps<TableData> = Required<
  Pick<TableProps<TableData>, 'height' | 'width' | 'density' | 'defaultColumnWidth' | 'defaultColumnHeight'>
> &
  Pick<TableProps<TableData>, 'onRowMouseOver' | 'onRowMouseOut' | 'pagination' | 'onPaginationChange'> & {
    onRowClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, id: string) => void;
    rows: Array<Row<TableData>>;
    columns: Array<Column<TableData, unknown>>;
    headers: Array<HeaderGroup<TableData>>;
    cellConfigs?: TableCellConfigs;
    rowCount: number;
    /**
     * Map of row IDs to error information for rows where action execution failed.
     */
    rowErrors?: Record<string, SelectionActionError>;
    /**
     * Callback fired when a user dismisses an error indicator on a row.
     */
    onRowErrorDismiss?: (rowId: string) => void;
  };

// Separating out the virtualized table because we may want a paginated table
// in the future that does not need virtualization, and we'd likely lay them
// out differently.
export function VirtualizedTable<TableData>({
  width,
  height,
  density,
  defaultColumnWidth,
  defaultColumnHeight,
  onRowClick,
  onRowMouseOver,
  onRowMouseOut,
  rows,
  columns,
  headers,
  cellConfigs,
  pagination,
  onPaginationChange,
  rowCount,
  rowErrors,
  onRowErrorDismiss,
}: VirtualizedTableProps<TableData>): ReactElement {
  const virtuosoRef = useRef<TableVirtuosoHandle>(null);
  // Use a ref for these values because they are only needed for keyboard
  // focus interactions and setting them on state will lead to a significant
  // amount of unnecessary re-renders.
  const visibleRange = useRef({
    startIndex: 0,
    endIndex: 0,
  });

  const setVisibleRange: TableVirtuosoProps<TableData, unknown>['rangeChanged'] = (newVisibleRange) => {
    visibleRange.current = newVisibleRange;
  };

  const keyboardNav = useVirtualizedTableKeyboardNav({
    visibleRange: visibleRange,
    virtualTable: virtuosoRef,

    // We add 1 here for the header.
    maxRows: rows.length + 1,
    maxColumns: columns.length,
  });

  const getFocusState = (cellPosition: TableCellPosition): TableCellProps['focusState'] => {
    if (cellPosition.row === keyboardNav.activeCell.row && cellPosition.column === keyboardNav.activeCell.column) {
      return keyboardNav.isActive ? 'trigger-focus' : 'focus-next';
    }

    return 'none';
  };

  const VirtuosoTableComponents: TableComponents<TableData> = useMemo(() => {
    return {
      Scroller: VirtualizedTableContainer,
      Table: (props): ReactElement => {
        return <InnerTable {...props} width={width} density={density} onKeyDown={keyboardNav.onTableKeyDown} />;
      },
      TableHead,
      TableFoot,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      TableRow: ({ item, ...props }): ReactElement | null => {
        const index = props['data-index'];
        const row = rows[index];
        if (!row) {
          return null;
        }

        const rowEventOpts: TableRowEventOpts = { id: row.id, index: row.index };

        return (
          <TableRow
            {...props}
            onClick={(e) => onRowClick(e, row.id)}
            density={density}
            onMouseOver={(e) => {
              onRowMouseOver?.(e, rowEventOpts);
            }}
            onMouseOut={(e) => {
              onRowMouseOut?.(e, rowEventOpts);
            }}
          />
        );
      },
      TableBody,
    };
  }, [density, keyboardNav.onTableKeyDown, onRowClick, onRowMouseOut, onRowMouseOver, rows, width]);

  const handleChangePage = (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number): void => {
    if (!pagination || !onPaginationChange) return;
    onPaginationChange({ ...pagination, pageIndex: newPage });
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    if (!pagination || !onPaginationChange) return;
    onPaginationChange({ pageIndex: 0, pageSize: parseInt(event.target.value, 10) });
  };

  return (
    <Box style={{ width, height }}>
      <TableVirtuoso
        ref={virtuosoRef}
        totalCount={rows.length}
        components={VirtuosoTableComponents}
        // Note: this value is impacted by overscan. See this issue if overscan
        // is added.
        // https://github.com/petyosi/react-virtuoso/issues/118#issuecomment-642156138
        rangeChanged={setVisibleRange}
        fixedHeaderContent={() => {
          return (
            <>
              {headers.map((headerGroup) => {
                return (
                  <TableRow key={headerGroup.id} density={density}>
                    {headerGroup.headers.map((header, i, headers) => {
                      const column = header.column;
                      const position: TableCellPosition = {
                        row: 0,
                        column: i,
                      };

                      const isSorted = column.getIsSorted();
                      const nextSorting = column.getNextSortingOrder();

                      return (
                        <TableHeaderCell
                          key={header.id}
                          onSort={column.getCanSort() ? column.getToggleSortingHandler() : undefined}
                          sortDirection={typeof isSorted === 'string' ? isSorted : undefined}
                          nextSortDirection={typeof nextSorting === 'string' ? nextSorting : undefined}
                          width={column.getSize() || defaultColumnWidth}
                          defaultColumnHeight={defaultColumnHeight}
                          align={column.columnDef.meta?.align}
                          variant="head"
                          density={density}
                          description={column.columnDef.meta?.headerDescription}
                          focusState={getFocusState(position)}
                          onFocusTrigger={() => keyboardNav.onCellFocus(position)}
                          isFirstColumn={i === 0}
                          isLastColumn={i === headers.length - 1}
                        >
                          {flexRender(column.columnDef.header, header.getContext())}
                        </TableHeaderCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </>
          );
        }}
        fixedFooterContent={
          pagination
            ? (): ReactElement => (
                <MuiTableRow sx={{ backgroundColor: (theme) => theme.palette.background.default }}>
                  <TablePagination
                    colSpan={columns.length}
                    count={rowCount}
                    page={pagination.pageIndex}
                    rowsPerPage={pagination.pageSize}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </MuiTableRow>
              )
            : undefined
        }
        itemContent={(index) => {
          const row = rows[index];
          if (!row) {
            return null;
          }

          // Check if this row has an error
          const rowError = rowErrors?.[row.id];

          return (
            <>
              {row.getVisibleCells().map((cell, i, cells) => {
                const position: TableCellPosition = {
                  row: index + 1,
                  column: i,
                };

                const cellContext = cell.getContext();
                const cellConfig = cellConfigs?.[cellContext.cell.id];

                const cellRenderFn = cell.column.columnDef.cell;
                const cellContent = typeof cellRenderFn === 'function' ? cellRenderFn(cellContext) : null;

                /* 
                   IMPORTANT:
                   If Variables exist in the link, they should have been translated by the plugin already. (Being developed at the moment)
                   Components have no access to any context (Which is intentional and correct)
                   We may want to add parameters to a link from neighboring cells in the future as well.
                   If this is the case, the value of the neighboring cells should be read from here and be replaced. (Bing discussed at the moment, not decided yet)
                */

                const cellDescriptionDef = cell.column.columnDef.meta?.cellDescription;
                let description: string | undefined = undefined;
                if (typeof cellDescriptionDef === 'function') {
                  // If the cell description is a function, set the value using
                  // the function.
                  description = cellDescriptionDef(cellContext);
                } else if (cellDescriptionDef && typeof cellContent === 'string') {
                  // If the cell description is `true` AND the cell content is
                  // a string (and thus viable as a `title` attribute), use the
                  // cell content.
                  description = cellContent;
                }

                /* this has been specifically added for the data link, 
                   therefore, non string and numeric values should be excluded
                */
                const adjacentCellsValuesMap = Object.entries(row.original as Record<string, unknown>)
                  ?.filter(([_, value]) => ['string', 'number'].includes(typeof value))
                  .reduce(
                    (acc, [key, value]) => ({
                      ...acc,
                      [key]: String(value),
                    }),
                    {}
                  );

                // Show error indicator in the first non-checkbox cell
                const showErrorIndicator = rowError && i === 0;

                return (
                  <TableCell
                    key={cell.id}
                    data-testid={cell.id}
                    title={description || cellConfig?.text || cellContent}
                    width={cell.column.getSize() || defaultColumnWidth}
                    defaultColumnHeight={defaultColumnHeight}
                    align={cell.column.columnDef.meta?.align}
                    density={density}
                    focusState={getFocusState(position)}
                    onFocusTrigger={() => keyboardNav.onCellFocus(position)}
                    isFirstColumn={i === 0}
                    isLastColumn={i === cells.length - 1}
                    description={description}
                    color={cellConfig?.textColor ?? undefined}
                    backgroundColor={cellConfig?.backgroundColor ?? undefined}
                    dataLink={cell.column.columnDef.meta?.dataLink}
                    adjacentCellsValuesMap={adjacentCellsValuesMap}
                  >
                    {cellConfig?.text || cellContent}
                    {showErrorIndicator && onRowErrorDismiss && (
                      <SelectionErrorIndicator error={rowError} onDismiss={onRowErrorDismiss} />
                    )}
                  </TableCell>
                );
              })}
            </>
          );
        }}
      />
    </Box>
  );
}
