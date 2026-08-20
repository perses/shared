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

import { IconButton, InputAdornment, TextField } from '@mui/material';
import ClearIcon from 'mdi-material-ui/Close';
import { ReactElement } from 'react';

import { FormatOptions, UNIT_CONFIG, UnitConfig } from '../model';
import { SettingsAutocomplete } from '../SettingsAutocomplete';

export interface UnitSelectorProps {
  value?: FormatOptions;
  onChange: (format: FormatOptions | undefined) => void;
  disabled?: boolean;
}

type AutocompleteUnitOption = UnitConfig & {
  id: NonNullable<FormatOptions['unit']>;
};

const KIND_OPTIONS: readonly AutocompleteUnitOption[] = Object.entries(UNIT_CONFIG)
  .map<AutocompleteUnitOption>(([id, config]) => {
    return {
      ...config,
      id: id as AutocompleteUnitOption['id'],
      group: config.group || 'Decimal',
    };
  })
  .filter((config) => !config.disableSelectorOption);

export function UnitSelector({ value, onChange, disabled = false, ...otherProps }: UnitSelectorProps): ReactElement {
  const unitConfig = UNIT_CONFIG[value?.unit || 'decimal'];

  const handleChange = (_: unknown, newValue: AutocompleteUnitOption | null): void => {
    if (newValue === null) {
      onChange(undefined);
    } else {
      onChange({ unit: newValue.id } as FormatOptions);
    }
  };

  return (
    <SettingsAutocomplete<AutocompleteUnitOption, false, true>
      value={{ id: value?.unit || 'decimal', ...unitConfig }}
      options={KIND_OPTIONS}
      groupBy={(option) => option.group ?? 'Decimal'}
      onChange={handleChange}
      disabled={disabled}
      disableClearable
      renderInput={({ InputProps, ...params }) => (
        <TextField
          {...params}
          slotProps={{
            input: {
              ...InputProps,
              endAdornment: (
                <>
                  {InputProps.endAdornment}
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="clear unit"
                      onClick={() => onChange(undefined)}
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
