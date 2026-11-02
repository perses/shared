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

import type { SxProps, Theme } from '@mui/material';
import {
  Checkbox,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Popover,
  Tooltip,
  Typography,
} from '@mui/material';
import Close from 'mdi-material-ui/Close';
import FilterVariant from 'mdi-material-ui/FilterVariant';
import Magnify from 'mdi-material-ui/Magnify';
import type { ReactElement } from 'react';
import React, { useCallback, useId, useMemo, useRef, useState } from 'react';

import { TextField } from '../controls';

export interface TableColumnFilterDropdownProps {
  /** Map of all distinct values present in the column to their occurrence counts. */
  uniqueValues: Map<unknown, number>;
  /**
   * The currently active filter values. Membership is checked via `Array.includes`, which uses
   * reference equality — object values must be the same references as those in `uniqueValues`.
   */
  filterValues: unknown[];
  onFilterChange: (values: unknown[]) => void;
}

const styles = {
  popoverAnchorOrigin: { vertical: 'bottom', horizontal: 'left' },
  popoverTransformOrigin: { vertical: 'top', horizontal: 'left' },
  search: { px: 1, pt: 1, pb: 0.5 },
  list: { minWidth: 160, maxWidth: 280, maxHeight: 280, overflowY: 'auto' },
  listItem: { px: 1, cursor: 'pointer', userSelect: 'none' },
  checkbox: { p: 0, mr: 1 },
} as const;

