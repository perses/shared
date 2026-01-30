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

import { Autocomplete, FormControlLabel, Stack, Switch, TextField as MuiTextField } from '@mui/material';
import { MergeColumnsTransform } from '@perses-dev/core';
import { ReactElement } from 'react';
import { TextField } from '../controls';
import { TransformSpecEditorProps } from './TransformEditor';

export const MergeColumnsTransformEditor = ({
  value,
  onChange,
}: TransformSpecEditorProps<MergeColumnsTransform>): ReactElement => {
  return (
    <Stack direction="row" gap={1} alignItems="center">
      <Autocomplete
        freeSolo
        multiple
        id="merge-columns-columns"
        sx={{ width: '100%' }}
        options={[]}
        value={value.spec.columns ?? []}
        // eslint-disable-next-line react/jsx-no-undef
        renderInput={(params) => <MuiTextField {...params} variant="outlined" label="Columns" required />}
        onChange={(_, columns) => {
          onChange({
            ...value,
            spec: {
              ...value.spec,
              columns: columns,
            },
          });
        }}
      />

      <TextField
        id="merge-columns-name"
        variant="outlined"
        label="Output Name"
        value={value.spec.name ?? ''}
        sx={{ width: '100%' }}
        onChange={(name) => {
          onChange({
            ...value,
            spec: {
              ...value.spec,
              name: name,
            },
          });
        }}
        required
      />
      <FormControlLabel
        label="Enabled"
        labelPlacement="start"
        control={
          <Switch
            value={!value.spec.disabled}
            checked={!value.spec.disabled}
            onChange={(e) =>
              onChange({
                ...value,
                spec: { ...value.spec, disabled: !e.target.checked },
              })
            }
          />
        }
      />
    </Stack>
  );
};
