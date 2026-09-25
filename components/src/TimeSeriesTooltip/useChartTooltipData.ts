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

import type { ECharts as EChartsInstance } from 'echarts/core';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import { getNearbySeriesData } from './nearby-series';
import type { CursorCoordinates, ZRRawMouseEvent } from './tooltip-model';
import { EMPTY_TOOLTIP_DATA } from './tooltip-model';
import type { NearbySeriesArray } from './types';

type TooltipOptions = Omit<Parameters<typeof getNearbySeriesData>[0], 'mousePos' | 'chart'> & {
  chartRef: RefObject<EChartsInstance | undefined>;
};

interface ChartTooltipData {
  mousePos: CursorCoordinates | null;
  nearbySeries: NearbySeriesArray;
}

const EMPTY_STATE: ChartTooltipData = { mousePos: null, nearbySeries: EMPTY_TOOLTIP_DATA };

function sameSeries(previous: NearbySeriesArray, next: NearbySeriesArray): boolean {
  return (
    previous.length === next.length &&
    previous.every((series, index) => {
      const other = next[index];
      return (
        other !== undefined &&
        series.seriesIdx === other.seriesIdx &&
        series.datumIdx === other.datumIdx &&
        series.seriesName === other.seriesName &&
        series.date === other.date &&
        series.markerColor === other.markerColor &&
        Object.is(series.x, other.x) &&
        Object.is(series.y, other.y) &&
        series.formattedY === other.formattedY &&
        series.isClosestToCursor === other.isClosestToCursor
      );
    })
  );
}

/** Read the chart only for its active cursor, with one React update per animation frame. */
export function useChartTooltipData({
  chartRef,
  data,
  seriesMapping,
  pinnedPos,
  format,
  seriesFormatMap,
  showAllSeries,
}: TooltipOptions): ChartTooltipData {
  const [tooltipData, setTooltipData] = useState(EMPTY_STATE);
  const cursorRef = useRef<CursorCoordinates | null>(null);

  useEffect(() => {
    let frame: number | null = null;

    const update = (): void => {
      frame = null;
      const mousePos = pinnedPos ?? cursorRef.current;
      if (mousePos === null) {
        setTooltipData(EMPTY_STATE);
        return;
      }
      const nearbySeries = getNearbySeriesData({
        mousePos,
        chart: chartRef.current ?? undefined,
        data,
        seriesMapping,
        pinnedPos,
        format,
        seriesFormatMap,
        showAllSeries,
      });
      setTooltipData((previous) => ({
        mousePos,
        nearbySeries: sameSeries(previous.nearbySeries, nearbySeries) ? previous.nearbySeries : nearbySeries,
      }));
    };

    const scheduleUpdate = (): void => {
      if (frame === null) frame = requestAnimationFrame(update);
    };

    const onMouseMove = (event: ZRRawMouseEvent): void => {
      const target = event.target;
      const chart = chartRef.current;
      if (!(target instanceof Element) || target.tagName !== 'CANVAS' || !chart?.getDom().contains(target)) {
        if (cursorRef.current === null) return;
        cursorRef.current = null;
      } else {
        cursorRef.current = {
          page: { x: event.pageX, y: event.pageY },
          client: { x: event.clientX, y: event.clientY },
          // Preserve zrender's browser normalization and the Edge offset fallback.
          plotCanvas: { x: event.zrX ?? event.offsetX, y: event.zrY ?? event.offsetY },
          target,
        };
      }
      // Track the live cursor for unpinning without recomputing or rendering pinned content.
      if (pinnedPos === null) scheduleUpdate();
    };

    const onWindowLeave = (): void => {
      if (cursorRef.current === null) return;
      cursorRef.current = null;
      if (pinnedPos === null) scheduleUpdate();
    };
    const onMouseOut = (event: MouseEvent): void => {
      if (event.relatedTarget === null) onWindowLeave();
    };

    update();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseout', onMouseOut);
    window.addEventListener('blur', onWindowLeave);
    return (): void => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseout', onMouseOut);
      window.removeEventListener('blur', onWindowLeave);
    };
  }, [chartRef, data, seriesMapping, pinnedPos, format, seriesFormatMap, showAllSeries]);

  return tooltipData;
}
