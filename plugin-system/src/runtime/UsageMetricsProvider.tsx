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
import { createContext, ReactElement, ReactNode, useContext, useEffect, useState } from 'react';

type QueryState = 'pending' | 'success' | 'error';

interface UsageMetrics {
  project: string;
  dashboard: string;
  startRenderTime: number;
  renderDurationMs: number;
  setRenderDurationMs: React.Dispatch<React.SetStateAction<number>>;
  renderErrorCount: number;
  setRenderErrorCount: React.Dispatch<React.SetStateAction<number>>;
  pendingQueries: Map<string, QueryState>;
  setPendingQueries: React.Dispatch<React.SetStateAction<Map<string, QueryState>>>;
  apiPrefix?: string;
  submitMetrics?: SubmitMetrics;
}

type SubmitMetrics = (
  param: Omit<UsageMetrics, 'setRenderDurationMs' | 'setRenderErrorCount' | 'setPendingQueries'>
) => Promise<void>;

export interface UsageMetricsProps {
  project: string;
  dashboard: string;
  apiPrefix?: string;
  children: ReactNode;
  submitMetrics?: SubmitMetrics;
}

interface UseUsageMetricsResults {
  markQuery: (definition: QueryDefinition, state: QueryState) => void;
}

export const UsageMetricsContext = createContext<UsageMetrics | undefined>(undefined);

export const useUsageMetricsContext = (): UsageMetrics | undefined => {
  return useContext(UsageMetricsContext);
};

export const useUsageMetrics = (): UseUsageMetricsResults => {
  const ctx = useUsageMetricsContext();

  useEffect(() => {
    if (!ctx) {
      return;
    }
    const { pendingQueries, renderDurationMs, startRenderTime, submitMetrics } = ctx;
    /* This means no query has run yet, so it should return 
       The subsequent logic makes sense when a-some queries have been running
    */
    if (!pendingQueries.size) {
      return;
    }

    const allDone = [...pendingQueries.values()].every((p) => p !== 'pending');
    if (renderDurationMs === 0 && allDone) {
      const finalDuration = Date.now() - startRenderTime;
      ctx.setRenderDurationMs(finalDuration);
      submitMetrics?.({ ...ctx, renderDurationMs: finalDuration });
    }
  }, [ctx]);

  return {
    markQuery: (definition: QueryDefinition, newState: QueryState): void => {
      if (ctx === undefined) {
        return;
      }

      const definitionKey = JSON.stringify(definition);
      if (ctx.pendingQueries.has(definitionKey) && newState === 'pending') {
        // Never allow transitions back to pending, to avoid re-sending stats on a re-render.
        return;
      }

      if (ctx.pendingQueries.get(definitionKey) !== newState) {
        ctx.setPendingQueries((prev) => {
          const map = new Map(prev);
          map.set(definitionKey, newState);
          return map;
        });
        if (newState === 'error') {
          ctx.setRenderErrorCount((prev) => prev + 1);
        }
      }
    },
  };
};

export const UsageMetricsProvider = ({
  apiPrefix,
  project,
  dashboard,
  children,
  submitMetrics,
}: UsageMetricsProps): ReactElement => {
  const [renderDurationMs, setRenderDurationMs] = useState(0);
  const [pendingQueries, setPendingQueries] = useState(new Map());
  const [renderErrorCount, setRenderErrorCount] = useState(0);
  const ctx: UsageMetrics = {
    project: project,
    dashboard: dashboard,
    renderErrorCount,
    startRenderTime: Date.now(),
    renderDurationMs,
    setRenderDurationMs,
    setPendingQueries,
    setRenderErrorCount,
    pendingQueries,
    apiPrefix,
    submitMetrics,
  };

  return <UsageMetricsContext.Provider value={ctx}>{children}</UsageMetricsContext.Provider>;
};
