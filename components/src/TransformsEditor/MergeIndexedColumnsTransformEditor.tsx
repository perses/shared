import { MergeIndexedColumnsTransform } from '@perses-dev/core';
import { ReactElement } from 'react';
import { FormControlLabel, Stack, Switch } from '@mui/material';
import { TextField } from '../controls';
import { TransformSpecEditorProps } from './TransformEditor';

export const MergeIndexedColumnsTransformEditor = ({
  value,
  onChange,
}: TransformSpecEditorProps<MergeIndexedColumnsTransform>): ReactElement => {
  return (
    <Stack direction="row">
      <TextField
        id="merge-indexed-columns"
        variant="outlined"
        label="Column"
        placeholder="Example: 'value' for merging 'value #1', 'value #2' and 'value #...'"
        value={value.spec.column ?? ''}
        sx={{ width: '100%' }}
        onChange={(column) => {
          onChange({
            ...value,
            spec: { ...value.spec, column: column },
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
