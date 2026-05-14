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

import { GridDefinition, TabDefinition } from '@perses-dev/spec';
import { createStore, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GridPanelGroup, TabPanelGroup } from '../../model';
import {
  convertLayoutsToPanelGroups,
  createEmptyPanelGroup,
  createPanelGroupSlice,
  PanelGroupSlice,
} from './panel-group-slice';

describe('convertLayoutsToPanelGroups', () => {
  it('converts a Grid layout to a GridPanelGroup with layoutKind Grid', () => {
    const gridLayout: GridDefinition = {
      kind: 'Grid',
      spec: {
        display: {
          title: 'My Grid',
          collapse: { open: true },
        },
        items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/panel-a' } }],
        repeatVariable: 'host',
      },
    };

    const result = convertLayoutsToPanelGroups([gridLayout]);
    const groups = Object.values(result.panelGroups);
    expect(groups).toHaveLength(1);

    const group = groups[0] as GridPanelGroup;
    expect(group.layoutKind).toBe('Grid');
    expect(group.title).toBe('My Grid');
    expect(group.isCollapsed).toBe(false); // collapse.open === true means NOT collapsed
    expect(group.repeatVariable).toBe('host');
    expect(group.itemLayouts).toHaveLength(1);
    expect(group.itemLayouts[0]).toMatchObject({ x: 0, y: 0, w: 12, h: 6 });
    expect(Object.values(group.itemPanelKeys)).toEqual(['panel-a']);
  });

  it('converts a Tabs layout to a TabPanelGroup with layoutKind Tabs', () => {
    const tabLayout: TabDefinition = {
      kind: 'Tabs',
      spec: {
        display: {
          title: 'My Tabs',
          collapse: { open: false },
        },
        tabs: [
          {
            name: 'Tab A',
            items: [{ x: 0, y: 0, width: 6, height: 4, content: { $ref: '#/spec/panels/panel-x' } }],
          },
          {
            name: 'Tab B',
            items: [
              { x: 0, y: 0, width: 12, height: 8, content: { $ref: '#/spec/panels/panel-y' } },
              { x: 0, y: 8, width: 6, height: 4, content: { $ref: '#/spec/panels/panel-z' } },
            ],
          },
        ],
        defaultTab: 1,
      },
    };

    const result = convertLayoutsToPanelGroups([tabLayout]);
    const groups = Object.values(result.panelGroups);
    expect(groups).toHaveLength(1);

    const group = groups[0] as TabPanelGroup;
    expect(group.layoutKind).toBe('Tabs');
    expect(group.title).toBe('My Tabs');
    expect(group.isCollapsed).toBe(true); // collapse.open === false means collapsed
    expect(group.defaultTab).toBe(1);
    expect(group.activeTab).toBe(1);
    expect(group.tabs).toHaveLength(2);

    // First tab
    expect(group.tabs[0]?.name).toBe('Tab A');
    expect(group.tabs[0]?.itemLayouts).toHaveLength(1);
    expect(group.tabs[0]?.itemLayouts[0]).toMatchObject({ x: 0, y: 0, w: 6, h: 4 });
    expect(Object.values(group.tabs[0]?.itemPanelKeys ?? {})).toEqual(['panel-x']);

    // Second tab
    expect(group.tabs[1]?.name).toBe('Tab B');
    expect(group.tabs[1]?.itemLayouts).toHaveLength(2);
    expect(Object.values(group.tabs[1]?.itemPanelKeys ?? {})).toContain('panel-y');
    expect(Object.values(group.tabs[1]?.itemPanelKeys ?? {})).toContain('panel-z');
  });

  it('handles mixed Grid and Tab layouts', () => {
    const gridLayout: GridDefinition = {
      kind: 'Grid',
      spec: {
        items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/panel-a' } }],
      },
    };

    const tabLayout: TabDefinition = {
      kind: 'Tabs',
      spec: {
        tabs: [
          {
            name: 'Only Tab',
            items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/panel-b' } }],
          },
        ],
      },
    };

    const result = convertLayoutsToPanelGroups([gridLayout, tabLayout]);
    const groups = Object.values(result.panelGroups);
    expect(groups).toHaveLength(2);

    // Order should match the input order
    expect(groups[0]?.layoutKind).toBe('Grid');
    expect(groups[1]?.layoutKind).toBe('Tabs');
  });
});

