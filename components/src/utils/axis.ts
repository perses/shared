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

import type { XAXisComponentOption, YAXisComponentOption } from 'echarts';
import merge from 'lodash/merge';

import type { FormatOptions } from '../model';
import { formatValue } from '../model';

export interface YAxisConfig {
  format?: FormatOptions;
  position?: 'left' | 'right';
  show?: boolean;
  min?: number;
  max?: number;
}

/** Average width of one character at the 12px axis font, when canvas measurement is unavailable. */
const CHAR_WIDTH_BASE = 7;
/** Extra pixels after each right-axis label so the next axis does not sit on the tick. */
const AXIS_LABEL_PADDING = 16;
/** Four characters, so a short tick ("0", "8%") still clears the tick before the next axis. */
const MIN_AXIS_LABEL_WIDTH = CHAR_WIDTH_BASE * 4;
/** Placeholder max when series data has not produced a max yet (keeps first layout stable). */
const DEFAULT_AXIS_MAX_VALUE = 1000;
/** grid.right when there are no additional right axes (single Y-axis chart). */
const DEFAULT_RIGHT_GRID_PADDING = 20;

function estimateLabelWidth(format: FormatOptions | undefined, maxValue: number): number {
  const formattedLabel = formatValue(maxValue, format);
  const fallbackLabelWidth = Math.max(formattedLabel.length * CHAR_WIDTH_BASE, MIN_AXIS_LABEL_WIDTH);
  if (typeof document === 'undefined') {
    return fallbackLabelWidth;
  }
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      return fallbackLabelWidth;
    }
    context.font = '12px sans-serif';
    return Math.max(context.measureText(formattedLabel).width, MIN_AXIS_LABEL_WIDTH);
  } catch {
    return fallbackLabelWidth;
  }
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

export interface MultipleYAxesLayout {
  axes: YAXisComponentOption[];
  rightGridPadding: number;
}

export function getFormattedMultipleYAxesLayout(
  baseAxis: YAXisComponentOption | undefined,
  baseFormat: FormatOptions | undefined,
  additionalFormats: FormatOptions[],
  maxValues?: number[],
): MultipleYAxesLayout {
  const axes: YAXisComponentOption[] = [];

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
    baseAxis,
  );
  axes.push(baseAxisConfig);

  let cumulativeOffset = 0;
  additionalFormats.forEach((format, index) => {
    const labelWidth = estimateLabelWidth(format, maxValues?.[index] ?? DEFAULT_AXIS_MAX_VALUE) + AXIS_LABEL_PADDING;
    axes.push({
      type: 'value',
      position: 'right',
      offset: cumulativeOffset,
      boundaryGap: [0, '10%'],
      axisLabel: {
        formatter: (value: number): string => {
          return formatValue(value, format);
        },
        hideOverlap: true,
      },
      splitLine: {
        show: false,
      },
      show: baseAxis?.show,
    });
    cumulativeOffset += labelWidth;
  });

  return {
    axes,
    rightGridPadding: cumulativeOffset > 0 ? cumulativeOffset : DEFAULT_RIGHT_GRID_PADDING,
  };
}

export function getFormattedMultipleYAxes(
  baseAxis: YAXisComponentOption | undefined,
  baseFormat: FormatOptions | undefined,
  additionalFormats: FormatOptions[],
  maxValues?: number[],
): YAXisComponentOption[] {
  return getFormattedMultipleYAxesLayout(baseAxis, baseFormat, additionalFormats, maxValues).axes;
}
