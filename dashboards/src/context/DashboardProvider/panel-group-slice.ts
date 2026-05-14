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

import { getPanelKeyFromRef, LayoutDefinition, PanelGroupId } from '@perses-dev/spec';
import { StateCreator } from 'zustand';
import { WritableDraft } from 'immer';
import { GridPanelGroup, PanelGroupDefinition, PanelGroupItemLayout, TabPanelGroup, TabState } from '../../model';
import { generateId, Middleware } from './common';

/**
 * Slice with the state of Panel Groups, as well as any actions that modify only Panel Group state.
 */
export interface PanelGroupSlice {
  /**
   * Panel groups indexed by their ID.
   */
  panelGroups: Record<PanelGroupId, PanelGroupDefinition>;

  /**
   * An array of panel group IDs, representing their order in the dashboard.
   */
  panelGroupOrder: PanelGroupId[];

  /**
   * Rearrange the order of panel groups by swapping the positions
   */
  swapPanelGroups: (xIndex: number, yIndex: number) => void;

  /**
   * Update the item layouts for a panel group when, for example, a panel is moved or resized.
   */
  updatePanelGroupLayouts: (panelGroupId: PanelGroupId, itemLayouts: PanelGroupItemLayout[]) => void;

  /**
   * Set the active tab index for a TabPanelGroup. No-op if the group doesn't exist or is not a Tabs group.
   */
  setActiveTab: (panelGroupId: PanelGroupId, tabIndex: number) => void;

  /**
   * Update the item layouts for a specific tab within a TabPanelGroup.
   * No-op if the group doesn't exist, is not a Tabs group, or the tab index is out of bounds.
   */
  updateTabLayouts: (panelGroupId: PanelGroupId, tabIndex: number, itemLayouts: PanelGroupItemLayout[]) => void;

  /**
   * Update the name of a tab at the given index within a TabPanelGroup.
   * No-op if the group doesn't exist, is not a Tabs group, or the tab index is out of bounds.
   */
  updateTabName: (panelGroupId: PanelGroupId, tabIndex: number, name: string) => void;

  /**
   * Set the default tab index for a TabPanelGroup.
   * No-op if the group doesn't exist, is not a Tabs group, or the tab index is out of bounds.
   */
  setDefaultTab: (panelGroupId: PanelGroupId, tabIndex: number) => void;

  /**
   * Add a new empty tab with the given name to a TabPanelGroup.
   * No-op if the group doesn't exist or is not a Tabs group.
   */
  addTab: (panelGroupId: PanelGroupId, name: string) => void;

  /**
   * Remove the tab at the given index from a TabPanelGroup.
   * Will not remove the last remaining tab. Adjusts activeTab and defaultTab if needed.
   * No-op if the group doesn't exist or is not a Tabs group.
   */
  removeTab: (panelGroupId: PanelGroupId, tabIndex: number) => void;

  /**
   * Reorder tabs by moving a tab from one index to another.
   * Adjusts activeTab and defaultTab to follow their original tabs.
   * No-op if the group doesn't exist, is not a Tabs group, or indices are out of bounds.
   */
  reorderTabs: (panelGroupId: PanelGroupId, fromIndex: number, toIndex: number) => void;
}

/**
 * Curried function for creating a PanelGroupSlice.
 */
