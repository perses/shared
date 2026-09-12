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

export interface TransformCommonSpec {
  disabled?: boolean;
}

export interface JoinByColumnValueTransform {
  kind: 'JoinByColumnValue';
  spec: TransformCommonSpec & {
    columns: string[];
  };
}

export interface ExtractColumnFieldsTransform {
  kind: 'ExtractColumnFields';
  spec: TransformCommonSpec & {
    column: string;
    format: 'JSON' | 'Regex' | 'SplitByDelimiter' | 'KeyValuePairs';
    matcher?: string;
  };
}

export interface MergeColumnsTransform {
  kind: 'MergeColumns';
  spec: TransformCommonSpec & {
    columns: string[];
    name: string;
  };
}

export interface MergeIndexedColumnsTransform {
  kind: 'MergeIndexedColumns';
  spec: TransformCommonSpec & {
    column: string;
  };
}

export interface MergeSeriesTransform {
  kind: 'MergeSeries';
  spec: TransformCommonSpec;
}

/**
 * Pivot multi-series table rows into a time × label matrix
 * (Grafana groupingToMatrix parity).
 *
 * Example: columnLabel=farm_short, rowField=timestamp
 * → one row per timestamp, one column per farm_short value.
 */
export interface PivotByLabelTransform {
  kind: 'PivotByLabel';
  spec: TransformCommonSpec & {
    /** Label/column that becomes dynamic column headers (e.g. farm_short). */
    columnLabel: string;
    /** Field for row identity (default: timestamp). */
    rowField?: string;
    /** Value field name (default: value). */
    valueField?: string;
    /** Name of the row column after pivot (default: rowField). */
    rowColumnName?: string;
  };
}

export type Transform =
  | JoinByColumnValueTransform
  | MergeColumnsTransform
  | MergeIndexedColumnsTransform
  | MergeSeriesTransform
  | ExtractColumnFieldsTransform
  | PivotByLabelTransform;

// Can be moved somewhere else
export const TRANSFORM_TEXT = {
  JoinByColumnValue: 'Join by column value',
  MergeColumns: 'Merge columns',
  MergeIndexedColumns: 'Merge indexed columns',
  MergeSeries: 'Merge series',
  ExtractColumnFields: 'Extract column fields',
  PivotByLabel: 'Pivot by label',
};
