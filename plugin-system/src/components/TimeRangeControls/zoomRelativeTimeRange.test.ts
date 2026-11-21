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

import type { TimeOption } from '@perses-dev/components';
import { getNeighbourRelativeTimeRange } from './zoomRelativeTimeRange';

const presets: TimeOption[] = ['5m', '1h', '6h', '1d'].map((d) => ({
  value: { pastDuration: d as never },
  display: d,
}));

describe('getNeighbourRelativeTimeRange', () => {
  it('returns the next larger preset when zooming out', () => {
    expect(getNeighbourRelativeTimeRange({ pastDuration: '1h' }, presets, 'out')).toEqual({ pastDuration: '6h' });
  });

  it('returns the next smaller preset when zooming in', () => {
    expect(getNeighbourRelativeTimeRange({ pastDuration: '1h' }, presets, 'in')).toEqual({ pastDuration: '5m' });
  });

  it('picks the closest preset for a duration that is not a preset', () => {
    expect(getNeighbourRelativeTimeRange({ pastDuration: '2h' }, presets, 'out')).toEqual({ pastDuration: '6h' });
    expect(getNeighbourRelativeTimeRange({ pastDuration: '2h' }, presets, 'in')).toEqual({ pastDuration: '1h' });
  });

  it('returns undefined when there is no preset in that direction', () => {
    expect(getNeighbourRelativeTimeRange({ pastDuration: '1d' }, presets, 'out')).toBeUndefined();
    expect(getNeighbourRelativeTimeRange({ pastDuration: '5m' }, presets, 'in')).toBeUndefined();
  });

  it('returns undefined for absolute ranges and relative ranges with an end', () => {
    expect(getNeighbourRelativeTimeRange({ start: new Date(0), end: new Date(1000) }, presets, 'out')).toBeUndefined();
    expect(getNeighbourRelativeTimeRange({ pastDuration: '1h', end: new Date(1000) }, presets, 'out')).toBeUndefined();
  });
});
