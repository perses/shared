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

import { verticalCompactor } from '@snapgridjs/react';

import { GRID_LAYOUT_COLS } from '../constants';
import type { PanelGroupItemLayout, PanelGroupItemLayoutId } from '../model';

const GRID_ITEM_ID_SEPARATOR = '|';

/**
 * Moves overlapping items down so that no two items share the same cells, then pulls every item
 * up as far as possible to remove vertical gaps (same behavior as react-grid-layout's `compactType="vertical"`).
 *
 * react-grid-layout did this automatically on every render. Snapgrid renders the layout exactly as given,
 * so we have to do it ourselves whenever the stored layout may contain overlaps, for example:
 * - a repeated panel is expanded into one item per variable value, all sharing the original `x`/`y`;
 * - a duplicated panel is inserted right below its reference, on top of whatever was there;
 * - a panel dropped from another group lands on cells already occupied in the receiving group.
 *
 * Positions are computed in the persisted 24 column grid, and only `x`/`y` are rewritten so that
 * extra fields such as `repeatVariable` are kept on the returned items.
 *
 * The compactor writes to the items it pushes down, so it gets copies: the given items can be frozen store state.
 */
export function compactLayout(layout: PanelGroupItemLayout[]): PanelGroupItemLayout[] {
  const compacted = verticalCompactor.compact(
    layout.map((item) => ({ ...item })),
    GRID_LAYOUT_COLS.sm,
  );
  return layout.map((item, index) => {
    const next = compacted[index];
    if (!next || (next.x === item.x && next.y === item.y)) return item;
    return { ...item, x: next.x, y: next.y };
  });
}

/**
 * Builds the id of a rendered grid tile. Repeated groups render the same persisted item once per
 * variable value, but dnd-kit needs a unique id per tile.
 */
export function encodeGridItemId(id: PanelGroupItemLayoutId, repeatVariable?: [string, string]): string {
  return `${encodeURIComponent(id)}${GRID_ITEM_ID_SEPARATOR}${encodeURIComponent(JSON.stringify(repeatVariable ?? []))}`;
}

/**
 * Extracts the persisted item id from a rendered grid tile id.
 */
export function decodeGridItemId(gridItemId: string): PanelGroupItemLayoutId {
  return decodeURIComponent(gridItemId.split(GRID_ITEM_ID_SEPARATOR)[0] ?? gridItemId);
}
