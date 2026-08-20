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

import { TimeSeries, TimeSeriesValueTuple } from '@perses-dev/spec';
import { ECharts as EChartsInstance } from 'echarts/core';

import { DatapointInfo } from '../model';
import {
  batchDispatchNearbySeriesActions,
  getClosestTimestamp,
  getClosestTimestampInFullDataset,
} from './chart-actions';

const TEST_TIME_SERIES_VALUES: TimeSeriesValueTuple[] = [
  [1690381125000, 0.12],
  [1690381140000, 0.12],
  [1690381155000, 0.13],
  [1690381170000, 0.13],
  [1690381185000, 0.14],
  [1690381200000, 0.14],
  [1690381215000, 0.16],
  [1690381230000, 0.16],
  [1690381245000, 0.16],
  [1690381260000, 0.16],
  [1690381275000, 0.16],
  [1690381290000, 0.15],
  [1690381305000, 0.15],
  [1690381320000, 0.16],
  [1690381335000, 0.17],
  [1690381350000, 0.17],
  [1690381365000, 0.17],
  [1690381380000, 0.16],
  [1690381395000, 0.16],
  [1690381410000, 0.16],
  [1690381425000, 0.15],
];

const TEST_TIME_SERIES_DATA: TimeSeries[] = [
  {
    name: 'node_network_transmit_queue_length{device="eth0",env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
    values: [
      [1690386135000, 1000],
      [1690386150000, 1000],
      [1690386165000, 1000],
      [1690386180000, 1000],
      [1690386195000, 1000],
      [1690386210000, 1000],
      [1690386225000, 1000],
      [1690386240000, 1000],
      [1690386255000, 1000],
      [1690386270000, 1000],
      [1690386285000, 1000],
      [1690386300000, 1000],
      [1690386315000, 1000],
      [1690386330000, 1000],
      [1690386345000, 1000],
      [1690386360000, 1000],
      [1690386375000, 1000],
      [1690386390000, 1000],
      [1690386405000, 1000],
      [1690386420000, 1000],
      [1690386435000, 1000],
    ],
  },
  {
    name: 'node_network_transmit_queue_length{device="lo",env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
    values: [
      [1690386135000, 1000],
      [1690386150000, 1000],
      [1690386165000, 1000],
      [1690386180000, 1000],
      [1690386195000, 1000],
      [1690386210000, 1000],
      [1690386225000, 1000],
      [1690386240000, 1000],
      [1690386255000, 1000],
      [1690386270000, 1000],
      [1690386285000, 1000],
      [1690386300000, 1000],
      [1690386315000, 1000],
      [1690386330000, 1000],
      [1690386345000, 1000],
      [1690386360000, 1000],
      [1690386375000, 1000],
      [1690386390000, 1000],
      [1690386405000, 1000],
      [1690386420000, 1000],
      [1690386435000, 1000],
    ],
  },
  {
    name: 'Threshold 1',
    values: [
      [1690386135000, 300],
      [1690386150000, 300],
      [1690386165000, 300],
      [1690386180000, 300],
      [1690386195000, 300],
      [1690386210000, 300],
      [1690386225000, 300],
      [1690386240000, 300],
      [1690386255000, 300],
      [1690386270000, 300],
      [1690386285000, 300],
      [1690386300000, 300],
      [1690386315000, 300],
      [1690386330000, 300],
      [1690386345000, 300],
      [1690386360000, 300],
      [1690386375000, 300],
      [1690386390000, 300],
      [1690386405000, 300],
      [1690386420000, 300],
      [1690386435000, 300],
    ],
  },
];

describe('getClosestTimestamp', () => {
  it('should determine closest timestamp to current cursor xValue in single dataset source', () => {
    expect(getClosestTimestamp(TEST_TIME_SERIES_VALUES, 1690381320276.3362)).toEqual(1690381320000);
  });

  it('should return null when no time series values', () => {
    expect(getClosestTimestamp([], 1690381320276.3362)).toEqual(null);
  });

  it('should return null when undefined cursorX param', () => {
    expect(getClosestTimestamp(TEST_TIME_SERIES_VALUES)).toEqual(null);
  });
});

