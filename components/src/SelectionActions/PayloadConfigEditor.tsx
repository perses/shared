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
  Button,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ReactElement, useState } from 'react';
import AddIcon from 'mdi-material-ui/Plus';
import DeleteIcon from 'mdi-material-ui/Delete';
import { FieldMapping } from './selection-action-model';
import { PayloadPreview } from './PayloadPreview';

export interface PayloadConfigEditorProps {
  payloadTemplate?: string;
  fieldMapping?: FieldMapping[];
  onPayloadTemplateChange: (template: string | undefined) => void;
  onFieldMappingChange: (mapping: FieldMapping[] | undefined) => void;
  availableColumns?: string[];
  sampleData?: Array<Record<string, unknown>>;
}

type PayloadMode = 'none' | 'template' | 'mapping';

/**
 * Editor for configuring payload transformation (template or field mapping)
 */
export function PayloadConfigEditor({
  payloadTemplate,
  fieldMapping,
  onPayloadTemplateChange,
  onFieldMappingChange,
  availableColumns = [],
  sampleData = [],
}: PayloadConfigEditorProps): ReactElement {
  const getInitialMode = (): PayloadMode => {
    if (payloadTemplate) return 'template';
    if (fieldMapping && fieldMapping.length > 0) return 'mapping';
    return 'none';
  };

  const [mode, setMode] = useState<PayloadMode>(getInitialMode());

  function handleModeChange(newMode: PayloadMode): void {
    setMode(newMode);
    if (newMode === 'none') {
      onPayloadTemplateChange(undefined);
      onFieldMappingChange(undefined);
    } else if (newMode === 'template') {
      onFieldMappingChange(undefined);
      if (!payloadTemplate) {
        onPayloadTemplateChange('{\n  \n}');
      }
    } else if (newMode === 'mapping') {
      onPayloadTemplateChange(undefined);
      if (!fieldMapping || fieldMapping.length === 0) {
        onFieldMappingChange([{ source: '', target: '' }]);
      }
    }
  }

  return (
    <Stack spacing={2}>
      <FormControl>
        <RadioGroup row value={mode} onChange={(e) => handleModeChange(e.target.value as PayloadMode)}>
          <FormControlLabel value="none" control={<Radio size="small" />} label="Raw Row Data" />
          <FormControlLabel value="template" control={<Radio size="small" />} label="JSON Template" />
          <FormControlLabel value="mapping" control={<Radio size="small" />} label="Field Mapping" />
        </RadioGroup>
      </FormControl>

      {mode === 'none' && (
        <Typography variant="body2" color="text.secondary">
          The full row data will be sent as-is without transformation.
        </Typography>
      )}

      {mode === 'template' && (
        <PayloadTemplateEditor
          template={payloadTemplate || ''}
          onChange={onPayloadTemplateChange}
          availableColumns={availableColumns}
        />
      )}

      {mode === 'mapping' && (
        <FieldMappingEditor
          mapping={fieldMapping || []}
          onChange={onFieldMappingChange}
          availableColumns={availableColumns}
        />
      )}

      {/* Preview Section */}
      <PayloadPreview
        payloadTemplate={mode === 'template' ? payloadTemplate : undefined}
        fieldMapping={mode === 'mapping' ? fieldMapping : undefined}
        sampleData={sampleData}
        availableColumns={availableColumns}
      />
    </Stack>
  );
}

interface PayloadTemplateEditorProps {
  template: string;
  onChange: (template: string) => void;
  availableColumns: string[];
}

function PayloadTemplateEditor({ template, onChange, availableColumns }: PayloadTemplateEditorProps): ReactElement {
  return (
    <Stack spacing={1}>
      <TextField
        label="JSON Template"
        value={template}
        onChange={(e) => onChange(e.target.value)}
        multiline
        rows={6}
        size="small"
        placeholder={'{\n  "name": "${__data.fields[\\"columnName\\"]}"\n}'}
        sx={{ fontFamily: 'monospace' }}
      />
      {availableColumns.length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Available columns:{' '}
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            {availableColumns.map((col) => `\${__data.fields["${col}"]}`).join(', ')}
          </Typography>
        </Box>
      )}
      <Typography variant="caption" color="text.secondary">
        Use {'${varName}'} for dashboard variables and {'${__data.fields["column"]}'} for row data.
      </Typography>
    </Stack>
  );
}

interface FieldMappingEditorProps {
  mapping: FieldMapping[];
  onChange: (mapping: FieldMapping[]) => void;
  availableColumns: string[];
}

function FieldMappingEditor({ mapping, onChange, availableColumns }: FieldMappingEditorProps): ReactElement {
  function handleMappingChange(index: number, field: Partial<FieldMapping>): void {
    const updated = [...mapping];
    const existing = updated[index];
    if (existing) {
      updated[index] = { source: existing.source, target: existing.target, ...field };
      onChange(updated);
    }
  }

  function handleAddMapping(): void {
    onChange([...mapping, { source: '', target: '' }]);
  }

  function handleDeleteMapping(index: number): void {
    const updated = [...mapping];
    updated.splice(index, 1);
    onChange(updated);
  }

  return (
    <Stack spacing={1}>
      {mapping.map((m, index) => (
        <Stack key={index} direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>Source Column</InputLabel>
            <Select
              value={m.source}
              label="Source Column"
              onChange={(e) => handleMappingChange(index, { source: e.target.value })}
            >
              {availableColumns.length > 0 ? (
                availableColumns.map((col) => (
                  <MenuItem key={col} value={col}>
                    {col}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="">
                  <em>No columns available</em>
                </MenuItem>
              )}
            </Select>
          </FormControl>
          <Typography>→</Typography>
          <TextField
            label="Target Field"
            value={m.target}
            onChange={(e) => handleMappingChange(index, { target: e.target.value })}
            size="small"
            sx={{ flex: 1 }}
          />
          <IconButton size="small" onClick={() => handleDeleteMapping(index)} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ))}
      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={handleAddMapping}
        sx={{ alignSelf: 'flex-start' }}
      >
        Add Field Mapping
      </Button>
    </Stack>
  );
}
