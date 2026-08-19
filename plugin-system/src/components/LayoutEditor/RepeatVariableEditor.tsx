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

import { Grid2 as Grid, ListSubheader, MenuItem, TextField, Typography } from '@mui/material';
import { ReactElement, useCallback } from 'react';
import { ControllerRenderProps, FieldErrors } from 'react-hook-form';

import { DEFAULT_MAX_PER_ROW, DEFAULT_REPEAT_ALIGNMENT } from '../../constants';
import { PanelEditorValues } from '../../model';
import { VariableDefinitionGroup } from './LayoutEditor';

type RepeatVariableValue = ControllerRenderProps<PanelEditorValues, 'layoutDefinition.repeatVariable'>['value'];
type RepeatVariableOnChange = ControllerRenderProps<PanelEditorValues, 'layoutDefinition.repeatVariable'>['onChange'];
type RepeatVariableErrors = FieldErrors<
  NonNullable<NonNullable<PanelEditorValues['layoutDefinition']>['repeatVariable']>
>;

export interface RepeatVariableEditorProps {
  value: RepeatVariableValue;
  onChange: RepeatVariableOnChange;
  errors: RepeatVariableErrors;
  variableDefinitionGroups: VariableDefinitionGroup[];
  isVertical: boolean;
  onRepeatVariableSet: () => void;
}

export function RepeatVariableEditor({
  value: current,
  onChange,
  errors,
  variableDefinitionGroups,
  isVertical,
  onRepeatVariableSet,
}: RepeatVariableEditorProps): ReactElement {
  const handleVariableChange = useCallback(
    (selected: string): void => {
      if (!selected) {
        onChange(undefined);
      } else {
        onChange(current ? { ...current, value: selected } : { value: selected, alignment: DEFAULT_REPEAT_ALIGNMENT });
        if (!current) {
          onRepeatVariableSet();
        }
      }
    },
    [current, onChange, onRepeatVariableSet],
  );

  const handleAlignmentChange = useCallback(
    (selected: string): void => {
      if (!current) return;
      onChange(
        selected === 'vertical'
          ? { ...current, alignment: selected, maxPer: undefined }
          : { ...current, alignment: selected },
      );
    },
    [current, onChange],
  );

  const handleMaxPerChange = useCallback(
    (value: string): void => {
      if (!current) return;
      onChange({ ...current, maxPer: value === '' ? undefined : Number(value) });
    },
    [current, onChange],
  );

  return (
    <>
      <Grid size={4}>
        <TextField
          select
          fullWidth
          label="Repeat Variable"
          value={current?.value ?? ''}
          error={!!errors.value}
          helperText={errors.value?.message}
          onChange={(event) => handleVariableChange(event.target.value)}
          slotProps={{ select: { MenuProps: { PaperProps: { sx: { maxHeight: 240 } } } } }}
        >
          <MenuItem value="">
            <Typography sx={{ fontStyle: 'italic' }}>None</Typography>
          </MenuItem>
          {variableDefinitionGroups.flatMap(({ source, definitions }) => {
            const listDefs = definitions.filter((def) => def.kind === 'ListVariable' && def.spec.allowMultiple);
            if (listDefs.length === 0) return [];
            return [
              source && <ListSubheader key={`group-${source}`}>{source}</ListSubheader>,
              ...listDefs.map((def) => (
                <MenuItem key={`${source ?? 'dashboard'}-${def.spec.name}`} value={def.spec.name}>
                  {def.spec.display?.name ?? def.spec.name}
                </MenuItem>
              )),
            ];
          })}
        </TextField>
      </Grid>

      <Grid size={4}>
        <TextField
          select
          fullWidth
          label="Alignment"
          value={current?.alignment ?? DEFAULT_REPEAT_ALIGNMENT}
          disabled={!current}
          error={!!errors.alignment}
          helperText={errors.alignment?.message}
          onChange={(event) => handleAlignmentChange(event.target.value)}
        >
          <MenuItem value="horizontal">Horizontal</MenuItem>
          <MenuItem value="vertical">Vertical</MenuItem>
        </TextField>
      </Grid>

      <Grid size={4}>
        <TextField
          select
          fullWidth
          label="Max Per Row"
          value={current?.maxPer ?? DEFAULT_MAX_PER_ROW}
          disabled={!current || isVertical}
          error={!!errors.maxPer}
          helperText={errors.maxPer?.message}
          onChange={(event) => handleMaxPerChange(event.target.value)}
          slotProps={{ select: { MenuProps: { PaperProps: { sx: { maxHeight: 240 } } } } }}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <MenuItem key={n} value={n}>
              {n}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
    </>
  );
}
