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
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
} from '@mui/material';
import { ReactElement, useMemo, useState } from 'react';
import ExpandMoreIcon from 'mdi-material-ui/ChevronDown';
import { FieldMapping } from './selection-action-model';

export interface PayloadPreviewProps {
  payloadTemplate?: string;
  fieldMapping?: FieldMapping[];
  sampleData: Array<Record<string, unknown>>;
  availableColumns: string[];
}

/**
 * Preview component showing the transformed payload output
 */
export function PayloadPreview({
  payloadTemplate,
  fieldMapping,
  sampleData,
  availableColumns,
}: PayloadPreviewProps): ReactElement {
  const [previewRowIndex, setPreviewRowIndex] = useState(0);
  const [showBulkPreview, setShowBulkPreview] = useState(false);

  const hasSampleData = sampleData.length > 0;
  const hasTransformation = Boolean(payloadTemplate || (fieldMapping && fieldMapping.length > 0));

  const previewResult = useMemo(() => {
    if (!hasTransformation) {
      if (!hasSampleData) {
        return {
          preview: generateMockDataHint(availableColumns),
          isValid: true,
          isMock: true,
        };
      }
      // Raw data mode
      const data = showBulkPreview ? sampleData.slice(0, 3) : sampleData[previewRowIndex];
      return {
        preview: JSON.stringify(data, null, 2),
        isValid: true,
        isMock: false,
      };
    }

    if (!hasSampleData) {
      // Show mock data hint
      return {
        preview: generateMockDataHint(availableColumns),
        isValid: true,
        isMock: true,
      };
    }

    try {
      if (payloadTemplate) {
        const rows = showBulkPreview ? sampleData.slice(0, 3) : [sampleData[previewRowIndex] ?? {}];
        const transformed = rows.map((row) => applyTemplate(payloadTemplate, row as Record<string, unknown>));

        if (showBulkPreview) {
          return {
            preview: JSON.stringify(transformed, null, 2),
            isValid: true,
            isMock: false,
          };
        }
        return {
          preview: JSON.stringify(transformed[0], null, 2),
          isValid: true,
          isMock: false,
        };
      }

      if (fieldMapping && fieldMapping.length > 0) {
        const rows = showBulkPreview ? sampleData.slice(0, 3) : [sampleData[previewRowIndex] ?? {}];
        const transformed = rows.map((row) => applyFieldMapping(row as Record<string, unknown>, fieldMapping));

        if (showBulkPreview) {
          return {
            preview: JSON.stringify(transformed, null, 2),
            isValid: true,
            isMock: false,
          };
        }
        return {
          preview: JSON.stringify(transformed[0], null, 2),
          isValid: true,
          isMock: false,
        };
      }

      return { preview: '{}', isValid: true, isMock: false };
    } catch (error) {
      return {
        preview: error instanceof Error ? error.message : 'Invalid transformation',
        isValid: false,
        isMock: false,
      };
    }
  }, [
    payloadTemplate,
    fieldMapping,
    sampleData,
    previewRowIndex,
    showBulkPreview,
    hasSampleData,
    hasTransformation,
    availableColumns,
  ]);

  return (
    <Accordion defaultExpanded={false}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2">Payload Preview</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {hasSampleData && (
            <>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Preview Row</InputLabel>
                <Select
                  value={previewRowIndex}
                  label="Preview Row"
                  onChange={(e) => setPreviewRowIndex(Number(e.target.value))}
                  disabled={showBulkPreview}
                >
                  {sampleData.slice(0, 10).map((_, index) => (
                    <MenuItem key={index} value={index}>
                      Row {index + 1}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={showBulkPreview}
                    onChange={(e) => setShowBulkPreview(e.target.checked)}
                    size="small"
                  />
                }
                label="Show bulk preview (first 3 rows)"
              />
            </>
          )}
        </Box>

        {previewResult.isMock && (
          <Typography variant="caption" color="text.secondary" fontStyle="italic" display="block" mb={1}>
            Configure query to see preview with real data
          </Typography>
        )}

        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor: previewResult.isValid ? 'grey.100' : 'error.light',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 300,
            overflow: 'auto',
          }}
        >
          {previewResult.preview}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

/**
 * Generate a mock data hint structure from available columns
 */
function generateMockDataHint(columns: string[]): string {
  if (columns.length === 0) {
    return '{\n  "column1": "<value>",\n  "column2": "<value>"\n}';
  }

  const mockObj: Record<string, string> = {};
  columns.forEach((col) => {
    mockObj[col] = '<value>';
  });
  return JSON.stringify(mockObj, null, 2);
}

/**
 * Apply a JSON template with variable substitution
 */
function applyTemplate(template: string, row: Record<string, unknown>): unknown {
  // Replace ${__data.fields["columnName"]} with actual values
  let result = template;

  const fieldRegex = /\$\{__data\.fields\["([^"]+)"\]\}/g;
  result = result.replace(fieldRegex, (_, fieldName) => {
    const value = row[fieldName];
    if (value === undefined || value === null) {
      return 'null';
    }
    if (typeof value === 'string') {
      return value;
    }
    return String(value);
  });

  // Try to parse as JSON
  try {
    return JSON.parse(result);
  } catch {
    throw new Error(`Invalid JSON after template substitution:\n${result}`);
  }
}

/**
 * Apply field mapping to transform row data
 */
function applyFieldMapping(row: Record<string, unknown>, mapping: FieldMapping[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const { source, target } of mapping) {
    if (source && target) {
      result[target] = row[source];
    }
  }
  return result;
}
