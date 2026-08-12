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

import { VariableStateMap } from '@perses-dev/plugin-system';

import { PanelGroupItemLayout, RepeatVariable } from '../model';
import {
  buildRepeatMeta,
  calcPerPanelWidth,
  calculateExpandedHeight,
  calculateSingleItemHeight,
  getPerRowCount,
  getRepeatVariableValues,
  restoreRepeatItemLayout,
  restoreRepeatLayouts,
} from './repeatLayoutUtils';

const makeVariableState = (options: string[], selected?: string[]): VariableStateMap[string] => ({
  value: selected ?? options,
  options: options.map((value) => ({ value, label: value })),
  loading: false,
});

describe('getRepeatVariableValues', () => {
  const variables: VariableStateMap = {
    env: makeVariableState(['prod', 'staging', 'dev']),
    region: makeVariableState(['us-east', 'eu-west'], ['us-east']),
  };

  test('returns selected values when selection is non-empty', () => {
    const repeatVariable: RepeatVariable = { value: 'region', alignment: 'horizontal' };
    expect(getRepeatVariableValues(repeatVariable, variables)).toEqual(['us-east']);
  });

  test('returns empty array when selection is empty array', () => {
    const variablesWithEmptySelection: VariableStateMap = {
      env: { value: [], options: [{ value: 'prod', label: 'prod' }], loading: false },
    };
    const repeatVariable: RepeatVariable = { value: 'env', alignment: 'horizontal' };
    expect(getRepeatVariableValues(repeatVariable, variablesWithEmptySelection)).toEqual([]);
  });

  test('returns all values when all values are selected', () => {
    const repeatVariable: RepeatVariable = { value: 'env', alignment: 'horizontal' };
    expect(getRepeatVariableValues(repeatVariable, variables)).toEqual(['prod', 'staging', 'dev']);
  });

  test('returns empty array when variable does not exist', () => {
    const repeatVariable: RepeatVariable = { value: 'missing', alignment: 'horizontal' };
    expect(getRepeatVariableValues(repeatVariable, variables)).toEqual([]);
  });

  test('returns empty array when variable has no options', () => {
    const emptyVariables: VariableStateMap = { env: { value: [], loading: false } };
    const repeatVariable: RepeatVariable = { value: 'env', alignment: 'horizontal' };
    expect(getRepeatVariableValues(repeatVariable, emptyVariables)).toEqual([]);
  });

  test('returns single value from groupRepeatVariable when variable matches', () => {
    const repeatVariable: RepeatVariable = { value: 'env', alignment: 'horizontal' };
    expect(getRepeatVariableValues(repeatVariable, variables, ['env', 'staging'])).toEqual(['staging']);
  });

  test('groupRepeatVariable pins value even when it is not in the current selection', () => {
    const variablesWithNarrowSelection: VariableStateMap = {
      env: makeVariableState(['prod', 'staging', 'dev'], ['prod']),
    };
    const repeatVariable: RepeatVariable = { value: 'env', alignment: 'horizontal' };
    expect(getRepeatVariableValues(repeatVariable, variablesWithNarrowSelection, ['env', 'staging'])).toEqual([
      'staging',
    ]);
  });

  test('ignores groupRepeatVariable when variable does not match', () => {
    const repeatVariable: RepeatVariable = { value: 'env', alignment: 'horizontal' };
    expect(getRepeatVariableValues(repeatVariable, variables, ['region', 'us-east'])).toEqual([
      'prod',
      'staging',
      'dev',
    ]);
  });

  test('returns empty array when variableState.value is undefined and options exist', () => {
    const variablesWithUndefinedValue: VariableStateMap = {
      env: { value: undefined as unknown as string[], options: [{ value: 'prod', label: 'prod' }], loading: false },
    };
    const repeatVariable: RepeatVariable = { value: 'env', alignment: 'horizontal' };
    expect(getRepeatVariableValues(repeatVariable, variablesWithUndefinedValue)).toEqual([]);
  });

  test('returns empty array when variableState.value is a string (single-value variable)', () => {
    const variablesWithStringValue: VariableStateMap = {
      env: { value: 'prod' as unknown as string[], loading: false },
    };
    const repeatVariable: RepeatVariable = { value: 'env', alignment: 'horizontal' };
    expect(getRepeatVariableValues(repeatVariable, variablesWithStringValue)).toEqual([]);
  });
});

