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
import { GridPanelGroup, TabPanelGroup } from '../model';
import { convertPanelGroupsToLayouts } from './useDashboard';

describe('convertPanelGroupsToLayouts', () => {
  it('converts a GridPanelGroup back to a GridDefinition', () => {
    const panelGroups: Record<number, GridPanelGroup | TabPanelGroup> = {
      1: {
        id: 1,
        layoutKind: 'Grid',
        isCollapsed: false,
        title: 'My Grid',
        repeatVariable: 'host',
        itemLayouts: [{ i: 'layout-1', x: 0, y: 0, w: 12, h: 6 }],
        itemPanelKeys: {
          'layout-1': 'panel-a',
        },
      },
    };
    const order = [1];

    const result = convertPanelGroupsToLayouts(panelGroups, order);
    expect(result).toHaveLength(1);

    const layout = result[0] as GridDefinition;
    expect(layout.kind).toBe('Grid');
    expect(layout.spec.display?.title).toBe('My Grid');
    expect(layout.spec.display?.collapse?.open).toBe(true);
    expect(layout.spec.repeatVariable).toBe('host');
    expect(layout.spec.items).toHaveLength(1);
    expect(layout.spec.items[0]).toMatchObject({
      x: 0,
      y: 0,
      width: 12,
      height: 6,
    });
  });

  it('converts a TabPanelGroup back to a TabDefinition', () => {
    const panelGroups: Record<number, GridPanelGroup | TabPanelGroup> = {
      2: {
        id: 2,
        layoutKind: 'Tabs',
        isCollapsed: true,
        title: 'My Tabs',
        defaultTab: 1,
        activeTab: 0,
        tabs: [
          {
            name: 'Tab A',
            itemLayouts: [{ i: 'tab1-l1', x: 0, y: 0, w: 6, h: 4 }],
            itemPanelKeys: { 'tab1-l1': 'panel-x' },
          },
          {
            name: 'Tab B',
            itemLayouts: [{ i: 'tab2-l1', x: 0, y: 0, w: 12, h: 8 }],
            itemPanelKeys: { 'tab2-l1': 'panel-y' },
          },
        ],
      },
    };
    const order = [2];

    const result = convertPanelGroupsToLayouts(panelGroups, order);
    expect(result).toHaveLength(1);

    const layout = result[0] as TabDefinition;
    expect(layout.kind).toBe('Tabs');
    expect(layout.spec.display?.title).toBe('My Tabs');
    expect(layout.spec.display?.collapse?.open).toBe(false); // isCollapsed === true => open === false
    expect(layout.spec.defaultTab).toBe(1);
    expect(layout.spec.tabs).toHaveLength(2);
    expect(layout.spec.tabs[0]?.name).toBe('Tab A');
    expect(layout.spec.tabs[0]?.items).toHaveLength(1);
    expect(layout.spec.tabs[0]?.items[0]).toMatchObject({
      x: 0,
      y: 0,
      width: 6,
      height: 4,
    });
    expect(layout.spec.tabs[1]?.name).toBe('Tab B');
  });

  it('handles mixed Grid and Tab groups in order', () => {
    const panelGroups: Record<number, GridPanelGroup | TabPanelGroup> = {
      1: {
        id: 1,
        layoutKind: 'Grid',
        isCollapsed: false,
        itemLayouts: [{ i: 'l1', x: 0, y: 0, w: 12, h: 6 }],
        itemPanelKeys: { l1: 'panel-a' },
      },
      2: {
        id: 2,
        layoutKind: 'Tabs',
        isCollapsed: false,
        defaultTab: 0,
        activeTab: 0,
        tabs: [
          {
            name: 'Tab 1',
            itemLayouts: [{ i: 'tl1', x: 0, y: 0, w: 12, h: 6 }],
            itemPanelKeys: { tl1: 'panel-b' },
          },
        ],
      },
    };
    const order = [1, 2];

    const result = convertPanelGroupsToLayouts(panelGroups, order);
    expect(result).toHaveLength(2);
    expect(result[0]?.kind).toBe('Grid');
    expect(result[1]?.kind).toBe('Tabs');
  });
});
