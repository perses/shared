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

  it('stacks right axes with increasing offset and grows rightGridPadding', () => {
    const formats = [{ unit: 'ops/sec' as const }, { unit: 'decimal' as const }];
    const { axes, rightGridPadding } = getFormattedMultipleYAxesLayout(
      { show: true },
      { unit: 'percent' },
      formats,
      [100, 1000],
    );

    expect(axes).toHaveLength(3);
    expect(axes[0]?.position).toBe('left');
    expect(axes[1]?.position).toBe('right');
    expect(axes[1]?.offset).toBe(0);
    expect(axes[2]?.position).toBe('right');
    expect((axes[2]?.offset as number) ?? 0).toBeGreaterThan(0);
    expect(rightGridPadding).toBeGreaterThan((axes[2]?.offset as number) ?? 0);
    expect(rightGridPadding).toBeGreaterThanOrEqual(40);
  });

  it('still accumulates padding when maxValues is omitted', () => {
    const { axes, rightGridPadding } = getFormattedMultipleYAxesLayout(undefined, { unit: 'decimal' }, [
      { unit: 'ops/sec' },
      { unit: 'events/sec' },
    ]);
    expect(axes).toHaveLength(3);
    expect(rightGridPadding).toBeGreaterThan(40);
  });
});

describe('getFormattedMultipleYAxes', () => {
  it('returns the axes array from the layout helper', () => {
    const axes = getFormattedMultipleYAxes({ show: true }, { unit: 'decimal' }, [{ unit: 'ops/sec' }], [50]);
    expect(axes).toHaveLength(2);
    expect(axes[1]?.position).toBe('right');
  });
});
