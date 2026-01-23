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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Switch,
  SwitchProps,
  TextField,
  Typography,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
  DragAndDropElement,
  DragButton,
  handleMoveDown,
  handleMoveUp,
  InfoTooltip,
  JSONEditor,
  OptionsEditorControl,
  OptionsEditorGroup,
  useDragAndDropMonitor,
} from '@perses-dev/components';
import AlertIcon from 'mdi-material-ui/Alert';
import CheckIcon from 'mdi-material-ui/Check';
import ChevronDown from 'mdi-material-ui/ChevronDown';
import ChevronRight from 'mdi-material-ui/ChevronRight';
import CloseIcon from 'mdi-material-ui/Close';
import SettingsIcon from 'mdi-material-ui/Cog';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import DownloadIcon from 'mdi-material-ui/Download';
import InfoIcon from 'mdi-material-ui/InformationOutline';
import LinkIcon from 'mdi-material-ui/Link';
import MagnifyScan from 'mdi-material-ui/MagnifyScan';
import PauseIcon from 'mdi-material-ui/Pause';
import PlayIcon from 'mdi-material-ui/Play';
import PlusIcon from 'mdi-material-ui/Plus';
import RefreshIcon from 'mdi-material-ui/Refresh';
import RobotOutline from 'mdi-material-ui/RobotOutline';
import SendIcon from 'mdi-material-ui/Send';
import StopIcon from 'mdi-material-ui/Stop';
import SyncIcon from 'mdi-material-ui/Sync';
import UploadIcon from 'mdi-material-ui/Upload';
import { ReactElement, useCallback, useMemo, useState } from 'react';

export type ActionIcon =
  | 'play'
  | 'pause'
  | 'stop'
  | 'delete'
  | 'refresh'
  | 'send'
  | 'download'
  | 'upload'
  | 'check'
  | 'close'
  | 'alert'
  | 'info'
  | 'settings'
  | 'link'
  | 'sync'
  | 'troubleshoot'
  | 'ask-ai';

export interface BaseAction {
  type: 'event' | 'webhook';
  name: string;
  confirmMessage?: string;
  icon?: ActionIcon;
  enabled?: boolean;
  batchMode: BatchMode;
  bodyTemplate?: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type BatchMode = 'batch' | 'individual';

export type ContentType = 'none' | 'json' | 'text';

export interface WebhookAction extends BaseAction {
  type: 'webhook';
  url: string;
  method: HttpMethod;
  contentType: ContentType;
  headers?: Record<string, string>;
}

export interface EventAction extends BaseAction {
  type: 'event';
  eventName: string;
}

export type ItemAction = EventAction | WebhookAction;

export interface ActionOptions {
  enabled?: boolean;
  actionsList?: ItemAction[];
  displayInHeader?: boolean;
  displayWithItem?: boolean;
}

export interface SelectionOptions {
  enabled?: boolean;
}

export interface ItemSelectionActionsEditorProps {
  actionOptions?: ActionOptions;
  selectionOptions?: SelectionOptions;
  onChangeActions: (actions?: ActionOptions) => void;
  onChangeSelection: (selection?: SelectionOptions) => void;
}

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const BATCH_MODES: Array<{ value: BatchMode; label: string }> = [
  { value: 'individual', label: 'Individual (one request per selection)' },
  { value: 'batch', label: 'Batch (single request with all selections)' },
];
const CONTENT_TYPES: Array<{ value: ContentType; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'text', label: 'Text' },
];
const BODY_METHODS: HttpMethod[] = ['POST', 'PUT', 'PATCH'];
const BODY_CLEAR_CONFIRM_MESSAGE = 'Changing this option will remove the current body template. Continue?';

