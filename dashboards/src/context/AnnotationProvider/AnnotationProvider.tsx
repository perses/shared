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

import { useAnnotations } from '@perses-dev/plugin-system';
import type { AnnotationData, AnnotationSpec } from '@perses-dev/spec';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import type { StoreApi } from 'zustand';
import { createStore, useStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';

import { getAnnotationSpecsWithData } from './annotation-data';

export type AnnotationState = {
  data: AnnotationData[] | null;
  isPending: boolean;
  error?: Error;
};

export type AnnotationStateMap = {
  [name: string]: AnnotationState;
};

type AnnotationStoreState = {
  annotationSpecs: AnnotationSpec[];
};

type AnnotationStoreActions = {
  setAnnotationSpecs: (definitions: AnnotationSpec[]) => void;
};

type AnnotationStore = AnnotationStoreState & AnnotationStoreActions;

const AnnotationStoreContext = createContext<StoreApi<AnnotationStore> | undefined>(undefined);

export function useAnnotationStoreCtx(): StoreApi<AnnotationStore> {
  const context = useContext(AnnotationStoreContext);
  const [fallbackStore] = useState(() => context ?? createAnnotationStore({}));
  return context ?? fallbackStore;
}

export function useAnnotationSpecs(): AnnotationSpec[] {
  const store = useAnnotationStoreCtx();
  return useStore(store, (s) => s.annotationSpecs);
}

/** Returns query-backed state for the requested dashboard annotations. */
export function useAnnotationStates(annotationNames?: string[]): AnnotationStateMap {
  const specs = useAnnotationSpecs();
  const definitions = annotationNames ? specs.filter((spec) => annotationNames.includes(spec.display.name)) : specs;
  const queries = useAnnotations(definitions);
  return useMemo(() => {
    const result: AnnotationStateMap = {};
    definitions.forEach((definition, index) => {
      const query = queries[index];
      if (query) {
        result[definition.display.name] = {
          data: query.data ?? null,
          isPending: query.isLoading,
          error: query.error instanceof Error ? query.error : undefined,
        };
      }
    });
    return result;
  }, [definitions, queries]);
}

export function useAnnotationActions(): AnnotationStoreActions {
  const store = useAnnotationStoreCtx();
  return useStoreWithEqualityFn(
    store,
    (s) => {
      return {
        setAnnotationSpecs: s.setAnnotationSpecs,
      };
    },
    shallow,
  );
}

/** Returns the spec and query-backed state of a dashboard annotation. */
export function useAnnotationSpecAndState(name: string): {
  definition: AnnotationSpec | undefined;
  state: AnnotationState | undefined;
} {
  const specs = useAnnotationSpecs();
  const states = useAnnotationStates([name]);
  const definition = specs.find((spec) => spec.display.name === name);
  const state = states[name];
  return useMemo(() => ({ definition, state }), [definition, state]);
}

export type AnnotationSpecWithData = {
  definition: AnnotationSpec;
  data: AnnotationData[];
};

/**
 * Resolves dashboard annotations on demand, returning specs paired with available query data.
 * Hidden annotations are included; `usePanelAnnotationsWithData` skips them for panels.
 */
export function useAnnotationsWithData(): AnnotationSpecWithData[] {
  const definitions = useAnnotationSpecs();
  const queries = useAnnotations(definitions);
  return getAnnotationSpecsWithData(definitions, queries);
}

interface AnnotationStoreArgs {
  initialAnnotationSpecs?: AnnotationSpec[];
}

function createAnnotationStore({ initialAnnotationSpecs = [] }: AnnotationStoreArgs): StoreApi<AnnotationStore> {
  const store = createStore<AnnotationStore>()(
    devtools(
      immer((set) => ({
        annotationSpecs: initialAnnotationSpecs,
        setAnnotationSpecs(definitions: AnnotationSpec[]): void {
          set(
            (s) => {
              s.annotationSpecs = definitions;
            },
            false,
            '[Annotations] setAnnotationSpecs', // Used for action name in Redux devtools
          );
        },
      })),
    ),
  );
  return store;
}

export interface AnnotationProviderProps {
  children: ReactNode;
  initialAnnotationSpecs?: AnnotationSpec[];
}

export function AnnotationProvider({ children, initialAnnotationSpecs }: AnnotationProviderProps): ReactNode {
  const [store] = useState(() => createAnnotationStore({ initialAnnotationSpecs }));

  return <AnnotationStoreContext.Provider value={store}>{children}</AnnotationStoreContext.Provider>;
}
