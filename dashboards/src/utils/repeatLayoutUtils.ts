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

import { Layout, Layouts } from 'react-grid-layout';
import { VariableStateMap } from '@perses-dev/plugin-system';
import { PanelGroupItemLayout, RepeatVariable } from '../model';

const DEFAULT_MARGIN = 10;
const ROW_HEIGHT = 30;

export const DEFAULT_REPEAT_ALIGNMENT = 'horizontal' as const;

/**
 * Resolves the list of string values for a repeat variable given the current variable state map.
 * Returns the currently selected values, falling back to all options when nothing is selected.
 */
export function getRepeatVariableValues(
  repeatVariable: RepeatVariable,
  variableValues: VariableStateMap,
  groupRepeatVariable?: [string, string]
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
  return variableState.options?.map((option) => option.value) ?? [];
}

/**
 * Returns how many items will be rendered per row for a repeat variable
 */
export function getPerRowCount(repeatVariable: RepeatVariable, totalValues: number): number {
  if ((repeatVariable.alignment ?? DEFAULT_REPEAT_ALIGNMENT) === 'vertical') {
    return 1;
  }
  return Math.min(repeatVariable.maxPer ?? totalValues, totalValues);
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
  repeatMeta: Map<string, RepeatItemMeta>
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
  groupRepeatVariable?: [string, string]
): { expandedItemLayouts: PanelGroupItemLayout[]; repeatMeta: Map<string, RepeatItemMeta> } {
  const repeatMeta = new Map<string, RepeatItemMeta>();
  const expandedItemLayouts = itemLayouts.map((itemLayout) => {
    const itemRepeatVariable = itemLayout.repeatVariable;
    if (!itemRepeatVariable) {
      return itemLayout;
    }

    const values = getRepeatVariableValues(itemRepeatVariable, variableValues, groupRepeatVariable);
    const perRowCount = getPerRowCount(itemRepeatVariable, values.length);
    const numberOfRows = values.length > 0 ? Math.ceil(values.length / perRowCount) : 1;
    repeatMeta.set(itemLayout.i, { itemRepeatVariable, values, numberOfRows });

    if (values.length === 0 || numberOfRows <= 1) {
      return itemLayout;
    }
    return { ...itemLayout, h: calculateExpandedHeight(itemLayout.h, numberOfRows) };
  });
  return { expandedItemLayouts, repeatMeta };
}
