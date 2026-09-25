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
  apiPrefix?: string;
  markQuery: (definition: QueryDefinition, state: QueryState) => void;
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

interface RenderMetrics {
  submitted: boolean;
  renderErrorCount: number;
  pendingQueries: Map<string, QueryState>;
}

interface SubmitMetricsParams {
  project: string;
  dashboard: string;
  apiPrefix?: string;
  renderDurationMs: number;
  renderErrorCount: number;
  fetchFn: FetchFn;
}

export const UsageMetricsContext = createContext<UsageMetrics | undefined>(undefined);

export const useUsageMetricsContext = (): UsageMetrics | undefined => {
  return useContext(UsageMetricsContext);
};

/** Records query transitions after commit or from an event handler. No-op without a provider. */
export const useUsageMetrics = (): UseUsageMetricsResults => {
  const ctx = useUsageMetricsContext();
  const markQuery = useCallback(
    (definition: QueryDefinition, state: QueryState): void => {
      ctx?.markQuery(definition, state);
    },
    [ctx],
  );
  return useMemo(() => ({ markQuery }), [markQuery]);
};

const submitMetrics = async (stats: SubmitMetricsParams): Promise<void> => {
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
  // Remounting on project/dashboard changes starts a fresh render measurement.
  return <UsageMetricsSession key={JSON.stringify([props.project, props.dashboard])} {...props} />;
};

function UsageMetricsSession({ apiPrefix, project, dashboard, children }: UsageMetricsProps): ReactElement {
  const { fetch } = useFetch();
  const [startRenderTime] = useState(() => Date.now());
  const metricsRef = useRef<RenderMetrics>({
    submitted: false,
    renderErrorCount: 0,
    pendingQueries: new Map(),
  });

  const markQuery = useCallback(
    (definition: QueryDefinition, newState: QueryState): void => {
      const metrics = metricsRef.current;
      const definitionKey = JSON.stringify(definition);
      // Never allow transitions back to pending, to avoid re-sending stats on a re-render.
      if (metrics.pendingQueries.has(definitionKey) && newState === 'pending') return;
      if (metrics.pendingQueries.get(definitionKey) === newState) return;
      metrics.pendingQueries.set(definitionKey, newState);
      if (newState === 'error') metrics.renderErrorCount += 1;
      const allDone = [...metrics.pendingQueries.values()].every((state) => state !== 'pending');
      if (!metrics.submitted && allDone) {
        metrics.submitted = true;
        void submitMetrics({
          project,
          dashboard,
          apiPrefix,
          renderDurationMs: Date.now() - startRenderTime,
          renderErrorCount: metrics.renderErrorCount,
          fetchFn: fetch,
        });
      }
    },
    [project, dashboard, startRenderTime, apiPrefix, fetch],
  );

  const ctx = useMemo<UsageMetrics>(
    () => ({ project, dashboard, apiPrefix, markQuery }),
    [project, dashboard, apiPrefix, markQuery],
  );

  return <UsageMetricsContext.Provider value={ctx}>{children}</UsageMetricsContext.Provider>;
}
