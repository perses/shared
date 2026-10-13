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

import { act, render } from '@testing-library/react';
import { init } from 'echarts/core';

import { EChart } from './EChart';

const option = {};

it('resizes on container changes and cancels pending work when unmounted', () => {
  vi.useFakeTimers();
  const resize = vi.fn();
  const dispose = vi.fn();
  const observe = vi.fn();
  const disconnect = vi.fn();
  const callbacks: ResizeObserverCallback[] = [];
  class TestResizeObserver {
    observe = observe;
    disconnect = disconnect;
    unobserve = vi.fn();
    constructor(callback: ResizeObserverCallback) {
      callbacks.push(callback);
    }
  }
  vi.stubGlobal('ResizeObserver', TestResizeObserver);
  vi.mocked(init).mockReturnValue({ setOption: vi.fn(), resize, dispose } as unknown as ReturnType<typeof init>);
  try {
    const { unmount } = render(<EChart option={option} />);
    expect(observe).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(200));
    expect(resize).toHaveBeenCalledTimes(1);
    act(() => {
      callbacks[0]?.([], {} as ResizeObserver);
      vi.advanceTimersByTime(200);
    });
    expect(resize).toHaveBeenCalledTimes(2);
    act(() => callbacks[0]?.([], {} as ResizeObserver));
    unmount();
    act(() => vi.runAllTimers());
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(resize).toHaveBeenCalledTimes(2);
  } finally {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  }
});
