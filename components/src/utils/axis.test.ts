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

import { getFormattedMultipleYAxes } from './axis';

describe('getFormattedMultipleYAxes', () => {
  it('applies the base axis log scale to the right-side axes', () => {
    const axes = getFormattedMultipleYAxes({ type: 'log', logBase: 2 }, { unit: 'bytes' }, [
      { unit: 'seconds' },
      { unit: 'percent' },
    ]);

    expect(axes).toHaveLength(3);
    axes.forEach((axis) => {
      expect(axis).toMatchObject({ type: 'log', logBase: 2 });
    });
  });

  it('keeps the right-side axes linear when the base axis is linear', () => {
    const axes = getFormattedMultipleYAxes({ show: true }, { unit: 'bytes' }, [{ unit: 'seconds' }]);

    expect(axes[1]).toMatchObject({ type: 'value', position: 'right' });
    expect(axes[1]).not.toHaveProperty('logBase');
  });
});
