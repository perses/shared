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

import { Checkbox, IconButton, InputAdornment, ListItemText, Menu, MenuItem, Stack } from '@mui/material';
import { Column } from '@tanstack/react-table';
import { ReactElement, useCallback, useState } from 'react';
import Magnify from 'mdi-material-ui/Magnify';
import Close from 'mdi-material-ui/Close';
import ViewColumn from 'mdi-material-ui/ViewColumn';
import { TextField } from '../controls';

export interface TableToolbarProps<TableData> {
  /**
   * When `true`, a search input is rendered.
   */
  showSearch?: boolean;

  /**
   * Current value of the global filter / search query.
   */
  globalFilter: string;

  /**
   * Callback fired when the search query changes.
   */
  onGlobalFilterChange: (value: string) => void;

  /**
   * When `true`, a "Columns" button is rendered that opens a column visibility dropdown.
   */
  showColumnFilter?: boolean;

  /**
   * All columns from the table instance, used to build the visibility menu.
   */
  columns: Array<Column<TableData>>;
  /**
   * The width of the toolbar, used to determine when to switch to a more compact layout.
   */
  width: number | string;
}

export function TableToolbar<TableData>({
  showSearch,
  globalFilter,
  onGlobalFilterChange,
  showColumnFilter,
  columns,
  width,
}: TableToolbarProps<TableData>): ReactElement | null {
  const [colMenuAnchor, setColMenuAnchor] = useState<null | HTMLElement>(null);
  const colMenuOpen = Boolean(colMenuAnchor);
  const [searchResetKey, setSearchResetKey] = useState(0);

  const handleSearchClear = useCallback(() => {
    onGlobalFilterChange('');
    setSearchResetKey((prev) => prev + 1);
  }, [onGlobalFilterChange]);

  if (!showSearch && !showColumnFilter) {
    return null;
  }

  return (
    <Stack
      direction="row"
      gap={1}
      alignItems="center"
      justifyContent="flex-end"
      width={width}
      padding="0.5rem"
      sx={{ backgroundColor: (theme) => theme.palette.background.default }}
    >
      {showSearch && (
        <TextField
          key={searchResetKey}
          placeholder="Search…"
          value={globalFilter}
          onChange={onGlobalFilterChange}
          variant="standard"
          slotProps={{
            htmlInput: { 'aria-label': 'search table' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Magnify fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: globalFilter !== '' && (
                <InputAdornment position="end">
                  <IconButton onClick={handleSearchClear}>
                    <Close fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{ flexGrow: 1 }}
        />
      )}
      {showColumnFilter && (
        <>
          <IconButton
            onClick={(e) => setColMenuAnchor(e.currentTarget)}
            aria-haspopup="listbox"
            aria-expanded={colMenuOpen}
            color="info"
          >
            <ViewColumn />
          </IconButton>
          <Menu
            anchorEl={colMenuAnchor}
            open={colMenuOpen}
            onClose={() => setColMenuAnchor(null)}
            slotProps={{ list: { dense: true } }}
          >
            {columns.map((column) => {
              const header = column.columnDef.header;
              const label = typeof header === 'string' ? header : column.id;
              return (
                <MenuItem
                  key={column.id}
                  disabled={!column.getCanHide()}
                  onClick={column.getCanHide() ? column.getToggleVisibilityHandler() : undefined}
                  dense
                >
                  <Checkbox
                    checked={column.getIsVisible()}
                    disabled={!column.getCanHide()}
                    size="small"
                    disableRipple
                    sx={{ p: 0, mr: 1 }}
                  />
                  <ListItemText primary={label} />
                </MenuItem>
              );
            })}
          </Menu>
        </>
      )}
    </Stack>
  );
}
