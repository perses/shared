import { createContext, ReactNode, useContext, useState } from 'react';
import { AnnotationData, AnnotationSpec } from '@perses-dev/spec';
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
  annotationSpecs: AnnotationSpec[];
  annotationState: AnnotationStateMap;
};

type AnnotationStoreActions = {
  setAnnotationSpecs: (definitions: AnnotationSpec[]) => void;
  setAnnotationState: (name: string, state: AnnotationState) => void;
};

type AnnotationStore = AnnotationStoreState & AnnotationStoreActions;

const AnnotationStoreContext = createContext<StoreApi<AnnotationStore> | undefined>(undefined);

export function useAnnotationStoreCtx(): StoreApi<AnnotationStore> {
  const context = useContext(AnnotationStoreContext);
  if (!context) {
    return createAnnotationStore({ initialAnnotationSpecs: [] });
  }
  return context;
}

export function useAnnotationSpecs(): AnnotationSpec[] {
  const store = useAnnotationStoreCtx();
  return useStore(store, (s) => s.annotationSpecs);
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
        setAnnotationSpecs: s.setAnnotationSpecs,
      };
    },
    shallow
  );
}

export function useAnnotationSpecAndState(name: string): {
  definition: AnnotationSpec | undefined;
  state: AnnotationState | undefined;
} {
  const store = useAnnotationStoreCtx();
  return useStore(store, (s) => {
    return {
      definition: s.annotationSpecs.find((d) => d.display.name === name),
      state: s.annotationState[name],
    };
  });
}

export type AnnotationSpecWithData = {
  definition: AnnotationSpec;
  data: AnnotationData[];
};

export function useAnnotationsWithData(): AnnotationSpecWithData[] {
  const store = useAnnotationStoreCtx();

  return useStore(store, (s) => {
    return s.annotationSpecs
      .map((definition) => {
        const state = s.annotationState[definition.display.name];
        return {
          definition,
          data: state?.data,
        };
      })
      .filter((annotation) => !!annotation.data) as AnnotationSpecWithData[];
  });
}

interface AnnotationStoreArgs {
  initialAnnotationSpecs?: AnnotationSpec[];
}

function createAnnotationStore({ initialAnnotationSpecs = [] }: AnnotationStoreArgs): StoreApi<AnnotationStore> {
  const store = createStore<AnnotationStore>()(
    devtools(
      immer((set, _get) => ({
        annotationSpecs: initialAnnotationSpecs,
        annotationState: {} as Record<string, AnnotationState>,
        setAnnotationSpecs(definitions: AnnotationSpec[]): void {
          set(
            (s) => {
              s.annotationSpecs = definitions;
            },
            false,
            '[Annotations] setAnnotationSpecs' // Used for action name in Redux devtools
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
  initialAnnotationSpecs?: AnnotationSpec[];
}

export function AnnotationProvider({ children, initialAnnotationSpecs = [] }: AnnotationProviderProps): ReactNode {
  const [store] = useState(() => createAnnotationStore({ initialAnnotationSpecs }));

  return (
    <AnnotationStoreContext.Provider value={store}>
      <AnnotationHydrationWrapper>{children}</AnnotationHydrationWrapper>
    </AnnotationStoreContext.Provider>
  );
}
