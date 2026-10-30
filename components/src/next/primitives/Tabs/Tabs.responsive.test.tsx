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

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Tab, TabList, TabPanel, Tabs } from './index';

type Listener = () => void;

/** Fakes `window.matchMedia` for `(min-width: Npx)` queries against a settable viewport width. */
function mockViewport(initialWidth: number): { resize: (width: number) => void } {
  let width = initialWidth;
  const listeners = new Set<Listener>();
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string): MediaQueryList => {
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
    }),
  );
  return {
    resize: (nextWidth) => {
      width = nextWidth;
      act(() => {
        for (const listener of listeners) listener();
      });
    },
  };
}

const orientation = { default: 'horizontal', md: 'vertical' } as const;

function renderResponsiveTabs(): void {
  render(
    <Tabs defaultValue="one" orientation={orientation}>
      <TabList aria-label="Responsive">
        <Tab value="one">One</Tab>
        <Tab value="two">Two</Tab>
      </TabList>
      <TabPanel value="one">Panel one</TabPanel>
      <TabPanel value="two">Panel two</TabPanel>
    </Tabs>,
  );
}

function orientationOf(part: HTMLElement): string | null {
  return part.getAttribute('data-orientation');
}

function parts(): { root: HTMLElement; list: HTMLElement; tab: HTMLElement } {
  const list = screen.getByRole('tablist');
  return { root: list.parentElement as HTMLElement, list, tab: screen.getByRole('tab', { name: 'One' }) };
}

describe('Tabs responsive orientation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is horizontal below the md breakpoint and vertical at or above it', () => {
    const viewport = mockViewport(800);
    renderResponsiveTabs();
    const { root, list, tab } = parts();
    for (const part of [root, list, tab]) expect(orientationOf(part)).toBe('horizontal');

    viewport.resize(900);
    for (const part of [root, list, tab]) expect(orientationOf(part)).toBe('vertical');

    viewport.resize(599);
    for (const part of [root, list, tab]) expect(orientationOf(part)).toBe('horizontal');
  });

  it('switches the arrow-key axis together with the orientation', async () => {
    const viewport = mockViewport(1200);
    renderResponsiveTabs();
    const one = screen.getByRole('tab', { name: 'One' });
    const two = screen.getByRole('tab', { name: 'Two' });

    await userEvent.click(one);
    await userEvent.keyboard('{ArrowRight}');
    expect(one).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(two).toHaveFocus();

    viewport.resize(700);
    await userEvent.keyboard('{ArrowDown}');
    expect(two).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(one).toHaveFocus();
  });

  it('keeps the active tab and panel across an orientation change', async () => {
    const viewport = mockViewport(700);
    renderResponsiveTabs();
    await userEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(screen.getByText('Panel two')).toBeInTheDocument();

    viewport.resize(1000);
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Panel two')).toBeInTheDocument();
    expect(orientationOf(parts().root)).toBe('vertical');
  });
});
