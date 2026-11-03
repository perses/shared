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

import type { QueryDefinition, UnknownSpec, QueryDataType } from '@perses-dev/spec';
import type { QueryObserverOptions, UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export type QueryOptions = Record<string, unknown>;
export interface DataQueriesProviderProps<Kind = unknown, PluginSpec = UnknownSpec> {
  definitions: Array<QueryDefinition<Kind, PluginSpec>>;
  children?: ReactNode;
  options?: QueryOptions;
  queryOptions?: Omit<QueryObserverOptions, 'queryKey'>;
}

export interface DataQueriesContextType {
  queryDefinitions: QueryDefinition[];
  queryResults: QueryData[];
  refetchAll: () => void;
  isFetching: boolean;
  isPending: boolean;
  errors: unknown[];
}

export interface UseDataQueryResults<T> extends Omit<DataQueriesContextType, 'queryResults'> {
  queryResults: Array<QueryData<T>>;
}

export type QueryData<T = QueryDataType> = {
  data?: T;
  definition: QueryDefinition;
  error: Error;
  isFetching: boolean;
  isPending: boolean;
  refetch?: () => void;
};

export function transformQueryResults(results: UseQueryResult[], definitions: QueryDefinition[]): QueryData[] {
  return results.map(({ data, isFetching, isPending, refetch, error }, i) => {
    return {
      definition: definitions[i],
      data,
      isFetching,
      isPending,
      refetch,
      error,
    } as QueryData;
  });
}
