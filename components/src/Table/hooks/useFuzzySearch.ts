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

import type { FuzzyMatchThreshold } from '@perses-dev/components';
import { rankings, rankItem } from '@tanstack/match-sorter-utils';
import type { ExpandedState, FilterFn, RowData, TableOptions } from '@tanstack/react-table';
import { tableOptions } from '@tanstack/react-table';
import type { SetStateAction } from 'react';
import { useCallback, useState } from 'react';

import type { TableFeatures } from '../model/table-model';

const getFuzzyFilterFunction =
  <TableData extends RowData>(threshold: FuzzyMatchThreshold): FilterFn<TableFeatures, TableData> =>
  (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value, { threshold: rankings[threshold] });
    addMeta?.({ itemRank });
    return itemRank.passed;
  };

export interface UseFuzzySearchResult<TableData extends RowData> {
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  fuzzySearchOptions: Pick<
    TableOptions<TableFeatures, TableData>,
    'globalFilterFn' | 'filterFromLeafRows' | 'onGlobalFilterChange'
  >;
}

/**
 * Returns fuzzy search state and the corresponding `useTable` options.
 * Filter options are disabled when `showSearch` is falsy.
 */
export function useFuzzySearch<TableData extends RowData>(
  isSearchEnabled: boolean | undefined,
  threshold: FuzzyMatchThreshold,
  expanded: ExpandedState,
  setExpanded: (value: SetStateAction<ExpandedState>) => void,
): UseFuzzySearchResult<TableData> {
  const [globalFilter, setGlobalFilter] = useState('');
  const [prevExpandedState, setPrevExpandedState] = useState<ExpandedState>(expanded);

  // expand all rows when a search query is entered, and restore previous expansion state when the query is cleared
  const handleGlobalFilterChange = useCallback(
    (value: string): void => {
      setGlobalFilter((prev) => {
        if (!prev) {
          setPrevExpandedState(expanded);
          setExpanded(true);
        } else if (prev && !value) {
          setExpanded(prevExpandedState);
        }
        return value;
      });
    },
    [expanded, prevExpandedState, setExpanded],
  );
  return {
    globalFilter,
    setGlobalFilter: handleGlobalFilterChange,
    fuzzySearchOptions: tableOptions<TableFeatures, TableData>({
      globalFilterFn: isSearchEnabled ? getFuzzyFilterFunction<TableData>(threshold) : undefined,
      filterFromLeafRows: isSearchEnabled,
      onGlobalFilterChange: handleGlobalFilterChange,
    }),
  };
}
