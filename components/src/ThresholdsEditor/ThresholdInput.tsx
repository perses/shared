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

import { ReactElement, RefObject, useState } from 'react';
import { Stack, FormLabel, IconButton, Box } from '@mui/material';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import { ThresholdOptions } from '@perses-dev/core';
import { OptionsColorPicker } from '../ColorPicker/OptionsColorPicker';
// LOGZ.IO CHANGE START:: Use NumberInput so partial decimals (".05") are not blanked [APPZ-1996]
import { NumberInput } from '../NumberInput';
// LOGZ.IO CHANGE END:: Use NumberInput so partial decimals (".05") are not blanked [APPZ-1996]

export interface ThresholdInputProps {
  label: string;
  color: string;
  value: number;
  onChange: (value: number | undefined) => void;
  onColorChange: (color: string) => void;
  onBlur: () => void;
  onDelete: () => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  mode?: ThresholdOptions['mode'];
}

export function ThresholdInput({
  inputRef,
  label,
  color,
  value,
  mode,
  onChange,
  onColorChange,
  onBlur,
  onDelete,
}: ThresholdInputProps): ReactElement {
  const [key, setKey] = useState(0); // use key to cause input to lose focus when pressing enter
  return (
    <Stack flex={1} direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <OptionsColorPicker label={label} color={color} onColorChange={onColorChange} />
      <FormLabel htmlFor={label}>{label}</FormLabel>
      {/* LOGZ.IO CHANGE START:: NumberInput buffers raw text so ".05"/"0.0"/"-5" survive typing [APPZ-1996] */}
      <NumberInput
        id={label}
        key={key}
        inputRef={inputRef}
        value={value}
        emptyValue={0}
        placeholder="0"
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onBlur();
            setKey(key + 1);
          }
        }}
        InputProps={{
          endAdornment: mode === 'percent' ? <Box paddingX={1}>%</Box> : undefined,
        }}
      />
      {/* LOGZ.IO CHANGE END:: NumberInput buffers raw text so ".05"/"0.0"/"-5" survive typing [APPZ-1996] */}
      <IconButton aria-label={`delete threshold ${label}`} size="small" onClick={onDelete}>
        <DeleteIcon />
      </IconButton>
    </Stack>
  );
}
