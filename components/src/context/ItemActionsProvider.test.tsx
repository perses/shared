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

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode } from 'react';
import { ItemActionsProvider, useItemActions } from './ItemActionsProvider';

// Test component that exposes action state and operations
function TestConsumer({
  onRender,
}: {
  onRender?: (state: ReturnType<typeof useItemActions<string>>) => void;
}): JSX.Element {
  const actions = useItemActions<string>();
  onRender?.(actions);

  const deleteStatus = actions.actionStatuses.get('delete');
  const deleteItemStatus = deleteStatus?.itemStatuses?.get('item-1');

  return (
    <div>
      <div data-testid="has-context">{String(actions.hasContext)}</div>
      <div data-testid="action-count">{actions.actionStatuses.size}</div>
      <div data-testid="delete-loading">{String(deleteStatus?.loading ?? false)}</div>
      <div data-testid="delete-error">{deleteStatus?.error?.message ?? ''}</div>
      <div data-testid="delete-success">{String(deleteStatus?.success ?? false)}</div>
      <div data-testid="delete-item-1-loading">{String(deleteItemStatus?.loading ?? false)}</div>
      <div data-testid="delete-item-1-error">{deleteItemStatus?.error?.message ?? ''}</div>
      <div data-testid="delete-item-1-success">{String(deleteItemStatus?.success ?? false)}</div>
      <button data-testid="set-action-loading" onClick={() => actions.setActionStatus('delete', { loading: true })}>
        Set Action Loading
      </button>
      <button
        data-testid="set-action-success"
        onClick={() => actions.setActionStatus('delete', { loading: false, success: true })}
      >
        Set Action Success
      </button>
      <button
        data-testid="set-action-error"
        onClick={() => actions.setActionStatus('delete', { loading: false, error: new Error('Delete failed') })}
      >
        Set Action Error
      </button>
      <button
        data-testid="set-item-loading"
        onClick={() => actions.setActionStatus('delete', { loading: true }, 'item-1')}
      >
        Set Item Loading
      </button>
      <button
        data-testid="set-item-success"
        onClick={() => actions.setActionStatus('delete', { loading: false, success: true }, 'item-1')}
      >
        Set Item Success
      </button>
      <button
        data-testid="set-item-error"
        onClick={() => actions.setActionStatus('delete', { loading: false, error: new Error('Item failed') }, 'item-1')}
      >
        Set Item Error
      </button>
      <button data-testid="clear-action" onClick={() => actions.clearActionStatus('delete')}>
        Clear Action
      </button>
      <button data-testid="clear-all" onClick={() => actions.clearActionStatus()}>
        Clear All
      </button>
    </div>
  );
}

