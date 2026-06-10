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

import { StateCreator } from 'zustand';
import { PanelGroupItemId, getGroupItemPanelKeys, findTabContainingItem } from '../../model';
import { Middleware } from './common';
import { PanelGroupSlice } from './panel-group-slice';
import { PanelSlice } from './panel-slice';

/**
 * Slice that handles the visual editor state and actions for deleting Panels.
 */
export interface DeletePanelSlice {
  /**
   * Delete panels
   */
  deletePanel: (panelGroupItemId: PanelGroupItemId) => void;

  /**
   * State for the delete panel dialog when it's open, otherwise undefined when it's closed.
   */
  deletePanelDialog?: DeletePanelDialogState;

  /**
   * Open delete panel dialog
   */
  openDeletePanelDialog: (panelGroupItemId: PanelGroupItemId) => void;

  /**
   * Close delete panel dialog
   */
  closeDeletePanelDialog: () => void;
}

export interface DeletePanelDialogState {
  panelGroupItemId: PanelGroupItemId;
  panelName: string;
  panelGroupName: string;
}

/**
 * Curried function for creating the PanelDeleteSlice.
 */
export function createDeletePanelSlice(): StateCreator<
  // Actions in here need to modify both Panels and Panel Groups state
  DeletePanelSlice & PanelSlice & PanelGroupSlice,
  Middleware,
  [],
  DeletePanelSlice
> {
  // Return the state creator function for Zustand that uses the panels provided as intitial state
  return (set, get) => ({
    deletePanel(panelGroupItemId: PanelGroupItemId): void {
      set((draft) => {
        const { panelGroupId, panelGroupItemLayoutId: panelGroupLayoutId } = panelGroupItemId;
        const existingGroup = draft.panelGroups[panelGroupId];
        if (existingGroup === undefined) {
          throw new Error(`Missing panel group ${panelGroupId}`);
        }
        const existingPanelKey = getGroupItemPanelKeys(existingGroup)[panelGroupLayoutId];
        if (existingPanelKey === undefined) {
          throw new Error(`Missing panel group item ${panelGroupLayoutId}`);
        }

        // remove panel from panel group
        if (existingGroup.layoutKind === 'Grid') {
          const existingLayoutIdx = existingGroup.itemLayouts.findIndex((layout) => layout.i === panelGroupLayoutId);
          if (existingLayoutIdx === -1) {
            throw new Error(`Missing panel group item layout ${panelGroupLayoutId}`);
          }
          existingGroup.itemLayouts.splice(existingLayoutIdx, 1);
          delete existingGroup.itemPanelKeys[panelGroupLayoutId];
        } else {
          const tab = findTabContainingItem(existingGroup, panelGroupLayoutId);
          if (tab === undefined) {
            throw new Error(`Missing panel group item in tabs ${panelGroupLayoutId}`);
          }
          const existingLayoutIdx = tab.itemLayouts.findIndex((layout) => layout.i === panelGroupLayoutId);
          if (existingLayoutIdx === -1) {
            throw new Error(`Missing panel group item layout ${panelGroupLayoutId}`);
          }
          tab.itemLayouts.splice(existingLayoutIdx, 1);
          delete tab.itemPanelKeys[panelGroupLayoutId];
        }

        // See if panel key is still used and if not, delete it
        if (isPanelKeyStillUsed(draft.panelGroups, existingPanelKey) === false) {
          delete draft.panels[existingPanelKey];
        }
      });
    },

    openDeletePanelDialog(panelGroupItemId: PanelGroupItemId): void {
      const { panelGroupId, panelGroupItemLayoutId: panelGroupLayoutId } = panelGroupItemId;

      const { panels, panelGroups } = get();
      const panelGroup = panelGroups[panelGroupId];
      if (panelGroup === undefined) {
        throw new Error(`Panel group not found ${panelGroupId}`);
      }

      const panelKey = getGroupItemPanelKeys(panelGroup)[panelGroupLayoutId];
      if (panelKey === undefined) {
        throw new Error(`Could not find Panel Group item ${panelGroupLayoutId}`);
      }

      const panel = panels[panelKey];
      if (panel === undefined) {
        throw new Error(`Could not find panel ${panelKey}`);
      }

      set((state) => {
        state.deletePanelDialog = {
          panelGroupItemId: panelGroupItemId,
          panelName: panel.spec.display?.name ?? panelKey,
          panelGroupName: panelGroup.title ?? '',
        };
      });
    },

    closeDeletePanelDialog(): void {
      set((state) => {
        state.deletePanelDialog = undefined;
      });
    },
  });
}

// Helper function to determine if a panel key is still being used somewhere in Panel Groups
function isPanelKeyStillUsed(panelGroups: PanelGroupSlice['panelGroups'], panelKey: string): boolean {
  for (const group of Object.values(panelGroups)) {
    const found = Object.values(getGroupItemPanelKeys(group)).find((key) => key === panelKey);
    if (found !== undefined) {
      return true;
    }
  }
  return false;
}
