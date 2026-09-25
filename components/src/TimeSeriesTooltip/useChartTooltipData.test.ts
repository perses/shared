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

import type { TimeSeries } from '@perses-dev/spec';
import { act, cleanup, fireEvent, renderHook } from '@testing-library/react';
import type { ECharts as EChartsInstance } from 'echarts/core';

import type { TimeChartSeriesMapping } from '../model';
import { getNearbySeriesData } from './nearby-series';
import type { CursorCoordinates } from './tooltip-model';
import type { NearbySeriesArray } from './types';
import { useChartTooltipData } from './useChartTooltipData';

vi.mock('./nearby-series', () => ({ getNearbySeriesData: vi.fn() }));

const series: NearbySeriesArray = [
  {
    seriesIdx: 0,
    datumIdx: 0,
    seriesName: 'requests',
    date: 100,
    x: 100,
    y: 5,
    formattedY: '5',
    markerColor: 'red',
    isClosestToCursor: true,
  },
];
const data: TimeSeries[] = [];
const seriesMapping: TimeChartSeriesMapping = [];
const frames = new Map<number, FrameRequestCallback>();
let frameId = 0;

function createChart(): { chartRef: { current: EChartsInstance }; canvas: HTMLCanvasElement } {
  const element = document.createElement('div');
  const canvas = document.createElement('canvas');
  element.appendChild(canvas);
  document.body.appendChild(element);
  return { chartRef: { current: { getDom: () => element } as unknown as EChartsInstance }, canvas };
}

function flushFrame(): void {
  act(() => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback(0));
  });
}

beforeEach(() => {
  vi.mocked(getNearbySeriesData)
    .mockReset()
    .mockImplementation(() => series.map((item) => ({ ...item })));
  frames.clear();
  frameId = 0;
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      frames.set(++frameId, callback);
      return frameId;
    }),
  );
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn((id: number) => {
      frames.delete(id);
    }),
  );
});

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

it('coalesces pointer events and only computes data for the hovered chart', () => {
  const first = createChart();
  const second = createChart();
  const active = renderHook(() => useChartTooltipData({ ...first, data, seriesMapping, pinnedPos: null }));
  const inactive = renderHook(() => useChartTooltipData({ ...second, data, seriesMapping, pinnedPos: null }));

  fireEvent.mouseMove(first.canvas, { clientX: 10, clientY: 20 });
  fireEvent.mouseMove(first.canvas, { clientX: 11, clientY: 21 });
  fireEvent.mouseMove(first.canvas, { clientX: 12, clientY: 22 });
  expect(getNearbySeriesData).not.toHaveBeenCalled();
  expect(frames.size).toBe(1);
  flushFrame();

  expect(getNearbySeriesData).toHaveBeenCalledTimes(1);
  expect(active.result.current.mousePos?.client).toEqual({ x: 12, y: 22 });
  expect(active.result.current.nearbySeries).toEqual(series);
  expect(inactive.result.current.mousePos).toBeNull();

  const previousSeries = active.result.current.nearbySeries;
  fireEvent.mouseMove(first.canvas, { clientX: 13, clientY: 23 });
  flushFrame();
  expect(active.result.current.mousePos?.client.x).toBe(13);
  expect(active.result.current.nearbySeries).toBe(previousSeries);
});

it('hides the old tooltip when moving to another chart and ignores subsequent outside movement', () => {
  const first = createChart();
  const second = createChart();
  const { result } = renderHook(() => useChartTooltipData({ ...first, data, seriesMapping, pinnedPos: null }));
  fireEvent.mouseMove(first.canvas);
  flushFrame();
  fireEvent.mouseMove(second.canvas);
  flushFrame();
  expect(result.current.mousePos).toBeNull();
  expect(result.current.nearbySeries).toEqual([]);
  expect(getNearbySeriesData).toHaveBeenCalledTimes(1);

  fireEvent.mouseMove(document.body);
  fireEvent.mouseMove(second.canvas);
  expect(frames.size).toBe(0);
});

it('keeps pinned content stable on pointer movement and hides it on unpin outside the chart', () => {
  const chart = createChart();
  const pinnedPos: CursorCoordinates = {
    page: { x: 10, y: 20 },
    client: { x: 10, y: 20 },
    plotCanvas: { x: 10, y: 20 },
    target: chart.canvas,
  };
  const { result, rerender } = renderHook(
    ({ pinned }: { pinned: CursorCoordinates | null }) =>
      useChartTooltipData({
        ...chart,
        data,
        seriesMapping,
        pinnedPos: pinned,
      }),
    { initialProps: { pinned: pinnedPos as CursorCoordinates | null } },
  );
  const pinnedData = result.current;
  expect(getNearbySeriesData).toHaveBeenCalledTimes(1);
  fireEvent.mouseMove(chart.canvas, { clientX: 50 });
  fireEvent.mouseMove(document.body);
  flushFrame();
  expect(result.current).toBe(pinnedData);
  expect(getNearbySeriesData).toHaveBeenCalledTimes(1);

  rerender({ pinned: null });
  expect(result.current.mousePos).toBeNull();
});

it('refreshes stationary tooltip content when its data changes', () => {
  const chart = createChart();
  const { result, rerender } = renderHook(
    ({ values }) => useChartTooltipData({ ...chart, data: values, seriesMapping, pinnedPos: null }),
    { initialProps: { values: data } },
  );
  fireEvent.mouseMove(chart.canvas);
  flushFrame();
  const nextSeries = series.map((item) => Object.assign({}, item, { y: 6, formattedY: '6' }));
  vi.mocked(getNearbySeriesData).mockReturnValue(nextSeries);
  rerender({ values: [...data] });
  expect(result.current.nearbySeries).toEqual(nextSeries);
});

it.each(['blur', 'mouseout'])('clears an unpinned tooltip on window %s', (event) => {
  const chart = createChart();
  const { result } = renderHook(() => useChartTooltipData({ ...chart, data, seriesMapping, pinnedPos: null }));
  fireEvent.mouseMove(chart.canvas);
  flushFrame();
  fireEvent(window, new MouseEvent(event));
  flushFrame();
  expect(result.current.mousePos).toBeNull();
});

it('cancels pending work and removes listeners on unmount', () => {
  const chart = createChart();
  const { unmount } = renderHook(() => useChartTooltipData({ ...chart, data, seriesMapping, pinnedPos: null }));
  fireEvent.mouseMove(chart.canvas);
  expect(frames.size).toBe(1);
  unmount();
  expect(frames.size).toBe(0);
  fireEvent.mouseMove(chart.canvas);
  flushFrame();
  expect(getNearbySeriesData).not.toHaveBeenCalled();
});
