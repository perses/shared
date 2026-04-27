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

import { TableSortLabel, Typography, tableSortLabelClasses, Box, Divider } from '@mui/material';
import { ReactElement } from 'react';
import { TableCell, TableCellProps } from './TableCell';
import { SortDirection } from './model/table-model';

export interface TableHeaderCellProps extends TableCellProps {
  /**
   * Handler called when a sort event is triggered.
   * When specified, the header will include sorting interactions and indicators.
   */
  onSort?: ((event: unknown) => void) | undefined;

  /**
   * The current direction the header is sorted.
   */
  sortDirection?: SortDirection;

  /**
   * The next direction the header will be sorted when another sort action
   * is triggered via click/keyboard. This impacts some UI interactions (e.g.
   * the direction of the sort arrow on hover f the column is currently
   * unsorted.)
   */
  nextSortDirection?: SortDirection;

  /**
   * Configuration for column resizing interactions.
   * When included, the header will include a resize handle (divider).
   */
  resizeConfig?: ResizeConfig;
}
interface ResizeConfig {
  /**
   * Handler called when a column resize event is triggered.
   */
  resizeHandler: (event: unknown) => void;
  /**
   * Handler called when a column reset size event is triggered (double click on the resize handle).
   */
  resetSizeHandler: () => void;

  /**
   * Indicates whether the column is currently being resized.
   */
  isResizing: boolean;
}

export function TableHeaderCell({
  onSort,
  sortDirection,
  nextSortDirection,
  children,
  resizeConfig,
  ...cellProps
}: TableHeaderCellProps): ReactElement {
  const showSortLabel = !!onSort;

  const headerText = (
    <Typography noWrap variant="inherit" component="div" color="inherit">
      {children}
    </Typography>
  );

  const isActive = !!sortDirection;
  const direction = isActive ? sortDirection : nextSortDirection;

  return (
    <TableCell {...cellProps}>
      {showSortLabel ? (
        <TableSortLabel
          onClick={onSort}
          direction={direction}
          active={isActive}
          sx={{
            // Overrides a default vertical alignment in the CSS that changes
            // the header vertical rhythm in a way that's inconsistent with
            // non-sorting headers.
            verticalAlign: 'unset',

            // Makes it possible to ellipsize the text if it's too long.
            maxWidth: '100%',

            // Make the arrow visible when focused using the keyboard to assist
            // with a11y.
            '&:focus-visible': {
              [`& .${tableSortLabelClasses.icon}`]: {
                opacity: isActive ? 1 : 0.5,
              },
            },
          }}
        >
          {headerText}
        </TableSortLabel>
      ) : (
        headerText
      )}
      {resizeConfig && (
        <Box
          onMouseDown={(e) => {
            if (e.detail === 2) {
              resizeConfig.resetSizeHandler();
              return;
            }
            resizeConfig.resizeHandler(e);
          }}
          onTouchStart={resizeConfig.resizeHandler}
          sx={{
            position: 'absolute',
            height: '100%',
            top: 0,
            right: '4px',
            cursor: 'col-resize',
          }}
        >
          <Divider
            flexItem
            orientation="vertical"
            sx={(theme) => ({
              backgroundColor: resizeConfig.isResizing ? theme.palette.action.active : theme.palette.divider,
              borderRadius: '2px',
              borderWidth: '2px',
              height: '100%',
              touchAction: 'none',
              transform: 'translateX(4px)',
              userSelect: 'none',
            })}
          />
        </Box>
      )}
    </TableCell>
  );
}
