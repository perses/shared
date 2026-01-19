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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode } from 'react';
import { SelectionProvider, useSelection } from './SelectionProvider';

interface TestItem {
  id: string;
  name: string;
}

// Test component that exposes selection state and actions
function TestConsumer({
  getId,
  onRender,
}: {
  getId?: (item: TestItem, index: number) => string;
  onRender?: (state: ReturnType<typeof useSelection<TestItem, string>>) => void;
}): JSX.Element {
  const selection = useSelection<TestItem, string>({ getId });
  onRender?.(selection);

  return (
    <div>
      <div data-testid="has-context">{String(selection.hasContext)}</div>
      <div data-testid="selection-count">{selection.selectionMap.size}</div>
      <div data-testid="selected-ids">{Array.from(selection.selectionMap.keys()).join(',')}</div>
      <button
        data-testid="toggle-item-1"
        onClick={() => selection.toggleSelection({ id: 'item-1', name: 'Item 1' }, 'item-1')}
      >
        Toggle Item 1
      </button>
      <button
        data-testid="toggle-item-2"
        onClick={() => selection.toggleSelection({ id: 'item-2', name: 'Item 2' }, 'item-2')}
      >
        Toggle Item 2
      </button>
      <button
        data-testid="set-selection"
        onClick={() =>
          selection.setSelection([
            { id: 'item-3', item: { id: 'item-3', name: 'Item 3' } },
            { id: 'item-4', item: { id: 'item-4', name: 'Item 4' } },
          ])
        }
      >
        Set Selection
      </button>
      <button data-testid="remove-item-1" onClick={() => selection.removeFromSelection('item-1')}>
        Remove Item 1
      </button>
      <button data-testid="clear-selection" onClick={() => selection.clearSelection()}>
        Clear
      </button>
      <div data-testid="is-item-1-selected">{String(selection.isSelected({ id: 'item-1', name: 'Item 1' }, 0))}</div>
    </div>
  );
}