/** Available action icons with their display components */
export const ACTION_ICONS: Array<{ value: ActionIcon; label: string; icon: ReactElement }> = [
  { value: 'play', label: 'Play', icon: <PlayIcon fontSize="inherit" /> },
  { value: 'pause', label: 'Pause', icon: <PauseIcon fontSize="inherit" /> },
  { value: 'stop', label: 'Stop', icon: <StopIcon fontSize="inherit" /> },
  { value: 'delete', label: 'Delete', icon: <DeleteIcon fontSize="inherit" /> },
  { value: 'refresh', label: 'Refresh', icon: <RefreshIcon fontSize="inherit" /> },
  { value: 'send', label: 'Send', icon: <SendIcon fontSize="inherit" /> },
  { value: 'download', label: 'Download', icon: <DownloadIcon fontSize="inherit" /> },
  { value: 'upload', label: 'Upload', icon: <UploadIcon fontSize="inherit" /> },
  { value: 'check', label: 'Check', icon: <CheckIcon fontSize="inherit" /> },
  { value: 'close', label: 'Close', icon: <CloseIcon fontSize="inherit" /> },
  { value: 'alert', label: 'Alert', icon: <AlertIcon fontSize="inherit" /> },
  { value: 'info', label: 'Info', icon: <InfoIcon fontSize="inherit" /> },
  { value: 'settings', label: 'Settings', icon: <SettingsIcon fontSize="inherit" /> },
  { value: 'link', label: 'Link', icon: <LinkIcon fontSize="inherit" /> },
  { value: 'sync', label: 'Sync', icon: <SyncIcon fontSize="inherit" /> },
  { value: 'troubleshoot', label: 'Troubleshoot', icon: <MagnifyScan fontSize="inherit" /> },
  { value: 'ask-ai', label: 'Ask AI', icon: <RobotOutline fontSize="inherit" /> },
];

const URL_HELPER_TEXT = 'Supports interpolation: ${__data.fields["fieldName"]}, ${__data.index}, ${__data.count}';

function createDefaultEventAction(): EventAction {
  return {
    type: 'event',
    name: 'New Event Action',
    eventName: 'selection-action',
    batchMode: 'individual',
    enabled: true,
  };
}

function createDefaultWebhookAction(): WebhookAction {
  return {
    type: 'webhook',
    name: 'New Webhook Action',
    url: '',
    method: 'POST',
    contentType: 'none',
    batchMode: 'individual',
    enabled: true,
  };
}

