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

import { Box, SxProps, Theme } from '@mui/material';
import { ReactNode, useMemo } from 'react';

export interface RepeatGridProps<T> {
  repeatItems: T[];
  maxPer: number;
  gap: number;
  renderItem: (item: T, options: { rowIndex: number; colIndex: number }) => ReactNode;
  containerSx?: SxProps<Theme>;
  rowSx?: SxProps<Theme>;
}

export function RepeatGrid<T>({
  repeatItems,
  maxPer,
  gap,
  renderItem,
  containerSx,
  rowSx,
}: RepeatGridProps<T>): ReactNode {
  const { rows, perRow } = useMemo(() => {
    const perRow = Math.max(1, maxPer);
    const rows: T[][] = [];
    for (let i = 0; i < repeatItems.length; i += perRow) {
      rows.push(repeatItems.slice(i, i + perRow));
    }

    return { rows, perRow };
  }, [maxPer, repeatItems]);

  return (
    <Box
      sx={[
        { display: 'flex', flexDirection: 'column', width: '100%', height: '100%', gap: `${gap}px` },
        ...(Array.isArray(containerSx) ? containerSx : [containerSx]),
      ]}
    >
      {rows.map((rowItems, rowIndex) => (
        <Box key={rowIndex} sx={[{ display: 'flex', gap: `${gap}px` }, ...(Array.isArray(rowSx) ? rowSx : [rowSx])]}>
          {rowItems.map((item, colIndex) => (
            <Box
              key={`${rowIndex}-${colIndex}`}
              sx={{
                width: `calc((100% - ${gap * (perRow - 1)}px) / ${perRow})`,
                overflow: 'hidden',
              }}
            >
              {renderItem(item, { rowIndex, colIndex })}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}