export function TableColumnFilterDropdown({
  uniqueValues,
  filterValues,
  onFilterChange,
}: TableColumnFilterDropdownProps): ReactElement {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = anchorEl !== null;
  const labelId = useId();
  const [searchQuery, setSearchQuery] = useState('');
  // `TextField` keeps its own debounced internal value, so clearing `searchQuery` alone does not
  // reset the visible text.
  const [searchKey, setSearchKey] = useState(0);

  const sortedEntries = useMemo(
    () => [...uniqueValues.entries()].toSorted(([a], [b]) => String(a).localeCompare(String(b))),
    [uniqueValues],
  );

  const visibleEntries = useMemo(() => {
    if (!searchQuery) return sortedEntries;
    const lower = searchQuery.toLowerCase();
    return sortedEntries.filter(([value]) => String(value).toLowerCase().includes(lower));
  }, [sortedEntries, searchQuery]);

  const { isActive, allVisibleSelected, someVisibleSelected } = useMemo(() => {
    const active = filterValues.length > 0;
    const allVisible = visibleEntries.length > 0 && visibleEntries.every(([v]) => filterValues.includes(v));
    const someVisible = visibleEntries.some(([v]) => filterValues.includes(v));
    return { isActive: active, allVisibleSelected: allVisible, someVisibleSelected: someVisible && !allVisible };
  }, [filterValues, visibleEntries]);

  const iconButtonSx: SxProps<Theme> = useCallback(
    (theme: Theme) => ({
      padding: theme.spacing(0.25),
      color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
      opacity: isActive ? 1 : 0.5,
      '&:hover': { opacity: 1 },
    }),
    [isActive],
  );

  const handleFocus = useCallback((e: React.FocusEvent) => e.stopPropagation(), []);

  const handleOpenClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setAnchorEl(anchorRef.current);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setSearchQuery('');
    setSearchKey((k) => k + 1);
  }, []);

  const handlePopoverClick = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);
  const handlePopoverKeyUp = useCallback((e: React.KeyboardEvent) => e.stopPropagation(), []);

  const handleToggleAll = useCallback((): void => {
    if (allVisibleSelected) {
      const visibleSet = new Set(visibleEntries.map(([v]) => v));
      onFilterChange(filterValues.filter((v) => !visibleSet.has(v)));
    } else {
      const toAdd = visibleEntries.map(([v]) => v).filter((v) => !filterValues.includes(v));
      onFilterChange([...filterValues, ...toAdd]);
    }
  }, [allVisibleSelected, filterValues, onFilterChange, visibleEntries]);

  const handleToggleValue = useCallback(
    (value: unknown): void => {
      if (filterValues.includes(value)) {
        onFilterChange(filterValues.filter((v) => v !== value));
      } else {
        onFilterChange([...filterValues, value]);
      }
    },
    [filterValues, onFilterChange],
  );

  const selectAllLabel = allVisibleSelected ? 'Clear all' : 'Select all';

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
    setSearchKey((k) => k + 1);
  }, []);

  const searchEndAdornment = useMemo(
    () =>
      searchQuery ? (
        <InputAdornment position="end">
          <IconButton size="small" aria-label="clear search" onClick={handleSearchClear}>
            <Close fontSize="small" />
          </IconButton>
        </InputAdornment>
      ) : null,
    [searchQuery, handleSearchClear],
  );

  const searchSlotProps = useMemo(
    () => ({
      htmlInput: { 'aria-label': 'search filter values' },
      input: {
        startAdornment: (
          <InputAdornment position="start">
            <Magnify fontSize="small" />
          </InputAdornment>
        ),
        endAdornment: searchEndAdornment,
      },
    }),
    [searchEndAdornment],
  );

  return (
    <>
      <Tooltip title="Filter" enterDelay={500} enterNextDelay={500}>
        <IconButton
          ref={anchorRef}
          size="small"
          aria-label="filter column"
          aria-haspopup="dialog"
          aria-expanded={open}
          onFocus={handleFocus}
          onClick={handleOpenClick}
          sx={iconButtonSx}
        >
          <FilterVariant fontSize="small" />
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onFocus={handleFocus}
        onClose={handleClose}
        anchorOrigin={styles.popoverAnchorOrigin}
        transformOrigin={styles.popoverTransformOrigin}
        onClick={handlePopoverClick}
        onKeyUp={handlePopoverKeyUp}
      >
        <TextField
          key={searchKey}
          placeholder="Search..."
          value={searchQuery}
          onChange={setSearchQuery}
          variant="standard"
          size="small"
          slotProps={searchSlotProps}
          sx={styles.search}
        />
        <Divider />
        <List dense disablePadding aria-labelledby={labelId} sx={styles.list}>
          <FilterItem
            id={labelId}
            label={selectAllLabel}
            checked={allVisibleSelected}
            indeterminate={someVisibleSelected}
            onToggle={handleToggleAll}
          />
          <Divider />
          {visibleEntries.map(([value]) => {
            const label = String(value);
            const checked = filterValues.includes(value);
            return (
              <FilterItem key={label} label={label} value={value} checked={checked} onToggle={handleToggleValue} />
            );
          })}
        </List>
      </Popover>
    </>
  );
}

interface FilterItemProps {
  id?: string;
  label: string;
  value?: unknown;
  checked: boolean;
  indeterminate?: boolean;
  onToggle: (value: unknown) => void;
}

function FilterItem({ id, label, value, checked, indeterminate, onToggle }: FilterItemProps): ReactElement {
  const checkboxId = useId();
  const checkboxSlotProps = useMemo(() => ({ input: { id: checkboxId } }), [checkboxId]);
  const handleChange = useCallback(() => onToggle(value), [onToggle, value]);
  const handleFocus = useCallback((e: React.FocusEvent) => e.stopPropagation(), []);

  const itemLabel = useMemo(
    () => (
      <Typography variant="body2" noWrap title={label}>
        {label}
      </Typography>
    ),
    [label],
  );

  return (
    <ListItem id={id} disablePadding sx={styles.listItem} component="label" htmlFor={checkboxId}>
      <Checkbox
        size="small"
        checked={checked}
        indeterminate={indeterminate}
        sx={styles.checkbox}
        onFocus={handleFocus}
        slotProps={checkboxSlotProps}
        onChange={handleChange}
      />
      <ListItemText primary={itemLabel} />
    </ListItem>
  );
}
