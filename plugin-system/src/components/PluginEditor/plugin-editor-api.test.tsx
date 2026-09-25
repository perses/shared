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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RenderHookResult } from '@testing-library/react';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { StrictMode, useState } from 'react';
import type { Mock } from 'vitest';

import { PluginRegistryContext } from '../../runtime';
import type { PluginEditorSelection, PluginEditorValue } from './plugin-editor-api';
import { usePluginEditor } from './plugin-editor-api';

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

function setup(): RenderHookResult<ReturnType<typeof usePluginEditor> & { value: PluginEditorValue }, unknown> & {
  getPlugin: Mock;
  onChange: Mock;
  createInitialOptions: Mock;
} {
  const createInitialOptions = vi.fn(() => ({ initialized: true }));
  const getPlugin = vi.fn().mockResolvedValue({ createInitialOptions });
  const onChange = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }): ReactNode {
    const [registry] = useState(() => ({ getPlugin, listPluginMetadata: vi.fn() }));
    return (
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <PluginRegistryContext.Provider value={registry}>{children}</PluginRegistryContext.Provider>
        </QueryClientProvider>
      </StrictMode>
    );
  }
  const hook = renderHook(
    () => {
      const [value, setValue] = useState<PluginEditorValue>({
        selection: { type: 'Variable', kind: 'Initial' },
        spec: { original: true },
      });
      const editor = usePluginEditor({
        pluginTypes: ['Variable'],
        // Match form callers that rebuild value and omit metadata on every render.
        value: { selection: { type: value.selection.type, kind: value.selection.kind }, spec: value.spec },
        onChange: (next) => {
          onChange(next);
          // Fail boundedly instead of hanging if the repeated-update regression returns.
          if (onChange.mock.calls.length > 10) throw new Error('Repeated plugin initialization');
          setValue({ selection: { type: next.selection.type, kind: next.selection.kind }, spec: next.spec });
        },
      });
      return { ...editor, value };
    },
    { wrapper: Wrapper },
  );
  return { ...hook, getPlugin, onChange, createInitialOptions };
}

it.each([{ version: '1.0.0' }, { registry: 'corp' }, { version: '1.0.0', registry: 'corp' }])(
  'completes a selection once when the owner drops metadata %j',
  async (metadata) => {
    const { result, rerender, getPlugin, onChange, createInitialOptions } = setup();
    const selection: PluginEditorSelection = { type: 'Variable', kind: 'Selected', metadata };
    act(() => result.current.onSelectionChange(selection));
    await waitFor(() => expect(result.current.value.spec).toEqual({ initialized: true }));
    expect(result.current.pendingSelection).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(getPlugin).toHaveBeenCalledWith({ kind: 'Variable', name: 'Selected', ...metadata });
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ selection, spec: { initialized: true } });

    rerender();
    act(() => result.current.onSpecChange({ edited: true }));
    rerender();
    expect(result.current.value.spec).toEqual({ edited: true });
    expect(createInitialOptions).toHaveBeenCalledTimes(1);

    act(() => result.current.onSelectionChange({ type: 'Variable', kind: 'Initial' }));
    expect(result.current.value.spec).toEqual({ original: true });
    act(() => result.current.onSelectionChange(selection));
    expect(result.current.value.spec).toEqual({ edited: true });
    expect(result.current.pendingSelection).toBeUndefined();
    expect(createInitialOptions).toHaveBeenCalledTimes(1);
  },
);

it('ignores an older plugin load after a newer selection completes', async () => {
  const { result, getPlugin, onChange } = setup();
  const older = deferred<{ createInitialOptions: () => { source: string } }>();
  const newer = deferred<{ createInitialOptions: () => { source: string } }>();
  getPlugin.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
  act(() => result.current.onSelectionChange({ type: 'Variable', kind: 'Older' }));
  await waitFor(() => expect(getPlugin).toHaveBeenCalledTimes(1));
  act(() => result.current.onSelectionChange({ type: 'Variable', kind: 'Newer' }));
  await waitFor(() => expect(getPlugin).toHaveBeenCalledTimes(2));
  await act(async () => newer.resolve({ createInitialOptions: () => ({ source: 'newer' }) }));
  await waitFor(() => expect(result.current.value.spec).toEqual({ source: 'newer' }));
  await act(async () => older.resolve({ createInitialOptions: () => ({ source: 'older' }) }));
  expect(result.current.value.spec).toEqual({ source: 'newer' });
  expect(onChange).toHaveBeenCalledTimes(1);
});

it.each(['cached selection', 'unmount'])('ignores a pending load after %s', async (action) => {
  const { result, getPlugin, onChange, unmount } = setup();
  const pending = deferred<{ createInitialOptions: () => { initialized: boolean } }>();
  getPlugin.mockReturnValueOnce(pending.promise);
  act(() => result.current.onSelectionChange({ type: 'Variable', kind: 'Selected' }));
  await waitFor(() => expect(getPlugin).toHaveBeenCalledTimes(1));
  if (action === 'unmount') {
    unmount();
  } else {
    act(() => result.current.onSelectionChange({ type: 'Variable', kind: 'Initial' }));
    expect(result.current.pendingSelection).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  }
  onChange.mockClear();
  await act(async () => pending.resolve({ createInitialOptions: () => ({ initialized: true }) }));
  expect(onChange).not.toHaveBeenCalled();
});

it('does not apply an old load to a new request after returning to a cached selection', async () => {
  const { result, getPlugin, onChange } = setup();
  const older = deferred<{ createInitialOptions: () => { source: string } }>();
  const newer = deferred<{ createInitialOptions: () => { source: string } }>();
  getPlugin.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
  act(() => result.current.onSelectionChange({ type: 'Variable', kind: 'Older' }));
  await waitFor(() => expect(getPlugin).toHaveBeenCalledTimes(1));
  act(() => result.current.onSelectionChange({ type: 'Variable', kind: 'Initial' }));
  act(() => result.current.onSelectionChange({ type: 'Variable', kind: 'Newer' }));
  await waitFor(() => expect(getPlugin).toHaveBeenCalledTimes(2));
  onChange.mockClear();
  await act(async () => older.resolve({ createInitialOptions: () => ({ source: 'older' }) }));
  expect(onChange).not.toHaveBeenCalled();
  expect(result.current.isLoading).toBe(true);
  await act(async () => newer.resolve({ createInitialOptions: () => ({ source: 'newer' }) }));
  await waitFor(() => expect(result.current.value.spec).toEqual({ source: 'newer' }));
  expect(onChange).toHaveBeenCalledTimes(1);
});
