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

import { Theme } from '@mui/material';
import { BarSeriesOption, LineSeriesOption } from 'echarts/charts';
import { ECharts as EChartsInstance } from 'echarts/core';

import { TimeChartSeriesMapping } from '../model';
import {
  CursorCoordinates,
  CursorData,
  TOOLTIP_MAX_WIDTH,
  TOOLTIP_MAX_HEIGHT,
  TOOLTIP_MIN_WIDTH,
  TOOLTIP_BG_COLOR_FALLBACK,
  TOOLTIP_PADDING,
} from './tooltip-model';

/**
 * Determine position of tooltip depending on chart dimensions and the number of focused series.
 */
export function assembleTransform(
  mousePos: CursorData['coords'],
  pinnedPos: CursorCoordinates | null,
  tooltipHeight: number,
  tooltipWidth: number,
  containerElement?: Element | null,
): string | undefined {
  if (mousePos === null) {
    return undefined;
  }

  const cursorPaddingX = 32;
  const cursorPaddingY = 16;

  if (pinnedPos !== null) {
    mousePos = pinnedPos;
  }

  if (mousePos.plotCanvas.x === undefined) return undefined;

  // Fall back to max size before the resize observer reports a real measurement.
  const effectiveHeight = tooltipHeight > 0 ? tooltipHeight : TOOLTIP_MAX_HEIGHT;
  const effectiveWidth = tooltipWidth > 0 ? tooltipWidth : TOOLTIP_MAX_WIDTH;

  let x = mousePos.page.x + cursorPaddingX; // Default to right side of the cursor
  let y = mousePos.page.y + cursorPaddingY;

  // If containerElement is defined, adjust coordinates relative to the container
  if (containerElement) {
    const containerRect = containerElement.getBoundingClientRect();
    x = x - containerRect.left + containerElement.scrollLeft;
    y = y - containerRect.top + containerElement.scrollTop;

    // Ensure tooltip does not go out of the container's bottom
    const containerBottom = containerRect.top + containerElement.scrollHeight;
    if (y + effectiveHeight > containerBottom) {
      y = Math.max(containerBottom - effectiveHeight - cursorPaddingY, TOOLTIP_PADDING / 2);
    }
  } else {
    // Ensure tooltip does not go out of the screen on the bottom
    if (y + effectiveHeight > window.innerHeight + window.scrollY) {
      y = Math.max(window.innerHeight + window.scrollY - effectiveHeight - cursorPaddingY, TOOLTIP_PADDING / 2);
    }
  }

  // Ensure tooltip does not go out of the screen on the right
  if (x + effectiveWidth > window.innerWidth) {
    x = mousePos.page.x - effectiveWidth - cursorPaddingX; // Move to the left of the cursor
  }

  // Ensure tooltip does not go out of the screen on the left
  if (x < cursorPaddingX) {
    x = cursorPaddingX;
  }

  // Ensure tooltip does not go out of the screen on the top
  if (y < TOOLTIP_PADDING / 2) {
    y = TOOLTIP_PADDING / 2;
  }

  return `translate3d(${x}px, ${y}px, 0)`;
}

/**
 * Helper for tooltip positioning styles
 */
export function getTooltipStyles(
  theme: Theme,
  pinnedPos: CursorCoordinates | null,
  maxHeight?: number,
): Record<string, unknown> {
  const adjustedMaxHeight = maxHeight ? maxHeight - TOOLTIP_PADDING : undefined;
  return {
    minWidth: TOOLTIP_MIN_WIDTH,
    maxWidth: TOOLTIP_MAX_WIDTH,
    maxHeight: adjustedMaxHeight ?? TOOLTIP_MAX_HEIGHT,
    padding: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: theme.palette.designSystem?.grey[800] ?? TOOLTIP_BG_COLOR_FALLBACK,
    borderRadius: '6px',
    color: '#fff',
    fontSize: '11px',
    visibility: 'visible',
    opacity: 1,
    // Animating transform causes intermediate positions outside the viewport; animate opacity/visibility instead.
    transition: 'opacity 0.1s ease-out, visibility 0.1s ease-out',
    // Pinned tooltip should not float above the drawer/sticky header.
    zIndex: pinnedPos !== null ? 'auto' : theme.zIndex.tooltip,
    overflow: 'hidden',
    '&:hover': {
      overflowY: 'auto',
    },
  };
}

