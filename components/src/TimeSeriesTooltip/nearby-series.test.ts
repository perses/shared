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

import { TimeSeries } from '@perses-dev/spec';
import { ECharts as EChartsInstance } from 'echarts/core';

import { EChartsDataFormat, FormatOptions, TimeChartSeriesMapping } from '../model';
import {
  checkforNearbyTimeSeries,
  legacyCheckforNearbySeries,
  getYBuffer,
  isWithinPercentageRange,
} from './nearby-series';
import { calculateVisualYForSeries } from './utils';

describe('legacyCheckforNearbySeries', () => {
  const chartData: EChartsDataFormat = {
    timeSeries: [
      {
        type: 'line',
        name: 'env="demo", instance="demo.do.prometheus", job="node", mode="test"',
        color: 'hsla(-1365438424,50%,50%,0.8)',
        data: [
          0.0002315202231525094, 0.00022873082287300112, 0.00023152022315149463, 0.00023152022315149463,
          0.00022873082287300112,
        ],
        symbol: 'circle',
      },
      {
        type: 'line',
        name: 'env="demo", instance="demo.do.prometheus", job="node", mode="test alt"',
        color: 'hsla(286664040,50%,50%,0.8)',
        data: [0.05245188284519867, 0.0524463040446356, 0.0524463040446356, 0.05247140864723438, 0.052482566248230646],
        symbol: 'circle',
      },
    ],
    xAxis: [1654007865000, 1654007880000, 1654007895000, 1654007910000, 1654007925000],
    rangeMs: 60000,
  };

  // https://echarts.apache.org/en/api.html#echartsInstance.convertFromPixel
  const pointInGrid = [2, 0.0560655737704918]; // converted from chart.getZr() mousemove coordinates

  const yBuffer = 0.02; // calculated from y axis interval

  const nearbySeriesOutput = [
    {
      date: 1654007895000,
      datumIdx: 2,
      isClosestToCursor: true,
      markerColor: 'hsla(286664040,50%,50%,0.8)',
      seriesName: 'env="demo", instance="demo.do.prometheus", job="node", mode="test alt"',
      seriesIdx: 1,
      x: 1654007895000,
      y: 0.0524463040446356,
      formattedY: '0.05',
    },
  ];

  it('should return nearby series data for points nearby the cursor', () => {
    const decimalUnit: FormatOptions = {
      unit: 'decimal',
      decimalPlaces: 2,
    };
    expect(legacyCheckforNearbySeries(chartData, pointInGrid, yBuffer, undefined, decimalUnit)).toEqual(
      nearbySeriesOutput,
    );
  });

  it('should return series values formatted as a percent', () => {
    const percentFormattedOutput = [...nearbySeriesOutput];
    if (percentFormattedOutput[0]) {
      percentFormattedOutput[0].formattedY = '5%';
    }
    const percentFormattedUnit: FormatOptions = {
      unit: 'percent-decimal',
      decimalPlaces: 0,
    };
    expect(legacyCheckforNearbySeries(chartData, pointInGrid, yBuffer, undefined, percentFormattedUnit)).toEqual(
      percentFormattedOutput,
    );
  });
});

describe('getYBuffer', () => {
  it('should return area to search for nearby series', () => {
    expect(getYBuffer({ yInterval: 1, totalSeries: 10, showAllSeries: false })).toBe(3);
  });

  it('should return entire canvas', () => {
    expect(getYBuffer({ yInterval: 1, totalSeries: 10, showAllSeries: true })).toBe(10);
  });

  it('should reduce area to search when many series', () => {
    expect(getYBuffer({ yInterval: 1, totalSeries: 1000, showAllSeries: false })).toBe(0.3);
  });

  it('should return area to search for larger interval', () => {
    expect(getYBuffer({ yInterval: 10, totalSeries: 10, showAllSeries: false })).toBe(30);
  });

  it('should return entire canvas for larger interval', () => {
    expect(getYBuffer({ yInterval: 10, totalSeries: 10, showAllSeries: true })).toBe(100);
  });

  it('should reduce area to search for larger interval when many series', () => {
    expect(getYBuffer({ yInterval: 10, totalSeries: 1000, showAllSeries: false })).toBe(3);
  });
});

describe('isWithinPercentageRange', () => {
  it('should return true when input value is within the specified percentage range of yValue', () => {
    const yValue = 261353472;
    const result = isWithinPercentageRange({ valueToCheck: 256250000, baseValue: yValue, percentage: 5 });
    expect(result).toBe(true);
  });

  it('returns false when nearbyY is outside the specified percentage range of yValue', () => {
    const yValue = 100;
    const result = isWithinPercentageRange({ valueToCheck: 200, baseValue: yValue, percentage: 5 });
    expect(result).toBe(false);
  });
});

