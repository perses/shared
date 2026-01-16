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

import {
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { ReactElement } from 'react';
import { ActionCondition } from './selection-action-model';

export interface ActionConditionEditorProps {
  condition?: ActionCondition;
  onChange: (condition: ActionCondition | undefined) => void;
  availableColumns?: string[];
}

type ConditionKind = 'Value' | 'Range' | 'Regex' | 'Misc';

/**
 * Editor for configuring action visibility conditions
 */
export function ActionConditionEditor({
  condition,
  onChange,
  availableColumns = [],
}: ActionConditionEditorProps): ReactElement {
  const hasCondition = condition !== undefined;

  function handleToggleCondition(enabled: boolean): void {
    if (enabled) {
      onChange({
        kind: 'Value',
        spec: { value: '' },
      });
    } else {
      onChange(undefined);
    }
  }

  function handleKindChange(kind: ConditionKind): void {
    switch (kind) {
      case 'Value':
        onChange({ kind: 'Value', spec: { value: '' } });
        break;
      case 'Range':
        onChange({ kind: 'Range', spec: {} });
        break;
      case 'Regex':
        onChange({ kind: 'Regex', spec: { expr: '' } });
        break;
      case 'Misc':
        onChange({ kind: 'Misc', spec: { value: 'empty' } });
        break;
    }
  }

  return (
    <Stack spacing={1}>
      <FormControlLabel
        control={
          <Switch checked={hasCondition} onChange={(e) => handleToggleCondition(e.target.checked)} size="small" />
        }
        label="Only show action when condition matches"
      />

      {hasCondition && condition && (
        <Box sx={{ pl: 2, borderLeft: 2, borderColor: 'divider' }}>
          <Stack spacing={2}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Condition Type</InputLabel>
              <Select
                value={condition.kind}
                label="Condition Type"
                onChange={(e) => handleKindChange(e.target.value as ConditionKind)}
              >
                <MenuItem value="Value">Exact Value</MenuItem>
                <MenuItem value="Range">Number Range</MenuItem>
                <MenuItem value="Regex">Regex Match</MenuItem>
                <MenuItem value="Misc">Special Values</MenuItem>
              </Select>
            </FormControl>

            {condition.kind === 'Value' && (
              <ValueConditionEditor
                value={condition.spec.value}
                onChange={(value) => onChange({ kind: 'Value', spec: { value } })}
              />
            )}

            {condition.kind === 'Range' && (
              <RangeConditionEditor
                min={condition.spec.min}
                max={condition.spec.max}
                onChange={(min, max) => onChange({ kind: 'Range', spec: { min, max } })}
              />
            )}

            {condition.kind === 'Regex' && (
              <RegexConditionEditor
                expr={condition.spec.expr}
                onChange={(expr) => onChange({ kind: 'Regex', spec: { expr } })}
              />
            )}

            {condition.kind === 'Misc' && (
              <MiscConditionEditor
                value={condition.spec.value}
                onChange={(value) => onChange({ kind: 'Misc', spec: { value } })}
              />
            )}

            {availableColumns.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                Condition is evaluated against the values in selected rows. Action is shown if ANY selected row matches.
              </Typography>
            )}
          </Stack>
        </Box>
      )}

      {!hasCondition && (
        <Typography variant="body2" color="text.secondary">
          Action will always be visible when rows are selected.
        </Typography>
      )}
    </Stack>
  );
}

interface ValueConditionEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function ValueConditionEditor({ value, onChange }: ValueConditionEditorProps): ReactElement {
  return (
    <TextField
      label="Match Value"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size="small"
      helperText="Row must contain this exact value in any column"
    />
  );
}

interface RangeConditionEditorProps {
  min?: number;
  max?: number;
  onChange: (min?: number, max?: number) => void;
}

function RangeConditionEditor({ min, max, onChange }: RangeConditionEditorProps): ReactElement {
  return (
    <Stack direction="row" spacing={2}>
      <TextField
        label="Min Value"
        type="number"
        value={min ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined, max)}
        size="small"
        sx={{ flex: 1 }}
      />
      <TextField
        label="Max Value"
        type="number"
        value={max ?? ''}
        onChange={(e) => onChange(min, e.target.value ? Number(e.target.value) : undefined)}
        size="small"
        sx={{ flex: 1 }}
      />
    </Stack>
  );
}

interface RegexConditionEditorProps {
  expr: string;
  onChange: (expr: string) => void;
}

function RegexConditionEditor({ expr, onChange }: RegexConditionEditorProps): ReactElement {
  return (
    <TextField
      label="Regex Pattern"
      value={expr}
      onChange={(e) => onChange(e.target.value)}
      size="small"
      helperText="Row value must match this regular expression"
      placeholder="^(active|running)$"
    />
  );
}

interface MiscConditionEditorProps {
  value: 'empty' | 'null' | 'NaN' | 'true' | 'false';
  onChange: (value: 'empty' | 'null' | 'NaN' | 'true' | 'false') => void;
}

function MiscConditionEditor({ value, onChange }: MiscConditionEditorProps): ReactElement {
  return (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel>Special Value</InputLabel>
      <Select
        value={value}
        label="Special Value"
        onChange={(e) => onChange(e.target.value as MiscConditionEditorProps['value'])}
      >
        <MenuItem value="empty">Empty</MenuItem>
        <MenuItem value="null">Null</MenuItem>
        <MenuItem value="NaN">NaN</MenuItem>
        <MenuItem value="true">True</MenuItem>
        <MenuItem value="false">False</MenuItem>
      </Select>
    </FormControl>
  );
}