describe('getPerRowCount', () => {
  test('returns DEFAULT_MAX_PER_ROW when alignment is undefined and no maxPer set', () => {
    const repeatVariable: RepeatVariable = { value: 'env' };
    expect(getPerRowCount(repeatVariable)).toBe(4);
  });

  test('returns 1 for vertical alignment', () => {
    const repeatVariable: RepeatVariable = { value: 'env', alignment: 'vertical' };
    expect(getPerRowCount(repeatVariable)).toBe(1);
  });

  test('returns DEFAULT_MAX_PER_ROW when no maxPer set', () => {
    const repeatVariable: RepeatVariable = { value: 'env', alignment: 'horizontal' };
    expect(getPerRowCount(repeatVariable)).toBe(4);
  });

  test('returns maxPer when set', () => {
    const repeatVariable: RepeatVariable = { value: 'env', alignment: 'horizontal', maxPer: 3 };
    expect(getPerRowCount(repeatVariable)).toBe(3);
  });
});

describe('calculateExpandedHeight', () => {
  test('returns singleItemHeight unchanged for 1 row', () => {
    expect(calculateExpandedHeight(6, 1)).toBe(6);
  });

  test('returns singleItemHeight unchanged for 0 rows', () => {
    expect(calculateExpandedHeight(6, 0)).toBe(6);
  });

  test('adds row height with gap for 2 rows', () => {
    expect(calculateExpandedHeight(6, 2)).toBe(13);
  });

  test('adds row heights with gaps for 3 rows', () => {
    expect(calculateExpandedHeight(6, 3)).toBe(19);
  });

  test('handles large numbers of rows', () => {
    expect(calculateExpandedHeight(4, 10)).toBe(43);
  });
});

describe('calculateSingleItemHeight', () => {
  test('returns totalHeight unchanged for 1 row', () => {
    expect(calculateSingleItemHeight(6, 1)).toBe(6);
  });

  test('inverts calculateExpandedHeight for 2 rows', () => {
    const singleItemHeight = 6;
    const expanded = calculateExpandedHeight(singleItemHeight, 2);
    expect(calculateSingleItemHeight(expanded, 2)).toBe(singleItemHeight);
  });

  test('inverts calculateExpandedHeight for 3 rows', () => {
    const singleItemHeight = 6;
    const expanded = calculateExpandedHeight(singleItemHeight, 3);
    expect(calculateSingleItemHeight(expanded, 3)).toBe(singleItemHeight);
  });

  test('inverts calculateExpandedHeight for 10 rows', () => {
    const singleItemHeight = 4;
    const expanded = calculateExpandedHeight(singleItemHeight, 10);
    expect(calculateSingleItemHeight(expanded, 10)).toBe(singleItemHeight);
  });

  test('returns at least 1 when total height is very small', () => {
    expect(calculateSingleItemHeight(1, 5)).toBe(1);
  });
});

describe('restoreRepeatItemLayout', () => {
  const repeatVariable: RepeatVariable = { value: 'env', alignment: 'horizontal', maxPer: 2 };
  const baseLayout: PanelGroupItemLayout = { i: 'panel-1', x: 0, y: 0, w: 12, h: 13 };

  test('restores single-item height from expanded height', () => {
    const meta = {
      itemRepeatVariable: repeatVariable,
      values: ['prod', 'staging', 'dev'],
      totalValues: 3,
      numberOfRows: 2,
    };
    expect(restoreRepeatItemLayout(baseLayout, meta).h).toBe(6);
  });

  test('re-attaches repeatVariable from meta', () => {
    const meta = { itemRepeatVariable: repeatVariable, values: ['prod'], totalValues: 1, numberOfRows: 1 };
    expect(restoreRepeatItemLayout(baseLayout, meta).repeatVariable).toBe(repeatVariable);
  });

  test('preserves other layout properties unchanged', () => {
    const meta = { itemRepeatVariable: repeatVariable, values: ['prod'], totalValues: 1, numberOfRows: 1 };
    const restored = restoreRepeatItemLayout(baseLayout, meta);
    expect(restored.i).toBe('panel-1');
    expect(restored.x).toBe(0);
    expect(restored.y).toBe(0);
    expect(restored.w).toBe(12);
  });

  test('round-trips with calculateExpandedHeight', () => {
    const singleItemHeight = 8;
    const numberOfRows = 3;
    const expandedHeight = calculateExpandedHeight(singleItemHeight, numberOfRows);
    const meta = { itemRepeatVariable: repeatVariable, values: ['a', 'b', 'c'], totalValues: 3, numberOfRows };
    const restored = restoreRepeatItemLayout({ ...baseLayout, h: expandedHeight }, meta);
    expect(restored.h).toBe(singleItemHeight);
  });
});

