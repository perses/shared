import { createContext, ReactNode, useContext, useState } from 'react';
import { AnnotationData, AnnotationDefinition } from '@perses-dev/spec';
import { createStore, StoreApi, useStore } from 'zustand';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AnnotationHydrationWrapper } from './AnnotationHydrationWrapper';

export type AnnotationState = {
  data: AnnotationData[] | null;
  isPending: boolean;
  error?: Error;
};

export type AnnotationStateMap = {
  [name: string]: AnnotationState;
};

type AnnotationStoreState = {
  annotationDefinitions: AnnotationDefinition[];
  annotationState: AnnotationStateMap;
};

type AnnotationStoreActions = {
  setAnnotationDefinitions: (definitions: AnnotationDefinition[]) => void;
  setAnnotationState: (name: string, state: AnnotationState) => void;
};

type AnnotationStore = AnnotationStoreState & AnnotationStoreActions;

const AnnotationStoreContext = createContext<StoreApi<AnnotationStore> | undefined>(undefined);

export function useAnnotationStoreCtx(): StoreApi<AnnotationStore> {
  const context = useContext(AnnotationStoreContext);
  if (!context) {
    return createAnnotationStore({ initialAnnotationDefinitions: [] });
  }
  return context;
}

export function useAnnotationDefinitions(): AnnotationDefinition[] {
  const store = useAnnotationStoreCtx();
  return useStore(store, (s) => s.annotationDefinitions);
}

export function useAnnotationStates(annotationNames?: string[]): AnnotationStateMap {
  const store = useAnnotationStoreCtx();
  return useStoreWithEqualityFn(
    store,
    (s) => {
      if (annotationNames) {
        const result: AnnotationStateMap = {};
        annotationNames.forEach((name) => {
          const s = store.getState().annotationState[name];
          if (s) {
            result[name] = s;
          }
        });
        return result;
      }

      return s.annotationState;
    },
    (left, right) => {
      return JSON.stringify(left) === JSON.stringify(right);
    }
  );
}

export function useAnnotationActions(): AnnotationStoreActions {
  const store = useAnnotationStoreCtx();
  return useStoreWithEqualityFn(
    store,
    (s) => {
      return {
        setAnnotationState: s.setAnnotationState,
        setAnnotationDefinitions: s.setAnnotationDefinitions,
      };
    },
    shallow
  );
}

export function useAnnotationDefinitionAndState(name: string): {
  definition: AnnotationDefinition | undefined;
  state: AnnotationState | undefined;
} {
  const store = useAnnotationStoreCtx();
  return useStore(store, (s) => {
    return {
      definition: s.annotationDefinitions.find((d) => d.spec.display.name === name),
      state: s.annotationState[name],
    };
  });
}

export type AnnotationDefinitionWithData = {
  definition: AnnotationDefinition;
  data: AnnotationData[];
};

export function useAnnotationsWithData(): AnnotationDefinitionWithData[] {
  const store = useAnnotationStoreCtx();

  return useStore(store, (s) => {
    return s.annotationDefinitions
      .map((definition) => {
        const state = s.annotationState[definition.spec.display.name];
        return {
          definition,
          data: state?.data,
        };
      })
      .filter((annotation) => !!annotation.data) as AnnotationDefinitionWithData[];
  });
}

interface AnnotationStoreArgs {
  initialAnnotationDefinitions?: AnnotationDefinition[];
}

function createAnnotationStore({ initialAnnotationDefinitions = [] }: AnnotationStoreArgs): StoreApi<AnnotationStore> {
  const store = createStore<AnnotationStore>()(
    devtools(
      immer((set, _get) => ({
        annotationDefinitions: initialAnnotationDefinitions,
        annotationState: {} as Record<string, AnnotationState>,
        setAnnotationDefinitions(definitions: AnnotationDefinition[]): void {
          set(
            (s) => {
              s.annotationDefinitions = definitions;
            },
            false,
            '[Annotations] setAnnotationDefinitions' // Used for action name in Redux devtools
          );
        },
        setAnnotationState: (name: string, state: AnnotationState): void => {
          set(
            (s) => {
              s.annotationState[name] = state;
            },
            false,
            '[Annotations] setAnnotationState' // Used for action name in Redux devtools
          );
        },
      }))
    )
  );
  return store;
}

export interface AnnotationProviderProps {
  children: ReactNode;
  initialAnnotationDefinitions?: AnnotationDefinition[];
}

export function AnnotationProvider({
  children,
  initialAnnotationDefinitions = [],
}: AnnotationProviderProps): ReactNode {
  const [store] = useState(() => createAnnotationStore({ initialAnnotationDefinitions }));

  return (
    <AnnotationStoreContext.Provider value={store}>
      <AnnotationHydrationWrapper>{children}</AnnotationHydrationWrapper>
    </AnnotationStoreContext.Provider>
  );
}
