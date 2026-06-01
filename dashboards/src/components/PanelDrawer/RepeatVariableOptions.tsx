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
import { Grid2 as Grid, MenuItem, TextField, Typography } from '@mui/material';
import { PanelEditorValues, VariableDefinition } from '@perses-dev/spec';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useAllVariableDefinitions } from '../../context/VariableProvider';
import { DEFAULT_REPEAT_ALIGNMENT } from '../../utils';
import { GRID_LAYOUT_COLS, GRID_LAYOUT_SMALL_BREAKPOINT } from '../../constants';

export function RepeatVariableOptions(): ReactElement {
  const variableDefinitions: VariableDefinition[] = useAllVariableDefinitions();
  const { control, formState, setValue } = useFormContext<PanelEditorValues>();

  const watchedRepeatVariable = useWatch({ control, name: 'layoutDefinition.repeatVariable' });

  const isVertical = (watchedRepeatVariable?.alignment ?? DEFAULT_REPEAT_ALIGNMENT) === 'vertical';

  return (
    <Grid container spacing={2} width="100%">
      <Grid size={12}>
        <Typography variant="h4">Repeat Options</Typography>
      </Grid>
      <Grid size={4}>
        <Controller
          control={control}
          name="layoutDefinition.repeatVariable"
          render={({ field }) => (
            <TextField
              select
              {...field}
              fullWidth
              label="Repeat Variable"
              error={!!formState.errors.layoutDefinition?.repeatVariable?.value}
              helperText={formState.errors.layoutDefinition?.repeatVariable?.value?.message}
              value={watchedRepeatVariable?.value ?? ''}
              onChange={(event) => {
                const selected = event.target.value;
                if (!selected) {
                  field.onChange(undefined);
                } else {
                  field.onChange(
                    watchedRepeatVariable
                      ? { ...watchedRepeatVariable, value: selected }
                      : { value: selected, alignment: DEFAULT_REPEAT_ALIGNMENT }
                  );
                  if (!watchedRepeatVariable) {
                    setValue('layoutDefinition.width', GRID_LAYOUT_COLS[GRID_LAYOUT_SMALL_BREAKPOINT]);
                  }
                }
              }}
            >
              <MenuItem value="">
                <Typography sx={{ fontStyle: 'italic' }}>None</Typography>
              </MenuItem>
              {variableDefinitions.map((def) => (
                <MenuItem key={def.spec.name} value={def.spec.name}>
                  {def.spec.display?.name ?? def.spec.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Grid>

      <Grid size={4}>
        <Controller
          control={control}
          name="layoutDefinition.repeatVariable"
          render={({ field }) => (
            <TextField
              select
              {...field}
              fullWidth
              label="Alignment"
              error={!!formState.errors.layoutDefinition?.repeatVariable?.alignment}
              helperText={formState.errors.layoutDefinition?.repeatVariable?.alignment?.message}
              value={watchedRepeatVariable?.alignment ?? DEFAULT_REPEAT_ALIGNMENT}
              disabled={!watchedRepeatVariable}
              onChange={(event) => {
                const selected = event.target.value;
                if (selected === 'vertical') {
                  field.onChange({ ...field.value, alignment: selected, maxPer: undefined });
                } else {
                  field.onChange({ ...field.value, alignment: selected });
                }
              }}
            >
              <MenuItem value="horizontal">Horizontal</MenuItem>
              <MenuItem value="vertical">Vertical</MenuItem>
            </TextField>
          )}
        />
      </Grid>

      <Grid size={4}>
        <Controller
          control={control}
          name="layoutDefinition.repeatVariable"
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Max Per Row"
              type="number"
              slotProps={{
                htmlInput: { min: 1, max: 12 },
              }}
              error={!!formState.errors.layoutDefinition?.repeatVariable?.maxPer}
              helperText={formState.errors.layoutDefinition?.repeatVariable?.maxPer?.message}
              value={watchedRepeatVariable?.maxPer ?? ''}
              onChange={(event) => {
                const value = event.target.value;
                if (value === undefined || value === '') {
                  field.onChange({ ...field.value, maxPer: undefined });
                } else {
                  const maxPer = parseInt(value, 10);
                  field.onChange({ ...field.value, maxPer: Number.isFinite(maxPer) ? maxPer : undefined });
                }
              }}
              disabled={!watchedRepeatVariable || isVertical}
            />
          )}
        />
      </Grid>
    </Grid>
  );
}
