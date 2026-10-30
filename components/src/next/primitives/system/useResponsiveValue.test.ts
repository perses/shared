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
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useResponsiveValue } from './useResponsiveValue';

type Listener = () => void;

/** Fakes `window.matchMedia` for `(min-width: Npx)` queries against a settable viewport width. */
function mockViewport(initialWidth: number): { resize: (width: number) => void; listeners: Set<Listener> } {
  let width = initialWidth;
  const listeners = new Set<Listener>();
  const matchMedia = vi.fn((query: string): MediaQueryList => {
    const minWidth = Number(/\(min-width: (\d+)px\)/.exec(query)?.[1]);
    return {
      get matches() {
        return width >= minWidth;
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: Listener) => listeners.add(listener),
      removeEventListener: (_type: string, listener: Listener) => listeners.delete(listener),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
  });
  vi.stubGlobal('matchMedia', matchMedia);
  return {
    listeners,
    resize: (nextWidth) => {
      width = nextWidth;
      act(() => {
        for (const listener of listeners) listener();
      });
    },
  };
}

const orientation = { default: 'horizontal', md: 'vertical' } as const;

describe('useResponsiveValue', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a plain value as-is without touching matchMedia', () => {
    const viewport = mockViewport(1000);
    const { result } = renderHook(() => useResponsiveValue('horizontal'));
    expect(result.current).toBe('horizontal');
    expect(window.matchMedia).not.toHaveBeenCalled();
    expect(viewport.listeners.size).toBe(0);
  });

  it('falls back to default when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { result } = renderHook(() => useResponsiveValue(orientation));
    expect(result.current).toBe('horizontal');
  });

  it.each([
    [599, 'default'],
    [600, 'sm'],
    [900, 'md'],
    [1200, 'lg'],
    [1536, 'xl'],
  ])('resolves the largest matching breakpoint at %ipx', (width, expected) => {
    mockViewport(width);
    const { result } = renderHook(() =>
      useResponsiveValue({ default: 'default', sm: 'sm', md: 'md', lg: 'lg', xl: 'xl' }),
    );
    expect(result.current).toBe(expected);
  });

  it('carries the nearest smaller breakpoint forward when the matching one has no value', () => {
    mockViewport(1300);
    const { result } = renderHook(() => useResponsiveValue(orientation));
    expect(result.current).toBe('vertical');
  });

  it('ignores xs/sm entries below the viewport and uses default above them only when nothing larger matches', () => {
    mockViewport(700);
    const { result } = renderHook(() => useResponsiveValue({ default: 'a', xs: 'b', md: 'c' }));
    expect(result.current).toBe('b');
  });

  it('re-renders when the viewport crosses a breakpoint', () => {
    const viewport = mockViewport(500);
    const { result } = renderHook(() => useResponsiveValue(orientation));
    expect(result.current).toBe('horizontal');
    viewport.resize(1000);
    expect(result.current).toBe('vertical');
    viewport.resize(800);
    expect(result.current).toBe('horizontal');
  });

  it('subscribes once per breakpoint and unsubscribes on unmount', () => {
    const viewport = mockViewport(500);
    const { unmount } = renderHook(() => useResponsiveValue(orientation));
    expect(viewport.listeners.size).toBeGreaterThan(0);
    unmount();
    expect(viewport.listeners.size).toBe(0);
  });
});
