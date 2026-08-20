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
import { BarSeriesOption } from 'echarts/charts';
import { ECharts as EChartsInstance } from 'echarts/core';

import {
  EChartsDataFormat,
  OPTIMIZED_MODE_SERIES_LIMIT,
  TimeChartSeriesMapping,
  DatapointInfo,
  FormatOptions,
  formatValue,
} from '../model';
import { batchDispatchNearbySeriesActions, getPointInGrid, getClosestTimestamp } from '../utils';
import { CursorCoordinates, CursorData, EMPTY_TOOLTIP_DATA } from './tooltip-model';
import { Candidate, GetYBufferParams, IsWithinPercentageRangeParams, NearbySeriesArray } from './types';
import {
  calculateBarBandwidth,
  calculateBarSegmentBounds,
  calculateBarYBounds,
  calculateVisualYForSeries,
  getPixelXFromGrid,
} from './utils';

export type { NearbySeriesArray, NearbySeriesInfo } from './types';

// increase multipliers to show more series in tooltip
export const INCREASE_NEARBY_SERIES_MULTIPLIER = 5.5; // adjusts how many series show in tooltip (higher == more series shown)
export const DYNAMIC_NEARBY_SERIES_MULTIPLIER = 30; // used for adjustment after series number divisor
export const SHOW_FEWER_SERIES_LIMIT = 5;

function gatherCandidates(
  data: TimeSeries[],
  seriesMapping: TimeChartSeriesMapping,
  closestTimestamp: number,
  cursorX: number,
  cursorY: number,
  cursorXPixel: number | null,
  cursorPixelY: number | undefined,
  yBuffer: number,
  yBufferPixels: number | null,
  chart: EChartsInstance,
): Candidate[] {
  const candidates: Candidate[] = [];
  const totalSeries = data.length;

  const stackTotals = new Map<string, number>();

  let sortedTimestamps: number[] = [];
  const firstValues = data[0]?.values;
  if (firstValues && firstValues.length > 0) {
    const seen = new Set<number>();
    for (const [ts] of firstValues) {
      if (!seen.has(ts)) {
        seen.add(ts);
        sortedTimestamps.push(ts);
      }
    }
    sortedTimestamps = sortedTimestamps.sort((a, b) => a - b);
  }

  // Bar-only indexes: ECharts groups bars independently of lines, so bar-relative index and count must exclude line series.
  const barSeriesIndexes: number[] = [];
  for (let i = 0; i < totalSeries; i++) {
    if ((seriesMapping[i]?.type ?? 'line') === 'bar') barSeriesIndexes.push(i);
  }

  // Computed once outside the loop — both depend only on the timestamp, not the series index.
  let barBandwidth: number | null = null;
  let barCenterPixelX: number | null = null;
  if (barSeriesIndexes.length > 0 && cursorXPixel !== null) {
    barBandwidth = calculateBarBandwidth(closestTimestamp, sortedTimestamps, chart);
    barCenterPixelX = getPixelXFromGrid(closestTimestamp, chart);
  }

  for (let seriesIdx = 0; seriesIdx < totalSeries; seriesIdx++) {
    const currentSeries = seriesMapping[seriesIdx];
    if (!currentSeries) continue;

    const currentDataset = data[seriesIdx];
    if (!currentDataset) continue;

    const currentDatasetValues: TimeSeriesValueTuple[] | undefined = currentDataset.values;
    if (!currentDatasetValues || !Array.isArray(currentDatasetValues)) continue;

    const seriesType = currentSeries.type ?? 'line';
    const currentSeriesName = currentSeries.name ? currentSeries.name.toString() : '';
    const seriesId = currentSeries.id ? currentSeries.id.toString() : '';
    const markerColor = (currentSeries.color ?? '#000').toString();

    let datumIdx = -1;
    let xValue = 0;
    let yValue: number | null | undefined;
    for (let i = 0; i < currentDatasetValues.length; i++) {
      const tuple = currentDatasetValues[i];
      if (!tuple) continue;
      if (tuple[0] === closestTimestamp) {
        datumIdx = i;
        xValue = tuple[0];
        yValue = tuple[1];
        break;
      }
    }
    if (datumIdx === -1) continue;

    if (yValue === null || yValue === undefined) continue;

    let isCandidate = false;
    let visualY = yValue;
    let distance = Infinity;

    if (seriesType === 'line') {
      visualY = calculateVisualYForSeries(seriesIdx, yValue, seriesMapping, stackTotals);

      if (cursorPixelY !== undefined && yBufferPixels !== null) {
        try {
          const dataPointPixel = chart.convertToPixel({ seriesIndex: seriesIdx }, [datumIdx, visualY]);
          if (dataPointPixel && dataPointPixel[1] !== undefined) {
            const pixelDistance = Math.abs(cursorPixelY - dataPointPixel[1]);
            isCandidate = pixelDistance <= yBufferPixels;
            distance = pixelDistance;
          } else {
            const verticalDistance = Math.abs(visualY - cursorY);
            isCandidate = verticalDistance <= yBuffer;
            distance = verticalDistance;
          }
        } catch {
          const verticalDistance = Math.abs(visualY - cursorY);
          isCandidate = verticalDistance <= yBuffer;
          distance = verticalDistance;
        }
      } else {
        const verticalDistance = Math.abs(visualY - cursorY);
        isCandidate = verticalDistance <= yBuffer;
        distance = verticalDistance;
      }
    } else if (seriesType === 'bar') {
      if (cursorXPixel === null || barBandwidth === null || barCenterPixelX === null) continue;

      const barRelativeIdx = barSeriesIndexes.indexOf(seriesIdx);
      if (barRelativeIdx === -1) continue;

      const segmentBounds = calculateBarSegmentBounds(
        barRelativeIdx,
        barBandwidth,
        barCenterPixelX,
        barSeriesIndexes.length,
      );

      const isWithinXBounds = cursorXPixel >= segmentBounds.left && cursorXPixel <= segmentBounds.right;
      if (!isWithinXBounds) continue;

      const stackId = (currentSeries as BarSeriesOption).stack;
      let isHoveringYBounds = true;

      if (stackId) {
        const stackIdStr = stackId.toString();
        const visualYBottom = stackTotals.get(stackIdStr) ?? 0;
        visualY = calculateVisualYForSeries(seriesIdx, yValue, seriesMapping, stackTotals);
        const yBounds = calculateBarYBounds(visualYBottom, visualY, chart);

        if (yBounds) {
          const cursorYPixel = chart.convertToPixel('grid', [0, cursorY]);
          if (cursorYPixel && cursorYPixel[1] !== undefined) {
            isHoveringYBounds = cursorYPixel[1] >= yBounds.top && cursorYPixel[1] <= yBounds.bottom;
          }
        }
      } else {
        visualY = yValue;
      }

      if (!isHoveringYBounds) continue;

      const segmentCenter = (segmentBounds.left + segmentBounds.right) / 2;
      distance = Math.abs(cursorXPixel - segmentCenter);
      isCandidate = true;
    }

    if (isCandidate) {
      candidates.push({
        seriesIdx,
        datumIdx,
        seriesId,
        seriesName: currentSeriesName,
        date: closestTimestamp,
        markerColor,
        x: xValue,
        y: yValue,
        visualY,
        distance,
      });
    }
  }

  return candidates;
}

