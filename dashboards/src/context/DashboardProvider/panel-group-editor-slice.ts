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
import { PanelGroupId } from '@perses-dev/spec';
import { GridPanelGroup, TabPanelGroup } from '../../model';
import { generateId, Middleware } from './common';
import { PanelGroupSlice, addPanelGroup, createEmptyPanelGroup } from './panel-group-slice';

export interface PanelGroupEditor {
  mode: 'Add' | 'Edit';
  initialValues: PanelGroupEditorValues;
  applyChanges: (next: PanelGroupEditorValues) => void;
  close: () => void;
}

export interface PanelGroupEditorValues {
  title: string;
  isCollapsed: boolean;
  repeatVariable: string | undefined;
  layoutKind: 'Grid' | 'Tabs';
}

/**
 * Slice that handles the visual editor state and related actions for adding or editing Panel Groups.
 */
export interface PanelGroupEditorSlice {
  /**
   * State that's present when the panel group editor is open.
   */
  panelGroupEditor?: PanelGroupEditor;

  /**
   * Opens the panel group editor to add a new panel group.
   */
  openAddPanelGroup: () => void;

  /**
   * Opens the panel group editor to edit an existing panel group.
   */
  openEditPanelGroup: (panelGroupId: PanelGroupId) => void;
}

export const createPanelGroupEditorSlice: StateCreator<
  // Actions in here need to modify Panel Group state
  PanelGroupEditorSlice & PanelGroupSlice,
  Middleware,
  [],
  PanelGroupEditorSlice
> = (set, get) => ({
  panelGroupEditor: undefined,

  openAddPanelGroup: (): void => {
    // Create the editor state
    const editor: PanelGroupEditor = {
      mode: 'Add',
      initialValues: {
        title: '',
        isCollapsed: false,
        repeatVariable: '',
        layoutKind: 'Grid',
      },
      applyChanges(next) {
        if (next.layoutKind === 'Tabs') {
          const newGroup: TabPanelGroup = {
            id: generateId(),
            layoutKind: 'Tabs',
            title: next.title,
            isCollapsed: next.isCollapsed,
            tabs: [{ name: 'Tab 1', itemLayouts: [], itemPanelKeys: {} }],
            defaultTab: 0,
            activeTab: 0,
          };
          set((draft) => {
            addPanelGroup(draft, newGroup);
          });
        } else {
          const newGroup = createEmptyPanelGroup();
          newGroup.title = next.title;
          newGroup.isCollapsed = next.isCollapsed;
          newGroup.repeatVariable = next.repeatVariable;
          set((draft) => {
            addPanelGroup(draft, newGroup);
          });
        }
      },
      close() {
        set((draft) => {
          draft.panelGroupEditor = undefined;
        });
      },
    };

    // Open the editor
    set((draft) => {
      draft.panelGroupEditor = editor;
    });
  },

  openEditPanelGroup: (panelGroupId): void => {
    const existingGroup = get().panelGroups[panelGroupId];
    if (existingGroup === undefined) {
      throw new Error(`Panel group with Id ${panelGroupId} does not exist`);
    }

    // Create the editor state
    const editor: PanelGroupEditor = {
      mode: 'Edit',
      initialValues: {
        title: existingGroup.title ?? '',
        isCollapsed: existingGroup.isCollapsed,
        repeatVariable: (existingGroup.layoutKind === 'Grid' ? existingGroup.repeatVariable : undefined) ?? '',
        layoutKind: existingGroup.layoutKind,
      },
      applyChanges(next) {
        set((draft) => {
          const group = draft.panelGroups[panelGroupId];
          if (group === undefined) {
            throw new Error(`Panel group with Id ${panelGroupId} does not exist`);
          }

          // Handle layout kind conversion
          if (next.layoutKind !== group.layoutKind) {
            if (next.layoutKind === 'Tabs' && group.layoutKind === 'Grid') {
              const tabGroup: TabPanelGroup = {
                id: group.id,
                layoutKind: 'Tabs',
                title: next.title,
                isCollapsed: next.isCollapsed,
                tabs: [
                  {
                    name: 'Tab 1',
                    itemLayouts: group.itemLayouts,
                    itemPanelKeys: group.itemPanelKeys,
                  },
                ],
                defaultTab: 0,
                activeTab: 0,
              };
              draft.panelGroups[panelGroupId] = tabGroup;
            } else if (next.layoutKind === 'Grid' && group.layoutKind === 'Tabs') {
              const allItemLayouts = group.tabs.flatMap((tab) => tab.itemLayouts);
              const allItemPanelKeys: Record<string, string> = Object.assign(
                {},
                ...group.tabs.map((tab) => tab.itemPanelKeys)
              );
              const gridGroup: GridPanelGroup = {
                id: group.id,
                layoutKind: 'Grid',
                title: next.title,
                isCollapsed: next.isCollapsed,
                itemLayouts: allItemLayouts,
                itemPanelKeys: allItemPanelKeys,
                repeatVariable: next.repeatVariable,
              };
              draft.panelGroups[panelGroupId] = gridGroup;
            }
          } else {
            // Same layout kind, just update properties
            group.title = next.title;
            group.isCollapsed = next.isCollapsed;
            if (group.layoutKind === 'Grid') {
              group.repeatVariable = next.repeatVariable;
            }
          }
        });
      },
      close() {
        set((draft) => {
          draft.panelGroupEditor = undefined;
        });
      },
    };

    // Open the editor
    set((draft) => {
      draft.panelGroupEditor = editor;
    });
  },
});
