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

import { Box, ButtonBase, Typography, useTheme } from '@mui/material';
import { ReactElement, useMemo, useRef, useState } from 'react';
import { ColumnFilterDropdown } from './ColumnFilterDropDown';
import { TableColumnConfig } from './model/table-model';
import { FilterColumns } from './TableFilters';

interface Props<TableData> extends FilterColumns {
  id: string;
  width?: number | 'auto';
  filters: Array<string | number>;
  borderRight: string;
  column: TableColumnConfig<TableData>;
  columnUniqueValues: Record<string, Array<string | number>>;
  openFilterColumn?: string;
  setOpenFilterColumn: (columnId?: string) => void;
}

export function ColumnFilter<TableData>({
  id,
  width,
  filters,
  column,
  setColumnFilters,
  columnFilters,
  borderRight,
  columnUniqueValues,
  openFilterColumn,
  setOpenFilterColumn,
}: Props<TableData>): ReactElement {
  const theme = useTheme();
  const dropdownId = id.concat('-dropdown');

  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | undefined>(undefined);
  const [calculatedWidth, setCalculatedWidth] = useState<string>('0px');

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>, columnId: string): void => {
    event.preventDefault();
    event.stopPropagation();
    setFilterAnchorEl(event.target as HTMLButtonElement);
    setOpenFilterColumn(columnId);
  };

  const handleFilterClose = (): void => {
    setFilterAnchorEl(undefined);
    setOpenFilterColumn(undefined);
  };

  const updateColumnFilter = (columnId: string, values: Array<string | number>): void => {
    const newFilters = columnFilters.filter((f) => f.id !== columnId);
    if (values.length) {
      newFilters.push({ id: columnId, value: values });
    }
    setColumnFilters(newFilters);
  };

  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [mainContainerDimension, setMainContainerDimension] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const observeDimensionChanges = (htmlElements: ResizeObserverEntry[]): void => {
    if (htmlElements?.length) {
      const targetElement = htmlElements[0]?.target as HTMLElement;
      const width = targetElement.offsetWidth;
      const height = targetElement.offsetHeight;
      setMainContainerDimension({ width, height });
    }
  };

  /**
   * Width is taken from the optional column.width. Therefore, it could be possibly undefined
   * To handle this, we need the actual width of the container to adjust the width of the dropdown. They need to be perfectly aligned
   * Also, using an observer is necessary due to the effects of the toggle view mode which changes the table dimension
   */
  const observer = useRef(new ResizeObserver(observeDimensionChanges));
  if (mainContainerRef.current) {
    observer.current.observe(mainContainerRef.current);
  }

  useMemo(() => {
    if (width !== undefined) {
      setCalculatedWidth(typeof width === 'number' ? `${width}px` : width);
    } else if (mainContainerDimension) {
      setCalculatedWidth(`${mainContainerDimension.width}px`);
    }
  }, [width, mainContainerDimension]);

  return (
    <Box
      key={id}
      data-testid={id}
      ref={mainContainerRef}
      sx={{
        padding: '8px',
        borderRight: borderRight,
        width: width,
        minWidth: width,
        maxWidth: width,
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        boxSizing: 'border-box',
        flex: typeof width === 'number' ? 'none' : '1 1 auto',
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        noWrap
        component="span"
        sx={{
          mr: 1,
          flex: 1,
          fontSize: '12px',
          minWidth: '100px',
        }}
      >
        {filters.length ? `${filters.length} items` : 'All'}
      </Typography>

      <ButtonBase
        onClick={(e) => handleFilterClick(e, column.accessorKey as string)}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          fontSize: '12px',
          color: filters.length ? 'primary.main' : 'text.secondary',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          minWidth: '20px',
          height: '24px',
          flexShrink: 0,
          transition: (theme) => theme.transitions.create('all', { duration: 200 }),
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        ▼
      </ButtonBase>
      {filterAnchorEl && (
        <ColumnFilterDropdown
          anchor={filterAnchorEl}
          open={openFilterColumn === column.accessorKey}
          id={dropdownId}
          width={calculatedWidth}
          allValues={columnUniqueValues[column.accessorKey as string] || []}
          selectedValues={filters}
          onFilterChange={(values) => updateColumnFilter(column.accessorKey as string, values)}
          theme={theme}
          handleFilterClose={handleFilterClose}
        />
      )}
    </Box>
  );
}