function findClosestCandidate(candidates: Candidate[]): Candidate | null {
  if (candidates.length === 0) return null;
  let winner: Candidate | null = null;
  for (const candidate of candidates) {
    if (winner === null || candidate.distance < winner.distance) {
      winner = candidate;
    }
  }
  return winner;
}

function processCandidates(
  candidates: Candidate[],
  winner: Candidate | null,
  format: FormatOptions | undefined,
  seriesFormatMap: Map<string, FormatOptions> | undefined,
  chart: EChartsInstance,
  nonCandidateSeriesIndexes: number[],
): NearbySeriesArray {
  const nearbySeriesIndexes: number[] = [];
  const emphasizedSeriesIndexes: number[] = [];
  const nonEmphasizedSeriesIndexes: number[] = [...nonCandidateSeriesIndexes];
  const emphasizedDatapoints: DatapointInfo[] = [];
  const duplicateDatapoints: DatapointInfo[] = [];
  const yValueCounts: Map<number, number> = new Map();

  const result: NearbySeriesArray = [];

  for (const candidate of candidates) {
    const seriesFormat = seriesFormatMap?.get(candidate.seriesId) ?? format;
    // Use raw y, not visualY — visualY is for proximity detection only.
    const displayY = candidate.y;
    const formattedY = formatValue(displayY, seriesFormat);
    const isClosestToCursor = winner !== null && candidate.seriesIdx === winner.seriesIdx;

    if (isClosestToCursor) {
      emphasizedSeriesIndexes.push(candidate.seriesIdx);

      const duplicateValuesCount = yValueCounts.get(displayY) ?? 0;
      yValueCounts.set(displayY, duplicateValuesCount + 1);
      if (duplicateValuesCount > 0) {
        duplicateDatapoints.push({
          seriesIndex: candidate.seriesIdx,
          dataIndex: candidate.datumIdx,
          seriesName: candidate.seriesName,
          yValue: displayY,
        });
      }

      emphasizedDatapoints.push({
        seriesIndex: candidate.seriesIdx,
        dataIndex: candidate.datumIdx,
        seriesName: candidate.seriesName,
        yValue: displayY,
      });
    } else {
      nonEmphasizedSeriesIndexes.push(candidate.seriesIdx);
    }

    result.push({
      seriesIdx: candidate.seriesIdx,
      datumIdx: candidate.datumIdx,
      seriesName: candidate.seriesName,
      date: candidate.date,
      x: candidate.x,
      y: displayY,
      formattedY,
      markerColor: candidate.markerColor,
      isClosestToCursor,
    });

    nearbySeriesIndexes.push(candidate.seriesIdx);
  }

  batchDispatchNearbySeriesActions(
    chart,
    nearbySeriesIndexes,
    emphasizedSeriesIndexes,
    nonEmphasizedSeriesIndexes,
    emphasizedDatapoints,
    duplicateDatapoints,
  );

  return result;
}