export function createPanelGroupSlice(
  layouts: LayoutDefinition[]
): StateCreator<PanelGroupSlice, Middleware, [], PanelGroupSlice> {
  const { panelGroups, panelGroupOrder } = convertLayoutsToPanelGroups(layouts);

  // Return the state creator function for Zustand
  return (set) => ({
    panelGroups,
    panelGroupOrder,

    swapPanelGroups(x, y): void {
      set((state) => {
        if (x < 0 || x >= state.panelGroupOrder.length || y < 0 || y >= state.panelGroupOrder.length) {
          throw new Error('index out of bound');
        }
        const xPanelGroup = state.panelGroupOrder[x];
        const yPanelGroup = state.panelGroupOrder[y];

        if (xPanelGroup === undefined || yPanelGroup === undefined) {
          throw new Error('panel group is undefined');
        }
        // assign yPanelGroup to layouts[x] and assign xGroup to layouts[y], swapping two panel groups
        [state.panelGroupOrder[x], state.panelGroupOrder[y]] = [yPanelGroup, xPanelGroup];
      });
    },

    updatePanelGroupLayouts(panelGroupId, itemLayouts): void {
      set((state) => {
        const group = state.panelGroups[panelGroupId];
        if (group === undefined) {
          throw new Error(`Cannot find panel group ${panelGroupId}`);
        }
        // Only Grid groups have direct itemLayouts to update
        if (group.layoutKind === 'Grid') {
          group.itemLayouts = itemLayouts;
        }
      });
    },

    setActiveTab(panelGroupId, tabIndex): void {
      set((state) => {
        const group = state.panelGroups[panelGroupId];
        if (group === undefined || group.layoutKind !== 'Tabs') return;
        group.activeTab = tabIndex;
      });
    },

    updateTabLayouts(panelGroupId, tabIndex, itemLayouts): void {
      set((state) => {
        const group = state.panelGroups[panelGroupId];
        if (group === undefined || group.layoutKind !== 'Tabs') return;
        const tab = group.tabs[tabIndex];
        if (tab === undefined) return;
        tab.itemLayouts = itemLayouts;
      });
    },

    updateTabName(panelGroupId, tabIndex, name): void {
      set((state) => {
        const group = state.panelGroups[panelGroupId];
        if (group === undefined || group.layoutKind !== 'Tabs') return;
        const tab = group.tabs[tabIndex];
        if (tab === undefined) return;
        tab.name = name;
      });
    },

    setDefaultTab(panelGroupId, tabIndex): void {
      set((state) => {
        const group = state.panelGroups[panelGroupId];
        if (group === undefined || group.layoutKind !== 'Tabs') return;
        if (tabIndex < 0 || tabIndex >= group.tabs.length) return;
        group.defaultTab = tabIndex;
      });
    },

    addTab(panelGroupId, name): void {
      set((state) => {
        const group = state.panelGroups[panelGroupId];
        if (group === undefined || group.layoutKind !== 'Tabs') return;
        group.tabs.push({ name, itemLayouts: [], itemPanelKeys: {} });
      });
    },

    removeTab(panelGroupId, tabIndex): void {
      set((state) => {
        const group = state.panelGroups[panelGroupId];
        if (group === undefined || group.layoutKind !== 'Tabs') return;
        if (group.tabs.length <= 1) return; // Don't remove the last tab
        group.tabs.splice(tabIndex, 1);
        // Adjust activeTab and defaultTab if needed
        if (group.activeTab >= group.tabs.length) group.activeTab = group.tabs.length - 1;
        if (group.defaultTab >= group.tabs.length) group.defaultTab = group.tabs.length - 1;
      });
    },

    reorderTabs(panelGroupId, fromIndex, toIndex): void {
      set((state) => {
        const group = state.panelGroups[panelGroupId];
        if (group === undefined || group.layoutKind !== 'Tabs') return;
        if (fromIndex < 0 || fromIndex >= group.tabs.length || toIndex < 0 || toIndex >= group.tabs.length) return;
        const [tab] = group.tabs.splice(fromIndex, 1);
        if (tab === undefined) return;
        group.tabs.splice(toIndex, 0, tab);
        // Adjust defaultTab to follow the tab that was default
        if (group.defaultTab === fromIndex) {
          group.defaultTab = toIndex;
        } else if (fromIndex < group.defaultTab && toIndex >= group.defaultTab) {
          group.defaultTab--;
        } else if (fromIndex > group.defaultTab && toIndex <= group.defaultTab) {
          group.defaultTab++;
        }
        // Adjust activeTab similarly
        if (group.activeTab === fromIndex) {
          group.activeTab = toIndex;
        } else if (fromIndex < group.activeTab && toIndex >= group.activeTab) {
          group.activeTab--;
        } else if (fromIndex > group.activeTab && toIndex <= group.activeTab) {
          group.activeTab++;
        }
      });
    },
  });
}

