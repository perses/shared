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

import { DurationString, PanelGroupDefinition } from '@perses-dev/core';
import { createPanelRef, DashboardSpec, GridDefinition, PanelGroupId } from '@perses-dev/spec';
import { DashboardResource } from '../model';
import { useDashboardStore } from './DashboardProvider';
import { useVariableDefinitionActions, useVariableDefinitions } from './VariableProvider';
import { useAnnotationActions, useAnnotationSpecs } from './AnnotationProvider';

type DashboardType = Omit<DashboardResource, 'spec'> & { spec: DashboardSpec & { ttl?: DurationString } };
export function useDashboard(): {
  dashboard: DashboardType;
  setDashboard: (dashboardResource: DashboardResource) => void;
} {
  const {
    panels,
    panelGroups,
    panelGroupOrder,
    setDashboard: setDashboardResource,
    kind,
    metadata,
    display,
    duration,
    refreshInterval,
    datasources,
    links,
    ttl,
  } = useDashboardStore(
    ({
      panels,
      panelGroups,
      panelGroupOrder,
      setDashboard,
      kind,
      metadata,
      display,
      duration,
      refreshInterval,
      datasources,
      links,
      ttl,
    }) => ({
      panels,
      panelGroups,
      panelGroupOrder,
      setDashboard,
      kind,
      metadata,
      display,
      duration,
      refreshInterval,
      datasources,
      links,
      ttl,
    })
  );
  const { setVariableDefinitions } = useVariableDefinitionActions();
  const { setAnnotationSpecs } = useAnnotationActions();
  // TODO: annotations
  const variables = useVariableDefinitions();
  const annotations = useAnnotationSpecs();
  const layouts = convertPanelGroupsToLayouts(panelGroups, panelGroupOrder);

  const dashboard: DashboardType =
    kind === 'Dashboard'
      ? {
          kind,
          metadata,
          spec: {
            display,
            panels,
            layouts,
            variables,
            annotations,
            duration,
            refreshInterval,
            datasources,
            links,
          },
        }
      : {
          kind,
          metadata,
          spec: {
            display,
            panels,
            layouts,
            variables,
            annotations,
            duration,
            refreshInterval,
            datasources,
            links,
            ttl,
          },
        };

  const setDashboard = (dashboardResource: DashboardResource): void => {
    // TODO: annotations
    setVariableDefinitions(dashboardResource.spec.variables);
    if (dashboardResource.spec.annotations) {
      setAnnotationSpecs(dashboardResource.spec.annotations);
    }
    setDashboardResource(dashboardResource);
  };

  return {
    dashboard,
    setDashboard,
  };
}

function convertPanelGroupsToLayouts(
  panelGroups: Record<number, PanelGroupDefinition>,
  panelGroupOrder: PanelGroupId[]
): GridDefinition[] {
  const layouts: GridDefinition[] = [];
  panelGroupOrder.map((groupOrderId) => {
    const group = panelGroups[groupOrderId];
    if (group === undefined) {
      throw new Error('panel group not found');
    }
    const { title, isCollapsed, repeatVariable, itemLayouts, itemPanelKeys } = group;
    let display = undefined;
    if (title || isCollapsed !== undefined) {
      display = {
        title: title ?? '',
        collapse: {
          open: !isCollapsed,
        },
      };
    }
    const layout: GridDefinition = {
      kind: 'Grid',
      spec: {
        display,
        items: itemLayouts.map((layout) => {
          const panelKey = itemPanelKeys[layout.i];
          if (panelKey === undefined) {
            throw new Error(`Missing panel key of layout ${layout.i}`);
          }
          return {
            x: layout.x,
            y: layout.y,
            width: layout.w,
            height: layout.h,
            content: createPanelRef(panelKey),
          };
        }),
        repeatVariable: repeatVariable,
      },
    };
    layouts.push(layout);
  });

  return layouts;
}
