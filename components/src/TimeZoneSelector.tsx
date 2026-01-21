// Copyright 2024 The Perses Authors
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

import { ReactElement, ReactNode, useMemo } from 'react';
import { Select, MenuItem, SelectProps, SelectChangeEvent } from '@mui/material';
import { TimeZoneOption, getTimeZoneOptions } from './model/timeZoneOption';

export interface TimeZoneSelectorProps extends Omit<SelectProps, 'onChange' | 'variant' | 'value'> {
  value: string;
  onChange?: (timeZoneOption: TimeZoneOption) => void;
  timeZoneOptions?: TimeZoneOption[];
  variant?: 'standard' | 'compact';
  heightPx?: string | number;
}

/**
 * Timezone selector component
 * Allows users to select a timezone from a dropdown list
 */
export function TimeZoneSelector({
  value,
  onChange,
  timeZoneOptions,
  variant = 'standard',
  heightPx,
  ...selectProps
}: TimeZoneSelectorProps): ReactElement {
  const options = useMemo(() => timeZoneOptions ?? getTimeZoneOptions(), [timeZoneOptions]);

  const height = heightPx ? (typeof heightPx === 'number' ? `${heightPx}px` : heightPx) : undefined;

  const handleChange = (selectedValue: string) => {
    const selectedOption = options.find((opt: TimeZoneOption) => opt.value === selectedValue);
    if (selectedOption && onChange) {
      onChange(selectedOption);
    }
  };

  const sxStyles = useMemo(
    () => ({
      minWidth: variant === 'compact' ? '80px' : '150px',
      ...(height && { lineHeight: height, paddingY: 0 }),
      ...selectProps.sx,
    }),
    [variant, height, selectProps.sx]
  );

  return (
    <Select
      {...selectProps}
      value={value}
      onChange={(event: SelectChangeEvent<unknown>, _child: ReactNode) => {
        handleChange(event.target.value as string);
      }}
      sx={sxStyles}
      size={variant === 'compact' ? 'small' : 'medium'}
    >
      {options.map((option: TimeZoneOption) => (
        <MenuItem key={option.value} value={option.value}>
          {option.display}
        </MenuItem>
      ))}
    </Select>
  );
}
