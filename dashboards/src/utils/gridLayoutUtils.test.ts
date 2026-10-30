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

import type { PanelGroupItemLayout } from '../model';
import { compactLayout, decodeGridItemId, encodeGridItemId } from './gridLayoutUtils';

describe('compactLayout', () => {
  it('pushes items below an item that grew taller', () => {
    const repeated: PanelGroupItemLayout = {
      i: 'a',
      x: 0,
      y: 0,
      w: 12,
      h: 9,
      repeatVariable: { value: 'instance' },
    };
    const below: PanelGroupItemLayout = { i: 'b', x: 0, y: 4, w: 12, h: 3 };
    const beside: PanelGroupItemLayout = { i: 'c', x: 12, y: 4, w: 12, h: 3 };

    const result = compactLayout([repeated, below, beside]);

    expect(result[0]).toBe(repeated);
    expect(result[1]).toEqual({ ...below, y: 9 });
    expect(result[2]).toEqual({ ...beside, y: 0 });
  });

  it('does not mutate frozen items when a pushed item pushes the next one', () => {
    const repeated: PanelGroupItemLayout = { i: 'a', x: 0, y: 0, w: 24, h: 16 };
    const below = Object.freeze<PanelGroupItemLayout>({ i: 'b', x: 0, y: 8, w: 12, h: 8 });
    const belowBelow = Object.freeze<PanelGroupItemLayout>({ i: 'c', x: 0, y: 16, w: 12, h: 8 });

    const result = compactLayout([repeated, below, belowBelow]);

    expect(result[1]).toEqual({ ...below, y: 16 });
    expect(result[2]).toEqual({ ...belowBelow, y: 24 });
  });

  it('removes vertical gaps and keeps horizontal positions', () => {
    const layout: PanelGroupItemLayout[] = [
      { i: 'a', x: 6, y: 5, w: 6, h: 2 },
      { i: 'b', x: 0, y: 10, w: 6, h: 2 },
    ];

    expect(compactLayout(layout)).toEqual([
      { i: 'a', x: 6, y: 0, w: 6, h: 2 },
      { i: 'b', x: 0, y: 0, w: 6, h: 2 },
    ]);
  });

  it('returns the same item references when nothing moves', () => {
    const layout: PanelGroupItemLayout[] = [
      { i: 'a', x: 0, y: 0, w: 12, h: 2 },
      { i: 'b', x: 0, y: 2, w: 12, h: 2 },
    ];

    const result = compactLayout(layout);

    expect(result[0]).toBe(layout[0]);
    expect(result[1]).toBe(layout[1]);
  });
});

describe('grid item ids', () => {
  it('round-trips ids containing the separator and encoded characters', () => {
    const id = 'panel|with%weird chars';
    expect(decodeGridItemId(encodeGridItemId(id))).toBe(id);
    expect(decodeGridItemId(encodeGridItemId(id, ['instance', 'host|1']))).toBe(id);
  });

  it('produces distinct tile ids per repeat value', () => {
    expect(encodeGridItemId('a', ['instance', '1'])).not.toBe(encodeGridItemId('a', ['instance', '2']));
    expect(encodeGridItemId('a')).not.toBe(encodeGridItemId('a', ['instance', '1']));
  });
});
