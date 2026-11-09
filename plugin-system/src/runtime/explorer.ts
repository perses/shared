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

import { QueryDefinition } from '@perses-dev/spec';
import { useMemo } from 'react';
import { encodeQueryParams, JsonParam, StringParam, useQueryParams } from 'use-query-params';

import { PluginType } from '../model';
import { useListPluginMetadata } from './plugin-registry';
import { TimeRangeParam } from './TimeRangeProvider';

export const explorerQueryConfig = {
  refresh: TimeRangeParam,
  start: TimeRangeParam,
  end: TimeRangeParam,
  explorer: StringParam,
  data: JsonParam,
};

export interface ExplorerQueryData {
  refresh?: Date;
  start?: Date;
  end?: Date;
  explorer?: string;
  data?: Record<string, unknown>;
}

/**
 * Builds the query string identifying an explorer and its state, carrying over any
 * explorer params already present on the current URL. Returns the query string
 * without a leading '?'.
 */
export function useExplorerQueryParams(inputs: ExplorerQueryData): string {
  const [query] = useQueryParams(explorerQueryConfig, { updateType: 'replaceIn' });
  const encoded = encodeQueryParams(explorerQueryConfig, { ...query, ...inputs });

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(encoded)) {
    // encodeQueryParams emits undefined for params it has no value for, and null for
    // ones explicitly cleared. Neither should reach the URL as a literal.
    if (value === undefined || value === null) continue;
    for (const entry of Array.isArray(value) ? value : [value]) {
      if (entry !== undefined && entry !== null) search.append(key, entry);
    }
  }
  return search.toString();
}

/**
 * Resolves the explorer that can open the given queries, expressed as the
 * `<module>-<plugin>` key the explorer page reads from its `explorer` param.
 *
 * A query plugin and the explorer able to open it ship in the same plugin module,
 * so the module of the first query is what selects the explorer. Returns undefined
 * while plugin metadata is loading, when there are no queries, or when the module
 * that owns the query ships no explorer.
 */
export function useExplorerKeyForQueries(queries: QueryDefinition[]): string | undefined {
  const queryTypes = useMemo(() => {
    const kinds = new Set<PluginType>();
    for (const query of queries) {
      if (query.kind) kinds.add(query.kind);
    }
    return Array.from(kinds);
  }, [queries]);

  const { data: queryPlugins } = useListPluginMetadata(queryTypes, { enabled: queryTypes.length > 0 });
  const { data: explorePlugins } = useListPluginMetadata(['Explore']);

  return useMemo(() => {
    const firstQuery = queries[0];
    if (!firstQuery?.spec?.plugin?.kind || !queryPlugins || !explorePlugins) return undefined;

    const owningModule = queryPlugins.find((plugin) => plugin.spec.name === firstQuery.spec.plugin.kind)?.module.name;
    const explorer = explorePlugins.find((plugin) => plugin.module.name === owningModule);
    return explorer ? `${explorer.module.name}-${explorer.spec.name}` : undefined;
  }, [queries, queryPlugins, explorePlugins]);
}