/**
 * Returns formatted series data for the points that are close to the user's cursor.
 * Adjust xBuffer and yBuffer to increase or decrease number of series shown.
 */
export function checkforNearbyTimeSeries(
  data: TimeSeries[],
  seriesMapping: TimeChartSeriesMapping,
  pointInGrid: number[],
  yBuffer: number,
  chart: EChartsInstance,
  format?: FormatOptions,
  seriesFormatMap?: Map<string, FormatOptions>,
  // in the case of multi-axis, we need the cursor Y position in pixel space
  cursorPixelY?: number,
  cursorXPixel?: number | null,
): NearbySeriesArray {
  const cursorX: number | null = pointInGrid[0] ?? null;
  const cursorY: number | null = pointInGrid[1] ?? null;

  if (cursorX === null || cursorY === null) return EMPTY_TOOLTIP_DATA;
  if (chart.dispatchAction === undefined) return EMPTY_TOOLTIP_DATA;
  if (!Array.isArray(data)) return EMPTY_TOOLTIP_DATA;

  // All series share the same x-axis timestamps (enforced by getCommonTimeScale).
  const firstTimeSeriesValues = data[0]?.values;
  const closestTimestamp = getClosestTimestamp(firstTimeSeriesValues, cursorX);
  if (closestTimestamp === null) return EMPTY_TOOLTIP_DATA;

  let yBufferPixels: number | null = null;
  if (cursorPixelY !== undefined) {
    const cursorPoint = chart.convertToPixel('grid', [0, cursorY]);
    const bufferPoint = chart.convertToPixel('grid', [0, cursorY + yBuffer]);
    if (cursorPoint && bufferPoint && cursorPoint[1] !== undefined && bufferPoint[1] !== undefined) {
      yBufferPixels = Math.abs(bufferPoint[1] - cursorPoint[1]);
    }
  }

  const resolvedCursorXPixel = cursorXPixel ?? getPixelXFromGrid(closestTimestamp, chart);

  const candidates = gatherCandidates(
    data,
    seriesMapping,
    closestTimestamp,
    cursorX,
    cursorY,
    resolvedCursorXPixel,
    cursorPixelY,
    yBuffer,
    yBufferPixels,
    chart,
  );

  const winner = findClosestCandidate(candidates);

  const candidateIndexes = new Set<number>();
  for (const candidate of candidates) candidateIndexes.add(candidate.seriesIdx);
  const nonCandidateSeriesIndexes: number[] = [];
  for (let idx = 0; idx < data.length; idx++) {
    if (!candidateIndexes.has(idx)) nonCandidateSeriesIndexes.push(idx);
  }

  return processCandidates(candidates, winner, format, seriesFormatMap, chart, nonCandidateSeriesIndexes);
}

/**
 * [DEPRECATED] Returns formatted series data for the points that are close to the user's cursor
 * Adjust yBuffer to increase or decrease number of series shown
 */