describe('restoreRepeatLayouts', () => {
  const repeatVariable: RepeatVariable = { value: 'env', alignment: 'horizontal', maxPer: 2 };
  const meta = new Map([
    [
      'repeat-panel',
      { itemRepeatVariable: repeatVariable, values: ['prod', 'staging', 'dev'], totalValues: 3, numberOfRows: 2 },
    ],
  ]);

  const expandedLayout = { i: 'repeat-panel', x: 0, y: 0, w: 12, h: 13 };
  const plainLayout = { i: 'plain-panel', x: 12, y: 0, w: 12, h: 4 };

  test('restores h for repeat items in currentLayout', () => {
    const { currentLayout } = restoreRepeatLayouts([expandedLayout, plainLayout], {}, meta);
    expect(currentLayout.find((l) => l.i === 'repeat-panel')?.h).toBe(6);
    expect(currentLayout.find((l) => l.i === 'plain-panel')?.h).toBe(4);
  });

  test('restores h for repeat items in allLayouts', () => {
    const { allLayouts } = restoreRepeatLayouts([], { sm: [expandedLayout, plainLayout] }, meta);
    expect(allLayouts['sm']?.find((l) => l.i === 'repeat-panel')?.h).toBe(6);
    expect(allLayouts['sm']?.find((l) => l.i === 'plain-panel')?.h).toBe(4);
  });

  test('restores all breakpoints in allLayouts', () => {
    const { allLayouts } = restoreRepeatLayouts([], { sm: [expandedLayout], xxs: [expandedLayout] }, meta);
    expect(allLayouts['sm']?.[0]?.h).toBe(6);
    expect(allLayouts['xxs']?.[0]?.h).toBe(6);
  });

  test('leaves allLayouts empty when no breakpoints provided', () => {
    const { allLayouts } = restoreRepeatLayouts([expandedLayout], {}, meta);
    expect(Object.keys(allLayouts)).toHaveLength(0);
  });
});

