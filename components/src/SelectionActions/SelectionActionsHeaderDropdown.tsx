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
  CircularProgress,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import LightningBoltIcon from 'mdi-material-ui/LightningBolt';
import { ReactElement, useState, MouseEvent } from 'react';
import { ActionConfirmationDialog } from '../ActionConfirmationDialog';
import { getActionIcon } from '../utils/icon-map';
import { useSelectionContextOptional } from './SelectionContext';
import { SelectionAction } from './selection-action-model';
import { executeSelectionAction, getVisibleActions } from './action-utils';

/**
 * Header dropdown component for selection actions.
 * Renders a lightning bolt icon that opens a dropdown menu with available selection actions.
 * - Returns null if no selectionActions are configured
 * - Shows disabled state with tooltip when no items are selected
 * - Shows selection count in menu header
 * - Uses itemLabel from context for display text (default: "item")
 */
export function SelectionActionsHeaderDropdown(): ReactElement | null {
  const context = useSelectionContextOptional();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<SelectionAction | null>(null);

  // If no context or no selection actions configured, don't render anything
  if (!context || context.selectionActions.length === 0) {
    return null;
  }

  const {
    selectedItems,
    selectionActions,
    isExecuting,
    onExecutingChange,
    onActionComplete,
    replaceVariables,
    getItemId,
    itemLabel = 'item',
  } = context;

  const isOpen = Boolean(anchorEl);
  const hasSelection = selectedItems.length > 0;
  const visibleActions = hasSelection ? getVisibleActions(selectionActions, selectedItems) : [];

  // Helper for pluralization
  const itemLabelPlural = `${itemLabel}s`;
  const itemCount = selectedItems.length;
  const itemText = itemCount === 1 ? itemLabel : itemLabelPlural;

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    if (hasSelection) {
      setAnchorEl(event.currentTarget);
    }
  }

  function handleClose(): void {
    setAnchorEl(null);
  }

  async function handleActionClick(action: SelectionAction): Promise<void> {
    handleClose();

    if (action.requireConfirmation) {
      setConfirmingAction(action);
      return;
    }

    await executeAction(action);
  }

  async function executeAction(action: SelectionAction): Promise<void> {
    onExecutingChange(true);

    try {
      const result = await executeSelectionAction(action, selectedItems, {
        replaceVariables,
        getItemId,
      });

      onActionComplete(result.failedItems);
    } finally {
      onExecutingChange(false);
      setConfirmingAction(null);
    }
  }

  function handleConfirmationCancel(): void {
    setConfirmingAction(null);
  }

  async function handleConfirmationConfirm(): Promise<void> {
    if (confirmingAction) {
      await executeAction(confirmingAction);
    }
  }

  const tooltipTitle = hasSelection
    ? `${itemCount} ${itemText} selected`
    : `Select ${itemLabelPlural} to enable actions`;

  return (
    <>
      <Tooltip title={tooltipTitle}>
        <span>
          <IconButton
            size="small"
            onClick={handleClick}
            disabled={!hasSelection || isExecuting}
            aria-label="Selection actions"
            aria-haspopup="menu"
            aria-expanded={isOpen}
          >
            {isExecuting ? (
              <CircularProgress size={18} />
            ) : (
              <LightningBoltIcon
                fontSize="inherit"
                sx={{
                  color: (theme) => (hasSelection ? theme.palette.primary.main : theme.palette.text.disabled),
                }}
              />
            )}
          </IconButton>
        </span>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {/* Menu header with selection count */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {itemCount} {itemText} selected
          </Typography>
        </Box>
        <Divider />

        {/* Action items */}
        {visibleActions.length > 0 ? (
          visibleActions.map((action) => (
            <MenuItem key={action.id} onClick={() => handleActionClick(action)} disabled={isExecuting}>
              {action.icon && <ListItemIcon>{getActionIcon(action.icon, { fontSize: 'small' })}</ListItemIcon>}
              <ListItemText>{action.label}</ListItemText>
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>
            <ListItemText>
              <Typography variant="body2" color="text.secondary">
                No actions available for selection
              </Typography>
            </ListItemText>
          </MenuItem>
        )}
      </Menu>

      <ActionConfirmationDialog
        open={confirmingAction !== null}
        title={`Confirm: ${confirmingAction?.label}`}
        message={confirmingAction?.confirmationMessage}
        actionLabel={confirmingAction?.label}
        selectedItemCount={selectedItems.length}
        onConfirm={handleConfirmationConfirm}
        onCancel={handleConfirmationCancel}
        isLoading={isExecuting}
      />
    </>
  );
}