describe('SelectionProvider', () => {
  describe('without provider', () => {
    it('should return hasContext as false when used outside provider', () => {
      render(<TestConsumer />);

      expect(screen.getByTestId('has-context')).toHaveTextContent('false');
      expect(screen.getByTestId('selection-count')).toHaveTextContent('0');
    });

    it('should have no-op functions when used outside provider', () => {
      render(<TestConsumer />);

      // These should not throw and should not change state
      userEvent.click(screen.getByTestId('toggle-item-1'));
      userEvent.click(screen.getByTestId('set-selection'));
      userEvent.click(screen.getByTestId('clear-selection'));

      expect(screen.getByTestId('selection-count')).toHaveTextContent('0');
      expect(screen.getByTestId('is-item-1-selected')).toHaveTextContent('false');
    });
  });

  describe('with provider', () => {
    const renderWithProvider = (children: ReactNode): ReturnType<typeof render> => {
      return render(<SelectionProvider>{children}</SelectionProvider>);
    };

    it('should return hasContext as true when used inside provider', () => {
      renderWithProvider(<TestConsumer />);

      expect(screen.getByTestId('has-context')).toHaveTextContent('true');
    });

    it('should start with empty selection', () => {
      renderWithProvider(<TestConsumer />);

      expect(screen.getByTestId('selection-count')).toHaveTextContent('0');
      expect(screen.getByTestId('selected-ids')).toHaveTextContent('');
    });

    describe('toggleSelection', () => {
      it('should add item to selection when not selected', () => {
        renderWithProvider(<TestConsumer />);

        userEvent.click(screen.getByTestId('toggle-item-1'));

        expect(screen.getByTestId('selection-count')).toHaveTextContent('1');
        expect(screen.getByTestId('selected-ids')).toHaveTextContent('item-1');
      });

      it('should remove item from selection when already selected', () => {
        renderWithProvider(<TestConsumer />);

        userEvent.click(screen.getByTestId('toggle-item-1'));
        expect(screen.getByTestId('selection-count')).toHaveTextContent('1');

        userEvent.click(screen.getByTestId('toggle-item-1'));
        expect(screen.getByTestId('selection-count')).toHaveTextContent('0');
        expect(screen.getByTestId('selected-ids')).toHaveTextContent('');
      });

      it('should allow multiple items to be selected', () => {
        renderWithProvider(<TestConsumer />);

        userEvent.click(screen.getByTestId('toggle-item-1'));
        userEvent.click(screen.getByTestId('toggle-item-2'));

        expect(screen.getByTestId('selection-count')).toHaveTextContent('2');
        expect(screen.getByTestId('selected-ids')).toHaveTextContent('item-1,item-2');
      });
    });

    describe('setSelection', () => {
      it('should replace entire selection with new items', () => {
        renderWithProvider(<TestConsumer />);

        // First add some items
        userEvent.click(screen.getByTestId('toggle-item-1'));
        userEvent.click(screen.getByTestId('toggle-item-2'));
        expect(screen.getByTestId('selection-count')).toHaveTextContent('2');

        // Now set a new selection
        userEvent.click(screen.getByTestId('set-selection'));

        expect(screen.getByTestId('selection-count')).toHaveTextContent('2');
        expect(screen.getByTestId('selected-ids')).toHaveTextContent('item-3,item-4');
      });
    });

    describe('removeFromSelection', () => {
      it('should remove specific item from selection', () => {
        renderWithProvider(<TestConsumer />);

        userEvent.click(screen.getByTestId('toggle-item-1'));
        userEvent.click(screen.getByTestId('toggle-item-2'));
        expect(screen.getByTestId('selection-count')).toHaveTextContent('2');

        userEvent.click(screen.getByTestId('remove-item-1'));

        expect(screen.getByTestId('selection-count')).toHaveTextContent('1');
        expect(screen.getByTestId('selected-ids')).toHaveTextContent('item-2');
      });

      it('should not change selection when removing non-existent item', () => {
        renderWithProvider(<TestConsumer />);

        userEvent.click(screen.getByTestId('toggle-item-2'));
        expect(screen.getByTestId('selection-count')).toHaveTextContent('1');

        userEvent.click(screen.getByTestId('remove-item-1'));

        expect(screen.getByTestId('selection-count')).toHaveTextContent('1');
        expect(screen.getByTestId('selected-ids')).toHaveTextContent('item-2');
      });
    });

    describe('clearSelection', () => {
      it('should remove all items from selection', () => {
        renderWithProvider(<TestConsumer />);

        userEvent.click(screen.getByTestId('toggle-item-1'));
        userEvent.click(screen.getByTestId('toggle-item-2'));
        expect(screen.getByTestId('selection-count')).toHaveTextContent('2');

        userEvent.click(screen.getByTestId('clear-selection'));

        expect(screen.getByTestId('selection-count')).toHaveTextContent('0');
        expect(screen.getByTestId('selected-ids')).toHaveTextContent('');
      });
    });

    describe('isSelected', () => {
      it('should return true when item is selected', () => {
        renderWithProvider(<TestConsumer getId={(item) => item.id} />);

        userEvent.click(screen.getByTestId('toggle-item-1'));

        expect(screen.getByTestId('is-item-1-selected')).toHaveTextContent('true');
      });

      it('should return false when item is not selected', () => {
        renderWithProvider(<TestConsumer getId={(item) => item.id} />);

        expect(screen.getByTestId('is-item-1-selected')).toHaveTextContent('false');
      });

      it('should use custom getId function', async () => {
        const customGetId = jest.fn((item: TestItem) => item.id);
        renderWithProvider(<TestConsumer getId={customGetId} />);

        userEvent.click(screen.getByTestId('toggle-item-1'));

        // Check isSelected which uses the getId function
        expect(screen.getByTestId('is-item-1-selected')).toHaveTextContent('true');
      });

      it('should use index as default id when no getId provided', () => {
        function IndexBasedConsumer(): JSX.Element {
          const selection = useSelection<TestItem, number>();

          return (
            <div>
              <button data-testid="toggle-index-0" onClick={() => selection.toggleSelection({ id: 'a', name: 'A' }, 0)}>
                Toggle Index 0
              </button>
              <div data-testid="is-index-0-selected">{String(selection.isSelected({ id: 'a', name: 'A' }, 0))}</div>
              <div data-testid="is-index-1-selected">{String(selection.isSelected({ id: 'b', name: 'B' }, 1))}</div>
            </div>
          );
        }

        renderWithProvider(<IndexBasedConsumer />);

        expect(screen.getByTestId('is-index-0-selected')).toHaveTextContent('false');
        expect(screen.getByTestId('is-index-1-selected')).toHaveTextContent('false');
      });
    });

    describe('selectionMap', () => {
      it('should contain selected items with their data', () => {
        let capturedState: ReturnType<typeof useSelection<TestItem, string>> | undefined;
        renderWithProvider(
          <TestConsumer
            getId={(item) => item.id}
            onRender={(state) => {
              capturedState = state;
            }}
          />
        );

        userEvent.click(screen.getByTestId('toggle-item-1'));

        expect(capturedState?.selectionMap.get('item-1')).toEqual({ id: 'item-1', name: 'Item 1' });
      });
    });
  });

  describe('multiple consumers', () => {
    it('should share selection state between consumers', () => {
      function Consumer1(): JSX.Element {
        const selection = useSelection<TestItem, string>({ getId: (item) => item.id });
        return (
          <div>
            <div data-testid="consumer1-count">{selection.selectionMap.size}</div>
            <button
              data-testid="consumer1-toggle"
              onClick={() => selection.toggleSelection({ id: 'shared', name: 'Shared' }, 'shared')}
            >
              Toggle
            </button>
          </div>
        );
      }

      function Consumer2(): JSX.Element {
        const selection = useSelection<TestItem, string>({ getId: (item) => item.id });
        return (
          <div>
            <div data-testid="consumer2-count">{selection.selectionMap.size}</div>
          </div>
        );
      }

      render(
        <SelectionProvider>
          <Consumer1 />
          <Consumer2 />
        </SelectionProvider>
      );

      expect(screen.getByTestId('consumer1-count')).toHaveTextContent('0');
      expect(screen.getByTestId('consumer2-count')).toHaveTextContent('0');

      userEvent.click(screen.getByTestId('consumer1-toggle'));

      expect(screen.getByTestId('consumer1-count')).toHaveTextContent('1');
      expect(screen.getByTestId('consumer2-count')).toHaveTextContent('1');
    });
  });
});
