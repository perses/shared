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

import type { TimeSeriesData } from '@perses-dev/spec';

import { getCommonTimeScale } from './time-series-data';

describe('getCommonTimeScale', () => {
  const undefinedSeriesData: Array<{
    name: string;
    seriesData: Array<TimeSeriesData | undefined>;
  }> = [
    {
      name: 'when series data is empty',
      seriesData: [],
    },
    {
      name: 'when series is missing step',
      seriesData: [
        {
          timeRange: {
            start: new Date('Tue Mar 28 2023 16:47:00 GMT-0700 (Pacific Daylight Time)'),
            end: new Date('Tue Mar 28 2023 04:47:00 GMT-0700 (Pacific Daylight Time)'),
          },
          series: [],
        },
      ],
    },
    {
      name: 'when series is missing time range',
      seriesData: [
        {
          stepMs: 6000,
          series: [],
        },
      ],
    },
  ];

  test.each(undefinedSeriesData)('returns undefined $name', ({ seriesData }) => {
    expect(getCommonTimeScale(seriesData)).toBeUndefined();
  });

  test('uses the specified time scale when a single series is available', () => {
    const singleTimeSeries: TimeSeriesData = {
      timeRange: {
        start: new Date('Tue Mar 28 2023 16:47:00 GMT-0700 (Pacific Daylight Time)'),
        end: new Date('Tue Mar 28 2023 04:47:00 GMT-0700 (Pacific Daylight Time)'),
      },
      stepMs: 3600,
      series: [],
    };
    const seriesData: Array<TimeSeriesData | undefined> = [singleTimeSeries];
    const timeScale = getCommonTimeScale(seriesData);

    expect(timeScale).toEqual({
      startMs: singleTimeSeries.timeRange?.start.getTime(),
      endMs: singleTimeSeries.timeRange?.end.getTime(),
      rangeMs: -43200000,
      stepMs: singleTimeSeries.stepMs,
    });
  });

  test('uses the min/max dates when multiple ranges available', () => {
    const minTime = new Date('Tue Mar 21 2023 17:00:00 GMT-0700 (Pacific Daylight Time)');
    const maxTime = new Date('Tue Mar 28 2023 17:00:00 GMT-0700 (Pacific Daylight Time)');

    const seriesData: Array<TimeSeriesData | undefined> = [
      {
        timeRange: {
          start: minTime,
          end: new Date('Tue Mar 28 2023 04:47:00 GMT-0700 (Pacific Daylight Time)'),
        },
        stepMs: 3600,
        series: [],
      },
      {
        timeRange: {
          start: new Date('Tue Mar 28 2023 16:47:00 GMT-0700 (Pacific Daylight Time)'),
          end: new Date('Tue Mar 28 2023 17:00:00 GMT-0700 (Pacific Daylight Time)'),
        },
        stepMs: 3600,
        series: [],
      },
      {
        timeRange: {
          start: new Date('Tue Mar 28 2023 16:47:00 GMT-0700 (Pacific Daylight Time)'),
          end: maxTime,
        },
        stepMs: 3600,
        series: [],
      },
    ];
    const timeScale = getCommonTimeScale(seriesData);
    expect(timeScale).toEqual({
      startMs: minTime.getTime(),
      endMs: maxTime.getTime(),
      rangeMs: 604800000,
      stepMs: 3600,
    });
  });

  test('uses the greatest common denominator when multiple steps are available', () => {
    const timeRange = {
      start: new Date('Tue Mar 28 2023 16:47:00 GMT-0700 (Pacific Daylight Time)'),
      end: new Date('Tue Mar 28 2023 17:00:00 GMT-0700 (Pacific Daylight Time)'),
    };
    const steps = [2400, 3600, 18000];

    const seriesData: Array<TimeSeriesData | undefined> = [
      {
        timeRange: timeRange,
        stepMs: steps[0],
        series: [],
      },
      {
        timeRange: timeRange,
        stepMs: steps[1],
        series: [],
      },
      {
        timeRange: timeRange,
        stepMs: steps[2],
        series: [],
      },
    ];
    const timeScale = getCommonTimeScale(seriesData);
    expect(timeScale).toEqual({
      startMs: timeRange.start.getTime(),
      endMs: timeRange.end.getTime(),
      rangeMs: 780000,
      stepMs: 1200,
    });
  });

  test('does not mutate the input time ranges', () => {
    // Reproduces perses/perses#4594: one query already refreshed to the new (24h) range while another still holds
    // the previous (7d) range. The first query's time range (cached query result) must not be widened in place.
    const refreshedTimeRange = {
      start: new Date('2023-03-27T17:00:00Z'),
      end: new Date('2023-03-28T17:00:00Z'),
    };
    const staleTimeRange = {
      start: new Date('2023-03-21T17:00:00Z'),
      end: new Date('2023-03-28T16:00:00Z'),
    };
    const refreshedStartMs = refreshedTimeRange.start.getTime();
    const refreshedEndMs = refreshedTimeRange.end.getTime();
    const staleStartMs = staleTimeRange.start.getTime();
    const staleEndMs = staleTimeRange.end.getTime();

    const seriesData: Array<TimeSeriesData | undefined> = [
      { timeRange: refreshedTimeRange, stepMs: 3600, series: [] },
      { timeRange: staleTimeRange, stepMs: 3600, series: [] },
    ];

    expect(getCommonTimeScale(seriesData)).toEqual({
      startMs: staleStartMs,
      endMs: refreshedEndMs,
      rangeMs: refreshedEndMs - staleStartMs,
      stepMs: 3600,
    });

    expect(refreshedTimeRange.start.getTime()).toBe(refreshedStartMs);
    expect(refreshedTimeRange.end.getTime()).toBe(refreshedEndMs);
    expect(staleTimeRange.start.getTime()).toBe(staleStartMs);
    expect(staleTimeRange.end.getTime()).toBe(staleEndMs);

    // Once the stale query refreshes, the common time scale must reflect only the new range.
    expect(
      getCommonTimeScale([
        { timeRange: refreshedTimeRange, stepMs: 3600, series: [] },
        { timeRange: { ...refreshedTimeRange }, stepMs: 3600, series: [] },
      ]),
    ).toEqual({
      startMs: refreshedStartMs,
      endMs: refreshedEndMs,
      rangeMs: refreshedEndMs - refreshedStartMs,
      stepMs: 3600,
    });
  });
});
