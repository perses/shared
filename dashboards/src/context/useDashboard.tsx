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

import {
  createPanelRef,
  DashboardSpec,
  DurationString,
  GridDefinition,
  LayoutDefinition,
  PanelGroupId,
  TabDefinition,
} from '@perses-dev/spec';
import { DashboardResource, PanelGroupDefinition } from '../model';

import { useDashboardStore } from './DashboardProvider';
import { useVariableDefinitionActions, useVariableDefinitions } from './VariableProvider';

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
  const variables = useVariableDefinitions();
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
            duration,
            refreshInterval,
            datasources,
            links,
            ttl,
          },
        };

  const setDashboard = (dashboardResource: DashboardResource): void => {
    setVariableDefinitions(dashboardResource.spec.variables);
    setDashboardResource(dashboardResource);
  };

  return {
    dashboard,
    setDashboard,
  };
}

export function convertPanelGroupsToLayouts(
  panelGroups: Record<number, PanelGroupDefinition>,
  panelGroupOrder: PanelGroupId[]
): LayoutDefinition[] {
  const layouts: LayoutDefinition[] = [];
  panelGroupOrder.forEach((groupOrderId) => {
    const group = panelGroups[groupOrderId];
    if (group === undefined) {
      throw new Error('panel group not found');
    }
    const { title, isCollapsed } = group;
    let display = undefined;
    if (title || isCollapsed !== undefined) {
      display = {
        title: title ?? '',
        collapse: {
          open: !isCollapsed,
        },
      };
    }

    switch (group.layoutKind) {
      case 'Grid': {
        const { repeatVariable, itemLayouts, itemPanelKeys } = group;
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
        break;
      }

      case 'Tabs': {
        const layout: TabDefinition = {
          kind: 'Tabs',
          spec: {
            display,
            tabs: group.tabs.map((tab) => ({
              name: tab.name,
              items: tab.itemLayouts.map((tabLayout) => {
                const panelKey = tab.itemPanelKeys[tabLayout.i];
                if (panelKey === undefined) {
                  throw new Error(`Missing panel key of tab layout ${tabLayout.i}`);
                }
                return {
                  x: tabLayout.x,
                  y: tabLayout.y,
                  width: tabLayout.w,
                  height: tabLayout.h,
                  content: createPanelRef(panelKey),
                };
              }),
            })),
            defaultTab: group.defaultTab,
          },
        };
        layouts.push(layout);
        break;
      }

      default: {
        // Exhaustive check
        const _exhaustiveCheck: never = group;
        throw new Error(`Unknown layout kind: ${(_exhaustiveCheck as PanelGroupDefinition).layoutKind}`);
      }
    }
  });

  return layouts;
}
