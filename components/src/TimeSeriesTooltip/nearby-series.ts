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

import { ECharts as EChartsInstance } from 'echarts/core';
import { LineSeriesOption } from 'echarts/charts';
import { formatValue, TimeSeriesValueTuple, FormatOptions, TimeSeries } from '@perses-dev/core';
import { EChartsDataFormat, OPTIMIZED_MODE_SERIES_LIMIT, TimeChartSeriesMapping, DatapointInfo } from '../model';
import { batchDispatchNearbySeriesActions, getPointInGrid, getClosestTimestamp } from '../utils';
import { CursorCoordinates, CursorData, EMPTY_TOOLTIP_DATA } from './tooltip-model';

// increase multipliers to show more series in tooltip
export const INCREASE_NEARBY_SERIES_MULTIPLIER = 5.5; // adjusts how many series show in tooltip (higher == more series shown)
export const DYNAMIC_NEARBY_SERIES_MULTIPLIER = 30; // used for adjustment after series number divisor
export const SHOW_FEWER_SERIES_LIMIT = 5;

export interface NearbySeriesInfo {
  seriesIdx: number | null;
  datumIdx: number | null;
  seriesName: string;
  date: number;
  markerColor: string;
  x: number;
  y: number;
  formattedY: string;
  isClosestToCursor: boolean;
}

