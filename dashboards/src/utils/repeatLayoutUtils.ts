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

import { DEFAULT_MAX_PER_ROW, DEFAULT_REPEAT_ALIGNMENT, VariableStateMap } from '@perses-dev/plugin-system';
import { Layout, Layouts } from 'react-grid-layout';

import { DEFAULT_MARGIN, ROW_HEIGHT } from '../constants';
import { PanelGroupItemLayout, RepeatVariable } from '../model';

/**
 * Resolves the list of string values for a repeat variable given the current variable state map.
 * When groupRepeatVariable matches, returns only that pinned value.
 * Returns selected values when the selection is a non-empty array, otherwise returns empty array.
 */
export function getRepeatVariableValues(
  repeatVariable: RepeatVariable,
  variableValues: VariableStateMap,
  groupRepeatVariable?: [string, string],
): string[] {
  const variableState = variableValues[repeatVariable.value];
  if (!variableState) {
    return [];
  }
  if (groupRepeatVariable && repeatVariable.value === groupRepeatVariable[0]) {
    return [groupRepeatVariable[1]];
  }
  if (Array.isArray(variableState.value) && variableState.value.length > 0) {
    return variableState.value;
  }
  return [];
}

/**
 * Returns how many items will be rendered per row for a repeat variable
 */
export function getPerRowCount(repeatVariable: RepeatVariable): number {
  if ((repeatVariable.alignment ?? DEFAULT_REPEAT_ALIGNMENT) === 'vertical') {
    return 1;
  }
  return repeatVariable.maxPer ?? DEFAULT_MAX_PER_ROW;
}

/**
 * Calculates the total expanded grid height for a repeat panel item given the single-item height.
 * Each row of repeated sub-panels occupies singleItemHeight grid rows, with margins between rows.
 */
export function calculateExpandedHeight(singleItemHeight: number, numberOfRows: number): number {
  if (numberOfRows <= 1) {
    return singleItemHeight;
  }
  return numberOfRows * singleItemHeight + Math.ceil(((numberOfRows - 1) * DEFAULT_MARGIN) / ROW_HEIGHT);
}

/**
 * Calculates the single-item grid height from a total expanded height.
 * This is the inverse of calculateExpandedHeight and is used when persisting
 * a resize performed by the user in edit mode.
 */
export function calculateSingleItemHeight(totalHeight: number, numberOfRows: number): number {
  if (numberOfRows <= 1) {
    return totalHeight;
  }
  const gapHeight = Math.ceil(((numberOfRows - 1) * DEFAULT_MARGIN) / ROW_HEIGHT);
  return Math.max(1, Math.round((totalHeight - gapHeight) / numberOfRows));
}

export interface RepeatItemMeta {
  itemRepeatVariable: RepeatVariable;
  values: string[];
  totalValues: number;
  numberOfRows: number;
}

/**
 * Restores a layout item to its single-item height and re-attaches repeatVariable after
 * react-grid-layout reports back an expanded (total) height. Used when persisting layouts,
 * including after a user resize in edit mode.
 */
export function restoreRepeatItemLayout(layout: PanelGroupItemLayout, meta: RepeatItemMeta): PanelGroupItemLayout {
  return {
    ...layout,
    h: calculateSingleItemHeight(layout.h, meta.numberOfRows),
    repeatVariable: meta.itemRepeatVariable,
  };
}

/**
 * Applies restoreRepeatItemLayout to all repeat items in currentLayout and allLayouts using
 * the provided meta map. Non-repeat items are returned unchanged.
 */
export function restoreRepeatLayouts(
  currentLayout: Layout[],
  allLayouts: Layouts,
  repeatMeta: Map<string, RepeatItemMeta>,
): { currentLayout: PanelGroupItemLayout[]; allLayouts: Layouts } {
  const restore = (layout: Layout): PanelGroupItemLayout => {
    const meta = repeatMeta.get(layout.i);
    return meta ? restoreRepeatItemLayout(layout, meta) : layout;
  };
  const restoredAllLayouts: Layouts = {};
  for (const [breakpoint, layouts] of Object.entries(allLayouts)) {
    restoredAllLayouts[breakpoint] = layouts.map(restore);
  }
  return { currentLayout: currentLayout.map(restore), allLayouts: restoredAllLayouts };
}

/**
 * Builds a map from layout item id to repeat metadata and a list of layouts with
 * expanded heights for repeat-variable items. Non-repeat items are returned unchanged.
 */
export function buildRepeatMeta(
  itemLayouts: PanelGroupItemLayout[],
  variableValues: VariableStateMap,
  groupRepeatVariable?: [string, string],
  maxValues?: number,
): { expandedItemLayouts: PanelGroupItemLayout[]; repeatMeta: Map<string, RepeatItemMeta> } {
  const repeatMeta = new Map<string, RepeatItemMeta>();
  const expandedItemLayouts = itemLayouts.map((itemLayout) => {
    const itemRepeatVariable = itemLayout.repeatVariable;
    if (!itemRepeatVariable) {
      return itemLayout;
    }

    const allValues = getRepeatVariableValues(itemRepeatVariable, variableValues, groupRepeatVariable);
    const values = maxValues ? allValues.slice(0, maxValues) : allValues;
    const perRowCount = getPerRowCount(itemRepeatVariable);
    const numberOfRows = values.length > 0 ? Math.ceil(values.length / perRowCount) : 1;
    repeatMeta.set(itemLayout.i, { itemRepeatVariable, values, totalValues: allValues.length, numberOfRows });

    if (values.length === 0 || numberOfRows <= 1) {
      return itemLayout;
    }
    return { ...itemLayout, h: calculateExpandedHeight(itemLayout.h, numberOfRows) };
  });
  return { expandedItemLayouts, repeatMeta };
}

/** Returns the pixel width of a single repeated panel, clamped to at least 1 to prevent negative values when the container is narrower than the combined gaps. */
export function calcPerPanelWidth(width: number, itemGap: number, perRow: number): number {
  return Math.max(1, Math.floor((width - itemGap * (perRow - 1)) / perRow));
}
