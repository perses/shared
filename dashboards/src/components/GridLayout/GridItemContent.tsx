// Copyright 2025 The Perses Authors
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

import { Box } from '@mui/material';
import { useInView } from 'react-intersection-observer';
import { DataQueriesProvider, usePlugin, useSuggestedStepMs } from '@perses-dev/plugin-system';
import React, { ReactElement, useMemo, useState } from 'react';
import { isPanelGroupItemIdEqual, PanelDefinition, PanelGroupItemId } from '@perses-dev/core';
import { useEditMode, usePanel, usePanelActions, useViewPanelGroup } from '../../context';
// LOGZ.IO CHANGE START:: Panel-level time range override [APPZ-2474]
import { PanelTimeRangeOverrideProvider } from '../../context/PanelTimeRangeOverride';
// LOGZ.IO CHANGE END:: Panel-level time range override [APPZ-2474]
import { Panel, PanelProps, PanelOptions } from '../Panel';
import { QueryViewerDialog } from '../QueryViewerDialog';

export interface GridItemContentProps {
  panelGroupItemId: PanelGroupItemId;
  width: number; // necessary for determining the suggested step ms
  panelOptions?: PanelOptions;
}

/**
 * Resolves the reference to panel content in a GridItemDefinition and renders the panel.
 */
export function GridItemContent(props: GridItemContentProps): ReactElement {
  const { panelGroupItemId, width } = props;
  const panelDefinition = usePanel(panelGroupItemId);

  const {
    spec: { queries = [] },
  } = panelDefinition;

  const { isEditMode } = useEditMode();
  const { openEditPanel, openDeletePanelDialog, duplicatePanel, viewPanel } = usePanelActions(panelGroupItemId);
  const viewPanelGroupItemId = useViewPanelGroup();
  const { ref, inView } = useInView({
    threshold: 0.2, // we have the flexibility to adjust this threshold to trigger queries slightly earlier or later based on performance
    initialInView: false,
    triggerOnce: true,
  });

  const [openQueryViewer, setOpenQueryViewer] = useState(false);

  const viewQueriesHandler = useMemo(() => {
    return isEditMode || !queries?.length
      ? undefined
      : {
          onClick: (): void => {
            setOpenQueryViewer(true);
          },
        };
  }, [isEditMode, queries]);

  const readHandlers = {
    isPanelViewed: isPanelGroupItemIdEqual(viewPanelGroupItemId, panelGroupItemId),
    onViewPanelClick: function (): void {
      if (viewPanelGroupItemId === undefined) {
        viewPanel(panelGroupItemId);
      } else {
        viewPanel(undefined);
      }
    },
  };

  // Provide actions to the panel when in edit mode
  let editHandlers: PanelProps['editHandlers'] = undefined;
  if (isEditMode) {
    editHandlers = {
      onEditPanelClick: openEditPanel,
      onDuplicatePanelClick: duplicatePanel,
      onDeletePanelClick: openDeletePanelDialog,
    };
  }

  return (
    <Box
      ref={ref}
      sx={{
        width: '100%',
        height: '100%',
      }}
    >
      {/* LOGZ.IO CHANGE START:: Panel-level time range override (Grafana timeFrom/timeShift) [APPZ-2474]
          The override needs to wrap useSuggestedStepMs + DataQueriesProvider + Panel so that
          the panel's queries pick up the overridden range. We extract the time-dependent body
          into GridItemContentBody so it sits inside the override-aware TimeRangeProvider. Read via
          local cast to avoid declaration-merging on `@perses-dev/core` PanelSpec — module-level
          augmentation triggered TS to re-derive types globally and broke pre-existing borderline
          inferences in unrelated app-ui test fixtures (e.g. `kind: string` not narrowing to
          `kind: 'Panel'`). Keep the new fields scoped to consumers. */}
      <PanelTimeRangeOverrideProvider spec={panelDefinition.spec as { timeFrom?: string; timeShift?: string }}>
        <GridItemContentBody
          panelDefinition={panelDefinition}
          width={width}
          inView={inView}
          panelGroupItemId={panelGroupItemId}
          readHandlers={readHandlers}
          editHandlers={editHandlers}
          viewQueriesHandler={viewQueriesHandler}
          panelOptions={props.panelOptions}
        />
      </PanelTimeRangeOverrideProvider>
      {/* LOGZ.IO CHANGE END:: Panel-level time range override [APPZ-2474] */}
      <QueryViewerDialog open={openQueryViewer} queryDefinitions={queries} onClose={() => setOpenQueryViewer(false)} />
    </Box>
  );
}

// LOGZ.IO CHANGE START:: GridItemContentBody — time-range-aware inner half [APPZ-2474]
interface GridItemContentBodyProps {
  panelDefinition: PanelDefinition;
  width: number;
  inView: boolean;
  panelGroupItemId: PanelGroupItemId;
  readHandlers: PanelProps['readHandlers'];
  editHandlers: PanelProps['editHandlers'];
  viewQueriesHandler: PanelProps['viewQueriesHandler'];
  panelOptions?: PanelOptions;
}

function GridItemContentBody({
  panelDefinition,
  width,
  inView,
  panelGroupItemId,
  readHandlers,
  editHandlers,
  viewQueriesHandler,
  panelOptions,
}: GridItemContentBodyProps): ReactElement {
  // map TimeSeriesQueryDefinition to Definition<UnknownSpec>
  const suggestedStepMs = useSuggestedStepMs(width);

  const { data: plugin } = usePlugin('Panel', panelDefinition.spec.plugin.kind);

  const definitions = useMemo(
    () =>
      (panelDefinition.spec.queries ?? []).map((query) => {
        return {
          kind: query.spec.plugin.kind,
          spec: query.spec.plugin.spec,
          hidden: query.spec.hidden ?? false, // LOGZ.IO CHANGE:: APPZ-955-math-on-queries-formulas
        };
      }),
    [panelDefinition.spec.queries]
  );

  const pluginQueryOptions = useMemo(
    () =>
      typeof plugin?.queryOptions === 'function'
        ? plugin?.queryOptions(panelDefinition.spec.plugin.spec)
        : plugin?.queryOptions,
    [plugin, panelDefinition.spec.plugin.spec]
  );

  return (
    <DataQueriesProvider
      definitions={definitions}
      options={{ suggestedStepMs, ...pluginQueryOptions }}
      queryOptions={{ enabled: inView }}
    >
      {inView && (
        <Panel
          definition={panelDefinition}
          readHandlers={readHandlers}
          editHandlers={editHandlers}
          viewQueriesHandler={viewQueriesHandler}
          panelOptions={panelOptions}
          panelGroupItemId={panelGroupItemId}
        />
      )}
    </DataQueriesProvider>
  );
}
// LOGZ.IO CHANGE END:: GridItemContentBody [APPZ-2474]
