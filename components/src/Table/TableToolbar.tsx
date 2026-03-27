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

import { Button, Checkbox, ListItemText, Menu, MenuItem, Stack } from '@mui/material';
import { Column } from '@tanstack/react-table';
import { ReactElement, useState } from 'react';
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
}

export function TableToolbar<TableData>({
  showSearch,
  globalFilter,
  onGlobalFilterChange,
  showColumnFilter,
  columns,
}: TableToolbarProps<TableData>): ReactElement | null {
  const [colMenuAnchor, setColMenuAnchor] = useState<null | HTMLElement>(null);
  const colMenuOpen = Boolean(colMenuAnchor);

  if (!showSearch && !showColumnFilter) {
    return null;
  }

  return (
    <Stack
      direction="row"
      gap={1}
      alignItems="center"
      justifyContent="flex-end"
      width="100%"
      paddingY="0.5rem"
      sx={{ backgroundColor: (theme) => theme.palette.background.default }}
    >
      {showSearch && (
        <TextField
          size="small"
          placeholder="Search…"
          value={globalFilter}
          onChange={onGlobalFilterChange}
          slotProps={{ htmlInput: { 'aria-label': 'search table' } }}
        />
      )}
      {showColumnFilter && (
        <>
          <Button
            variant="outlined"
            onClick={(e) => setColMenuAnchor(e.currentTarget)}
            aria-haspopup="listbox"
            aria-expanded={colMenuOpen}
          >
            Columns
          </Button>
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