describe('calculateVisualYForSeries', () => {
  it('returns the raw yValue for non-stacked series and does not touch the totals map', () => {
    const seriesMapping = [{ type: 'line', name: 'a' }] as unknown as TimeChartSeriesMapping;
    const totals = new Map<string, number>();

    const result = calculateVisualYForSeries(0, 42, seriesMapping, totals);

    expect(result).toBe(42);
    expect(totals.size).toBe(0);
  });

  it('accumulates stacked totals per stack id across sequential calls', () => {
    const seriesMapping = [
      { type: 'line', name: 'a', stack: 'total' },
      { type: 'line', name: 'b', stack: 'total' },
      { type: 'line', name: 'c', stack: 'total' },
    ] as unknown as TimeChartSeriesMapping;

    const totals = new Map<string, number>();

    expect(calculateVisualYForSeries(0, 10, seriesMapping, totals)).toBe(10);
    expect(calculateVisualYForSeries(1, 20, seriesMapping, totals)).toBe(30);
    expect(calculateVisualYForSeries(2, 5, seriesMapping, totals)).toBe(35);
    expect(totals.get('total')).toBe(35);
  });

  it('keeps totals separate across different stack ids', () => {
    const seriesMapping = [
      { type: 'line', name: 'a', stack: 'left' },
      { type: 'line', name: 'b', stack: 'right' },
      { type: 'line', name: 'c', stack: 'left' },
    ] as unknown as TimeChartSeriesMapping;

    const totals = new Map<string, number>();

    expect(calculateVisualYForSeries(0, 100, seriesMapping, totals)).toBe(100);
    expect(calculateVisualYForSeries(1, 50, seriesMapping, totals)).toBe(50);
    expect(calculateVisualYForSeries(2, 25, seriesMapping, totals)).toBe(125);
    expect(totals.get('left')).toBe(125);
    expect(totals.get('right')).toBe(50);
  });
});

describe('checkforNearbyTimeSeries — stacked lines', () => {
  const TIMESTAMP = 1_700_000_000_000;

  function buildStackedFixture(): {
    data: TimeSeries[];
    seriesMapping: TimeChartSeriesMapping;
  } {
    const data: TimeSeries[] = [
      { name: 'series-a', values: [[TIMESTAMP, 10]] },
      { name: 'series-b', values: [[TIMESTAMP, 20]] },
    ];
    const seriesMapping = [
      { type: 'line', name: 'series-a', color: '#111', stack: 'group', id: 'a' },
      { type: 'line', name: 'series-b', color: '#222', stack: 'group', id: 'b' },
    ] as unknown as TimeChartSeriesMapping;
    return { data, seriesMapping };
  }

  function buildChartMock(): {
    chart: EChartsInstance;
    dispatched: Array<{ type: string; seriesIndex?: number | number[]; dataIndex?: number }>;
  } {
    const dispatched: Array<{ type: string; seriesIndex?: number | number[]; dataIndex?: number }> = [];
    const chart = {
      dispatchAction: (action: { type: string; seriesIndex?: number | number[]; dataIndex?: number }): void => {
        dispatched.push(action);
      },
      // Simple identity-style mock: return the value passed in as pixel Y.
      convertToPixel: (_finder: unknown, value: number[]): number[] => [value[0] ?? 0, value[1] ?? 0],
      getDom: (): null => null,
    } as unknown as EChartsInstance;
    return { chart, dispatched };
  }

  it('emphasizes the visually-hovered stacked series (top of stack), not the one with the matching raw value', () => {
    const { data, seriesMapping } = buildStackedFixture();
    const { chart, dispatched } = buildChartMock();

    const yBuffer = 5;
    const result = checkforNearbyTimeSeries(data, seriesMapping, [TIMESTAMP, 30], yBuffer, chart);

    const winner = result.find((series) => series.isClosestToCursor);
    expect(winner).toBeDefined();
    expect(winner?.seriesName).toBe('series-b');
    // y should be the raw per-series value (20), not the accumulated visual Y (30)
    expect(winner?.y).toBe(20);

    const seriesA = result.find((series) => series.seriesName === 'series-a');
    expect(seriesA).toBeUndefined();

    // Non-candidate series (a) must be explicitly downplayed to clear stale emphasis.
    const downplays = dispatched.filter((action) => action.type === 'downplay');
    const downplayedSeriesIdxs = new Set<number>();
    for (const action of downplays) {
      if (Array.isArray(action.seriesIndex)) {
        for (const idx of action.seriesIndex) downplayedSeriesIdxs.add(idx);
      } else if (typeof action.seriesIndex === 'number') {
        downplayedSeriesIdxs.add(action.seriesIndex);
      }
    }
    expect(downplayedSeriesIdxs.has(0)).toBe(true);
  });

  it('emphasizes series-a when the cursor is near its visual position (bottom of stack)', () => {
    const { data, seriesMapping } = buildStackedFixture();
    const { chart } = buildChartMock();

    const result = checkforNearbyTimeSeries(data, seriesMapping, [TIMESTAMP, 10], 5, chart);
    const winner = result.find((series) => series.isClosestToCursor);
    expect(winner?.seriesName).toBe('series-a');
  });

  it('downplays previously-hovered non-candidate series (fix for persistent emphasis)', () => {
    const data: TimeSeries[] = [
      { name: 'a', values: [[TIMESTAMP, 1]] },
      { name: 'b', values: [[TIMESTAMP, 2]] },
      { name: 'c', values: [[TIMESTAMP, 3]] },
    ];
    const seriesMapping = [
      { type: 'line', name: 'a', color: '#111', id: 'a' },
      { type: 'line', name: 'b', color: '#222', id: 'b' },
      { type: 'line', name: 'c', color: '#333', id: 'c' },
    ] as unknown as TimeChartSeriesMapping;

    const { chart, dispatched } = buildChartMock();

    const result = checkforNearbyTimeSeries(data, seriesMapping, [TIMESTAMP, 1000], 0.5, chart);

    expect(result).toEqual([]);

    const downplayed = new Set<number>();
    for (const action of dispatched) {
      if (action.type !== 'downplay') continue;
      if (Array.isArray(action.seriesIndex)) {
        for (const idx of action.seriesIndex) downplayed.add(idx);
      } else if (typeof action.seriesIndex === 'number') {
        downplayed.add(action.seriesIndex);
      }
    }
    expect(downplayed.has(0)).toBe(true);
    expect(downplayed.has(1)).toBe(true);
    expect(downplayed.has(2)).toBe(true);
  });
});