export function legacyCheckforNearbySeries(
  data: EChartsDataFormat,
  pointInGrid: number[],
  yBuffer: number,
  chart?: EChartsInstance,
  format?: FormatOptions,
): NearbySeriesArray {
  const currentNearbySeriesData: NearbySeriesArray = [];
  const cursorX: number | null = pointInGrid[0] ?? null;
  const cursorY: number | null = pointInGrid[1] ?? null;

  if (cursorX === null || cursorY === null) {
    return currentNearbySeriesData;
  }

  const nearbySeriesIndexes: number[] = [];
  const emphasizedSeriesIndexes: number[] = [];
  const nonEmphasizedSeriesIndexes: number[] = [];
  const totalSeries = data.timeSeries.length;
  if (Array.isArray(data.xAxis) && Array.isArray(data.timeSeries)) {
    for (let seriesIdx = 0; seriesIdx < totalSeries; seriesIdx++) {
      const currentSeries = data.timeSeries[seriesIdx];
      if (currentSeries === undefined) break;
      if (currentNearbySeriesData.length >= OPTIMIZED_MODE_SERIES_LIMIT) break;

      const currentSeriesName = currentSeries.name ? currentSeries.name.toString() : '';
      const markerColor = currentSeries.color ?? '#000';
      if (Array.isArray(currentSeries.data)) {
        for (let datumIdx = 0; datumIdx < currentSeries.data.length; datumIdx++) {
          const xValue = data.xAxis[datumIdx] ?? 0;
          const yValue = currentSeries.data[datumIdx];
          // ensure null values not displayed in tooltip
          if (yValue !== undefined && yValue !== null && cursorX === datumIdx) {
            if (yValue !== '-' && cursorY <= yValue + yBuffer && cursorY >= yValue - yBuffer) {
              // show fewer bold series in tooltip when many total series
              const minPercentRange = totalSeries > SHOW_FEWER_SERIES_LIMIT ? 2 : 5;
              const percentRangeToCheck = Math.max(minPercentRange, 100 / totalSeries);
              const isClosestToCursor = isWithinPercentageRange({
                valueToCheck: cursorY,
                baseValue: yValue,
                percentage: percentRangeToCheck,
              });
              if (isClosestToCursor) {
                emphasizedSeriesIndexes.push(seriesIdx);
              } else {
                nonEmphasizedSeriesIndexes.push(seriesIdx);
                // ensure series not close to cursor are not highlighted
                if (chart?.dispatchAction !== undefined) {
                  chart.dispatchAction({
                    type: 'downplay',
                    seriesIndex: seriesIdx,
                  });
                }
              }

              // determine whether to convert timestamp to ms, see: https://stackoverflow.com/a/23982005/17575201
              const xValueMilliSeconds = xValue > 99999999999 ? xValue : xValue * 1000;
              const formattedY = formatValue(yValue, format);
              currentNearbySeriesData.push({
                seriesIdx: seriesIdx,
                datumIdx: datumIdx,
                seriesName: currentSeriesName,
                date: xValueMilliSeconds,
                x: xValue,
                y: yValue,
                formattedY: formattedY,
                markerColor: markerColor.toString(),
                isClosestToCursor,
              });
              nearbySeriesIndexes.push(seriesIdx);
            }
          }
        }
      }
    }
  }
  if (chart?.dispatchAction !== undefined) {
    // Clears emphasis state of all lines that are not emphasized.
    // Emphasized is a subset of just the nearby series that are closest to cursor.
    chart.dispatchAction({
      type: 'downplay',
      seriesIndex: nonEmphasizedSeriesIndexes,
    });

    // https://echarts.apache.org/en/api.html#action.highlight
    if (emphasizedSeriesIndexes.length > 0) {
      // Fadeout opacity of all series not closest to cursor.
      chart.dispatchAction({
        type: 'highlight',
        seriesIndex: emphasizedSeriesIndexes,
        notBlur: false, // ensure blur IS triggered, this is default but setting so it is explicit
        escapeConnect: true, // shared crosshair should not emphasize series on adjacent charts
      });
    } else {
      // When no emphasized series with bold text, notBlur allows opacity fadeout to not trigger.
      chart.dispatchAction({
        type: 'highlight',
        seriesIndex: nearbySeriesIndexes,
        notBlur: true, // do not trigger blur state when cursor is not immediately close to any series
        escapeConnect: true, // shared crosshair should not emphasize series on adjacent charts
      });
    }
  }

  return currentNearbySeriesData;
}

/**
 * Uses mouse position to determine whether user is hovering over a chart canvas
 * If yes, convert from pixel values to logical cartesian coordinates and return all nearby series
 */
