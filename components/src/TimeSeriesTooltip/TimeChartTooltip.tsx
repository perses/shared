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

import { memo, MutableRefObject, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Box, Portal, Stack } from '@mui/material';
import { ECharts as EChartsInstance } from 'echarts/core';
import { TimeSeries } from '@perses-dev/spec';
import useResizeObserver from 'use-resize-observer';
import { FormatOptions, TimeChartSeriesMapping } from '../model';
import { CursorCoordinates, useMousePosition } from './tooltip-model';
import { assembleTransform, getTooltipStyles } from './utils';
import { getNearbySeriesData } from './nearby-series';
import { TooltipHeader } from './TooltipHeader';
import { TooltipContent } from './TooltipContent';

export interface TimeChartTooltipProps {
  chartRef: MutableRefObject<EChartsInstance | undefined>;
  data: TimeSeries[];
  seriesMapping: TimeChartSeriesMapping;
  enablePinning?: boolean;
  pinnedPos: CursorCoordinates | null;
  /**
   * The id of the container that will have the chart tooltip appended to it.
   * By default, the chart tooltip is attached to document.body.
   */
  containerId?: string;
  onUnpinClick?: () => void;
  format?: FormatOptions;
  /**
   * Map of series ID to format options for per-series formatting (used with multiple Y axes)
   */
  seriesFormatMap?: Map<string, FormatOptions>;
  wrapLabels?: boolean;
}

export const TimeChartTooltip = memo(function TimeChartTooltip({
  containerId,
  chartRef,
  data,
  seriesMapping,
  enablePinning = true,
  wrapLabels,
  format,
  seriesFormatMap,
  onUnpinClick,
  pinnedPos,
}: TimeChartTooltipProps) {
  const [showAllSeries, setShowAllSeries] = useState(false);
  const transform = useRef<string | undefined>();
  const tooltipElementRef = useRef<HTMLDivElement | null>(null);

  const mousePos = useMousePosition();
  const { height, width, ref: tooltipRef } = useResizeObserver();

  const isTooltipPinned = pinnedPos !== null && enablePinning;

  // Stable callback — prevents the ResizeObserver from disconnecting/reconnecting on every render.
  const setTooltipRef = useCallback(
    (node: HTMLDivElement | null): void => {
      tooltipElementRef.current = node;
      tooltipRef(node);
    },
    [tooltipRef]
  );

  const containerElement = containerId ? document.querySelector(containerId) : undefined;

  // Synchronously reposition after every render to prevent one-frame viewport overflow.
  useLayoutEffect(() => {
    if (mousePos === null) return;
    const node = tooltipElementRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (rect.height === 0 || rect.width === 0) return;
    const nextTransform = assembleTransform(mousePos, pinnedPos, rect.height, rect.width, containerElement);
    if (nextTransform && nextTransform !== transform.current) {
      transform.current = nextTransform;
      node.style.transform = nextTransform;
    }
  });

  if (mousePos === null || mousePos.target === null || data === null) return null;

  if (pinnedPos === null && (mousePos.target as HTMLElement).tagName !== 'CANVAS') return null;

  const chart = chartRef.current;

  // Cap height to container so the tooltip is not cut off.
  const maxHeight = containerElement ? containerElement.getBoundingClientRect().height : undefined;

  transform.current = assembleTransform(mousePos, pinnedPos, height ?? 0, width ?? 0, containerElement);

  const nearbySeries = getNearbySeriesData({
    mousePos,
    data,
    seriesMapping,
    pinnedPos,
    chart,
    format,
    seriesFormatMap,
    showAllSeries,
  });
  if (nearbySeries.length === 0) {
    return null;
  }

  const totalSeries = data.length;

  return (
    <Portal container={containerElement}>
      <Box
        ref={setTooltipRef}
        sx={(theme) => getTooltipStyles(theme, pinnedPos, maxHeight)}
        style={{
          transform: transform.current,
        }}
      >
        <Stack spacing={0.5}>
          <TooltipHeader
            nearbySeries={nearbySeries}
            totalSeries={totalSeries}
            enablePinning={enablePinning}
            isTooltipPinned={isTooltipPinned}
            showAllSeries={showAllSeries}
            onShowAllClick={(checked) => setShowAllSeries(checked)}
            onUnpinClick={onUnpinClick}
          />
          <TooltipContent series={nearbySeries} wrapLabels={wrapLabels} />
        </Stack>
      </Box>
    </Portal>
  );
});
