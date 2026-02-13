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

import { createContext, ReactElement, ReactNode, useContext } from 'react';

export type QueryEditorOptions = Record<string, unknown>;

const QueryEditorOptionsContext = createContext<QueryEditorOptions>({});

export interface QueryEditorOptionsProviderProps {
  options?: QueryEditorOptions;
  children: ReactNode;
}

export function QueryEditorOptionsProvider({ options, children }: QueryEditorOptionsProviderProps): ReactElement {
  return <QueryEditorOptionsContext.Provider value={options ?? {}}>{children}</QueryEditorOptionsContext.Provider>;
}

export function useQueryEditorOptions<T extends QueryEditorOptions = QueryEditorOptions>(): T {
  return useContext(QueryEditorOptionsContext) as T;
}
