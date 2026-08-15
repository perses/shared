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

import { Box, Stack, Typography } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import {
  DataQueriesProvider,
  MultiQueryEditor,
  useDataQueriesContext,
  usePlugin,
  useSuggestedStepMs,
} from '@perses-dev/plugin-system';
import { PanelDefinition, QueryDefinition, QueryPluginType } from '@perses-dev/spec';
import { ReactElement, useCallback, useContext, useMemo, useState } from 'react';
import { PanelEditorContext } from '../../context';
import { PanelEditorProvider } from '../../context/PanelEditorProvider/PanelEditorProvider';
import { PanelPreview } from '../PanelDrawer';

export interface QueryPlaygroundProps {
  panelDefinition: PanelDefinition;
}

/**
 * An ephemeral "playground" for the queries of a panel: it renders a live preview of the panel
 * along with editable query inputs, so edited queries can be run and assessed on the fly.
 * All state is local to the component, so edits are never persisted: unmounting it (e.g. closing
 * the dialog rendering it) drops every change.
 */
export function QueryPlayground({ panelDefinition }: QueryPlaygroundProps): ReactElement {
  return (
    <PanelEditorProvider>
      <QueryPlaygroundContent panelDefinition={panelDefinition} />
    </PanelEditorProvider>
  );
}

function QueryPlaygroundContent({ panelDefinition }: QueryPlaygroundProps): ReactElement | null {
  const { data: plugin, isLoading } = usePlugin('Panel', panelDefinition.spec.plugin.kind);
  const panelEditorContext = useContext(PanelEditorContext);
  const suggestedStepMs = useSuggestedStepMs(panelEditorContext?.preview.previewPanelWidth);

  // Draft queries drive the editors, preview queries drive the chart: a draft only
  // becomes part of the preview when the user runs it.
  const [draftQueries, setDraftQueries] = useState<QueryDefinition[]>(panelDefinition.spec.queries ?? []);
  const [previewQueries, setPreviewQueries] = useState<QueryDefinition[]>(panelDefinition.spec.queries ?? []);

  const pluginQueryOptions = useMemo(
    () =>
      typeof plugin?.queryOptions === 'function'
        ? plugin.queryOptions(panelDefinition.spec.plugin.spec)
        : plugin?.queryOptions,
    [panelDefinition.spec.plugin.spec, plugin]
  );

  const handleQueriesChange = useCallback((queries: QueryDefinition[]) => {
    setDraftQueries(queries);
    // If the number of queries has changed, sync the preview to drop results of deleted queries.
    setPreviewQueries((prev) => (queries.length !== prev.length ? queries : prev));
  }, []);

  const handleQueryRun = useCallback((index: number, query: QueryDefinition) => {
    setPreviewQueries((prev) => {
      const next = [...prev];
      next[index] = query;
      return next;
    });
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <DataQueriesProvider definitions={previewQueries} options={{ suggestedStepMs, ...pluginQueryOptions }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" marginBottom={1}>
            Preview
          </Typography>
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            <PanelPreview panelDefinition={panelDefinition} />
          </ErrorBoundary>
        </Box>
        <ErrorBoundary FallbackComponent={ErrorAlert}>
          <QueryPlaygroundEditor
            queryTypes={plugin?.supportedQueryTypes ?? []}
            queries={draftQueries}
            previewQueries={previewQueries}
            onChange={handleQueriesChange}
            onQueryRun={handleQueryRun}
          />
        </ErrorBoundary>
      </Stack>
    </DataQueriesProvider>
  );
}

interface QueryPlaygroundEditorProps {
  queryTypes: QueryPluginType[];
  queries: QueryDefinition[];
  previewQueries: QueryDefinition[];
  onChange: (queries: QueryDefinition[]) => void;
  onQueryRun: (index: number, query: QueryDefinition) => void;
}

// Separate component because reading the query results requires being inside the DataQueriesProvider.
function QueryPlaygroundEditor({
  queryTypes,
  queries,
  previewQueries,
  onChange,
  onQueryRun,
}: QueryPlaygroundEditorProps): ReactElement {
  const { queryResults } = useDataQueriesContext();

  return (
    <MultiQueryEditor
      queryTypes={queryTypes}
      queries={queries}
      queryResults={queryResults}
      onChange={onChange}
      onQueryRun={(index, query): void => {
        onQueryRun(index, query);
        // If the spec has not changed, refetch to update the data
        if (JSON.stringify(previewQueries[index]) === JSON.stringify(query)) {
          queryResults[index]?.refetch?.();
        }
      }}
    />
  );
}
