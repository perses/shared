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

export type PanelGroupId = number;

/**
 * Panel Group Item Layout ID type. String identifier for items within a panel group.
 */
export type PanelGroupItemLayoutId = string;

/**
 * Uniquely identifies an item in a PanelGroup.
 */
export interface PanelGroupItemId {
  panelGroupId: PanelGroupId;
  panelGroupItemLayoutId: PanelGroupItemLayoutId;
  repeatVariable?: [string, string]; // Optional, used for repeated panel groups. Variable name and value.
}

/**
 * Base layout properties for positioning and sizing items in a grid.
 * This is a framework-agnostic representation that can be used with various grid systems.
 */
export interface BaseLayout {
  /**
   * Item identifier
   */
  i: string;
  /**
   * X position in grid units
   */
  x: number;
  /**
   * Y position in grid units
   */
  y: number;
  /**
   * Width in grid units
   */
  w: number;
  /**
   * Height in grid units
   */
  h: number;
}

export interface PanelGroupItemLayout extends BaseLayout {
  i: PanelGroupItemLayoutId;
}

/**
 * State for a single tab within a TabPanelGroup.
 */
export interface TabState {
  name: string;
  itemLayouts: PanelGroupItemLayout[];
  itemPanelKeys: Record<PanelGroupItemLayoutId, string>;
}

/**
 * Base properties shared by all panel group types.
 */
interface PanelGroupBase {
  id: PanelGroupId;
  isCollapsed: boolean;
  title?: string;
  repeatedOriginId?: PanelGroupId;
}

/**
 * A panel group that uses a grid layout for its items.
 */
export interface GridPanelGroup extends PanelGroupBase {
  layoutKind: 'Grid';
  itemLayouts: PanelGroupItemLayout[];
  itemPanelKeys: Record<PanelGroupItemLayoutId, string>;
  repeatVariable?: string;
}

/**
 * A panel group that uses a tabbed layout for its items.
 */
export interface TabPanelGroup extends PanelGroupBase {
  layoutKind: 'Tabs';
  tabs: TabState[];
  defaultTab: number;
  activeTab: number;
}

/**
 * Definition of a panel group, containing layout and panel information.
 * Discriminated union on the `layoutKind` field.
 */
export type PanelGroupDefinition = GridPanelGroup | TabPanelGroup;

/**
 * Check if two PanelGroupItemId are equal
 */
export function isPanelGroupItemIdEqual(a?: PanelGroupItemId, b?: PanelGroupItemId): boolean {
  return a?.panelGroupId === b?.panelGroupId && a?.panelGroupItemLayoutId === b?.panelGroupItemLayoutId;
}

/**
 * Returns a unified record of all item panel keys across all tabs (for TabPanelGroup)
 * or the direct itemPanelKeys (for GridPanelGroup).
 */
export function getGroupItemPanelKeys(group: PanelGroupDefinition): Record<PanelGroupItemLayoutId, string> {
  if (group.layoutKind === 'Grid') return group.itemPanelKeys;
  return Object.assign({}, ...group.tabs.map((tab) => tab.itemPanelKeys));
}

/**
 * Returns a unified array of all item layouts across all tabs (for TabPanelGroup)
 * or the direct itemLayouts (for GridPanelGroup).
 */
export function getGroupItemLayouts(group: PanelGroupDefinition): PanelGroupItemLayout[] {
  if (group.layoutKind === 'Grid') return group.itemLayouts;
  return group.tabs.flatMap((tab) => tab.itemLayouts);
}

/**
 * For a TabPanelGroup, find the tab that contains a given layout item ID.
 */
export function findTabContainingItem(group: TabPanelGroup, layoutId: PanelGroupItemLayoutId): TabState | undefined {
  return group.tabs.find((tab) => tab.itemPanelKeys[layoutId] !== undefined);
}
