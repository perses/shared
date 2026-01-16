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

import { createContext, useContext, ReactNode } from 'react';
import { SelectionAction, SelectionActionError } from './selection-action-model';

/**
 * Context value for sharing selection state between components and header actions.
 * This context is generic and can be used for tables, charts, or any selectable UI.
 */
export interface SelectionContextValue {
  /** Currently selected items data */
  selectedItems: Array<Record<string, unknown>>;
  /** Configured selection actions */
  selectionActions: SelectionAction[];
  /** Whether an action is currently executing */
  isExecuting: boolean;
  /** Callback to update executing state */
  onExecutingChange: (executing: boolean) => void;
  /** Callback when action completes (with any failed items) */
  onActionComplete: (failedItems: SelectionActionError[]) => void;
  /** Function to replace variables in strings (for payload templates) */
  replaceVariables: (text: string) => string;
  /** Function to get item ID from item data */
  getItemId: (item: Record<string, unknown>, index: number) => string;
  /** Label for the selected item type (default: "item"), used for display text like "3 rows selected" */
  itemLabel?: string;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export interface SelectionProviderProps {
  children: ReactNode;
  value: SelectionContextValue;
}

/**
 * Provider component for sharing selection state.
 * Use this to wrap components that need access to selection actions.
 */
export function SelectionProvider({ children, value }: SelectionProviderProps): ReactNode {
  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

/**
 * Hook to access selection context
 * @throws Error if used outside of SelectionProvider
 */
export function useSelectionContext(): SelectionContextValue {
  const context = useContext(SelectionContext);
  if (context === null) {
    throw new Error('useSelectionContext must be used within a SelectionProvider');
  }
  return context;
}

/**
 * Hook to access selection context, returns null if not in provider.
 * Useful for header action components that need to check if context is available.
 */
export function useSelectionContextOptional(): SelectionContextValue | null {
  return useContext(SelectionContext);
}
