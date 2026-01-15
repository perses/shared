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

import merge from 'lodash/merge';
import type { XAXisComponentOption, YAXisComponentOption } from 'echarts';
import { formatValue, FormatOptions } from '@perses-dev/core';

export interface YAxisConfig {
  format?: FormatOptions;
  position?: 'left' | 'right';
  show?: boolean;
  min?: number;
  max?: number;
}

// Average character width in pixels (approximate for typical UI fonts)
const AVG_CHAR_WIDTH = 7;
// Base padding for axis labels (spacing, axis line, etc.)
const AXIS_LABEL_PADDING = 12;

/**
 * Estimate the pixel width needed for an axis label based on the formatted max value.
 * This provides dynamic spacing that adapts to the actual data scale.
 */
function estimateLabelWidth(format: FormatOptions | undefined, maxValue: number): number {
  const formattedLabel = formatValue(maxValue, format);
  return formattedLabel.length * AVG_CHAR_WIDTH + AXIS_LABEL_PADDING;
}

/*
 * Populate yAxis or xAxis properties, returns an Array since multiple axes will be supported in the future
 */
export function getFormattedAxis(axis?: YAXisComponentOption | XAXisComponentOption, unit?: FormatOptions): unknown[] {
  const AXIS_DEFAULT = {
    type: 'value',
    boundaryGap: [0, '10%'],
    axisLabel: {
      formatter: (value: number): string => {
        return formatValue(value, unit);
      },
    },
  };
  return [merge(AXIS_DEFAULT, axis)];
}

/**
 * Create multiple Y axes configurations for ECharts
 * The first axis (index 0) is always on the left side (default axis from panel settings)
 * Additional axes are placed on the right side
 *
 * @param baseAxis - Base axis configuration from panel settings
 * @param baseFormat - Format for the base/default Y axis
 * @param additionalFormats - Array of formats for additional right-side Y axes
 * @param maxValues - Optional array of max values for each additional format (used to compute dynamic label widths)
 */
export function getFormattedMultipleYAxes(
  baseAxis: YAXisComponentOption | undefined,
  baseFormat: FormatOptions | undefined,
  additionalFormats: FormatOptions[],
  maxValues?: number[]
): YAXisComponentOption[] {
  const axes: YAXisComponentOption[] = [];

  // Base/default Y axis (left side)
  const baseAxisConfig: YAXisComponentOption = merge(
    {
      type: 'value',
      position: 'left',
      boundaryGap: [0, '10%'],
      axisLabel: {
        formatter: (value: number): string => {
          return formatValue(value, baseFormat);
        },
      },
    },
    baseAxis
  );
  axes.push(baseAxisConfig);

  // Calculate cumulative offsets based on actual formatted label widths
  let cumulativeOffset = 0;

  // Additional Y axes (right side) for each unique format
  additionalFormats.forEach((format, index) => {
    // For subsequent axes, add the width of the previous axis's labels
    if (index > 0 && maxValues) {
      const prevMaxValue = maxValues[index - 1] ?? 1000;
      cumulativeOffset += estimateLabelWidth(additionalFormats[index - 1], prevMaxValue);
    }

    const rightAxisConfig: YAXisComponentOption = {
      type: 'value',
      position: 'right',
      // Dynamic offset based on cumulative width of preceding axis labels
      offset: cumulativeOffset,
      boundaryGap: [0, '10%'],
      axisLabel: {
        formatter: (value: number): string => {
          return formatValue(value, format);
        },
      },
      splitLine: {
        show: false, // Hide grid lines for right-side axes to reduce visual noise
      },
    };
    axes.push(rightAxisConfig);
  });

  return axes;
}
