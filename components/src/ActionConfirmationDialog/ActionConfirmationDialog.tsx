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

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { ReactElement } from 'react';

export interface ActionConfirmationDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;

  /**
   * Title of the confirmation dialog
   */
  title?: string;

  /**
   * Message displayed in the dialog body
   */
  message?: string;

  /**
   * Label for the confirm button
   */
  actionLabel?: string;

  /**
   * Number of selected items (displayed in the message if provided)
   */
  selectedItemCount?: number;

  /**
   * Callback when user confirms the action
   */
  onConfirm: () => void;

  /**
   * Callback when user cancels the action
   */
  onCancel: () => void;

  /**
   * Whether the action is currently being executed (shows loading state)
   */
  isLoading?: boolean;
}

/**
 * Reusable confirmation dialog for destructive or important selection actions
 */
export function ActionConfirmationDialog({
  open,
  title = 'Confirm Action',
  message,
  actionLabel = 'Confirm',
  selectedItemCount,
  onConfirm,
  onCancel,
  isLoading = false,
}: ActionConfirmationDialogProps): ReactElement {
  const defaultMessage = selectedItemCount
    ? `Are you sure you want to perform this action on ${selectedItemCount} selected item${selectedItemCount > 1 ? 's' : ''}?`
    : 'Are you sure you want to perform this action?';

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="action-confirmation-dialog-title"
      aria-describedby="action-confirmation-dialog-description"
    >
      <DialogTitle id="action-confirmation-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="action-confirmation-dialog-description">{message || defaultMessage}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={onConfirm} color="primary" variant="contained" disabled={isLoading}>
          {isLoading ? 'Executing...' : actionLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