describe('ItemActionsProvider', () => {
  describe('without provider', () => {
    it('should return hasContext as false when used outside provider', () => {
      render(<TestConsumer />);

      expect(screen.getByTestId('has-context')).toHaveTextContent('false');
      expect(screen.getByTestId('action-count')).toHaveTextContent('0');
    });

    it('should have no-op functions when used outside provider', () => {
      render(<TestConsumer />);

      // These should not throw and should not change state
      userEvent.click(screen.getByTestId('set-action-loading'));
      userEvent.click(screen.getByTestId('set-item-loading'));
      userEvent.click(screen.getByTestId('clear-action'));

      expect(screen.getByTestId('action-count')).toHaveTextContent('0');
      expect(screen.getByTestId('delete-loading')).toHaveTextContent('false');
    });
  });

  const renderWithProvider = (children: ReactNode): ReturnType<typeof render> => {
    return render(<ItemActionsProvider>{children}</ItemActionsProvider>);
  };

  describe('with provider', () => {
    it('should return hasContext as true when used inside provider', () => {
      renderWithProvider(<TestConsumer />);

      expect(screen.getByTestId('has-context')).toHaveTextContent('true');
    });

    it('should start with empty action statuses', () => {
      renderWithProvider(<TestConsumer />);

      expect(screen.getByTestId('action-count')).toHaveTextContent('0');
      expect(screen.getByTestId('delete-loading')).toHaveTextContent('false');
      expect(screen.getByTestId('delete-success')).toHaveTextContent('false');
    });

    describe('setActionStatus - action-level', () => {
      it('should set loading state for action', async () => {
        renderWithProvider(<TestConsumer />);

        userEvent.click(screen.getByTestId('set-action-loading'));

        await waitFor(() => {
          expect(screen.getByTestId('delete-loading')).toHaveTextContent('true');
        });
        expect(screen.getByTestId('action-count')).toHaveTextContent('1');
      });

      it('should set success state for action', async () => {
        renderWithProvider(<TestConsumer />);

        userEvent.click(screen.getByTestId('set-action-success'));

        await waitFor(() => {
          expect(screen.getByTestId('delete-success')).toHaveTextContent('true');
        });
        expect(screen.getByTestId('delete-loading')).toHaveTextContent('false');
      });

      it('should set error state for action', async () => {
        renderWithProvider(<TestConsumer />);

        userEvent.click(screen.getByTestId('set-action-error'));

        await waitFor(() => {
          expect(screen.getByTestId('delete-error')).toHaveTextContent('Delete failed');
        });
        expect(screen.getByTestId('delete-loading')).toHaveTextContent('false');
      });

      it('should update existing action status', async () => {
        renderWithProvider(<TestConsumer />);

        userEvent.click(screen.getByTestId('set-action-loading'));
        await waitFor(() => {
          expect(screen.getByTestId('delete-loading')).toHaveTextContent('true');
        });

        userEvent.click(screen.getByTestId('set-action-success'));
        await waitFor(() => {
          expect(screen.getByTestId('delete-success')).toHaveTextContent('true');
        });
        expect(screen.getByTestId('delete-loading')).toHaveTextContent('false');
      });
    });

    describe('setActionStatus - item-level', () => {
      it('should set loading state for item', async () => {
        renderWithProvider(<TestConsumer />);

        userEvent.click(screen.getByTestId('set-item-loading'));

        await waitFor(() => {
          expect(screen.getByTestId('delete-item-1-loading')).toHaveTextContent('true');
        });
        expect(screen.getByTestId('action-count')).toHaveTextContent('1');
      });

      it('should set success state for item', async () => {
        renderWithProvider(<TestConsumer />);

        userEvent.click(screen.getByTestId('set-item-success'));

        await waitFor(() => {
          expect(screen.getByTestId('delete-item-1-success')).toHaveTextContent('true');
        });
        expect(screen.getByTestId('delete-item-1-loading')).toHaveTextContent('false');
      });

      it('should set error state for item', async () => {
        renderWithProvider(<TestConsumer />);

        userEvent.click(screen.getByTestId('set-item-error'));

        await waitFor(() => {
          expect(screen.getByTestId('delete-item-1-error')).toHaveTextContent('Item failed');
        });
        expect(screen.getByTestId('delete-item-1-loading')).toHaveTextContent('false');
      });

      it('should not affect action-level status when setting item status', async () => {
        renderWithProvider(<TestConsumer />);

        userEvent.click(screen.getByTestId('set-action-loading'));
        await waitFor(() => {
          expect(screen.getByTestId('delete-loading')).toHaveTextContent('true');
        });

        userEvent.click(screen.getByTestId('set-item-success'));
        await waitFor(() => {
          expect(screen.getByTestId('delete-item-1-success')).toHaveTextContent('true');
        });

        // Action-level loading should still be true
        expect(screen.getByTestId('delete-loading')).toHaveTextContent('true');
      });

      it('should maintain multiple item statuses', async () => {
        let capturedState: ReturnType<typeof useItemActions<string>> | undefined;
        renderWithProvider(
          <TestConsumer
            onRender={(state) => {
              capturedState = state;
            }}
          />
        );

        userEvent.click(screen.getByTestId('set-item-loading'));
        await waitFor(() => {
          expect(screen.getByTestId('delete-item-1-loading')).toHaveTextContent('true');
        });

        // Manually set another item status
        capturedState?.setActionStatus('delete', { loading: true }, 'item-2');

        await waitFor(() => {
          const deleteStatus = capturedState?.actionStatuses.get('delete');
          expect(deleteStatus?.itemStatuses?.size).toBe(2);
          expect(deleteStatus?.itemStatuses?.get('item-1')?.loading).toBe(true);
          expect(deleteStatus?.itemStatuses?.get('item-2')?.loading).toBe(true);
        });
      });
    });

    describe('clearActionStatus', () => {
      it('should clear specific action status', async () => {
        renderWithProvider(<TestConsumer />);

        userEvent.click(screen.getByTestId('set-action-loading'));
        await waitFor(() => {
          expect(screen.getByTestId('delete-loading')).toHaveTextContent('true');
        });
        expect(screen.getByTestId('action-count')).toHaveTextContent('1');

        userEvent.click(screen.getByTestId('clear-action'));

        await waitFor(() => {
          expect(screen.getByTestId('action-count')).toHaveTextContent('0');
        });
        expect(screen.getByTestId('delete-loading')).toHaveTextContent('false');
      });

      it('should clear all action statuses', async () => {
        let capturedState: ReturnType<typeof useItemActions<string>> | undefined;
        renderWithProvider(
          <TestConsumer
            onRender={(state) => {
              capturedState = state;
            }}
          />
        );

        userEvent.click(screen.getByTestId('set-action-loading'));
        await waitFor(() => {
          expect(screen.getByTestId('delete-loading')).toHaveTextContent('true');
        });

        // Add another action
        capturedState?.setActionStatus('update', { loading: true });
        await waitFor(() => {
          expect(capturedState?.actionStatuses.size).toBe(2);
        });

        userEvent.click(screen.getByTestId('clear-all'));

        await waitFor(() => {
          expect(screen.getByTestId('action-count')).toHaveTextContent('0');
        });
      });

      it('should not fail when clearing non-existent action', () => {
        renderWithProvider(<TestConsumer />);

        expect(screen.getByTestId('action-count')).toHaveTextContent('0');

        userEvent.click(screen.getByTestId('clear-action'));

        expect(screen.getByTestId('action-count')).toHaveTextContent('0');
      });
    });

    describe('actionStatuses map', () => {
      it('should contain action status with item statuses', async () => {
        let capturedState: ReturnType<typeof useItemActions<string>> | undefined;
        renderWithProvider(
          <TestConsumer
            onRender={(state) => {
              capturedState = state;
            }}
          />
        );

        userEvent.click(screen.getByTestId('set-item-success'));

        await waitFor(() => {
          const deleteStatus = capturedState?.actionStatuses.get('delete');
          expect(deleteStatus?.itemStatuses?.get('item-1')).toEqual({
            loading: false,
            success: true,
          });
        });
      });

      it('should handle multiple actions independently', async () => {
        let capturedState: ReturnType<typeof useItemActions<string>> | undefined;
        renderWithProvider(
          <TestConsumer
            onRender={(state) => {
              capturedState = state;
            }}
          />
        );

        userEvent.click(screen.getByTestId('set-action-loading'));
        await waitFor(() => {
          expect(screen.getByTestId('delete-loading')).toHaveTextContent('true');
        });

        capturedState?.setActionStatus('update', { loading: false, success: true });

        await waitFor(() => {
          expect(capturedState?.actionStatuses.size).toBe(2);
          expect(capturedState?.actionStatuses.get('delete')?.loading).toBe(true);
          expect(capturedState?.actionStatuses.get('update')?.success).toBe(true);
        });
      });
    });
  });

  describe('multiple consumers', () => {
    it('should share action state between consumers', async () => {
      function Consumer1(): JSX.Element {
        const actions = useItemActions<string>();
        const deleteStatus = actions.actionStatuses.get('delete');

        return (
          <div>
            <div data-testid="consumer1-loading">{String(deleteStatus?.loading ?? false)}</div>
            <button
              data-testid="consumer1-set-loading"
              onClick={() => actions.setActionStatus('delete', { loading: true })}
            >
              Set Loading
            </button>
          </div>
        );
      }

      function Consumer2(): JSX.Element {
        const actions = useItemActions<string>();
        const deleteStatus = actions.actionStatuses.get('delete');

        return (
          <div>
            <div data-testid="consumer2-loading">{String(deleteStatus?.loading ?? false)}</div>
          </div>
        );
      }

      render(
        <ItemActionsProvider>
          <Consumer1 />
          <Consumer2 />
        </ItemActionsProvider>
      );

      expect(screen.getByTestId('consumer1-loading')).toHaveTextContent('false');
      expect(screen.getByTestId('consumer2-loading')).toHaveTextContent('false');

      userEvent.click(screen.getByTestId('consumer1-set-loading'));

      await waitFor(() => {
        expect(screen.getByTestId('consumer1-loading')).toHaveTextContent('true');
        expect(screen.getByTestId('consumer2-loading')).toHaveTextContent('true');
      });
    });
  });

  describe('complex scenarios', () => {
    it('should handle mixed action and item statuses', async () => {
      let capturedState: ReturnType<typeof useItemActions<string>> | undefined;
      renderWithProvider(
        <TestConsumer
          onRender={(state) => {
            capturedState = state;
          }}
        />
      );

      // Set action-level loading
      userEvent.click(screen.getByTestId('set-action-loading'));
      await waitFor(() => {
        expect(screen.getByTestId('delete-loading')).toHaveTextContent('true');
      });

      // Set item-level success
      userEvent.click(screen.getByTestId('set-item-success'));
      await waitFor(() => {
        expect(screen.getByTestId('delete-item-1-success')).toHaveTextContent('true');
      });

      // Both should coexist
      const deleteStatus = capturedState?.actionStatuses.get('delete');
      expect(deleteStatus?.loading).toBe(true);
      expect(deleteStatus?.itemStatuses?.get('item-1')?.success).toBe(true);
    });

    it('should handle updating item status multiple times', async () => {
      renderWithProvider(<TestConsumer />);

      userEvent.click(screen.getByTestId('set-item-loading'));
      await waitFor(() => {
        expect(screen.getByTestId('delete-item-1-loading')).toHaveTextContent('true');
      });

      userEvent.click(screen.getByTestId('set-item-success'));
      await waitFor(() => {
        expect(screen.getByTestId('delete-item-1-success')).toHaveTextContent('true');
      });
      expect(screen.getByTestId('delete-item-1-loading')).toHaveTextContent('false');

      userEvent.click(screen.getByTestId('set-item-error'));
      await waitFor(() => {
        expect(screen.getByTestId('delete-item-1-error')).toHaveTextContent('Item failed');
      });
      // Success should be preserved unless explicitly cleared
      expect(screen.getByTestId('delete-item-1-success')).toHaveTextContent('true');
    });
  });
});
