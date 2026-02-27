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

import { ReactElement } from 'react';
import { Box, Checkbox, Divider, FormControlLabel, Theme, Typography, Popover } from '@mui/material';

interface Props {
  id: string;
  allValues: Array<string | number>;
  selectedValues: Array<string | number>;
  onFilterChange: (values: Array<string | number>) => void;
  handleFilterClose: () => void;
  theme: Theme;
  width: string;
  anchor: HTMLButtonElement;
  open: boolean;
}

export const ColumnFilterDropdown = ({
  id,
  allValues,
  selectedValues,
  onFilterChange,
  handleFilterClose,
  theme,
  width,
  open,
  anchor,
}: Props): ReactElement => {
  const values = [...new Set(allValues)].filter((v) => v !== null).sort();

  if (!values.length) {
    return (
      <Popover
        sx={{ marginTop: '4px', marginLeft: '8px' }}
        open={open}
        anchorEl={anchor}
        onClose={handleFilterClose}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <Box
          data-filter-dropdown
          data-testid={id}
          sx={{
            width: width,
            padding: 10,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[4],
          }}
        >
          <Typography sx={{ color: theme.palette.text.secondary, fontSize: 14 }}>No values found</Typography>
        </Box>
      </Popover>
    );
  }

  return (
    <Popover
      sx={{ marginTop: '4px', marginLeft: '8px' }}
      open={open}
      anchorEl={anchor}
      onClose={handleFilterClose}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
    >
      <Box
        data-filter-dropdown
        data-testid={id}
        sx={{
          width: width,
          padding: '10px',
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[4],
          maxHeight: 250,
          overflowY: 'auto',
        }}
      >
        <Box style={{ marginBottom: 8, fontSize: 14, fontWeight: 'bold' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedValues.length === values.length && values.length > 0}
                onChange={(e) => onFilterChange(e.target.checked ? values : [])}
                indeterminate={selectedValues.length > 0 && selectedValues.length < values.length}
              />
            }
            label={<Typography sx={{ color: 'text.primary' }}>Select All ({values.length})</Typography>}
          />
        </Box>
        <Divider sx={{ my: 1 }} />
        {values.map((value, index) => (
          <Box key={`value-${index}`} style={{ marginBottom: 4 }}>
            <FormControlLabel
              sx={{
                display: 'flex',
                alignItems: 'center',
                padding: '2px 0',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              control={
                <Checkbox
                  size="small"
                  checked={selectedValues.includes(value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onFilterChange([...selectedValues, value]);
                    } else {
                      onFilterChange(selectedValues.filter((v) => v !== value));
                    }
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: 'text.primary', fontSize: 14 }}>
                  {!value && value !== 0 ? '(empty)' : String(value)}
                </Typography>
              }
            />
          </Box>
        ))}
      </Box>
    </Popover>
  );
};
