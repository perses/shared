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
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type GetIdFn<T, Id> = (item: T, index: number) => Id;

export interface SelectionState<T, Id = unknown> {
  selectionMap: Map<Id, T>;
  setSelection: (items: Array<{ id: Id; item: T }>) => void;
  toggleSelection: (item: T, id: Id) => void;
  removeFromSelection: (id: Id) => void;
  clearSelection: () => void;
  isSelected: (item: T, index: number) => boolean;
}

export interface SelectionProviderProps {
  children: ReactNode;
}

export interface UseSelectionOptions<T, Id = string | number> {
  getId?: GetIdFn<T, Id>;
}

interface InternalState<T, Id> extends SelectionState<T, Id> {
  registerGetId: (fn: GetIdFn<T, Id>) => void;
}

const SelectionContext = createContext<InternalState<unknown, unknown> | undefined>(undefined);

const defaultGetId = (_item: unknown, index: number): unknown => index;

/**
 * Provides selection state to descendant components.
 */
export function SelectionProvider({ children }: SelectionProviderProps): ReactElement {
  const [selectionMap, setSelectionMap] = useState(new Map<unknown, unknown>());
  const getIdRef = useRef<GetIdFn<unknown, unknown>>(defaultGetId);

  // Allows consumers to register their own getId function. by default we use the index.
  const registerGetId = useCallback((fn: GetIdFn<unknown, unknown>) => {
    getIdRef.current = fn;
  }, []);

  const setSelection = useCallback((items: Array<{ id: unknown; item: unknown }>) => {
    const newMap = new Map<unknown, unknown>();
    items.forEach(({ item, id }) => newMap.set(id, item));
    setSelectionMap(newMap);
  }, []);

  const toggleSelection = useCallback((item: unknown, id: unknown) => {
    setSelectionMap((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(id)) {
        newMap.delete(id);
      } else {
        newMap.set(id, item);
      }
      return newMap;
    });
  }, []);

  const removeFromSelection = useCallback((id: unknown) => {
    setSelectionMap((prev) => {
      if (!prev.has(id)) return prev;
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectionMap(new Map()), []);

  const isSelected = useCallback(
    (item: unknown, index: number) => selectionMap.has(getIdRef.current(item, index)),
    [selectionMap]
  );

  const ctx = useMemo<InternalState<unknown, unknown>>(
    () => ({
      selectionMap,
      setSelection,
      toggleSelection,
      removeFromSelection,
      clearSelection,
      isSelected,
      registerGetId,
    }),
    [selectionMap, setSelection, toggleSelection, removeFromSelection, clearSelection, isSelected, registerGetId]
  );

  return <SelectionContext.Provider value={ctx}>{children}</SelectionContext.Provider>;
}

/**
 *  No-op functions and empty map for when there is no context available.
 * This allows components to use the hook without crashing given the optional nature of the provider.
 */
const noOp = (): void => {};
const noOpIsSelected = (): boolean => false;
const emptyMap = new Map<unknown, unknown>();
const defaultState: SelectionState<unknown, unknown> & { hasContext: false } = {
  selectionMap: emptyMap,
  setSelection: noOp,
  toggleSelection: noOp,
  removeFromSelection: noOp,
  clearSelection: noOp,
  isSelected: noOpIsSelected,
  hasContext: false,
};

/**
 * Hook to access selection state from context.
 * If used outside of a SelectionProvider, returns no-op functions and an empty selection map.
 *
 * @param options Optional configuration for the selection hook.
 * @param options.getId Function to get the unique identifier for an item, this allows the selection state to identify items.
 */
export function useSelection<T, Id = string | number>(
  options?: UseSelectionOptions<T, Id>
): SelectionState<T, Id> & { hasContext: boolean } {
  const ctx = useContext(SelectionContext);

  useEffect(() => {
    if (ctx && options?.getId) {
      ctx.registerGetId(options.getId as GetIdFn<unknown, unknown>);
    }
  }, [ctx, options?.getId]);

  const memoizedResult = useMemo(() => {
    if (!ctx) return defaultState as SelectionState<T, Id> & { hasContext: false };

    const { registerGetId: _, ...rest } = ctx;
    return { ...rest, hasContext: true } as SelectionState<T, Id> & { hasContext: true };
  }, [ctx]);

  return memoizedResult;
}
