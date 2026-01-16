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
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import ArrowDownIcon from 'mdi-material-ui/ArrowDown';
import ArrowUpIcon from 'mdi-material-ui/ArrowUp';
import ExpandMoreIcon from 'mdi-material-ui/ChevronDown';
import DeleteIcon from 'mdi-material-ui/Delete';
import { ReactElement } from 'react';
import { ACTION_ICON_OPTIONS, getActionIcon } from '../utils/icon-map';
import { ActionConditionEditor } from './ActionConditionEditor';
import { PayloadConfigEditor } from './PayloadConfigEditor';
import {
  ActionCondition,
  ActionIcon,
  CallbackActionSpec,
  FieldMapping,
  SelectionAction,
  WebhookActionSpec,
  isCallbackAction,
  isWebhookAction,
} from './selection-action-model';

export interface SelectionActionFormProps {
  action: SelectionAction;
  onChange: (action: SelectionAction) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isFirst: boolean;
  isLast: boolean;
  availableColumns?: string[];
  sampleData?: Array<Record<string, unknown>>;
}

/**
 * Form for editing a single selection action
 */
export function SelectionActionForm({
  action,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isExpanded,
  onToggleExpand,
  isFirst,
  isLast,
  availableColumns = [],
  sampleData = [],
}: SelectionActionFormProps): ReactElement {
  function handleKindChange(kind: 'callback' | 'webhook'): void {
    const newSpec: CallbackActionSpec | WebhookActionSpec =
      kind === 'callback' ? { eventName: 'customAction' } : { url: '', method: 'POST' };
    onChange({ ...action, kind, spec: newSpec });
  }

  function handleCallbackSpecChange(spec: CallbackActionSpec): void {
    onChange({ ...action, spec });
  }

  function handleWebhookSpecChange(spec: WebhookActionSpec): void {
    onChange({ ...action, spec });
  }

  return (
    <Accordion expanded={isExpanded} onChange={onToggleExpand} sx={{ width: '100%' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%', pr: 2 }}>
          {action.icon && <Box sx={{ display: 'flex' }}>{getActionIcon(action.icon, { fontSize: 'small' })}</Box>}
          <Typography sx={{ flexGrow: 1 }}>{action.label || 'Unnamed Action'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {action.kind}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={isFirst}
          >
            <ArrowUpIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={isLast}
          >
            <ArrowDownIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {/* Basic Settings */}
          <Stack direction="row" spacing={2}>
            <TextField
              label="ID"
              value={action.id}
              onChange={(e) => onChange({ ...action, id: e.target.value })}
              size="small"
              sx={{ flex: 1 }}
            />
            <TextField
              label="Label"
              value={action.label}
              onChange={(e) => onChange({ ...action, label: e.target.value })}
              size="small"
              sx={{ flex: 1 }}
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Icon</InputLabel>
              <Select
                value={action.icon || ''}
                label="Icon"
                onChange={(e) => onChange({ ...action, icon: (e.target.value as ActionIcon) || undefined })}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {ACTION_ICON_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {getActionIcon(option.value, { fontSize: 'small' })}
                      <span>{option.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Kind</InputLabel>
              <Select
                value={action.kind}
                label="Kind"
                onChange={(e) => handleKindChange(e.target.value as 'callback' | 'webhook')}
              >
                <MenuItem value="callback">Callback (Event)</MenuItem>
                <MenuItem value="webhook">Webhook (HTTP)</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Kind-specific settings */}
          {isCallbackAction(action) && (
            <TextField
              label="Event Name"
              value={action.spec.eventName}
              onChange={(e) => handleCallbackSpecChange({ ...action.spec, eventName: e.target.value })}
              size="small"
              helperText="Custom event name dispatched via window.dispatchEvent()"
            />
          )}

          {isWebhookAction(action) && <WebhookSpecEditor spec={action.spec} onChange={handleWebhookSpecChange} />}

          {/* Execution Options */}
          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            Execution Options
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={action.bulkMode ?? false}
                onChange={(e) => onChange({ ...action, bulkMode: e.target.checked })}
              />
            }
            label="Bulk Mode (send all selected rows in single request)"
          />

          {/* Confirmation Settings */}
          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            Confirmation
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={action.requireConfirmation ?? false}
                onChange={(e) => onChange({ ...action, requireConfirmation: e.target.checked })}
              />
            }
            label="Require confirmation before executing"
          />
          {action.requireConfirmation && (
            <TextField
              label="Confirmation Message"
              value={action.confirmationMessage || ''}
              onChange={(e) => onChange({ ...action, confirmationMessage: e.target.value })}
              size="small"
              multiline
              rows={2}
              placeholder="Are you sure you want to perform this action?"
            />
          )}

          {/* Conditional Visibility */}
          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            Conditional Visibility
          </Typography>
          <ActionConditionEditor
            condition={action.condition}
            onChange={(condition: ActionCondition | undefined) => onChange({ ...action, condition })}
            availableColumns={availableColumns}
          />

          {/* Payload Configuration */}
          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            Payload Configuration
          </Typography>
          <PayloadConfigEditor
            payloadTemplate={action.payloadTemplate}
            fieldMapping={action.fieldMapping}
            onPayloadTemplateChange={(template: string | undefined) =>
              onChange({ ...action, payloadTemplate: template, fieldMapping: undefined })
            }
            onFieldMappingChange={(mapping: FieldMapping[] | undefined) =>
              onChange({ ...action, fieldMapping: mapping, payloadTemplate: undefined })
            }
            availableColumns={availableColumns}
            sampleData={sampleData}
          />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

interface WebhookSpecEditorProps {
  spec: WebhookActionSpec;
  onChange: (spec: WebhookActionSpec) => void;
}

function WebhookSpecEditor({ spec, onChange }: WebhookSpecEditorProps): ReactElement {
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Method</InputLabel>
          <Select
            value={spec.method || 'POST'}
            label="Method"
            onChange={(e) => onChange({ ...spec, method: e.target.value as WebhookActionSpec['method'] })}
          >
            <MenuItem value="GET">GET</MenuItem>
            <MenuItem value="POST">POST</MenuItem>
            <MenuItem value="PUT">PUT</MenuItem>
            <MenuItem value="PATCH">PATCH</MenuItem>
            <MenuItem value="DELETE">DELETE</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="URL"
          value={spec.url}
          onChange={(e) => onChange({ ...spec, url: e.target.value })}
          size="small"
          sx={{ flex: 1 }}
          helperText='Supports variables: ${varName} and ${__data.fields["column"]}'
        />
      </Stack>

      {/* Rate Limiting */}
      <Typography variant="caption" color="text.secondary">
        Rate Limiting (optional)
      </Typography>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Requests/Second"
          type="number"
          value={spec.rateLimit?.requestsPerSecond || ''}
          onChange={(e) =>
            onChange({
              ...spec,
              rateLimit: {
                ...spec.rateLimit,
                requestsPerSecond: e.target.value ? Number(e.target.value) : undefined,
              },
            })
          }
          size="small"
          inputProps={{ min: 1 }}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Max Concurrent"
          type="number"
          value={spec.rateLimit?.maxConcurrent || ''}
          onChange={(e) =>
            onChange({
              ...spec,
              rateLimit: {
                ...spec.rateLimit,
                maxConcurrent: e.target.value ? Number(e.target.value) : undefined,
              },
            })
          }
          size="small"
          inputProps={{ min: 1 }}
          sx={{ flex: 1 }}
        />
      </Stack>
    </Stack>
  );
}
