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

import type { PanelGroupId } from '@perses-dev/plugin-system';
import type { LayoutDefinition } from '@perses-dev/spec';
import { getPanelKeyFromRef } from '@perses-dev/spec';
import type { WritableDraft } from 'immer';
import type { StateCreator } from 'zustand';

import { GRID_LAYOUT_COLS } from '../../constants';
import type { PanelGroupDefinition, PanelGroupItemLayout } from '../../model';
import { compactLayout } from '../../utils';
import type { Middleware } from './common';
import { generateId } from './common';

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
   * Commit a grid gesture, transferring panel references and repeat settings for received items.
   * Source removals are completed by the receiving grid so either callback order preserves metadata.
   */
  updatePanelGroupLayouts: (panelGroupId: PanelGroupId, itemLayouts: PanelGroupItemLayout[]) => void;
}

/**
 * Curried function for creating a PanelGroupSlice.
 */
export function createPanelGroupSlice(
  layouts: LayoutDefinition[],
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
        if (!group) {
          throw new Error(`Cannot find panel group ${panelGroupId}`);
        }
        const nextLayouts = new Map<string, PanelGroupItemLayout>();
        for (const layout of itemLayouts) {
          const existing = group.itemLayouts.find((item) => item.i === layout.i);
          if (existing) {
            nextLayouts.set(layout.i, { ...existing, ...layout, repeatVariable: existing.repeatVariable });
            continue;
          }
          const source = Object.values(state.panelGroups).find((candidate) =>
            candidate.itemLayouts.some((item) => item.i === layout.i),
          );
          const original = source?.itemLayouts.find((item) => item.i === layout.i);
          const panelKey = source?.itemPanelKeys[layout.i];
          if (!source || !original || panelKey === undefined) {
            throw new Error(`Cannot find panel for grid item ${layout.i}`);
          }
          // A received repeated panel carries an expanded display height. Keep its base height.
          nextLayouts.set(layout.i, {
            ...original,
            x: Math.min(layout.x, GRID_LAYOUT_COLS.sm - original.w),
            y: layout.y,
          });
          group.itemPanelKeys[layout.i] = panelKey;
          source.itemLayouts = source.itemLayouts.filter((item) => item.i !== layout.i);
          delete source.itemPanelKeys[layout.i];
        }
        // Snapgrid calls both grids independently. Retain outgoing metadata until the receiver commits.
        for (const layout of group.itemLayouts) {
          if (!nextLayouts.has(layout.i)) {
            nextLayouts.set(layout.i, layout);
          }
        }
        // Retained items and received items restored to their base height may overlap: reflow them.
        group.itemLayouts = compactLayout([...nextLayouts.values()]);
      });
    },
  });
}

export function convertLayoutsToPanelGroups(
  layouts: LayoutDefinition[],
): Pick<PanelGroupSlice, 'panelGroups' | 'panelGroupOrder'> {
  // Convert the initial layouts from the JSON
  const panelGroups: PanelGroupSlice['panelGroups'] = {};
  const panelGroupIdOrder: PanelGroupSlice['panelGroupOrder'] = [];
  for (const layout of layouts) {
    const itemLayouts: PanelGroupDefinition['itemLayouts'] = [];
    const itemPanelKeys: PanelGroupDefinition['itemPanelKeys'] = {};

    // Split layout information from panel keys to make it easier to update just layouts on move/resize of panels
    if ('items' in layout.spec) {
      for (const item of layout.spec.items) {
        const panelGroupLayoutId = generateId().toString();
        itemLayouts.push({
          i: panelGroupLayoutId,
          w: item.width,
          h: item.height,
          x: item.x,
          y: item.y,
          repeatVariable: item.repeatVariable,
        });
        itemPanelKeys[panelGroupLayoutId] = getPanelKeyFromRef(item.content);
      }
    }

    // Create the panel group and keep track of the ID order
    const repeatVariable = 'repeatVariable' in layout.spec ? layout.spec.repeatVariable : undefined;
    const panelGroupId = generateId();
    panelGroups[panelGroupId] = {
      id: panelGroupId,
      isCollapsed: layout.spec.display?.collapse?.open === false,
      repeatVariable,
      title: layout.spec.display?.title,
      visibility: layout.kind === 'Grid' ? layout.spec.display?.visibility : undefined,
      itemLayouts,
      itemPanelKeys,
    };
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
export function createEmptyPanelGroup(): PanelGroupDefinition {
  return {
    id: generateId(),
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
