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

import { Box, IconButton, InputAdornment, TextField, createFilterOptions } from '@mui/material';
import ChevronLeftIcon from 'mdi-material-ui/ChevronLeft';
import ChevronRightIcon from 'mdi-material-ui/ChevronRight';
import ClearIcon from 'mdi-material-ui/Close';
import type { ReactElement } from 'react';
import { useState } from 'react';

import type { FormatOptions, UnitConfig, UnitGroup } from '../model';
import { UNIT_CONFIG } from '../model';
import { SettingsAutocomplete } from '../SettingsAutocomplete';

export interface UnitSelectorProps {
  value?: FormatOptions;
  onChange: (format: FormatOptions | undefined) => void;
  disabled?: boolean;
}

type UnitOption = UnitConfig & {
  id: NonNullable<FormatOptions['unit']>;
  kind: 'unit';
  group: UnitGroup;
};

type NavigationOption = { id: string; label: string; kind: 'navigation'; group: UnitGroup | null };
type PickerOption = UnitOption | NavigationOption;

const UNIT_OPTIONS = Object.entries(UNIT_CONFIG).map<UnitOption>(
  ([id, { label, group = 'Decimal', disableSelectorOption }]) => ({
    id: id as UnitOption['id'],
    label,
    group,
    disableSelectorOption,
    kind: 'unit',
  }),
);
const SELECTABLE_UNITS = UNIT_OPTIONS.filter((option) => !option.disableSelectorOption);
const GROUP_OPTIONS = Array.from(
  new Set(SELECTABLE_UNITS.map((option) => option.group)),
  (group): NavigationOption => ({ id: `group-${group}`, label: group, kind: 'navigation', group }),
);
const BACK_OPTION: NavigationOption = { id: 'back', label: 'All unit families', kind: 'navigation', group: null };
const OPTIONS = [...UNIT_OPTIONS, ...GROUP_OPTIONS, BACK_OPTION];
const filterUnits = createFilterOptions<UnitOption>({
  stringify: ({ label, id, group }) => `${label} ${id} ${group}`,
});

function getPickerOptionLabel(option: PickerOption): string {
  if (option.kind === 'unit') {
    return option.label;
  }
  return option.group ? `Browse ${option.label} units` : 'Back to all unit families';
}

/** Select a unit by browsing its family or searching across all families. */
export function UnitSelector({ value, onChange, disabled = false, ...otherProps }: UnitSelectorProps): ReactElement {
  // Undefined means the popup is closed. Null shows the list of families.
  const [group, setGroup] = useState<UnitGroup | null>();
  const [search, setSearch] = useState<string>();
  const query = search?.trim();
  const browseLevel = group ? `${group} units` : 'Unit families';
  const unit = value?.unit || 'decimal';
  const unitConfig = UNIT_CONFIG[unit];
  const selectedUnit: UnitOption = {
    id: unit,
    label: unitConfig?.label ?? unit,
    group: unitConfig?.group ?? 'Decimal',
    kind: 'unit',
  };

  const closePicker = (): void => {
    setGroup(undefined);
    setSearch(undefined);
  };

  // Autocomplete can blur during render when it becomes disabled.
  if (disabled && (group !== undefined || search !== undefined)) {
    closePicker();
  }

  const handleChange = (_: unknown, option: PickerOption): void => {
    if (option.kind === 'navigation') {
      setGroup(option.group);
      return;
    }
    closePicker();
    onChange({ unit: option.id } as FormatOptions);
  };

  return (
    <SettingsAutocomplete<PickerOption, false, true>
      value={selectedUnit}
      inputValue={search ?? selectedUnit.label}
      options={OPTIONS}
      getOptionKey={(option) => option.id}
      getOptionLabel={getPickerOptionLabel}
      open={group !== undefined}
      onOpen={() => setGroup(null)}
      onClose={closePicker}
      autoHighlight={!query}
      onKeyDown={(event) => {
        // Keep Enter in the picker even when no option is highlighted.
        if (group !== undefined && event.key === 'Enter' && !event.nativeEvent.isComposing) {
          event.preventDefault();
        }
      }}
      onInputChange={(_, input, reason) => {
        if (reason === 'input') {
          setSearch(input);
        } else if (reason === 'blur') {
          setSearch(undefined);
        }
      }}
      filterOptions={(_, state) => {
        if (query) {
          return filterUnits(SELECTABLE_UNITS, { ...state, inputValue: query });
        }
        return group ? [BACK_OPTION, ...SELECTABLE_UNITS.filter((option) => option.group === group)] : GROUP_OPTIONS;
      }}
      renderOption={({ key, ...props }, option) => (
        <li key={key} {...props} aria-label={option.kind === 'navigation' ? getPickerOptionLabel(option) : undefined}>
          {option.kind === 'navigation' && option.group === null && <ChevronLeftIcon fontSize="small" />}
          {option.label}
          {option.kind === 'navigation' && option.group !== null && (
            <ChevronRightIcon fontSize="small" sx={{ ml: 'auto' }} />
          )}
        </li>
      )}
      onChange={handleChange}
      disabled={disabled}
      disableClearable
      disableCloseOnSelect
      renderInput={({ InputProps, ...params }) => (
        <TextField
          {...params}
          slotProps={{
            input: {
              ...InputProps,
              endAdornment: (
                <>
                  {InputProps.endAdornment}
                  <Box
                    component="output"
                    sx={{
                      position: 'absolute',
                      width: '1px',
                      height: '1px',
                      overflow: 'hidden',
                      clipPath: 'inset(50%)',
                    }}
                  >
                    {group !== undefined && (query ? 'Searching all unit families' : browseLevel)}
                  </Box>
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="clear unit"
                      onClick={() => {
                        closePicker();
                        onChange(undefined);
                      }}
                      disabled={disabled}
                      tabIndex={-1}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                </>
              ),
            },
          }}
        />
      )}
      {...otherProps}
    />
  );
}
