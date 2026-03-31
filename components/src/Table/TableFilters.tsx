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

import { Box, useTheme } from '@mui/material';
import { ReactElement, useMemo, useState } from 'react';
import { ColumnFiltersState } from '@tanstack/react-table';

import { TableProps } from './model/table-model';
import { ColumnFilter } from './ColumnFilter';

type FilterFields = 'columns' | 'width' | 'data';

export interface FilterColumns {
  columnFilters: ColumnFiltersState;
  setColumnFilters: (filters: ColumnFiltersState) => void;
}

export function TableFilter<TableData>({
  columns,
  width,
  data,
  columnFilters,
  setColumnFilters,
}: Pick<TableProps<TableData>, FilterFields> & FilterColumns): ReactElement {
  const theme = useTheme();
  const [openFilterColumn, setOpenFilterColumn] = useState<string | undefined>(undefined);

  const getSelectedFilterValues = (columnId: string): Array<string | number> => {
    const filter = columnFilters.find((f) => f.id === columnId);
    return filter ? (filter.value as Array<string | number>) : [];
  };

  const columnUniqueValues = useMemo(() => {
    const uniqueValues: Record<string, Array<string | number>> = {};
    const keys: Set<string> = new Set();
    data.forEach((entry) => {
      Object.keys(entry as object).forEach((k) => keys.add(k));
    });

    keys.forEach((key) => {
      const values = data.map((row) => (row as Record<string, unknown>)[key]).filter((i) => i !== undefined);
      uniqueValues[key] = Array.from(new Set(values as Array<string | number>));
    });

    return uniqueValues;
  }, [data]);

  return (
    <Box
      sx={{
        display: 'flex',
        background: theme.palette.background.default,
        borderBottom: `1px solid ${theme.palette.divider}`,
        width: width,
        boxSizing: 'border-box',
      }}
    >
      {columns.map((column, idx) => {
        const filters = getSelectedFilterValues(column.accessorKey as string);
        const borderRight = idx < columns.length - 1 ? `1px solid ${theme.palette.divider}` : 'none';
        const columnFilterId = `filter-${idx}`;
        return (
          <ColumnFilter
            key={columnFilterId}
            id={columnFilterId}
            width={column.width}
            filters={filters}
            borderRight={borderRight}
            column={column}
            setOpenFilterColumn={setOpenFilterColumn}
            openFilterColumn={openFilterColumn}
            columnFilters={columnFilters}
            setColumnFilters={setColumnFilters}
            columnUniqueValues={columnUniqueValues}
          />
        );
      })}
    </Box>
  );
}
