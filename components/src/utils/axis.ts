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

// Character width multipliers (approximate for typical UI fonts)
const CHAR_WIDTH_BASE = 8;
const CHAR_WIDTH_MULTIPLIERS = {
  dot: 0.5, // Dots and periods are very narrow
  uppercase: 0.9,
  lowercase: 0.65, // Lowercase letters slightly narrower
  digit: 0.7,
  symbol: 0.7, // Symbols like %, $, etc.
  space: 0.5, // Spaces
};
const AXIS_LABEL_PADDING = 14;

/**
 * Calculate the width of a single character based on its type
 */
function getCharWidth(char?: string): number {
  if (!char || char.length === 0) {
    return 0;
  }

  if (char === '.' || char === ',' || char === ':') {
    return CHAR_WIDTH_BASE * CHAR_WIDTH_MULTIPLIERS.dot;
  }
  if (char === ' ') {
    return CHAR_WIDTH_BASE * CHAR_WIDTH_MULTIPLIERS.space;
  }
  if (char >= 'A' && char <= 'Z') {
    return CHAR_WIDTH_BASE * CHAR_WIDTH_MULTIPLIERS.uppercase;
  }
  if (char >= 'a' && char <= 'z') {
    return CHAR_WIDTH_BASE * CHAR_WIDTH_MULTIPLIERS.lowercase;
  }
  if (char >= '0' && char <= '9') {
    return CHAR_WIDTH_BASE * CHAR_WIDTH_MULTIPLIERS.digit;
  }
  // Symbols like %, $, -, +, etc.
  return CHAR_WIDTH_BASE * CHAR_WIDTH_MULTIPLIERS.symbol;
}

/**
 * Estimate the pixel width needed for an axis label based on the formatted max value.
 * This provides dynamic spacing that adapts to the actual data scale.
 */
function estimateLabelWidth(format: FormatOptions | undefined, maxValue: number): number {
  const formattedLabel = formatValue(maxValue, format);
  // Calculate width based on individual character types
  let totalWidth = 0;
  for (let i = 0; i < formattedLabel.length; i++) {
    totalWidth += getCharWidth(formattedLabel[i]);
  }
  return totalWidth;
}

/*
 * Populate yAxis or xAxis properties, returns an Array since multiple axes are supported
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
      show: baseAxis?.show,
    };
    axes.push(rightAxisConfig);
    // For subsequent axes, add the width of the previous axis's labels
    if (maxValues) {
      cumulativeOffset += estimateLabelWidth(format, maxValues[index] ?? 1000) + AXIS_LABEL_PADDING;
    }
  });

  return axes;
}
