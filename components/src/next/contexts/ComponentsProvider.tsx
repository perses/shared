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

import { ReactElement, useContext, useMemo } from 'react';

import { ComponentsContext } from './ComponentsContext';
import type {
  PersesComponents,
  PersesIcons,
  ComponentsContextValue,
  ComponentsProviderProps,
} from './ComponentsContext';

export type { PersesComponents, PersesIcons, ComponentsContextValue, ComponentsProviderProps };

export function ComponentsProvider({ children, components, icons }: ComponentsProviderProps): ReactElement {
  // Callers must memoize or hoist components/icons to a stable reference to avoid unnecessary
  // re-renders — the useMemo below only skips recomputing `value`, it does not make an unstable
  // components/icons reference stable (see ComponentsProviderProps).
  const value = useMemo(() => ({ components, icons }), [components, icons]);

  return <ComponentsContext.Provider value={value}>{children}</ComponentsContext.Provider>;
}

export function useComponents(): ComponentsContextValue {
  const ctx = useContext(ComponentsContext);
  if (ctx === undefined) {
    throw new Error('No ComponentsContext found. Did you forget a Provider?');
  }
  return ctx;
}