export type NearbySeriesArray = NearbySeriesInfo[];

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
  cursorPixelY?: number
): NearbySeriesArray {
  const currentNearbySeriesData: NearbySeriesArray = [];
  const cursorX: number | null = pointInGrid[0] ?? null;
  const cursorY: number | null = pointInGrid[1] ?? null;

  if (cursorX === null || cursorY === null) return currentNearbySeriesData;

  if (chart.dispatchAction === undefined) return currentNearbySeriesData;

  if (!Array.isArray(data)) return currentNearbySeriesData;
  const nearbySeriesIndexes: number[] = [];
  const emphasizedSeriesIndexes: number[] = [];
  const nonEmphasizedSeriesIndexes: number[] = [];
  const emphasizedDatapoints: DatapointInfo[] = [];
  const duplicateDatapoints: DatapointInfo[] = [];

  const totalSeries = data.length;

  const yValueCounts: Map<number, number> = new Map();

  // Only need to loop through first dataset source since getCommonTimeScale ensures xAxis timestamps are consistent
  const firstTimeSeriesValues = data[0]?.values;
  const closestTimestamp = getClosestTimestamp(firstTimeSeriesValues, cursorX);

  if (closestTimestamp === null) {
    return EMPTY_TOOLTIP_DATA;
  }

  // For multi-axis support: convert yBuffer to pixel space for consistent comparison
  // This allows us to compare series on different Y axes fairly
  let yBufferPixels: number | null = null;
  if (cursorPixelY !== undefined) {
    // Convert a point at cursorY and cursorY + yBuffer to pixels to get the buffer in pixel space
    const cursorPoint = chart.convertToPixel('grid', [0, cursorY]);
    const bufferPoint = chart.convertToPixel('grid', [0, cursorY + yBuffer]);
    if (cursorPoint && bufferPoint && cursorPoint[1] !== undefined && bufferPoint[1] !== undefined) {
      yBufferPixels = Math.abs(bufferPoint[1] - cursorPoint[1]);
    }
  }

  // find the timestamp with data that is closest to cursorX
  for (let seriesIdx = 0; seriesIdx < totalSeries; seriesIdx++) {
    const currentSeries = seriesMapping[seriesIdx];
    if (!currentSeries) break;

    const currentDataset = totalSeries > 0 ? data[seriesIdx] : null;
    if (!currentDataset) break;

    const currentDatasetValues: TimeSeriesValueTuple[] = currentDataset.values;
    if (currentDatasetValues === undefined || !Array.isArray(currentDatasetValues)) break;
    const lineSeries = currentSeries as LineSeriesOption;
    const currentSeriesName = lineSeries.name ? lineSeries.name.toString() : '';
    const seriesId = lineSeries.id ? lineSeries.id.toString() : '';
    const markerColor = lineSeries.color ?? '#000';

    // Get the format for this series (from seriesFormatMap or fallback to default format)
    const seriesFormat = seriesFormatMap?.get(seriesId) ?? format;

    if (Array.isArray(data)) {
      for (let datumIdx = 0; datumIdx < currentDatasetValues.length; datumIdx++) {
        const nearbyTimeSeries = currentDatasetValues[datumIdx];
        if (nearbyTimeSeries === undefined || !Array.isArray(nearbyTimeSeries)) break;

        const xValue = nearbyTimeSeries[0];
        const yValue = nearbyTimeSeries[1];
        // TODO: ensure null values not displayed in tooltip
        if (yValue !== undefined && yValue !== null) {
          if (closestTimestamp === xValue) {
            // Check if this series is nearby the cursor
            let isNearby = false;

            // For multi-axis: compare in pixel space
            if (cursorPixelY !== undefined && yBufferPixels !== null) {
              const dataPointPixel = chart.convertToPixel({ seriesIndex: seriesIdx }, [datumIdx, yValue]);
              if (dataPointPixel && dataPointPixel[1] !== undefined) {
                const pixelDistance = Math.abs(cursorPixelY - dataPointPixel[1]);
                isNearby = pixelDistance <= yBufferPixels;
              } else {
                // Fallback to data-space comparison for primary axis
                isNearby = cursorY <= yValue + yBuffer && cursorY >= yValue - yBuffer;
              }
            } else {
              // Fallback to original data-space comparison
              isNearby = cursorY <= yValue + yBuffer && cursorY >= yValue - yBuffer;
            }

            if (isNearby) {
              // show fewer bold series in tooltip when many total series
              const minPercentRange = totalSeries > SHOW_FEWER_SERIES_LIMIT ? 2 : 5;
              const percentRangeToCheck = Math.max(minPercentRange, 100 / totalSeries);

              // For isClosestToCursor, also use pixel space for multi-axis
              let isClosestToCursor = false;
              if (cursorPixelY !== undefined) {
                const dataPointPixel = chart.convertToPixel({ seriesIndex: seriesIdx }, [datumIdx, yValue]);
                if (dataPointPixel && dataPointPixel[1] !== undefined) {
                  const pixelDistance = Math.abs(cursorPixelY - dataPointPixel[1]);
                  // Use percentage of buffer for "closest" determination
                  const tightBufferPixels = (yBufferPixels ?? 50) * (percentRangeToCheck / 100);
                  isClosestToCursor = pixelDistance <= Math.max(tightBufferPixels, 5);
                } else {
                  isClosestToCursor = isWithinPercentageRange({
                    valueToCheck: cursorY,
                    baseValue: yValue,
                    percentage: percentRangeToCheck,
                  });
                }
              } else {
                isClosestToCursor = isWithinPercentageRange({
                  valueToCheck: cursorY,
                  baseValue: yValue,
                  percentage: percentRangeToCheck,
                });
              }

              if (isClosestToCursor) {
                // shows as bold in tooltip, customize 'emphasis' options in getTimeSeries util
                emphasizedSeriesIndexes.push(seriesIdx);

                // Used to determine which datapoint to apply select styles to.
                // Accounts for cases where lines may be rendered directly on top of eachother.
                const duplicateValuesCount = yValueCounts.get(yValue) ?? 0;
                yValueCounts.set(yValue, duplicateValuesCount + 1);
                if (duplicateValuesCount > 0) {
                  duplicateDatapoints.push({
                    seriesIndex: seriesIdx,
                    dataIndex: datumIdx,
                    seriesName: currentSeriesName,
                    yValue: yValue,
                  });
                }

                // keep track of all bold datapoints in tooltip so that 'select' state only applied to topmost
                emphasizedDatapoints.push({
                  seriesIndex: seriesIdx,
                  dataIndex: datumIdx,
                  seriesName: currentSeriesName,
                  yValue: yValue,
                });
              } else {
                nonEmphasizedSeriesIndexes.push(seriesIdx);
                // ensure series far away from cursor are not highlighted
                chart.dispatchAction({
                  type: 'downplay',
                  seriesIndex: seriesIdx,
                });
              }
              const formattedY = formatValue(yValue, seriesFormat);
              currentNearbySeriesData.push({
                seriesIdx: seriesIdx,
                datumIdx: datumIdx,
                seriesName: currentSeriesName,
                date: closestTimestamp,
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

  batchDispatchNearbySeriesActions(
    chart,
    nearbySeriesIndexes,
    emphasizedSeriesIndexes,
    nonEmphasizedSeriesIndexes,
    emphasizedDatapoints,
    duplicateDatapoints
  );

  return currentNearbySeriesData;
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
  format?: FormatOptions
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

  // mousemove position undefined when not hovering over chart canvas
  if (mousePos.plotCanvas.x === undefined || mousePos.plotCanvas.y === undefined) return EMPTY_TOOLTIP_DATA;

  const cursorPixelY = mousePos.plotCanvas.y;
  const pointInGrid = getPointInGrid(mousePos.plotCanvas.x, cursorPixelY, chart);
  if (pointInGrid !== null) {
    const chartModel = chart['_model'];
    const yAxisScale = chartModel.getComponent('yAxis').axis.scale;
    const isLogScale = yAxisScale.type === 'log';
    let yInterval = yAxisScale._interval;
    // For logarithmic scales, convert the log interval to actual data range
    if (isLogScale && yAxisScale.base) {
      const logBase = yAxisScale.base;
      const extent = yAxisScale._extent;
      // Calculate actual data range from log extent
      // extent is in log space (e.g., [0, 2] for 10^0 to 10^2)
      const actualMin = logBase ** extent[0];
      const actualMax = logBase ** extent[1];
      // Use a fraction of the actual range as the interval
      yInterval = (actualMax - actualMin) / 100;
    }
    const totalSeries = data.length;
    const yBuffer = getYBuffer({ yInterval, totalSeries, showAllSeries });

    // Detect if chart has multiple Y-axes by checking if any series uses yAxisIndex > 0
    const hasMultipleYAxes = seriesMapping.some((series) => series.yAxisIndex !== undefined && series.yAxisIndex > 0);

    return checkforNearbyTimeSeries(
      data,
      seriesMapping,
      pointInGrid,
      yBuffer,
      chart,
      format,
      seriesFormatMap,
      hasMultipleYAxes ? cursorPixelY : undefined
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
}: {
  valueToCheck: number;
  baseValue: number;
  percentage: number;
}): boolean {
  const range = (percentage / 100) * baseValue;
  const lowerBound = baseValue - range;
  const upperBound = baseValue + range;
  return valueToCheck >= lowerBound && valueToCheck <= upperBound;
}

/*
 * Get range to check within for nearby series to show in tooltip.
 */
export function getYBuffer({
  yInterval,
  totalSeries,
  showAllSeries = false,
}: {
  yInterval: number;
  totalSeries: number;
  showAllSeries?: boolean;
}): number {
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
