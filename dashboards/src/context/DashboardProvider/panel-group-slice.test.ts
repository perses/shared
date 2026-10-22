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

import type { LayoutDefinition } from '@perses-dev/spec';
import { createStore } from 'zustand';
import type { StoreApi } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { PanelGroupSlice } from './panel-group-slice';
import { createPanelGroupSlice } from './panel-group-slice';

const layouts: LayoutDefinition[] = [
  {
    kind: 'Grid',
    spec: {
      items: [
        {
          x: 0,
          y: 0,
          width: 12,
          height: 4,
          content: { $ref: '#/spec/panels/cpu' },
          repeatVariable: { value: 'instance', maxPer: 2 },
        },
        { x: 0, y: 4, width: 12, height: 3, content: { $ref: '#/spec/panels/memory' } },
      ],
    },
  },
  { kind: 'Grid', spec: { items: [] } },
];

function setup(definitions: LayoutDefinition[] = layouts): {
  store: ReturnType<typeof createPanelGroupStore>;
  sourceId: number;
  destinationId: number;
} {
  const store = createPanelGroupStore(definitions);
  const [sourceId, destinationId] = store.getState().panelGroupOrder;
  if (sourceId === undefined || destinationId === undefined) throw new Error('Missing test groups');
  return { store, sourceId, destinationId };
}

function createPanelGroupStore(definitions: LayoutDefinition[]): StoreApi<PanelGroupSlice> {
  return createStore<PanelGroupSlice>()(immer(devtools(createPanelGroupSlice(definitions))));
}

it.each(['source first', 'destination first'])('moves panel references and repeat settings (%s)', (order) => {
  const { store, sourceId, destinationId } = setup();
  const { updatePanelGroupLayouts, panelGroups } = store.getState();
  const [panel, remaining] = panelGroups[sourceId]?.itemLayouts ?? [];
  if (!panel || !remaining) throw new Error('Missing test panels');
  const sourceLayout = [{ ...remaining, y: 0 }];
  // A drag reports the displayed height of a repeated panel, not its saved single-panel height.
  const destinationLayout = [{ ...panel, x: 12, y: 0, h: 9 }];
  if (order === 'source first') {
    updatePanelGroupLayouts(sourceId, sourceLayout);
    updatePanelGroupLayouts(destinationId, destinationLayout);
  } else {
    updatePanelGroupLayouts(destinationId, destinationLayout);
    updatePanelGroupLayouts(sourceId, sourceLayout);
  }
  const next = store.getState().panelGroups;
  expect(next[sourceId]?.itemLayouts).toEqual(sourceLayout);
  expect(next[sourceId]?.itemPanelKeys).toEqual({ [remaining.i]: 'memory' });
  expect(next[destinationId]?.itemLayouts).toEqual([{ ...panel, x: 12, y: 0 }]);
  expect(next[destinationId]?.itemPanelKeys).toEqual({ [panel.i]: 'cpu' });
  // Moving the last panel back leaves an empty, valid group.
  updatePanelGroupLayouts(destinationId, []);
  updatePanelGroupLayouts(sourceId, [...sourceLayout, { ...panel, y: 3 }]);
  expect(store.getState().panelGroups[destinationId]?.itemLayouts).toEqual([]);
  expect(store.getState().panelGroups[destinationId]?.itemPanelKeys).toEqual({});
});

it('persists resizing without losing repeat settings or panel references', () => {
  const { store, sourceId } = setup();
  const group = store.getState().panelGroups[sourceId];
  if (!group) throw new Error('Missing test group');
  const next = group.itemLayouts.map(({ repeatVariable: _repeatVariable, ...layout }) => ({ ...layout, h: 6 }));
  store.getState().updatePanelGroupLayouts(sourceId, next);
  expect(store.getState().panelGroups[sourceId]?.itemLayouts[0]).toMatchObject({
    h: 6,
    repeatVariable: { value: 'instance', maxPer: 2 },
  });
  expect(store.getState().panelGroups[sourceId]?.itemPanelKeys).toEqual(group.itemPanelKeys);
});