interface ItemActionEditorProps {
  action: ItemAction;
  index: number;
  onChange: (index: number, action: ItemAction) => void;
  onRemove: (index: number) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

interface InterpolationHelperProps {
  batchMode: BatchMode;
}

function InterpolationHelper({ batchMode }: InterpolationHelperProps): ReactElement {
  let content: ReactElement = (
    <div>
      Individual mode patterns: <code>{'${__data.fields["field"]}'}</code>, <code>{'${__data.index}'}</code>,{' '}
      <code>{'${__data.count}'}</code>
    </div>
  );

  if (batchMode === 'batch') {
    content = (
      <div>
        Batch mode patterns: <code>{'${__data}'}</code>, <code>{"${__data[0].fields['field']}"}</code>,{' '}
        <code>{"${__data.fields['field']:csv}"}</code>, <code>{'${__data.count}'}</code>
      </div>
    );
  }

  return (
    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
      {content}
    </Typography>
  );
}

function EventActionEditor({
  action,
  index,
  onChange,
  onRemove,
  onMoveDown,
  onMoveUp,
}: ItemActionEditorProps): ReactElement {
  const eventAction = action as EventAction;

  const [isCollapsed, setIsCollapsed] = useState(true);
  const hasBodyTemplate = (eventAction.bodyTemplate ?? '').trim().length > 0;

  const handleIncludesTemplateChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextContentType = event.target.value as 'custom' | 'none';

      const bodyTemplate = nextContentType === 'custom' ? JSON.stringify({}) : undefined;

      onChange(index, { ...eventAction, bodyTemplate: bodyTemplate });
    },
    [index, onChange, eventAction]
  );

  const handleBodyTemplateChange = useCallback(
    (template: string) => {
      onChange(index, { ...eventAction, bodyTemplate: template || undefined });
    },
    [index, onChange, eventAction]
  );

  const jsonDataTemplate = useMemo(() => {
    if (eventAction.bodyTemplate) {
      try {
        return JSON.parse(eventAction.bodyTemplate);
      } catch {
        return {};
      }
    }
  }, [eventAction.bodyTemplate]);

  return (
    <DragAndDropElement data={eventAction as unknown as Record<string, unknown>}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={4}>
        <Stack direction="row" gap={1}>
          <IconButton
            data-testid={`event-action-toggle#${eventAction.name}`}
            size="small"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight /> : <ChevronDown />}
          </IconButton>
          <Typography variant="overline" component="h4" sx={{ textTransform: 'none' }}>
            EVENT ACTION:{' '}
            {eventAction.name ? (
              <span>
                <strong>{eventAction.name}</strong>
              </span>
            ) : (
              <strong>{eventAction.name}</strong>
            )}
          </Typography>
        </Stack>

        <Stack direction="row" gap={1}>
          <InfoTooltip description="Remove action settings" placement="top">
            <IconButton
              size="small"
              sx={{ marginLeft: 'auto' }}
              onClick={() => onRemove(index)}
              key="delete-action-button"
            >
              <DeleteIcon />
            </IconButton>
          </InfoTooltip>
          <InfoTooltip description="Reorder action settings" placement="top">
            <DragButton
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              menuSx={{
                '.MuiPaper-root': { backgroundColor: (theme) => theme.palette.background.lighter },
              }}
              key="reorder-action-button"
            />
          </InfoTooltip>
        </Stack>
      </Stack>

      {!isCollapsed && (
        <Stack spacing={2}>
          <OptionsEditorControl
            label="Enabled"
            control={
              <Switch
                checked={eventAction?.enabled ?? false}
                onChange={(e) => onChange(index, { ...eventAction, enabled: e.target.checked })}
              />
            }
          />

          <Stack direction="row" spacing={2}>
            <TextField
              label="Action Name"
              size="small"
              value={eventAction.name}
              onChange={(e) => onChange(index, { ...eventAction, name: e.target.value })}
              sx={{ flexGrow: 1 }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Icon</InputLabel>
              <Select
                value={eventAction.icon || ''}
                label="Icon"
                onChange={(e) => onChange(index, { ...eventAction, icon: (e.target.value as ActionIcon) || undefined })}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {ACTION_ICONS.map((iconOption) => (
                  <MenuItem key={iconOption.value} value={iconOption.value}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {iconOption.icon}
                      <span>{iconOption.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Event Name"
              size="small"
              value={eventAction.eventName}
              onChange={(e) => onChange(index, { ...eventAction, eventName: e.target.value })}
              helperText="Name of the CustomEvent to dispatch (e.g., 'selection-action')"
              fullWidth
            />

            <FormControl size="small" sx={{ flexGrow: 1, minWidth: 280 }}>
              <InputLabel>Batch Mode</InputLabel>
              <Select
                value={eventAction.batchMode ?? 'individual'}
                label="Batch Mode"
                onChange={(e) => onChange(index, { ...eventAction, batchMode: e.target.value as BatchMode })}
              >
                {BATCH_MODES.map((mode) => (
                  <MenuItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <FormControl component="fieldset" size="small">
            <FormLabel component="legend">Template</FormLabel>
            <RadioGroup row value={hasBodyTemplate ? 'custom' : 'none'} onChange={handleIncludesTemplateChange}>
              <FormControlLabel value="none" control={<Radio size="small" />} label="None" />
              <FormControlLabel value="custom" control={<Radio size="small" />} label="JSON template" />
            </RadioGroup>
          </FormControl>

          {hasBodyTemplate && (
            <>
              <InterpolationHelper batchMode={eventAction.batchMode} />
              <JSONEditor
                value={jsonDataTemplate || ''}
                onChange={handleBodyTemplateChange}
                minHeight="100px"
                maxHeight="200px"
              />
            </>
          )}

          <TextField
            label="Confirmation Message (optional)"
            size="small"
            value={eventAction.confirmMessage || ''}
            onChange={(e) => onChange(index, { ...eventAction, confirmMessage: e.target.value || undefined })}
            helperText="If set, shows a confirmation dialog before executing the action"
            fullWidth
            multiline
            rows={2}
          />
        </Stack>
      )}
    </DragAndDropElement>
  );
}

function WebhookActionEditor({
  action,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: ItemActionEditorProps): ReactElement {
  const webhookAction = action as WebhookAction;
  const [pendingChange, setPendingChange] = useState<
    { kind: 'contentType'; value: ContentType } | { kind: 'method'; value: HttpMethod } | null
  >(null);
  const contentTypeValue = webhookAction.contentType ?? 'none';
  const hasBodyTemplate = (webhookAction.bodyTemplate ?? '').trim().length > 0;
  const supportsBody = BODY_METHODS.includes(webhookAction.method);

  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleBodyTemplateChange = useCallback(
    (template: string) => {
      onChange(index, { ...webhookAction, bodyTemplate: template || undefined });
    },
    [index, onChange, webhookAction]
  );

  const handleTextTemplateChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(index, { ...webhookAction, bodyTemplate: event.target.value || undefined });
    },
    [index, onChange, webhookAction]
  );

  const handleContentTypeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextContentType = event.target.value as ContentType;
      if (nextContentType === contentTypeValue) {
        return;
      }

      if (hasBodyTemplate) {
        setPendingChange({ kind: 'contentType', value: nextContentType });
        return;
      }

      onChange(index, { ...webhookAction, contentType: nextContentType });
    },
    [contentTypeValue, hasBodyTemplate, index, onChange, webhookAction]
  );

  const handleMethodChange = useCallback(
    (event: SelectChangeEvent<HttpMethod>) => {
      const nextMethod = event.target.value as HttpMethod;
      if (nextMethod === webhookAction.method) {
        return;
      }

      const nextSupportsBody = BODY_METHODS.includes(nextMethod);
      if (!nextSupportsBody && hasBodyTemplate) {
        setPendingChange({ kind: 'method', value: nextMethod });
        return;
      }

      onChange(index, { ...webhookAction, method: nextMethod });
    },
    [hasBodyTemplate, index, onChange, webhookAction]
  );

  const handleConfirmClose = useCallback(() => {
    setPendingChange(null);
  }, []);

  const handleConfirmApply = useCallback(() => {
    if (!pendingChange) {
      return;
    }

    if (pendingChange.kind === 'contentType') {
      onChange(index, { ...webhookAction, contentType: pendingChange.value, bodyTemplate: undefined });
    } else {
      onChange(index, { ...webhookAction, method: pendingChange.value, bodyTemplate: undefined });
    }

    setPendingChange(null);
  }, [index, onChange, pendingChange, webhookAction]);

  const jsonBodyTemplate = useMemo(() => {
    if (webhookAction.contentType === 'json' && webhookAction.bodyTemplate) {
      try {
        return JSON.parse(webhookAction.bodyTemplate);
      } catch {
        return {};
      }
    }
  }, [webhookAction.bodyTemplate, webhookAction.contentType]);

  return (
    <DragAndDropElement data={webhookAction as unknown as Record<string, unknown>}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={4}>
        <Stack direction="row" gap={1}>
          <IconButton
            data-testid={`column-toggle#${webhookAction.name}`}
            size="small"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight /> : <ChevronDown />}
          </IconButton>
          <Typography variant="overline" component="h4" sx={{ textTransform: 'none' }}>
            WEBHOOK ACTION: <strong>{webhookAction.name}</strong>
          </Typography>
        </Stack>

        <Stack direction="row" gap={1}>
          <InfoTooltip description="Remove action settings" placement="top">
            <IconButton
              size="small"
              sx={{ marginLeft: 'auto' }}
              onClick={() => onRemove(index)}
              key="delete-action-button"
            >
              <DeleteIcon />
            </IconButton>
          </InfoTooltip>
          <InfoTooltip description="Reorder action settings" placement="top">
            <DragButton
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              menuSx={{
                '.MuiPaper-root': { backgroundColor: (theme) => theme.palette.background.lighter },
              }}
              key="reorder-action-button"
            />
          </InfoTooltip>
        </Stack>
      </Stack>

      {!isCollapsed && (
        <Stack spacing={2}>
          <OptionsEditorControl
            label="Enabled"
            control={
              <Switch
                checked={action?.enabled ?? false}
                onChange={(e) => onChange(index, { ...webhookAction, enabled: e.target.checked })}
              />
            }
          />

          <Stack direction="row" spacing={2}>
            <TextField
              label="Action Name"
              size="small"
              value={webhookAction.name}
              onChange={(e) => onChange(index, { ...webhookAction, name: e.target.value })}
              sx={{ flexGrow: 1 }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Icon</InputLabel>
              <Select
                value={webhookAction.icon || ''}
                label="Icon"
                onChange={(e) =>
                  onChange(index, { ...webhookAction, icon: (e.target.value as ActionIcon) || undefined })
                }
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {ACTION_ICONS.map((iconOption) => (
                  <MenuItem key={iconOption.value} value={iconOption.value}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {iconOption.icon}
                      <span>{iconOption.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <TextField
            label="URL"
            size="small"
            value={webhookAction.url}
            onChange={(e) => onChange(index, { ...webhookAction, url: e.target.value })}
            helperText={URL_HELPER_TEXT}
            fullWidth
          />

          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Method</InputLabel>
              <Select value={webhookAction.method} label="Method" onChange={handleMethodChange}>
                {HTTP_METHODS.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ flexGrow: 1 }}>
              <InputLabel>Batch Mode</InputLabel>
              <Select
                value={webhookAction.batchMode}
                label="Batch Mode"
                onChange={(e) => onChange(index, { ...webhookAction, batchMode: e.target.value as BatchMode })}
              >
                {BATCH_MODES.map((mode) => (
                  <MenuItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <FormControl component="fieldset" size="small">
            <FormLabel component="legend">Content Type</FormLabel>
            <RadioGroup row value={contentTypeValue} onChange={handleContentTypeChange}>
              {CONTENT_TYPES.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio size="small" />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </FormControl>

          {supportsBody && contentTypeValue !== 'none' && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {contentTypeValue === 'json' ? 'Body Template (JSON)' : 'Body Template (Text)'}
              </Typography>
              <InterpolationHelper batchMode={webhookAction.batchMode} />
              {contentTypeValue === 'json' ? (
                <JSONEditor
                  value={jsonBodyTemplate || ''}
                  onChange={handleBodyTemplateChange}
                  minHeight="100px"
                  maxHeight="200px"
                />
              ) : (
                <TextField
                  value={webhookAction.bodyTemplate || ''}
                  onChange={handleTextTemplateChange}
                  fullWidth
                  multiline
                  rows={5}
                />
              )}
            </Box>
          )}

          <TextField
            label="Confirmation Message (optional)"
            size="small"
            value={webhookAction.confirmMessage || ''}
            onChange={(e) => onChange(index, { ...webhookAction, confirmMessage: e.target.value || undefined })}
            helperText="If set, shows a confirmation dialog before executing the action"
            fullWidth
            multiline
            rows={2}
          />
        </Stack>
      )}

      <Dialog open={Boolean(pendingChange)} onClose={handleConfirmClose} aria-labelledby="selection-body-clear-title">
        <DialogTitle id="selection-body-clear-title">Remove Body Template?</DialogTitle>
        <DialogContent>
          <DialogContentText>{BODY_CLEAR_CONFIRM_MESSAGE}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose}>Cancel</Button>
          <Button onClick={handleConfirmApply} variant="contained" color="primary">
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </DragAndDropElement>
  );
}

export function ItemSelectionActionsEditor({
  actionOptions,
  selectionOptions,
  onChangeActions,
  onChangeSelection,
}: ItemSelectionActionsEditorProps): ReactElement {
  const actions = useMemo(
    () => actionOptions || { enabled: true, displayInHeader: true, displayWithItem: false },
    [actionOptions]
  );

  const handleEnableActionsChange: SwitchProps['onChange'] = (_: unknown, checked: boolean) => {
    onChangeActions({ ...actions, enabled: checked ? true : undefined });
  };

  const handleEnableSelectionChange: SwitchProps['onChange'] = (_: unknown, checked: boolean) => {
    onChangeSelection({ ...selectionOptions, enabled: checked ? true : undefined });
  };

  const handleDisplayInHeaderChange: SwitchProps['onChange'] = (_: unknown, checked: boolean) => {
    onChangeActions({ ...actions, displayInHeader: checked ? true : undefined });
  };

  const handleDisplayWithItemChange: SwitchProps['onChange'] = (_: unknown, checked: boolean) => {
    onChangeActions({ ...actions, displayWithItem: checked ? true : undefined });
  };

  const handleAddEventAction = useCallback(() => {
    onChangeActions({ ...actions, actionsList: [...(actions.actionsList ?? []), createDefaultEventAction()] });
  }, [actions, onChangeActions]);

  const handleAddWebhookAction = useCallback(() => {
    onChangeActions({ ...actions, actionsList: [...(actions.actionsList ?? []), createDefaultWebhookAction()] });
  }, [actions, onChangeActions]);

  const handleActionChange = useCallback(
    (index: number, updatedAction: ItemAction) => {
      const newActions = actions.actionsList ? [...actions.actionsList] : [];
      newActions[index] = updatedAction;
      onChangeActions({ ...actions, actionsList: newActions });
    },
    [actions, onChangeActions]
  );

  const handleRemoveAction = useCallback(
    (index: number) => {
      const newActions = actions.actionsList ? actions.actionsList.filter((_, i) => i !== index) : [];
      onChangeActions(newActions.length > 0 ? { ...actions, actionsList: newActions } : undefined);
    },
    [actions, onChangeActions]
  );

  useDragAndDropMonitor({
    elements: actions.actionsList as unknown as Array<Record<string, unknown>>,
    accessKey: 'name',
    onChange: (newElements) => {
      onChangeActions({ ...actions, actionsList: newElements as unknown as ItemAction[] });
    },
  });

  return (
    <Stack spacing={1}>
      <OptionsEditorControl
        label="Enable Item Selection"
        description="Allow selecting items"
        control={<Switch checked={selectionOptions?.enabled ?? false} onChange={handleEnableSelectionChange} />}
      />
      <OptionsEditorControl
        label="Enable Item Actions"
        description="Allow executing actions on selected items"
        control={<Switch checked={actionOptions?.enabled ?? false} onChange={handleEnableActionsChange} />}
      />
      <OptionsEditorControl
        label="Display Actions in Panel Header"
        description="Show action buttons in the panel header when items are selected"
        control={<Switch checked={actionOptions?.displayInHeader ?? false} onChange={handleDisplayInHeaderChange} />}
      />
      <OptionsEditorControl
        label="Display Actions with Each Item"
        description="Show action buttons alongside each item when selected"
        control={<Switch checked={actionOptions?.displayWithItem ?? false} onChange={handleDisplayWithItemChange} />}
      />
      <OptionsEditorGroup title="Actions">
        <Stack spacing={3}>
          {!actions.actionsList || actions.actionsList.length === 0 ? (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              No actions defined. Add an action to enable triggering events or webhooks on selected data.
            </Typography>
          ) : (
            <Stack spacing={1} border="none">
              {actions.actionsList &&
                actions.actionsList.map((action, index) => (
                  <Box key={index} borderBottom={1} borderColor={(theme) => theme.palette.divider} pb={1}>
                    {action.type === 'event' ? (
                      <EventActionEditor
                        action={action}
                        index={index}
                        onChange={handleActionChange}
                        onRemove={handleRemoveAction}
                        onMoveDown={() =>
                          onChangeActions({ ...actions, actionsList: handleMoveDown(action, actions.actionsList!) })
                        }
                        onMoveUp={() =>
                          onChangeActions({ ...actions, actionsList: handleMoveUp(action, actions.actionsList!) })
                        }
                      />
                    ) : (
                      <WebhookActionEditor
                        action={action}
                        index={index}
                        onChange={handleActionChange}
                        onRemove={handleRemoveAction}
                        onMoveDown={() =>
                          onChangeActions({ ...actions, actionsList: handleMoveDown(action, actions.actionsList!) })
                        }
                        onMoveUp={() =>
                          onChangeActions({ ...actions, actionsList: handleMoveUp(action, actions.actionsList!) })
                        }
                      />
                    )}
                  </Box>
                ))}
            </Stack>
          )}

          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<PlusIcon />} onClick={handleAddEventAction}>
              Add Event Action
            </Button>
            <Button variant="contained" startIcon={<PlusIcon />} onClick={handleAddWebhookAction}>
              Add Webhook Action
            </Button>
          </Stack>
        </Stack>
      </OptionsEditorGroup>
    </Stack>
  );
}
