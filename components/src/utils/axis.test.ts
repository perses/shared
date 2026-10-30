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

import { getFormattedMultipleYAxes, getFormattedMultipleYAxesLayout } from './axis';

beforeAll(() => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: () => null,
  });
});

describe('getFormattedMultipleYAxesLayout', () => {
  it('returns only the left axis when there are no additional formats', () => {
    const { axes, rightGridPadding } = getFormattedMultipleYAxesLayout({ show: true, min: 0 }, { unit: 'decimal' }, []);
    expect(axes).toHaveLength(1);
    expect(axes[0]?.position).toBe('left');
    expect(rightGridPadding).toBe(20);
  });

  it('leaves a single right axis to containLabel', () => {
    const { axes, rightGridPadding } = getFormattedMultipleYAxesLayout({ show: true }, { unit: 'percent' }, [
      { unit: 'bytes' },
    ]);
    expect(axes).toHaveLength(2);
    expect(axes[1]?.offset).toBe(0);
    expect(rightGridPadding).toBe(20);
  });

  it('reserves grid.right only for right axes after the first', () => {
    const opsPerSec = { unit: 'ops/sec' as const };
    const decimal = { unit: 'decimal' as const };
    const formats = [opsPerSec, decimal];
    const firstMax = 100;
    const secondMax = 1000;
    const { axes, rightGridPadding } = getFormattedMultipleYAxesLayout({ show: true }, { unit: 'percent' }, formats, [
      firstMax,
      secondMax,
    ]);
    const secondAxisWidth = getFormattedMultipleYAxesLayout(
      { show: true },
      { unit: 'percent' },
      [decimal, opsPerSec],
      [secondMax, firstMax],
    ).axes[2]?.offset;

    expect(axes).toHaveLength(3);
    expect(axes[0]?.position).toBe('left');
    expect(axes[1]?.position).toBe('right');
    expect(axes[1]?.offset).toBe(0);
    expect(axes[2]?.position).toBe('right');
    expect((axes[2]?.offset as number) ?? 0).toBeGreaterThan(0);
    expect(rightGridPadding).toBe(secondAxisWidth);
    expect(rightGridPadding).toBeLessThan(((axes[2]?.offset as number) ?? 0) + (secondAxisWidth as number));
  });

  it('still reserves only the outer axis when maxValues is omitted', () => {
    const opsPerSec = { unit: 'ops/sec' as const };
    const eventsPerSec = { unit: 'events/sec' as const };
    const formats = [opsPerSec, eventsPerSec];
    const { axes, rightGridPadding } = getFormattedMultipleYAxesLayout(undefined, { unit: 'decimal' }, formats);
    const secondAxisWidth = getFormattedMultipleYAxesLayout(undefined, { unit: 'decimal' }, [eventsPerSec, opsPerSec])
      .axes[2]?.offset;
    expect(axes).toHaveLength(3);
    expect(rightGridPadding).toBe(secondAxisWidth);
    expect(rightGridPadding).toBeGreaterThan(20);
  });
});

describe('getFormattedMultipleYAxes', () => {
  it('returns the axes array from the layout helper', () => {
    const axes = getFormattedMultipleYAxes({ show: true }, { unit: 'decimal' }, [{ unit: 'ops/sec' }], [50]);
    expect(axes).toHaveLength(2);
    expect(axes[1]?.position).toBe('right');
  });
});
