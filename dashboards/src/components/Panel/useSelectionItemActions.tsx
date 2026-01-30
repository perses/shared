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

import { Box, CircularProgress } from '@mui/material';
import { Dialog, InfoTooltip, useItemActions, useSelection } from '@perses-dev/components';
import { ACTION_ICONS, executeAction, ItemAction, VariableStateMap } from '@perses-dev/plugin-system';
import { ReactNode, useCallback, useMemo, useState } from 'react';
import { HeaderIconButton } from './HeaderIconButton';

export interface UseItemActionsOptions {
  actions?: ItemAction[];
  variableState?: VariableStateMap;
  disabledWithEmptySelection?: boolean;
}

type Item<Id extends string | number> = { id: Id; data: Record<string, unknown> };

export interface UseItemActionsResult<Id extends string | number> {
  actionButtons: ReactNode[];
  confirmDialog: ReactNode;
  getItemActionButtons: (item: Item<Id>) => ReactNode[];
}

/**
 * Hook that returns action buttons and confirmation dialog for selection based PanelActions.
 */
export function useSelectionItemActions<Id extends string | number = string>({
  actions,
  variableState,
  disabledWithEmptySelection,
}: UseItemActionsOptions): UseItemActionsResult<Id> {
  const { selectionMap } = useSelection();
  const { actionStatuses, setActionStatus } = useItemActions();
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    action?: ItemAction;
    item?: Item<Id>;
  }>({ open: false });

  const handleExecuteAction = useCallback(
    async (action: ItemAction, item?: Item<Id>) => {
      if (item) {
        // If item is passed, it means we need to use the current item data and not the selection
        await executeAction({
          action,
          selectionMap: new Map<Id, Record<string, unknown>>([[item.id, item.data]]),
          variableState,
          setActionStatus,
        });
      } else {
        await executeAction({
          action,
          selectionMap: selectionMap as Map<string | number, Record<string, unknown>>,
          variableState,
          setActionStatus,
        });
      }
    },
    [selectionMap, variableState, setActionStatus]
  );

  const handleActionClick = useCallback(
    (action: ItemAction, item?: Item<Id>) => {
      if (action.confirmMessage) {
        setConfirmState({ open: true, action, item });
      } else {
        handleExecuteAction(action, item);
      }
    },
    [handleExecuteAction]
  );

  const closeConfirm = useCallback(() => setConfirmState((prev) => ({ ...prev, open: false })), []);

  const handleConfirm = useCallback(async () => {
    setConfirmState((prev) => ({ ...prev, open: false }));
    if (confirmState.action) {
      await handleExecuteAction(confirmState.action, confirmState.item);
    }
  }, [confirmState.action, handleExecuteAction, confirmState.item]);

  const areButtonsDisabled = disabledWithEmptySelection && selectionMap.size === 0;

  const actionButtons = useMemo((): ReactNode[] => {
    if (!actions?.length) return [];

    const buttons: ReactNode[] = [];

    for (const action of actions) {
      if (!action.enabled) {
        continue;
      }

      const isLoading = actionStatuses.get(action.name)?.loading ?? false;
      const iconConfig = action.icon ? ACTION_ICONS.find((i) => i.value === action.icon) : undefined;

      buttons.push(
        <InfoTooltip key={action.name} description={action.name}>
          <HeaderIconButton
            size="small"
            disabled={isLoading || areButtonsDisabled}
            onClick={(e) => {
              e.stopPropagation();
              handleActionClick(action);
            }}
            aria-label={action.name}
          >
            {isLoading ? (
              <CircularProgress size={14} />
            ) : iconConfig ? (
              iconConfig.icon
            ) : (
              <Box component="span" sx={{ fontSize: '0.75rem', px: 0.5 }}>
                {action.name}
              </Box>
            )}
          </HeaderIconButton>
        </InfoTooltip>
      );
    }

    return buttons;
  }, [actions, actionStatuses, handleActionClick, areButtonsDisabled]);

  const getItemActionButtons = useCallback(
    (item: Item<Id>) => {
      if (!actions?.length) return [];

      const buttons: ReactNode[] = [];

      for (const action of actions) {
        if (!action.enabled) {
          continue;
        }

        const isLoading = actionStatuses.get(action.name)?.itemStatuses?.get(item.id)?.loading ?? false;
        const iconConfig = action.icon ? ACTION_ICONS.find((i) => i.value === action.icon) : undefined;

        buttons.push(
          <InfoTooltip key={`${action.name}-${item.id}`} description={action.name}>
            <HeaderIconButton
              size="small"
              disabled={isLoading || areButtonsDisabled}
              onClick={(e) => {
                e.stopPropagation();
                handleActionClick(action, item);
              }}
              aria-label={action.name}
            >
              {isLoading ? (
                <CircularProgress size={14} />
              ) : iconConfig ? (
                iconConfig.icon
              ) : (
                <Box component="span" sx={{ fontSize: '0.75rem', px: 0.5 }}>
                  {action.name}
                </Box>
              )}
            </HeaderIconButton>
          </InfoTooltip>
        );
      }

      return buttons;
    },
    [actions, actionStatuses, areButtonsDisabled, handleActionClick]
  );

  const confirmDialog = useMemo(
    (): ReactNode => (
      <Dialog open={confirmState.open && !!confirmState.action} onClose={closeConfirm}>
        <Dialog.Header onClose={closeConfirm}>
          {confirmState.action?.name ? `Confirm: ${confirmState.action.name}` : 'Confirm Action'}
        </Dialog.Header>
        <Dialog.Content>
          {confirmState.action?.confirmMessage ?? 'Are you sure you want to perform this action?'}
        </Dialog.Content>
        <Dialog.Actions>
          <Dialog.PrimaryButton onClick={handleConfirm}>Confirm</Dialog.PrimaryButton>
          <Dialog.SecondaryButton onClick={closeConfirm}>Cancel</Dialog.SecondaryButton>
        </Dialog.Actions>
      </Dialog>
    ),
    [confirmState.open, confirmState.action, closeConfirm, handleConfirm]
  );

  return { actionButtons, confirmDialog, getItemActionButtons };
}