it.each(['moving row first', 'receiving row first'])(
  'reflows a panel moved between two rows of the same repeated group (%s)',
  (order) => {
    const { store, sourceId } = setup();
    const [panel, remaining] = store.getState().panelGroups[sourceId]?.itemLayouts ?? [];
    if (!panel || !remaining) throw new Error('Missing test panels');
    // The row the panel left reports the compacted layout without it; the receiving row reports it dropped on top.
    const movingRowLayout = [{ ...remaining, y: 0 }];
    const receivingRowLayout = [
      { ...panel, x: 0, y: 0 },
      { ...remaining, y: 4 },
    ];
    const { updatePanelGroupLayouts } = store.getState();
    if (order === 'moving row first') {
      updatePanelGroupLayouts(sourceId, movingRowLayout);
      updatePanelGroupLayouts(sourceId, receivingRowLayout);
    } else {
      updatePanelGroupLayouts(sourceId, receivingRowLayout);
      updatePanelGroupLayouts(sourceId, movingRowLayout);
    }
    const itemLayouts = store.getState().panelGroups[sourceId]?.itemLayouts ?? [];
    expect(itemLayouts).toHaveLength(2);
    expect(itemLayouts.find((item) => item.i === panel.i)).toMatchObject({
      h: 4,
      repeatVariable: panel.repeatVariable,
    });
    expect(itemLayouts.find((item) => item.i === remaining.i)).toMatchObject({ h: 3 });
    const [first, second] = itemLayouts;
    const overlaps = first && second && first.y < second.y + second.h && second.y < first.y + first.h;
    expect(overlaps).toBe(false);
    expect(store.getState().panelGroups[sourceId]?.itemPanelKeys).toEqual({
      [panel.i]: 'cpu',
      [remaining.i]: 'memory',
    });
  },
);

it('reflows items around a received repeated panel restored to its base height', () => {
  const [source] = layouts;
  if (!source) throw new Error('Missing test layout');
  const { store, sourceId, destinationId } = setup([
    source,
    {
      kind: 'Grid',
      spec: { items: [{ x: 0, y: 0, width: 24, height: 2, content: { $ref: '#/spec/panels/other' } }] },
    },
  ]);
  const [panel] = store.getState().panelGroups[sourceId]?.itemLayouts ?? [];
  const [other] = store.getState().panelGroups[destinationId]?.itemLayouts ?? [];
  if (!panel || !other) throw new Error('Missing test panels');
  // The destination grid laid out `other` below the expanded (h: 9) preview of the repeated panel.
  store.getState().updatePanelGroupLayouts(destinationId, [
    { ...panel, x: 0, y: 0, h: 9 },
    { ...other, y: 9 },
  ]);
  expect(store.getState().panelGroups[destinationId]?.itemLayouts).toEqual([
    { ...panel, x: 0, y: 0 },
    { ...other, y: 4 },
  ]);
});

it('rejects an unknown received item without modifying either group', () => {
  const { store, destinationId } = setup();
  const before = store.getState().panelGroups;
  expect(() =>
    store.getState().updatePanelGroupLayouts(destinationId, [{ i: 'missing', x: 0, y: 0, w: 12, h: 4 }]),
  ).toThrow('Cannot find panel');
  expect(store.getState().panelGroups).toBe(before);
});

it('keeps the layout visibility on the panel group', () => {
  const visibility = { variable: 'phase', value: ['DEV'] };
  const store = createPanelGroupStore([{ kind: 'Grid', spec: { display: { title: 'Workers', visibility }, items: [] } }]);
  const { panelGroups, panelGroupOrder } = store.getState();
  expect(panelGroups[panelGroupOrder[0] ?? -1]?.visibility).toEqual(visibility);
});