describe('getClosestTimestampInFullDataset', () => {
  it('should determine closest timestamp to current cursor xValue in full time series data', () => {
    expect(getClosestTimestampInFullDataset(TEST_TIME_SERIES_DATA, 1690386199722.634)).toEqual(1690386195000);
  });
});

describe('batchDispatchNearbySeriesActions', () => {
  function makeChartMock(): { chart: EChartsInstance; calls: Array<{ type: string; payload: unknown }> } {
    const calls: Array<{ type: string; payload: unknown }> = [];
    const chart = {
      dispatchAction: (payload: { type: string; [k: string]: unknown }) => {
        calls.push({ type: payload.type, payload: JSON.parse(JSON.stringify(payload)) });
      },
    } as unknown as EChartsInstance;
    return { chart, calls };
  }

  it('dispatches a blanket downplay to clear ECharts axis-triggered emphasis before highlighting the winner', () => {
    const { chart, calls } = makeChartMock();
    const winnerDatapoint: DatapointInfo = { seriesIndex: 3, dataIndex: 5, seriesName: 's3', yValue: 42 };

    batchDispatchNearbySeriesActions(chart, [1, 2, 3, 4], [3], [1, 2, 4], [winnerDatapoint], []);

    const blanketDownplayIdx = calls.findIndex(
      (c) => c.type === 'downplay' && (c.payload as { seriesIndex?: unknown }).seriesIndex === undefined,
    );
    const targetedDownplayIdx = calls.findIndex(
      (c) => c.type === 'downplay' && Array.isArray((c.payload as { seriesIndex?: unknown }).seriesIndex),
    );
    const highlightIdx = calls.findIndex((c) => c.type === 'highlight');

    expect(blanketDownplayIdx).toBeGreaterThanOrEqual(0);
    expect(targetedDownplayIdx).toBeGreaterThan(blanketDownplayIdx);
    expect(highlightIdx).toBeGreaterThan(targetedDownplayIdx);
    expect((calls[highlightIdx]!.payload as { seriesIndex: number[] }).seriesIndex).toEqual([3]);
  });

  it('dispatches a select action on the winning datapoint', () => {
    const { chart, calls } = makeChartMock();
    const winnerDatapoint: DatapointInfo = { seriesIndex: 7, dataIndex: 11, seriesName: 's7', yValue: 1.5 };

    batchDispatchNearbySeriesActions(chart, [7], [7], [], [winnerDatapoint], []);

    const selectCall = calls.find((c) => c.type === 'select');
    expect(selectCall).toBeDefined();
    expect((selectCall!.payload as { seriesIndex: number; dataIndex: number }).seriesIndex).toBe(7);
    expect((selectCall!.payload as { seriesIndex: number; dataIndex: number }).dataIndex).toBe(11);
  });

  it('uses the last duplicate datapoint for select when duplicates exist (avoids color mismatch)', () => {
    const { chart, calls } = makeChartMock();
    const winner: DatapointInfo = { seriesIndex: 1, dataIndex: 0, seriesName: 's1', yValue: 100 };
    const duplicate: DatapointInfo = { seriesIndex: 2, dataIndex: 0, seriesName: 's2', yValue: 100 };

    batchDispatchNearbySeriesActions(chart, [1, 2], [1, 2], [], [winner, duplicate], [duplicate]);

    const selectCall = calls.find((c) => c.type === 'select');
    expect((selectCall!.payload as { seriesIndex: number }).seriesIndex).toBe(2);
  });

  it('falls back to highlighting all nearby series when no emphasized winner exists', () => {
    const { chart, calls } = makeChartMock();

    batchDispatchNearbySeriesActions(chart, [1, 2, 3], [], [1, 2, 3], [], []);

    const highlight = calls.find((c) => c.type === 'highlight');
    expect(highlight).toBeDefined();
    expect((highlight!.payload as { seriesIndex: number[]; notBlur: boolean }).seriesIndex).toEqual([1, 2, 3]);
    expect((highlight!.payload as { seriesIndex: number[]; notBlur: boolean }).notBlur).toBe(true);
    expect(calls.some((c) => c.type === 'toggleSelect')).toBe(true);
  });
});
