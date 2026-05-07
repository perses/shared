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

import { Grid, Typography } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { PanelEditorContext, PanelPreview } from '@perses-dev/dashboards';
// LOGZ.IO CHANGE START:: Import PanelSpecChangeProvider for bidirectional panel-settings sync [APPZ-1695]
import {
  DataQueriesProvider,
  PanelSpecChangeProvider,
  PanelSpecEditor,
  usePlugin,
  useSuggestedStepMs,
} from '@perses-dev/plugin-system';
// LOGZ.IO CHANGE END:: Import PanelSpecChangeProvider for bidirectional panel-settings sync [APPZ-1695]
import { Definition, PanelDefinition, PanelEditorValues, QueryDefinition, UnknownSpec } from '@perses-dev/core';
import { Control, FieldPath, useWatch } from 'react-hook-form';
import { ReactElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
// LOGZ.IO CHANGE START:: Wrap editor preview in panel time range override [APPZ-2474]
import { PanelTimeRangeOverrideProvider } from '../../context/PanelTimeRangeOverride';
// LOGZ.IO CHANGE END:: Wrap editor preview in panel time range override [APPZ-2474]

export interface PanelQueriesSharedControlsProps {
  control: Control<PanelEditorValues>;
  plugin: Definition<UnknownSpec>;
  panelDefinition: PanelDefinition;
  onQueriesChange: (queries: QueryDefinition[]) => void;
  onPluginSpecChange: (spec: UnknownSpec) => void;
  onJSONChange: (panelDefinitionStr: string) => void;
}

// Component of PanelEditor, it will share queries results to its children with DataQueriesProvider.
// TODO: consider merging PanelEditorProvider, QueryCountProvider and DataQueriesProvider into a single provider to avoid multiple nested providers.
// LOGZ.IO CHANGE START:: Wrap editor preview/queries in panel time range override so the preview matches the dashboard panel [APPZ-2474]
// The override needs to wrap useSuggestedStepMs + DataQueriesProvider + PanelPreview, mirroring
// what GridItemContent does for the dashboard view. The body is split into an inner component so
// the override-aware TimeRangeProvider sits above the time-range readers. The override values
// are read live from form state via useWatch (panelDefinition prop comes from `usePanelEditor`,
// which doesn't track these fields), and merged into a panelDefinition view that the preview
// and badge consume.
const TIME_FROM_PATH = 'panelDefinition.spec.timeFrom' as unknown as FieldPath<PanelEditorValues>;
const TIME_SHIFT_PATH = 'panelDefinition.spec.timeShift' as unknown as FieldPath<PanelEditorValues>;
const HIDE_OVERRIDE_PATH = 'panelDefinition.spec.hideTimeOverride' as unknown as FieldPath<PanelEditorValues>;

export function PanelQueriesSharedControls(props: PanelQueriesSharedControlsProps): ReactElement {
  const { control, panelDefinition: basePanelDefinition } = props;

  const timeFromRaw = useWatch({ control, name: TIME_FROM_PATH }) as string | undefined;
  const timeShiftRaw = useWatch({ control, name: TIME_SHIFT_PATH }) as string | undefined;
  const hideTimeOverrideRaw = useWatch({ control, name: HIDE_OVERRIDE_PATH }) as boolean | undefined;

  const panelDefinition = useMemo<PanelDefinition>(
    () => ({
      ...basePanelDefinition,
      spec: {
        ...basePanelDefinition.spec,
        ...(timeFromRaw !== undefined && timeFromRaw !== '' && { timeFrom: timeFromRaw }),
        ...(timeShiftRaw !== undefined && timeShiftRaw !== '' && { timeShift: timeShiftRaw }),
        ...(hideTimeOverrideRaw !== undefined && { hideTimeOverride: hideTimeOverrideRaw }),
      },
    }),
    [basePanelDefinition, timeFromRaw, timeShiftRaw, hideTimeOverrideRaw]
  );

  return (
    <PanelTimeRangeOverrideProvider spec={{ timeFrom: timeFromRaw, timeShift: timeShiftRaw }}>
      <PanelQueriesSharedControlsBody {...props} panelDefinition={panelDefinition} />
    </PanelTimeRangeOverrideProvider>
  );
}

function PanelQueriesSharedControlsBody({
  plugin,
  control,
  panelDefinition,
  onQueriesChange,
  onPluginSpecChange,
  onJSONChange,
}: PanelQueriesSharedControlsProps): ReactElement {
  const { data: pluginPreview } = usePlugin('Panel', plugin.kind);
  const panelEditorContext = useContext(PanelEditorContext);

  const suggestedStepMs = useSuggestedStepMs(panelEditorContext?.preview.previewPanelWidth);
  // LOGZ.IO CHANGE END:: Wrap editor preview/queries in panel time range override [APPZ-2474]

  const pluginQueryOptions = useMemo(
    () =>
      typeof pluginPreview?.queryOptions === 'function'
        ? pluginPreview?.queryOptions(panelDefinition.spec.plugin.spec)
        : pluginPreview?.queryOptions,
    [panelDefinition.spec.plugin.spec, pluginPreview]
  );

  const [previewDefinition, setPreviewDefinition] = useState(
    () =>
      panelDefinition.spec.queries?.map((query) => {
        return {
          kind: query.spec.plugin.kind,
          spec: query.spec.plugin.spec,
          hidden: query.spec.hidden ?? false, // LOGZ.IO CHANGE:: APPZ-955-math-on-queries-formulas
        };
      }) ?? []
  );

  // LOGZ.IO CHANGE START:: sync preview when queries are added or removed [APPZ-1695]
  const prevQueryCountRef = useRef(panelDefinition.spec.queries?.length ?? 0);
  useEffect(() => {
    const currentCount = panelDefinition.spec.queries?.length ?? 0;

    if (currentCount !== prevQueryCountRef.current) {
      setPreviewDefinition(
        panelDefinition.spec.queries?.map((query) => ({
          kind: query.spec.plugin.kind,
          spec: query.spec.plugin.spec,
          hidden: query.spec.hidden ?? false,
        })) ?? []
      );
    }
    prevQueryCountRef.current = currentCount;
  }, [panelDefinition.spec.queries]);
  // LOGZ.IO CHANGE END:: sync preview when queries are added or removed [APPZ-1695]

  const handleRunQuery = useCallback((index: number, newDef: QueryDefinition) => {
    setPreviewDefinition((prev) => {
      const newDefinitions = [...prev];
      newDefinitions[index] = {
        kind: newDef.spec.plugin.kind,
        spec: newDef.spec.plugin.spec,
        hidden: newDef.spec.hidden ?? false, // LOGZ.IO CHANGE:: APPZ-955-math-on-queries-formulas
      };
      return newDefinitions;
    });
  }, []);

  // LOGZ.IO CHANGE START:: Wrap with PanelSpecChangeProvider for bidirectional panel-settings sync [APPZ-1695]
  return (
    <PanelSpecChangeProvider value={onPluginSpecChange}>
      <DataQueriesProvider definitions={previewDefinition} options={{ suggestedStepMs, ...pluginQueryOptions }}>
        <Grid item xs={12}>
          <Typography variant="h4" marginBottom={1}>
            Preview
          </Typography>
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            <PanelPreview panelDefinition={panelDefinition} />
          </ErrorBoundary>
        </Grid>
        <Grid item xs={12}>
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            <PanelSpecEditor
              control={control}
              panelDefinition={panelDefinition}
              onJSONChange={onJSONChange}
              onQueriesChange={onQueriesChange}
              onQueryRun={handleRunQuery}
              onPluginSpecChange={onPluginSpecChange}
            />
          </ErrorBoundary>
        </Grid>
      </DataQueriesProvider>
    </PanelSpecChangeProvider>
  );
  // LOGZ.IO CHANGE END:: Wrap with PanelSpecChangeProvider for bidirectional panel-settings sync [APPZ-1695]
}
