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

import { createContext, ReactElement, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export interface ItemActionStatus {
  loading: boolean;
  error?: Error;
  success?: boolean;
}

export interface ActionStatus {
  loading: boolean;
  error?: Error;
  success?: boolean;
  itemStatuses?: Map<unknown, ItemActionStatus>;
}

export interface ActionState<Id = unknown> {
  actionStatuses: Map<string, ActionStatus>;
  setActionStatus: (actionName: string, status: Partial<ActionStatus>, itemId?: Id) => void;
  clearActionStatus: (actionName?: string) => void;
}

export interface ItemActionsProviderProps {
  children: ReactNode;
}

const ItemActionsContext = createContext<ActionState<unknown> | undefined>(undefined);

export function ItemActionsProvider({ children }: ItemActionsProviderProps): ReactElement {
  const [actionStatuses, setActionStatuses] = useState(new Map<string, ActionStatus>());

  const setActionStatus = useCallback((actionName: string, status: Partial<ActionStatus>, itemId?: unknown) => {
    setActionStatuses((prev) => {
      const newMap = new Map(prev);
      const existingStatus = newMap.get(actionName) || { loading: false };

      if (itemId !== undefined) {
        // Update item-level status for individual actions
        const itemStatuses = new Map(existingStatus.itemStatuses || new Map());
        const existingItemStatus = itemStatuses.get(itemId) || { loading: false };
        itemStatuses.set(itemId, { ...existingItemStatus, ...status } as ItemActionStatus);
        newMap.set(actionName, { ...existingStatus, itemStatuses });
      } else {
        // Update action-level status for batch actions
        newMap.set(actionName, { ...existingStatus, ...status });
      }

      return newMap;
    });
  }, []);

  const clearActionStatus = useCallback((actionName?: string) => {
    setActionStatuses((prev) => {
      if (actionName === undefined) {
        return new Map();
      }
      if (!prev.has(actionName)) return prev;
      const newMap = new Map(prev);
      newMap.delete(actionName);
      return newMap;
    });
  }, []);

  const ctx = useMemo<ActionState<unknown>>(
    () => ({
      actionStatuses,
      setActionStatus,
      clearActionStatus,
    }),
    [actionStatuses, setActionStatus, clearActionStatus]
  );

  return <ItemActionsContext.Provider value={ctx}>{children}</ItemActionsContext.Provider>;
}

const noOp = (): void => {};
const emptyActionStatuses = new Map<string, ActionStatus>();
const defaultState: ActionState<unknown> & { hasContext: false } = {
  actionStatuses: emptyActionStatuses,
  setActionStatus: noOp,
  clearActionStatus: noOp,
  hasContext: false,
};

export function useItemActions<Id = string | number>(): ActionState<Id> & { hasContext: boolean } {
  const ctx = useContext(ItemActionsContext);

  const memoizedResult = useMemo(() => {
    if (!ctx) return defaultState as ActionState<Id> & { hasContext: false };

    return { ...ctx, hasContext: true } as ActionState<Id> & { hasContext: true };
  }, [ctx]);

  return memoizedResult;
}