describe('buildRepeatMeta', () => {
  const variables: VariableStateMap = {
    env: makeVariableState(['prod', 'staging', 'dev']),
  };

  const baseLayout: PanelGroupItemLayout = { i: 'panel-1', x: 0, y: 0, w: 12, h: 6 };

  test('returns layout unchanged when no repeatVariable', () => {
    const { expandedItemLayouts, repeatMeta } = buildRepeatMeta([baseLayout], variables);
    expect(expandedItemLayouts).toEqual([baseLayout]);
    expect(repeatMeta.size).toBe(0);
  });

  test('expands height for horizontal repeat with multiple rows', () => {
    const layout: PanelGroupItemLayout = {
      ...baseLayout,
      repeatVariable: { value: 'env', alignment: 'horizontal', maxPer: 2 },
    };
    const { expandedItemLayouts, repeatMeta } = buildRepeatMeta([layout], variables);
    expect(expandedItemLayouts[0]?.h).toBe(13);
    expect(repeatMeta.get('panel-1')?.numberOfRows).toBe(2);
    expect(repeatMeta.get('panel-1')?.values).toEqual(['prod', 'staging', 'dev']);
  });

  test('does not expand height when all values fit in one row', () => {
    const layout: PanelGroupItemLayout = {
      ...baseLayout,
      repeatVariable: { value: 'env', alignment: 'horizontal' },
    };
    const { expandedItemLayouts, repeatMeta } = buildRepeatMeta([layout], variables);
    expect(expandedItemLayouts[0]?.h).toBe(6);
    expect(repeatMeta.get('panel-1')?.numberOfRows).toBe(1);
  });

  test('uses numberOfRows 1 and keeps original height when variable has no values', () => {
    const layout: PanelGroupItemLayout = {
      ...baseLayout,
      repeatVariable: { value: 'missing', alignment: 'horizontal' },
    };
    const { expandedItemLayouts, repeatMeta } = buildRepeatMeta([layout], variables);
    expect(expandedItemLayouts[0]?.h).toBe(6);
    expect(repeatMeta.get('panel-1')?.numberOfRows).toBe(1);
    expect(repeatMeta.get('panel-1')?.values).toEqual([]);
  });

  test('uses numberOfRows equal to value count for vertical alignment', () => {
    const layout: PanelGroupItemLayout = {
      ...baseLayout,
      repeatVariable: { value: 'env', alignment: 'vertical' },
    };
    const { expandedItemLayouts, repeatMeta } = buildRepeatMeta([layout], variables);
    expect(expandedItemLayouts[0]?.h).toBe(19);
    expect(repeatMeta.get('panel-1')?.numberOfRows).toBe(3);
  });

  test('handles mixed repeat and non-repeat layouts', () => {
    const repeatLayout: PanelGroupItemLayout = {
      i: 'repeat-panel',
      x: 0,
      y: 0,
      w: 12,
      h: 6,
      repeatVariable: { value: 'env', alignment: 'vertical' },
    };
    const plainLayout: PanelGroupItemLayout = { i: 'plain-panel', x: 12, y: 0, w: 12, h: 4 };
    const { expandedItemLayouts, repeatMeta } = buildRepeatMeta([repeatLayout, plainLayout], variables);
    expect(expandedItemLayouts[0]?.h).toBe(19);
    expect(expandedItemLayouts[1]?.h).toBe(4);
    expect(repeatMeta.size).toBe(1);
    expect(repeatMeta.has('repeat-panel')).toBe(true);
    expect(repeatMeta.has('plain-panel')).toBe(false);
  });

  test('sets totalValues to full count regardless of maxValues', () => {
    const layout: PanelGroupItemLayout = {
      ...baseLayout,
      repeatVariable: { value: 'env', alignment: 'horizontal' },
    };
    const { repeatMeta } = buildRepeatMeta([layout], variables, undefined, 2);
    expect(repeatMeta.get('panel-1')?.values).toEqual(['prod', 'staging']);
    expect(repeatMeta.get('panel-1')?.totalValues).toBe(3);
  });

  test('totalValues equals values length when no cap is applied', () => {
    const layout: PanelGroupItemLayout = {
      ...baseLayout,
      repeatVariable: { value: 'env', alignment: 'horizontal' },
    };
    const { repeatMeta } = buildRepeatMeta([layout], variables);
    expect(repeatMeta.get('panel-1')?.totalValues).toBe(3);
    expect(repeatMeta.get('panel-1')?.values).toHaveLength(3);
  });
});

describe('calcPerPanelWidth', () => {
  test('divides available width evenly across panels', () => {
    // 400px wide, 8px gap, 2 columns: (400 - 8) / 2 = 196
    expect(calcPerPanelWidth(400, 8, 2)).toBe(196);
  });

  test('floors fractional widths', () => {
    // 100px wide, 0px gap, 3 columns: floor(100 / 3) = 33
    expect(calcPerPanelWidth(100, 0, 3)).toBe(33);
  });

  test('returns at least 1 when container is narrower than gap space', () => {
    // 50px wide, 8px gap, 10 columns: 50 - 8*9 = -22 → clamped to 1
    expect(calcPerPanelWidth(50, 8, 10)).toBe(1);
  });

  test('returns at least 1 when width is zero', () => {
    expect(calcPerPanelWidth(0, 8, 4)).toBe(1);
  });

  test('handles a single column', () => {
    expect(calcPerPanelWidth(300, 8, 1)).toBe(300);
  });
});
