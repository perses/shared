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

import { Grid2 as Grid, MenuItem, TextField, Typography } from '@mui/material';
import { ReactElement, useMemo } from 'react';
import { Control, Controller, useFormContext, useWatch } from 'react-hook-form';

import { DEFAULT_MAX_PER_ROW, DEFAULT_REPEAT_ALIGNMENT } from '../../constants';
import { PanelEditorValues } from '../../model';
import { VariableDefinitionGroup } from '../../model/variables';
import { useVariableValues } from '../../runtime';
import { RepeatLayoutPreview } from './RepeatLayoutPreview';
import { RepeatVariableEditor } from './RepeatVariableEditor';

const DEFAULT_LAYOUT_WIDTH = 24;

export type { VariableDefinitionGroup };

export interface PanelGroup {
  id: number;
  title?: string;
}

export interface LayoutEditorProps {
  control: Control<PanelEditorValues>;
  variableDefinitionGroups: VariableDefinitionGroup[];
  panelGroups?: PanelGroup[];
}

export function LayoutEditor({ control, variableDefinitionGroups, panelGroups }: LayoutEditorProps): ReactElement {
  const { formState, setValue } = useFormContext<PanelEditorValues>();
  const variableValues = useVariableValues();
  const watchedRepeatVariableValue = useWatch({ control, name: 'layoutDefinition.repeatVariable.value' });
  const watchedAlignment = useWatch({ control, name: 'layoutDefinition.repeatVariable.alignment' });
  const watchedMaxPer = useWatch({ control, name: 'layoutDefinition.repeatVariable.maxPer' });

  const optionCount = useMemo(() => {
    if (!watchedRepeatVariableValue) return 0;
    return variableValues[watchedRepeatVariableValue]?.options?.length ?? 0;
  }, [watchedRepeatVariableValue, variableValues]);

  const isVertical = (watchedAlignment ?? DEFAULT_REPEAT_ALIGNMENT) === 'vertical';
  const perRow = isVertical ? 1 : (watchedMaxPer ?? DEFAULT_MAX_PER_ROW);

  return (
    <Grid container spacing={2} width="100%">
      {panelGroups && (
        <>
          <Grid size={12}>
            <Typography variant="h4">Panel Group</Typography>
          </Grid>
          <Grid size={4}>
            <Controller
              control={control}
              name="groupId"
              render={({ field, fieldState }) => (
                <TextField
                  select
                  {...field}
                  required
                  fullWidth
                  label="Group"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                >
                  {panelGroups.map((panelGroup, index) => (
                    <MenuItem key={panelGroup.id} value={panelGroup.id}>
                      {panelGroup.title ?? `Group ${index + 1}`}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={8} />
        </>
      )}
      <Grid size={12}>
        <Typography variant="h4">Repeat Options</Typography>
      </Grid>
      <Controller
        control={control}
        name="layoutDefinition.repeatVariable"
        render={({ field }) => (
          <RepeatVariableEditor
            value={field.value}
            onChange={field.onChange}
            errors={formState.errors.layoutDefinition?.repeatVariable ?? {}}
            variableDefinitionGroups={variableDefinitionGroups}
            isVertical={isVertical}
            onRepeatVariableSet={() => setValue('layoutDefinition.width', DEFAULT_LAYOUT_WIDTH)}
          />
        )}
      />
      {watchedRepeatVariableValue && optionCount > 0 && (
        <Grid size={12}>
          <RepeatLayoutPreview optionCount={optionCount} maxPer={perRow} />
        </Grid>
      )}
    </Grid>
  );
}
