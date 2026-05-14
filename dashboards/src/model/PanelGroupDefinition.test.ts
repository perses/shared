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

import {
  GridPanelGroup,
  TabPanelGroup,
  getGroupItemPanelKeys,
  getGroupItemLayouts,
  findTabContainingItem,
} from './PanelGroupDefinition';

describe('PanelGroupDefinition helpers', () => {
  const gridGroup: GridPanelGroup = {
    id: 1,
    layoutKind: 'Grid',
    isCollapsed: false,
    title: 'Grid Group',
    itemLayouts: [
      { i: 'layout-1', x: 0, y: 0, w: 12, h: 6 },
      { i: 'layout-2', x: 0, y: 6, w: 6, h: 4 },
    ],
    itemPanelKeys: {
      'layout-1': 'panel-a',
      'layout-2': 'panel-b',
    },
  };

  const tabGroup: TabPanelGroup = {
    id: 2,
    layoutKind: 'Tabs',
    isCollapsed: false,
    title: 'Tab Group',
    defaultTab: 0,
    activeTab: 0,
    tabs: [
      {
        name: 'Tab 1',
        itemLayouts: [{ i: 'tab1-layout-1', x: 0, y: 0, w: 12, h: 6 }],
        itemPanelKeys: { 'tab1-layout-1': 'panel-x' },
      },
      {
        name: 'Tab 2',
        itemLayouts: [
          { i: 'tab2-layout-1', x: 0, y: 0, w: 6, h: 4 },
          { i: 'tab2-layout-2', x: 6, y: 0, w: 6, h: 4 },
        ],
        itemPanelKeys: {
          'tab2-layout-1': 'panel-y',
          'tab2-layout-2': 'panel-z',
        },
      },
    ],
  };

  describe('getGroupItemPanelKeys', () => {
    it('returns itemPanelKeys directly for Grid groups', () => {
      const result = getGroupItemPanelKeys(gridGroup);
      expect(result).toEqual({
        'layout-1': 'panel-a',
        'layout-2': 'panel-b',
      });
    });

    it('returns flattened panel keys across all tabs for Tab groups', () => {
      const result = getGroupItemPanelKeys(tabGroup);
      expect(result).toEqual({
        'tab1-layout-1': 'panel-x',
        'tab2-layout-1': 'panel-y',
        'tab2-layout-2': 'panel-z',
      });
    });
  });

  describe('getGroupItemLayouts', () => {
    it('returns itemLayouts directly for Grid groups', () => {
      const result = getGroupItemLayouts(gridGroup);
      expect(result).toEqual([
        { i: 'layout-1', x: 0, y: 0, w: 12, h: 6 },
        { i: 'layout-2', x: 0, y: 6, w: 6, h: 4 },
      ]);
    });

    it('returns flattened layouts across all tabs for Tab groups', () => {
      const result = getGroupItemLayouts(tabGroup);
      expect(result).toEqual([
        { i: 'tab1-layout-1', x: 0, y: 0, w: 12, h: 6 },
        { i: 'tab2-layout-1', x: 0, y: 0, w: 6, h: 4 },
        { i: 'tab2-layout-2', x: 6, y: 0, w: 6, h: 4 },
      ]);
    });
  });

  describe('findTabContainingItem', () => {
    it('returns the tab containing the given layout id', () => {
      const result = findTabContainingItem(tabGroup, 'tab2-layout-1');
      expect(result).toBeDefined();
      expect(result?.name).toBe('Tab 2');
    });

    it('returns undefined when the layout id is not found in any tab', () => {
      const result = findTabContainingItem(tabGroup, 'nonexistent');
      expect(result).toBeUndefined();
    });
  });
});
