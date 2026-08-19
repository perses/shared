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

import { createContext, ReactElement, ReactNode, useCallback, useContext } from 'react';

import { fetch as defaultFetch } from '../util/fetch';

export type FetchFn = (...args: Parameters<typeof globalThis.fetch>) => Promise<Response>;

const FetchContext = createContext<FetchFn>(defaultFetch);

export interface FetchProviderProps {
  fetchFn: FetchFn;
  children: ReactNode;
}

export function FetchProvider({ fetchFn, children }: FetchProviderProps): ReactElement {
  return <FetchContext.Provider value={fetchFn}>{children}</FetchContext.Provider>;
}

export function useFetch(): {
  fetch: FetchFn;
  fetchJson: <T>(...args: Parameters<typeof globalThis.fetch>) => Promise<T>;
} {
  const fetch = useContext(FetchContext);

  const fetchJson = useCallback(
    async <T,>(...args: Parameters<typeof globalThis.fetch>): Promise<T> => {
      const response = await fetch(...args);
      return await response.json();
    },
    [fetch],
  );

  return { fetch, fetchJson };
}
