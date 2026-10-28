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

import type { DurationString, TimeRangeValue } from '@perses-dev/spec';
import { render, screen } from '@testing-library/react';

import type { TimeOption } from '../model';
import { TimeRangeSelector } from './TimeRangeSelector';

const TIME_OPTIONS: TimeOption[] = [
  { value: { pastDuration: '5m' as DurationString }, display: 'Last 5 minutes' },
  { value: { pastDuration: '1h' as DurationString }, display: 'Last 1 hour' },
];

function renderTimeRangeSelector(value: TimeRangeValue): void {
  render(<TimeRangeSelector value={value} timeOptions={TIME_OPTIONS} onChange={vi.fn()} timeZone="UTC" />);
}

describe('TimeRangeSelector', () => {
  it('should name the combobox after the selected time option', () => {
    renderTimeRangeSelector({ pastDuration: '1h' as DurationString });
    expect(
      screen.getByRole('combobox', { name: 'Select time range. Currently set to Last 1 hour' }),
    ).toBeInTheDocument();
  });

  it('should name the combobox after the absolute time range', () => {
    renderTimeRangeSelector({
      start: new Date('2026-03-09T09:00:00Z'),
      end: new Date('2026-03-09T10:00:00Z'),
    });
    expect(
      screen.getByRole('combobox', {
        name: 'Select time range. Currently set to 2026-03-09 09:00:00 - 2026-03-09 10:00:00',
      }),
    ).toBeInTheDocument();
  });
});