export function getNearbySeriesData({
  mousePos,
  pinnedPos,
  data,
  seriesMapping,
  chart,
  format,
  seriesFormatMap,
  showAllSeries = false,
}: {
  mousePos: CursorData['coords'];
  pinnedPos: CursorCoordinates | null;
  data: TimeSeries[];
  seriesMapping: TimeChartSeriesMapping;
  chart?: EChartsInstance;
  format?: FormatOptions;
  seriesFormatMap?: Map<string, FormatOptions>;
  showAllSeries?: boolean;
}): NearbySeriesArray {
  if (chart === undefined || mousePos === null) return EMPTY_TOOLTIP_DATA;

  // prevents multiple tooltips showing from adjacent charts unless tooltip is pinned
  let cursorTargetMatchesChart = false;
  if (mousePos.target !== null) {
    const currentParent = (<HTMLElement>mousePos.target).parentElement;
    if (currentParent !== null) {
      const currentGrandparent = currentParent.parentElement;
      if (currentGrandparent !== null) {
        const chartDom = chart.getDom();
        if (chartDom === currentGrandparent) {
          cursorTargetMatchesChart = true;
        }
      }
    }
  }

  // allows moving cursor inside tooltip without it fading away
  if (pinnedPos !== null) {
    mousePos = pinnedPos;
    cursorTargetMatchesChart = true;
  }

  if (cursorTargetMatchesChart === false || data === null || chart['_model'] === undefined) return EMPTY_TOOLTIP_DATA;

  if (mousePos.plotCanvas.x === undefined || mousePos.plotCanvas.y === undefined) return EMPTY_TOOLTIP_DATA;

  const cursorPixelY = mousePos.plotCanvas.y;
  const cursorXPixel = mousePos.plotCanvas.x;
  const pointInGrid = getPointInGrid(cursorXPixel, cursorPixelY, chart);
  if (pointInGrid !== null) {
    const chartModel = chart['_model'];
    const yAxisScale = chartModel.getComponent('yAxis').axis.scale;
    const isLogScale = yAxisScale.type === 'log';
    let yInterval = yAxisScale._interval;
    // For log scales, convert from log-space extent to actual data range and use 1% as the interval.
    if (isLogScale && yAxisScale.base) {
      const logBase = yAxisScale.base;
      const extent = yAxisScale._extent;
      // e.g. extent [0, 2] → 10^0..10^2
      const actualMin = logBase ** extent[0];
      const actualMax = logBase ** extent[1];
      yInterval = (actualMax - actualMin) / 100;
    }
    const totalSeries = data.length;
    const yBuffer = getYBuffer({ yInterval, totalSeries, showAllSeries });

    const hasMultipleYAxes = seriesMapping.some((series) => series.yAxisIndex !== undefined && series.yAxisIndex > 0);

    return checkforNearbyTimeSeries(
      data,
      seriesMapping,
      pointInGrid,
      yBuffer,
      chart,
      format,
      seriesFormatMap,
      hasMultipleYAxes ? cursorPixelY : undefined,
      cursorXPixel,
    );
  }

  // no nearby series found
  return EMPTY_TOOLTIP_DATA;
}

/*
 * Check if two numbers are within a specified percentage range
 */
export function isWithinPercentageRange({
  valueToCheck,
  baseValue,
  percentage,
}: IsWithinPercentageRangeParams): boolean {
  const range = (percentage / 100) * baseValue;
  const lowerBound = baseValue - range;
  const upperBound = baseValue + range;
  return valueToCheck >= lowerBound && valueToCheck <= upperBound;
}

/*
 * Get range to check within for nearby series to show in tooltip.
 */
export function getYBuffer({ yInterval, totalSeries, showAllSeries = false }: GetYBufferParams): number {
  if (showAllSeries) {
    return yInterval * 10; // roughly correlates with grid so entire canvas is searched
  }
  // never let nearby series range be less than roughly the size of a single tick
  const yBufferMin = yInterval * 0.3;

  // tooltip trigger area gets smaller with more series
  if (totalSeries > SHOW_FEWER_SERIES_LIMIT) {
    const adjustedBuffer = (yInterval * DYNAMIC_NEARBY_SERIES_MULTIPLIER) / totalSeries;
    return Math.max(yBufferMin, adjustedBuffer);
  }
  // increase multiplier to expand nearby series range
  return Math.max(yBufferMin, yInterval * INCREASE_NEARBY_SERIES_MULTIPLIER);
}