describe('createEmptyPanelGroup', () => {
  it('returns a GridPanelGroup with layoutKind Grid', () => {
    const group = createEmptyPanelGroup();
    expect(group.layoutKind).toBe('Grid');
    expect(group.itemLayouts).toEqual([]);
    expect(group.itemPanelKeys).toEqual({});
    expect(group.isCollapsed).toBe(false);
  });
});

/**
 * Helper to create a real Zustand store with immer middleware for testing store actions.
 */
function createTestStore(layouts: Array<GridDefinition | TabDefinition>): StoreApi<PanelGroupSlice> {
  return createStore<PanelGroupSlice>()(immer(createPanelGroupSlice(layouts)));
}

describe('setActiveTab', () => {
  const tabLayout: TabDefinition = {
    kind: 'Tabs',
    spec: {
      display: { title: 'Test Tabs' },
      tabs: [
        { name: 'Tab A', items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p1' } }] },
        { name: 'Tab B', items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p2' } }] },
        { name: 'Tab C', items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p3' } }] },
      ],
      defaultTab: 0,
    },
  };

  it('sets activeTab on a TabPanelGroup', () => {
    const store = createTestStore([tabLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;
    const group = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    expect(group.activeTab).toBe(0);

    store.getState().setActiveTab(panelGroupId, 2);

    const updated = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    expect(updated.activeTab).toBe(2);
  });

  it('does nothing when panelGroupId does not exist', () => {
    const store = createTestStore([tabLayout]);
    const stateBefore = store.getState();

    store.getState().setActiveTab(99999, 1);

    // State should be unchanged
    expect(store.getState().panelGroups).toEqual(stateBefore.panelGroups);
  });

  it('does nothing when called on a Grid group', () => {
    const gridLayout: GridDefinition = {
      kind: 'Grid',
      spec: { items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p1' } }] },
    };
    const store = createTestStore([gridLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;

    store.getState().setActiveTab(panelGroupId, 1);

    const group = store.getState().panelGroups[panelGroupId];
    expect(group!.layoutKind).toBe('Grid');
  });
});

describe('updateTabLayouts', () => {
  const tabLayout: TabDefinition = {
    kind: 'Tabs',
    spec: {
      display: { title: 'Test Tabs' },
      tabs: [
        { name: 'Tab A', items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p1' } }] },
        { name: 'Tab B', items: [{ x: 0, y: 0, width: 6, height: 4, content: { $ref: '#/spec/panels/p2' } }] },
      ],
    },
  };

  it('updates the itemLayouts for a specific tab', () => {
    const store = createTestStore([tabLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;
    const group = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    const originalLayoutId = group.tabs[1]!.itemLayouts[0]!.i;

    const newLayouts = [{ i: originalLayoutId, x: 2, y: 2, w: 8, h: 10 }];
    store.getState().updateTabLayouts(panelGroupId, 1, newLayouts);

    const updated = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    expect(updated.tabs[1]!.itemLayouts).toEqual(newLayouts);
    // Tab 0 should be unchanged
    expect(updated.tabs[0]!.itemLayouts).toEqual(group.tabs[0]!.itemLayouts);
  });

  it('does nothing when panelGroupId does not exist', () => {
    const store = createTestStore([tabLayout]);
    const stateBefore = store.getState();

    store.getState().updateTabLayouts(99999, 0, []);

    expect(store.getState().panelGroups).toEqual(stateBefore.panelGroups);
  });

  it('does nothing when tabIndex is out of bounds', () => {
    const store = createTestStore([tabLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;
    const groupBefore = store.getState().panelGroups[panelGroupId] as TabPanelGroup;

    store.getState().updateTabLayouts(panelGroupId, 999, []);

    const groupAfter = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    expect(groupAfter.tabs).toEqual(groupBefore.tabs);
  });

  it('does nothing when called on a Grid group', () => {
    const gridLayout: GridDefinition = {
      kind: 'Grid',
      spec: { items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p1' } }] },
    };
    const store = createTestStore([gridLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;

    store.getState().updateTabLayouts(panelGroupId, 0, []);

    const group = store.getState().panelGroups[panelGroupId];
    expect(group!.layoutKind).toBe('Grid');
  });
});

describe('updateTabName', () => {
  const tabLayout: TabDefinition = {
    kind: 'Tabs',
    spec: {
      display: { title: 'Test Tabs' },
      tabs: [
        { name: 'Tab A', items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p1' } }] },
        { name: 'Tab B', items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p2' } }] },
      ],
    },
  };

  it('updates the name of a tab at the given index', () => {
    const store = createTestStore([tabLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;

    store.getState().updateTabName(panelGroupId, 0, 'Renamed Tab');

    const group = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    expect(group.tabs[0]!.name).toBe('Renamed Tab');
    expect(group.tabs[1]!.name).toBe('Tab B');
  });

  it('does nothing when panelGroupId does not exist', () => {
    const store = createTestStore([tabLayout]);
    const stateBefore = store.getState();

    store.getState().updateTabName(99999, 0, 'Renamed');

    expect(store.getState().panelGroups).toEqual(stateBefore.panelGroups);
  });

  it('does nothing when called on a Grid group', () => {
    const gridLayout: GridDefinition = {
      kind: 'Grid',
      spec: { items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p1' } }] },
    };
    const store = createTestStore([gridLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;

    store.getState().updateTabName(panelGroupId, 0, 'Renamed');

    const group = store.getState().panelGroups[panelGroupId];
    expect(group!.layoutKind).toBe('Grid');
  });

  it('does nothing when tabIndex is out of bounds', () => {
    const store = createTestStore([tabLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;

    store.getState().updateTabName(panelGroupId, 999, 'Renamed');

    const group = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    expect(group.tabs[0]!.name).toBe('Tab A');
    expect(group.tabs[1]!.name).toBe('Tab B');
  });
});

describe('setDefaultTab', () => {
  const tabLayout: TabDefinition = {
    kind: 'Tabs',
    spec: {
      display: { title: 'Test Tabs' },
      tabs: [
        { name: 'Tab A', items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p1' } }] },
        { name: 'Tab B', items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p2' } }] },
        { name: 'Tab C', items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p3' } }] },
      ],
      defaultTab: 0,
    },
  };

  it('sets the default tab index', () => {
    const store = createTestStore([tabLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;

    store.getState().setDefaultTab(panelGroupId, 2);

    const group = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    expect(group.defaultTab).toBe(2);
  });

  it('does nothing when panelGroupId does not exist', () => {
    const store = createTestStore([tabLayout]);
    const stateBefore = store.getState();

    store.getState().setDefaultTab(99999, 1);

    expect(store.getState().panelGroups).toEqual(stateBefore.panelGroups);
  });

  it('does nothing when called on a Grid group', () => {
    const gridLayout: GridDefinition = {
      kind: 'Grid',
      spec: { items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p1' } }] },
    };
    const store = createTestStore([gridLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;

    store.getState().setDefaultTab(panelGroupId, 0);

    const group = store.getState().panelGroups[panelGroupId];
    expect(group!.layoutKind).toBe('Grid');
  });

  it('does nothing when tabIndex is out of bounds', () => {
    const store = createTestStore([tabLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;

    store.getState().setDefaultTab(panelGroupId, -1);
    const group1 = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    expect(group1.defaultTab).toBe(0);

    store.getState().setDefaultTab(panelGroupId, 999);
    const group2 = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    expect(group2.defaultTab).toBe(0);
  });
});

describe('addTab', () => {
  const tabLayout: TabDefinition = {
    kind: 'Tabs',
    spec: {
      display: { title: 'Test Tabs' },
      tabs: [{ name: 'Tab A', items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p1' } }] }],
    },
  };

  it('adds a new tab with the given name', () => {
    const store = createTestStore([tabLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;

    store.getState().addTab(panelGroupId, 'New Tab');

    const group = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    expect(group.tabs).toHaveLength(2);
    expect(group.tabs[1]!.name).toBe('New Tab');
    expect(group.tabs[1]!.itemLayouts).toEqual([]);
    expect(group.tabs[1]!.itemPanelKeys).toEqual({});
  });

  it('does nothing when panelGroupId does not exist', () => {
    const store = createTestStore([tabLayout]);
    const stateBefore = store.getState();

    store.getState().addTab(99999, 'New Tab');

    expect(store.getState().panelGroups).toEqual(stateBefore.panelGroups);
  });

  it('does nothing when called on a Grid group', () => {
    const gridLayout: GridDefinition = {
      kind: 'Grid',
      spec: { items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p1' } }] },
    };
    const store = createTestStore([gridLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;

    store.getState().addTab(panelGroupId, 'New Tab');

    const group = store.getState().panelGroups[panelGroupId];
    expect(group!.layoutKind).toBe('Grid');
  });
});

describe('removeTab', () => {
  const tabLayout: TabDefinition = {
    kind: 'Tabs',
    spec: {
      display: { title: 'Test Tabs' },
      tabs: [
        { name: 'Tab A', items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p1' } }] },
        { name: 'Tab B', items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p2' } }] },
        { name: 'Tab C', items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p3' } }] },
      ],
      defaultTab: 1,
    },
  };

  it('removes the tab at the given index', () => {
    const store = createTestStore([tabLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;

    store.getState().removeTab(panelGroupId, 0);

    const group = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    expect(group.tabs).toHaveLength(2);
    expect(group.tabs[0]!.name).toBe('Tab B');
    expect(group.tabs[1]!.name).toBe('Tab C');
  });

  it('does not remove the last remaining tab', () => {
    const singleTabLayout: TabDefinition = {
      kind: 'Tabs',
      spec: {
        tabs: [
          { name: 'Only Tab', items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p1' } }] },
        ],
      },
    };
    const store = createTestStore([singleTabLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;

    store.getState().removeTab(panelGroupId, 0);

    const group = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    expect(group.tabs).toHaveLength(1);
    expect(group.tabs[0]!.name).toBe('Only Tab');
  });

  it('adjusts activeTab when it is beyond the new length', () => {
    const store = createTestStore([tabLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;
    // Set activeTab to the last tab (index 2)
    store.getState().setActiveTab(panelGroupId, 2);

    store.getState().removeTab(panelGroupId, 2);

    const group = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    expect(group.activeTab).toBe(1); // Clamped to new last index
  });

  it('adjusts defaultTab when it is beyond the new length', () => {
    const store = createTestStore([tabLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;
    // defaultTab is 1, remove tab at index 0
    store.getState().removeTab(panelGroupId, 2);
    store.getState().removeTab(panelGroupId, 1);

    const group = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    expect(group.defaultTab).toBe(0); // Clamped to new last index
  });

  it('does nothing when panelGroupId does not exist', () => {
    const store = createTestStore([tabLayout]);
    const stateBefore = store.getState();

    store.getState().removeTab(99999, 0);

    expect(store.getState().panelGroups).toEqual(stateBefore.panelGroups);
  });

  it('does nothing when called on a Grid group', () => {
    const gridLayout: GridDefinition = {
      kind: 'Grid',
      spec: { items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p1' } }] },
    };
    const store = createTestStore([gridLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;

    store.getState().removeTab(panelGroupId, 0);

    const group = store.getState().panelGroups[panelGroupId];
    expect(group!.layoutKind).toBe('Grid');
  });
});

describe('reorderTabs', () => {
  const tabLayout: TabDefinition = {
    kind: 'Tabs',
    spec: {
      display: { title: 'Test Tabs' },
      tabs: [
        { name: 'Tab A', items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p1' } }] },
        { name: 'Tab B', items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p2' } }] },
        { name: 'Tab C', items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p3' } }] },
      ],
      defaultTab: 0,
    },
  };

  it('moves a tab from one position to another', () => {
    const store = createTestStore([tabLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;

    store.getState().reorderTabs(panelGroupId, 0, 2);

    const group = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    expect(group.tabs[0]!.name).toBe('Tab B');
    expect(group.tabs[1]!.name).toBe('Tab C');
    expect(group.tabs[2]!.name).toBe('Tab A');
  });

  it('adjusts defaultTab when the default tab is moved', () => {
    const store = createTestStore([tabLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;
    // defaultTab is 0 (Tab A), move it to index 2
    store.getState().reorderTabs(panelGroupId, 0, 2);

    const group = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    expect(group.defaultTab).toBe(2);
  });

  it('adjusts defaultTab when a tab before the default is moved after it', () => {
    const store = createTestStore([tabLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;
    // Set defaultTab to index 1 (Tab B)
    store.getState().setDefaultTab(panelGroupId, 1);
    // Move Tab A (index 0) to index 2 (after the default)
    store.getState().reorderTabs(panelGroupId, 0, 2);

    const group = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    // Tab B was at index 1, but Tab A was removed from before it, so it shifts to 0
    expect(group.defaultTab).toBe(0);
  });

  it('adjusts defaultTab when a tab after the default is moved before it', () => {
    const store = createTestStore([tabLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;
    // Set defaultTab to index 1 (Tab B)
    store.getState().setDefaultTab(panelGroupId, 1);
    // Move Tab C (index 2) to index 0 (before the default)
    store.getState().reorderTabs(panelGroupId, 2, 0);

    const group = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    // Tab B was at index 1, Tab C was inserted before it, so Tab B shifts to 2
    expect(group.defaultTab).toBe(2);
  });

  it('adjusts activeTab when the active tab is moved', () => {
    const store = createTestStore([tabLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;
    // Set activeTab to 0
    store.getState().setActiveTab(panelGroupId, 0);
    // Move Tab A (index 0) to index 2
    store.getState().reorderTabs(panelGroupId, 0, 2);

    const group = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    expect(group.activeTab).toBe(2);
  });

  it('does nothing when indices are out of bounds', () => {
    const store = createTestStore([tabLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;

    store.getState().reorderTabs(panelGroupId, -1, 2);

    const group = store.getState().panelGroups[panelGroupId] as TabPanelGroup;
    expect(group.tabs[0]!.name).toBe('Tab A');
    expect(group.tabs[1]!.name).toBe('Tab B');
    expect(group.tabs[2]!.name).toBe('Tab C');
  });

  it('does nothing when panelGroupId does not exist', () => {
    const store = createTestStore([tabLayout]);
    const stateBefore = store.getState();

    store.getState().reorderTabs(99999, 0, 1);

    expect(store.getState().panelGroups).toEqual(stateBefore.panelGroups);
  });

  it('does nothing when called on a Grid group', () => {
    const gridLayout: GridDefinition = {
      kind: 'Grid',
      spec: { items: [{ x: 0, y: 0, width: 12, height: 6, content: { $ref: '#/spec/panels/p1' } }] },
    };
    const store = createTestStore([gridLayout]);
    const panelGroupId = store.getState().panelGroupOrder[0]!;

    store.getState().reorderTabs(panelGroupId, 0, 1);

    const group = store.getState().panelGroups[panelGroupId];
    expect(group!.layoutKind).toBe('Grid');
  });
});
