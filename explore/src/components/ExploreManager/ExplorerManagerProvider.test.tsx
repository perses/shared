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

import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';
import { StrictMode } from 'react';

import { ExplorerManagerProvider, useExplorerManagerContext } from './ExplorerManagerProvider';

function Wrapper({ children }: PropsWithChildren): ReactElement {
  return (
    <StrictMode>
      <ExplorerManagerProvider>{children}</ExplorerManagerProvider>
    </StrictMode>
  );
}

it('restores each explorer draft and preserves data when selecting the current explorer', () => {
  const { result } = renderHook(() => useExplorerManagerContext<{ query?: string }>(), { wrapper: Wrapper });
  act(() => result.current.setExplorer('metrics'));
  act(() => result.current.setData({ query: 'up' }));
  act(() => result.current.setExplorer('metrics'));
  expect(result.current.data).toEqual({ query: 'up' });
  act(() => result.current.setExplorer('logs'));
  expect(result.current.data).toEqual({});
  act(() => result.current.setData({ query: 'error' }));
  act(() => result.current.setExplorer('metrics'));
  expect(result.current.data).toEqual({ query: 'up' });
  act(() => result.current.setExplorer('logs'));
  expect(result.current.data).toEqual({ query: 'error' });
});
