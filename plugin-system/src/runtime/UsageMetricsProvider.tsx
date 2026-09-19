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

import type { FetchFn } from '@perses-dev/client';
import { useFetch } from '@perses-dev/client';
import type { QueryDefinition } from '@perses-dev/spec';
import type { ReactElement, ReactNode } from 'react';
import { createContext, useContext, useCallback, useMemo, useRef, useState } from 'react';

type QueryState = 'pending' | 'success' | 'error';

interface UsageMetrics {
  project: string;
  dashboard: string;
  startRenderTime: number;
  renderDurationMs: number;
  renderErrorCount: number;
  pendingQueries: Map<string, QueryState>;
  apiPrefix?: string;
  fetchFn: FetchFn;
  /** Provider-owned updater; optional for compatibility with directly supplied context values. */
  markQuery?: UseUsageMetricsResults['markQuery'];
}

interface UsageMetricsProps {
  project: string;
  dashboard: string;
  apiPrefix?: string;
  children: ReactNode;
}

interface UseUsageMetricsResults {
  markQuery: (definition: QueryDefinition, state: QueryState) => void;
}

export const UsageMetricsContext = createContext<UsageMetrics | undefined>(undefined);

export const useUsageMetricsContext = (): UsageMetrics | undefined => {
  return useContext(UsageMetricsContext);
};

/** Records query transitions after commit or from an event handler. */
export const useUsageMetrics = (): UseUsageMetricsResults => {
  const ctx = useUsageMetricsContext();
  const markQuery = useCallback(
    (definition: QueryDefinition, state: QueryState): void => {
      if (!ctx) return;
      if (ctx.markQuery) {
        ctx.markQuery(definition, state);
      } else {
        recordLegacyQuery(ctx, definition, state);
      }
    },
    [ctx],
  );
  return useMemo(() => ({ markQuery }), [markQuery]);
};

// Direct context providers historically supply an imperative metrics accumulator.
// Keep that API working; the standard provider owns its accumulator in a ref.
function recordLegacyQuery(stats: UsageMetrics, definition: QueryDefinition, state: QueryState): void {
  const key = JSON.stringify(definition);
  if (stats.pendingQueries.has(key) && state === 'pending') return;
  if (stats.pendingQueries.get(key) === state) return;
  stats.pendingQueries.set(key, state);
  if (state === 'error') stats.renderErrorCount += 1;
  if (stats.renderDurationMs === 0 && [...stats.pendingQueries.values()].every((value) => value !== 'pending')) {
    stats.renderDurationMs = Date.now() - stats.startRenderTime;
    void submitMetrics(stats);
  }
}

const submitMetrics = async (stats: UsageMetrics): Promise<void> => {
  await stats.fetchFn(`${stats.apiPrefix ?? ''}/api/v1/view`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      project: stats.project,
      dashboard: stats.dashboard,
      render_time: stats.renderDurationMs / 1000,
      render_errors: stats.renderErrorCount,
    }),
  });
};

export const UsageMetricsProvider = (props: UsageMetricsProps): ReactElement => {
  return <UsageMetricsSession key={JSON.stringify([props.project, props.dashboard])} {...props} />;
};

function UsageMetricsSession({ apiPrefix, project, dashboard, children }: UsageMetricsProps): ReactElement {
  'use no memo'; // The public metrics context exposes live getters over an imperative accumulator.

  const { fetch } = useFetch();
  const [startRenderTime] = useState(() => Date.now());
  const metricsRef = useRef({
    submitted: false,
    renderDurationMs: 0,
    renderErrorCount: 0,
    pendingQueries: new Map<string, QueryState>(),
  });

  const markQuery = useCallback(
    (definition: QueryDefinition, newState: QueryState): void => {
      const metrics = metricsRef.current;
      const definitionKey = JSON.stringify(definition);
      if (metrics.pendingQueries.has(definitionKey) && newState === 'pending') return;
      if (metrics.pendingQueries.get(definitionKey) === newState) return;
      metrics.pendingQueries.set(definitionKey, newState);
      if (newState === 'error') metrics.renderErrorCount += 1;
      const allDone = [...metrics.pendingQueries.values()].every((state) => state !== 'pending');
      if (!metrics.submitted && allDone) {
        metrics.submitted = true;
        metrics.renderDurationMs = Date.now() - startRenderTime;
        void submitMetrics({ project, dashboard, startRenderTime, ...metrics, apiPrefix, fetchFn: fetch });
      }
    },
    [project, dashboard, startRenderTime, apiPrefix, fetch],
  );
  const ctx = useMemo<UsageMetrics>(
    () => ({
      markQuery,
      project,
      dashboard,
      startRenderTime,
      // Compiler getters are unsupported; preserve the live context API in this opted-out component.
      // oxlint-disable-next-line react/todo
      get renderDurationMs(): number {
        return metricsRef.current.renderDurationMs;
      },
      // oxlint-disable-next-line react/todo
      get renderErrorCount(): number {
        return metricsRef.current.renderErrorCount;
      },
      // oxlint-disable-next-line react/todo
      get pendingQueries(): Map<string, QueryState> {
        return metricsRef.current.pendingQueries;
      },
      apiPrefix,
      fetchFn: fetch,
    }),
    [markQuery, project, dashboard, startRenderTime, apiPrefix, fetch],
  );

  return <UsageMetricsContext.Provider value={ctx}>{children}</UsageMetricsContext.Provider>;
}
