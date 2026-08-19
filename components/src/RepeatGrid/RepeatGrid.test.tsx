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

import { render, RenderResult, screen } from '@testing-library/react';
import { ReactNode } from 'react';

import { RepeatGrid, RepeatGridProps } from './RepeatGrid';

type TestItem = { id: string; label: string };

const ITEMS: TestItem[] = [
  { id: 'a', label: 'Item A' },
  { id: 'b', label: 'Item B' },
  { id: 'c', label: 'Item C' },
  { id: 'd', label: 'Item D' },
  { id: 'e', label: 'Item E' },
];

type RenderRepeatGridOpts = Partial<RepeatGridProps<TestItem>>;

const renderRepeatGrid = ({
  repeatItems = ITEMS,
  maxPer = 3,
  gap = 8,
  renderItem = (item): ReactNode => <div data-testid={`item-${item.id}`}>{item.label}</div>,
  containerSx,
  rowSx,
}: RenderRepeatGridOpts = {}): RenderResult => {
  return render(
    <RepeatGrid
      repeatItems={repeatItems}
      maxPer={maxPer}
      gap={gap}
      renderItem={renderItem}
      containerSx={containerSx}
      rowSx={rowSx}
    />,
  );
};

describe('RepeatGrid', () => {
  describe('rendering items', () => {
    it('renders all items', () => {
      renderRepeatGrid();
      for (const item of ITEMS) {
        expect(screen.getByTestId(`item-${item.id}`)).toBeInTheDocument();
      }
    });

    it('renders nothing when repeatItems is empty', () => {
      const { container } = renderRepeatGrid({ repeatItems: [] });
      expect(container.querySelectorAll('[data-testid^="item-"]')).toHaveLength(0);
    });

    it('renders a single item', () => {
      renderRepeatGrid({ repeatItems: [ITEMS[0]!] });
      expect(screen.getByTestId('item-a')).toBeInTheDocument();
    });
  });

  describe('row and column indices', () => {
    it('passes correct rowIndex and colIndex to renderItem', () => {
      const positions: Array<{ id: string; rowIndex: number; colIndex: number }> = [];
      renderRepeatGrid({
        repeatItems: ITEMS.slice(0, 4),
        maxPer: 2,
        renderItem: (item, { rowIndex, colIndex }) => {
          positions.push({ id: item.id, rowIndex, colIndex });
          return <div key={item.id}>{item.label}</div>;
        },
      });

      expect(positions).toEqual([
        { id: 'a', rowIndex: 0, colIndex: 0 },
        { id: 'b', rowIndex: 0, colIndex: 1 },
        { id: 'c', rowIndex: 1, colIndex: 0 },
        { id: 'd', rowIndex: 1, colIndex: 1 },
      ]);
    });

    it('puts all items in one row when maxPer exceeds item count', () => {
      const positions: Array<{ rowIndex: number; colIndex: number }> = [];
      renderRepeatGrid({
        repeatItems: ITEMS.slice(0, 3),
        maxPer: 10,
        renderItem: (item, { rowIndex, colIndex }) => {
          positions.push({ rowIndex, colIndex });
          return <div key={item.id}>{item.label}</div>;
        },
      });

      expect(positions.every((p) => p.rowIndex === 0)).toBe(true);
      expect(positions.map((p) => p.colIndex)).toEqual([0, 1, 2]);
    });
  });

  describe('maxPer behaviour', () => {
    it('distributes 5 items into rows of 3 (2 rows)', () => {
      const rowIndices: number[] = [];
      renderRepeatGrid({
        repeatItems: ITEMS,
        maxPer: 3,
        renderItem: (item, { rowIndex }) => {
          rowIndices.push(rowIndex);
          return <div key={item.id}>{item.label}</div>;
        },
      });

      // Items a,b,c → row 0; items d,e → row 1
      expect(rowIndices).toEqual([0, 0, 0, 1, 1]);
    });

    it('clamps maxPer of 0 to 1 item per row', () => {
      const colIndices: number[] = [];
      renderRepeatGrid({
        repeatItems: ITEMS.slice(0, 3),
        maxPer: 0,
        renderItem: (item, { colIndex }) => {
          colIndices.push(colIndex);
          return <div key={item.id}>{item.label}</div>;
        },
      });

      expect(colIndices).toEqual([0, 0, 0]);
    });

    it('clamps negative maxPer to 1 item per row', () => {
      const colIndices: number[] = [];
      renderRepeatGrid({
        repeatItems: ITEMS.slice(0, 2),
        maxPer: -5,
        renderItem: (item, { colIndex }) => {
          colIndices.push(colIndex);
          return <div key={item.id}>{item.label}</div>;
        },
      });

      expect(colIndices).toEqual([0, 0]);
    });

    it('places all items in a single row when maxPer equals item count', () => {
      const rowIndices: number[] = [];
      renderRepeatGrid({
        repeatItems: ITEMS,
        maxPer: ITEMS.length,
        renderItem: (item, { rowIndex }) => {
          rowIndices.push(rowIndex);
          return <div key={item.id}>{item.label}</div>;
        },
      });

      expect(rowIndices.every((r) => r === 0)).toBe(true);
    });
  });
});