export function convertLayoutsToPanelGroups(
  layouts: LayoutDefinition[]
): Pick<PanelGroupSlice, 'panelGroups' | 'panelGroupOrder'> {
  // Convert the initial layouts from the JSON
  const panelGroups: PanelGroupSlice['panelGroups'] = {};
  const panelGroupIdOrder: PanelGroupSlice['panelGroupOrder'] = [];

  for (const layout of layouts) {
    const panelGroupId = generateId();

    switch (layout.kind) {
      case 'Grid': {
        const itemLayouts: PanelGroupItemLayout[] = [];
        const itemPanelKeys: Record<string, string> = {};

        // Split layout information from panel keys to make it easier to update just layouts on move/resize of panels
        for (const item of layout.spec.items) {
          const panelGroupLayoutId = generateId().toString();
          itemLayouts.push({
            i: panelGroupLayoutId,
            w: item.width,
            h: item.height,
            x: item.x,
            y: item.y,
          });
          itemPanelKeys[panelGroupLayoutId] = getPanelKeyFromRef(item.content);
        }

        const gridGroup: GridPanelGroup = {
          id: panelGroupId,
          layoutKind: 'Grid',
          isCollapsed: layout.spec.display?.collapse?.open === false,
          repeatVariable: layout.spec.repeatVariable,
          title: layout.spec.display?.title,
          itemLayouts,
          itemPanelKeys,
        };
        panelGroups[panelGroupId] = gridGroup;
        break;
      }

      case 'Tabs': {
        const tabs: TabState[] = layout.spec.tabs.map((tabDef) => {
          const tabItemLayouts: PanelGroupItemLayout[] = [];
          const tabItemPanelKeys: Record<string, string> = {};

          for (const item of tabDef.items) {
            const panelGroupLayoutId = generateId().toString();
            tabItemLayouts.push({
              i: panelGroupLayoutId,
              w: item.width,
              h: item.height,
              x: item.x,
              y: item.y,
            });
            tabItemPanelKeys[panelGroupLayoutId] = getPanelKeyFromRef(item.content);
          }

          return {
            name: tabDef.name,
            itemLayouts: tabItemLayouts,
            itemPanelKeys: tabItemPanelKeys,
          };
        });

        const defaultTab = layout.spec.defaultTab ?? 0;
        const tabGroup: TabPanelGroup = {
          id: panelGroupId,
          layoutKind: 'Tabs',
          isCollapsed: layout.spec.display?.collapse?.open === false,
          title: layout.spec.display?.title,
          tabs,
          defaultTab,
          activeTab: defaultTab,
        };
        panelGroups[panelGroupId] = tabGroup;
        break;
      }
    }

    panelGroupIdOrder.push(panelGroupId);
  }

  return {
    panelGroups,
    panelGroupOrder: panelGroupIdOrder,
  };
}

/**
 * Private helper function for creating an empty panel group.
 */
export function createEmptyPanelGroup(): GridPanelGroup {
  return {
    id: generateId(),
    layoutKind: 'Grid',
    title: undefined,
    isCollapsed: false,
    itemLayouts: [],
    itemPanelKeys: {},
  };
}

/**
 * Private helper function that modifies panel group state to add a new panel
 */
export function addPanelGroup(draft: WritableDraft<PanelGroupSlice>, newGroup: PanelGroupDefinition): void {
  draft.panelGroups[newGroup.id] = newGroup;
  draft.panelGroupOrder.unshift(newGroup.id);
}
