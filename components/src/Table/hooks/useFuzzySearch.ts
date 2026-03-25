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

import { FilterFn, getFilteredRowModel, TableOptions } from '@tanstack/react-table';
import { rankItem } from '@tanstack/match-sorter-utils';
import { useState } from 'react';

const fuzzyFilter: FilterFn<unknown> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta({ itemRank });
  return itemRank.passed;
};

export interface UseFuzzySearchResult<TableData> {
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  fuzzySearchOptions: Pick<
    TableOptions<TableData>,
    'filterFns' | 'globalFilterFn' | 'getFilteredRowModel' | 'filterFromLeafRows' | 'onGlobalFilterChange'
  >;
}

/**
 * Returns fuzzy search state and the corresponding `useReactTable` options.
 * Filter options are disabled when `showSearch` is falsy.
 */
export function useFuzzySearch<TableData>(showSearch: boolean | undefined): UseFuzzySearchResult<TableData> {
  const [globalFilter, setGlobalFilter] = useState('');

  return {
    globalFilter,
    setGlobalFilter,
    fuzzySearchOptions: {
      filterFns: { fuzzy: fuzzyFilter },
      globalFilterFn: showSearch ? 'fuzzy' : undefined,
      getFilteredRowModel: showSearch ? getFilteredRowModel() : undefined,
      filterFromLeafRows: showSearch,
      onGlobalFilterChange: setGlobalFilter,
    },
  };
}