export function getPixelXFromGrid(timestamp: number, chart: EChartsInstance): number | null {
  try {
    const pixelCoords = chart.convertToPixel('grid', [timestamp, 0]);
    return pixelCoords?.[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns the cumulative (visual) Y for a series, accumulating stack totals in-place.
 * For non-stacked series, returns the raw yValue unchanged.
 * Mutates `stackTotals` — pass a fresh Map for each cursor evaluation.
 */
export function calculateVisualYForSeries(
  seriesIdx: number,
  yValue: number,
  seriesMapping: TimeChartSeriesMapping,
  stackTotals: Map<string, number>,
): number {
  const currentSeries = seriesMapping[seriesIdx];
  if (!currentSeries) return yValue;

  const stackId = (currentSeries as LineSeriesOption | BarSeriesOption).stack;
  if (!stackId) {
    return yValue;
  }

  const stackIdStr = stackId.toString();
  const currentTotal = stackTotals.get(stackIdStr) ?? 0;
  const newTotal = currentTotal + yValue;
  stackTotals.set(stackIdStr, newTotal);
  return newTotal;
}

export function calculateBarBandwidth(timestamp: number, sortedTimestamps: number[], chart: EChartsInstance): number {
  const currentIdx = sortedTimestamps.indexOf(timestamp);
  if (currentIdx === -1) {
    return 20;
  }

  const prevTimestamp = currentIdx > 0 ? (sortedTimestamps[currentIdx - 1] ?? null) : null;
  const nextTimestamp = currentIdx < sortedTimestamps.length - 1 ? (sortedTimestamps[currentIdx + 1] ?? null) : null;

  const currentPixelX = getPixelXFromGrid(timestamp, chart);
  if (currentPixelX === null) return 20;

  let leftBound: number;
  let rightBound: number;

  if (prevTimestamp !== null && nextTimestamp !== null) {
    const prevPixelX = getPixelXFromGrid(prevTimestamp, chart) ?? currentPixelX;
    const nextPixelX = getPixelXFromGrid(nextTimestamp, chart) ?? currentPixelX;
    leftBound = (currentPixelX + prevPixelX) / 2;
    rightBound = (currentPixelX + nextPixelX) / 2;
  } else if (prevTimestamp !== null) {
    const prevPixelX = getPixelXFromGrid(prevTimestamp, chart) ?? currentPixelX;
    leftBound = (currentPixelX + prevPixelX) / 2;
    rightBound = currentPixelX + (currentPixelX - leftBound);
  } else if (nextTimestamp !== null) {
    const nextPixelX = getPixelXFromGrid(nextTimestamp, chart) ?? currentPixelX;
    rightBound = (currentPixelX + nextPixelX) / 2;
    leftBound = currentPixelX - (rightBound - currentPixelX);
  } else {
    return 20;
  }

  return Math.max(1, rightBound - leftBound);
}

/**
 * Computes the pixel left/right bounds of one bar segment within a group.
 * @param barRelativeIdx - zero-based index among bar-only series
 * @param bandwidth      - total pixel width for the bar group
 * @param centerPixelX   - pixel X of the bar group centre
 * @param barCount       - total bar series count (lines excluded)
 */
export function calculateBarSegmentBounds(
  barRelativeIdx: number,
  bandwidth: number,
  centerPixelX: number,
  barCount: number,
): { left: number; right: number } {
  const count = Math.max(1, barCount);
  const segmentWidth = bandwidth / count;
  const segmentLeft = centerPixelX - bandwidth / 2 + barRelativeIdx * segmentWidth;
  return {
    left: segmentLeft,
    right: segmentLeft + segmentWidth,
  };
}

export function calculateBarYBounds(
  visualYBottom: number,
  visualYTop: number,
  chart: EChartsInstance,
): { top: number; bottom: number } | null {
  try {
    const bottomPixel = chart.convertToPixel('grid', [0, visualYBottom]);
    const topPixel = chart.convertToPixel('grid', [0, visualYTop]);

    if (!bottomPixel || !topPixel || bottomPixel[1] === undefined || topPixel[1] === undefined) return null;

    // Y increases downward in pixels; min/max normalizes the mapping for negative bar values.
    return {
      top: Math.min(topPixel[1], bottomPixel[1]),
      bottom: Math.max(topPixel[1], bottomPixel[1]),
    };
  } catch {
    return null;
  }
}
