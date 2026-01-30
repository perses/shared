import { FormControlLabel, Stack, Switch } from '@mui/material';
import { MergeSeriesTransform } from '@perses-dev/core';
import { ReactElement } from 'react';
import { TransformSpecEditorProps } from './TransformEditor';

export const MergeSeriesTransformEditor = ({
  value,
  onChange,
}: TransformSpecEditorProps<MergeSeriesTransform>): ReactElement => {
  return (
    <Stack direction="row">
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
