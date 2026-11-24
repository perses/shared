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

import { act, fireEvent, render, screen } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { forwardRef } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ComponentsProvider } from '../../contexts/ComponentsProvider';
import { defaultComponents, defaultIcons } from '../defaults';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon } from '../Icon';
import type { IconButtonProps } from '../IconButton';
import { Tab, TabList, Tabs } from './index';
import type { TabListProps } from './index';

const resizeCallbacks: ResizeObserverCallback[] = [];
const observe = vi.fn();
const disconnect = vi.fn();

class TestResizeObserver {
  observe = observe;
  disconnect = disconnect;
  unobserve = vi.fn();
  constructor(callback: ResizeObserverCallback) {
    resizeCallbacks.push(callback);
  }
}

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return (
    <ComponentsProvider components={defaultComponents} icons={defaultIcons}>
      {children}
    </ComponentsProvider>
  );
}

/** Markup of an icon rendered on its own, for comparing against what a scroll button shows. */
function svgOf(icon: ReactElement): string {
  const { container, unmount } = render(icon);
  const html = container.innerHTML;
  unmount();
  return html;
}

function buttonSvgs(): string[] {
  return scrollButtons().map((button) => button.querySelector('svg')?.outerHTML ?? '');
}

function renderScrollable(props: Partial<TabListProps> = {}, orientation?: 'vertical'): RenderResult {
  return render(
    <Tabs defaultValue="one" orientation={orientation}>
      <TabList aria-label="Scroll" scrollButtons {...props}>
        <Tab value="one">One</Tab>
        <Tab value="two">Two</Tab>
      </TabList>
    </Tabs>,
    { wrapper: Wrapper },
  );
}

interface Geometry {
  position?: number;
  size?: number;
  total?: number;
}

/** Fakes the list's layout (jsdom has none), re-measures through a scroll event and lets observers settle. */
async function setGeometry(
  list: HTMLElement,
  { position = 0, size = 100, total = 100 }: Geometry,
  vertical = false,
): Promise<void> {
  const define = (name: string, value: number): void => {
    Object.defineProperty(list, name, { value, configurable: true });
  };
  define(vertical ? 'scrollTop' : 'scrollLeft', position);
  define(vertical ? 'clientHeight' : 'clientWidth', size);
  define(vertical ? 'scrollHeight' : 'scrollWidth', total);
  await act(async () => fireEvent.scroll(list));
}

function DynamicTabs({
  count,
  scrollButtons: enabled = true,
}: {
  count: number;
  scrollButtons?: boolean;
}): ReactElement {
  return (
    <Tabs defaultValue={0}>
      <TabList aria-label="Scroll" scrollButtons={enabled}>
        {Array.from({ length: count }, (_, index) => (
          <Tab key={index} value={index}>
            Tab {index}
          </Tab>
        ))}
      </TabList>
    </Tabs>
  );
}

function scrollButtons(): HTMLElement[] {
  return [...screen.getByRole('tablist').querySelectorAll<HTMLElement>('.ps-TabList__scrollButton')];
}

describe('TabList scroll buttons', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resizeCallbacks.length = 0;
    observe.mockClear();
    disconnect.mockClear();
  });

  it('preserves tab identity, selection and keyboard focus when scroll affordances toggle', async () => {
    const { rerender } = render(<DynamicTabs count={2} scrollButtons={false} />, { wrapper: Wrapper });
    const second = screen.getByRole('tab', { name: 'Tab 1' });
    await userEvent.click(second);
    expect(second).toHaveFocus();

    for (const enabled of [true, false, true]) {
      rerender(<DynamicTabs count={2} scrollButtons={enabled} />);
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toBe(second);
      expect(second).toHaveAttribute('aria-selected', 'true');
      expect(second).toHaveFocus();
    }
  });

  it('renders nothing until the list overflows, then shows mouse-only buttons at each edge', async () => {
    renderScrollable();
    const list = screen.getByRole('tablist');
    expect(scrollButtons()).toHaveLength(0);

    await setGeometry(list, { total: 300 });
    const [back, forward] = scrollButtons();
    expect(back).toHaveAttribute('data-direction', 'back');
    expect(forward).toHaveAttribute('data-direction', 'forward');
    expect(back).toBeDisabled();
    expect(forward).toBeEnabled();
    for (const button of scrollButtons()) {
      expect(button).toHaveAttribute('aria-hidden', 'true');
      expect(button).toHaveAttribute('tabindex', '-1');
      expect(button).toHaveClass('ps-IconButton');
    }
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(list.lastElementChild).toHaveClass('ps-TabList__indicator');
  });

  it('flips the enabled edge as the list scrolls and hides again when it fits', async () => {
    renderScrollable();
    const list = screen.getByRole('tablist');
    await setGeometry(list, { position: 200, total: 300 });
    expect(scrollButtons()[0]).toBeEnabled();
    expect(scrollButtons()[1]).toBeDisabled();

    await setGeometry(list, { position: 100, total: 300 });
    expect(scrollButtons()[0]).toBeEnabled();
    expect(scrollButtons()[1]).toBeEnabled();

    await setGeometry(list, { position: 0, total: 100 });
    expect(scrollButtons()).toHaveLength(0);
  });

  it('scrolls by most of the visible size along the orientation axis', async () => {
    renderScrollable();
    const list = screen.getByRole('tablist');
    const scrollBy = vi.fn();
    Object.defineProperty(list, 'scrollBy', { value: scrollBy, configurable: true });
    await setGeometry(list, { position: 50, size: 100, total: 300 });

    await userEvent.click(scrollButtons()[1] as HTMLElement);
    expect(scrollBy).toHaveBeenLastCalledWith({ left: 80 });
    await userEvent.click(scrollButtons()[0] as HTMLElement);
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -80 });
  });

  it('measures the block axis when vertical', async () => {
    renderScrollable({}, 'vertical');
    const list = screen.getByRole('tablist');
    const scrollBy = vi.fn();
    Object.defineProperty(list, 'scrollBy', { value: scrollBy, configurable: true });
    await setGeometry(list, { position: 0, size: 50, total: 200 }, true);
    expect(scrollButtons()).toHaveLength(2);
    fireEvent.click(scrollButtons()[1] as HTMLElement);
    expect(scrollBy).toHaveBeenLastCalledWith({ top: 40 });
  });

  it('re-measures and observes new tabs when the tab collection changes', async () => {
    vi.stubGlobal('ResizeObserver', TestResizeObserver);
    const { rerender } = render(<DynamicTabs count={2} />, { wrapper: Wrapper });
    const list = screen.getByRole('tablist');
    expect(scrollButtons()).toHaveLength(0);

    Object.defineProperty(list, 'scrollWidth', { value: 300, configurable: true });
    Object.defineProperty(list, 'clientWidth', { value: 100, configurable: true });
    await act(async () => rerender(<DynamicTabs count={6} />));
    expect(scrollButtons()).toHaveLength(2);
    expect(observe).toHaveBeenCalledWith(screen.getByRole('tab', { name: 'Tab 5' }));

    Object.defineProperty(list, 'scrollWidth', { value: 100, configurable: true });
    await act(async () => rerender(<DynamicTabs count={2} />));
    expect(scrollButtons()).toHaveLength(0);
  });

  it('treats the start edge as "back" and scrolls the other way in right-to-left lists', async () => {
    renderScrollable({ style: { direction: 'rtl' } });
    const list = screen.getByRole('tablist');
    const scrollBy = vi.fn();
    Object.defineProperty(list, 'scrollBy', { value: scrollBy, configurable: true });

    await setGeometry(list, { position: 0, size: 100, total: 300 });
    expect(scrollButtons()[0]).toBeDisabled();
    expect(scrollButtons()[1]).toBeEnabled();

    await setGeometry(list, { position: -200, size: 100, total: 300 });
    expect(scrollButtons()[0]).toBeEnabled();
    expect(scrollButtons()[1]).toBeDisabled();

    await userEvent.click(scrollButtons()[0] as HTMLElement);
    expect(scrollBy).toHaveBeenLastCalledWith({ left: 80 });
  });

  it('re-measures from ResizeObserver and disconnects on unmount', () => {
    vi.stubGlobal('ResizeObserver', TestResizeObserver);
    const { unmount } = renderScrollable();
    const list = screen.getByRole('tablist');
    expect(observe).toHaveBeenCalledWith(list);
    for (const tab of screen.getAllByRole('tab')) expect(observe).toHaveBeenCalledWith(tab);

    Object.defineProperty(list, 'scrollWidth', { value: 300, configurable: true });
    Object.defineProperty(list, 'clientWidth', { value: 100, configurable: true });
    act(() => {
      for (const callback of resizeCallbacks) callback([], {} as ResizeObserver);
    });
    expect(scrollButtons()).toHaveLength(2);

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('uses the IconButton from ComponentsProvider and applies slotProps.scrollButton', async () => {
    const CustomIconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function CustomIconButton(
      { children, ...props },
      ref,
    ) {
      return (
        <button ref={ref} type="button" data-custom-icon-button="" {...props}>
          {children}
        </button>
      );
    });
    render(
      <ComponentsProvider components={{ ...defaultComponents, IconButton: CustomIconButton }} icons={defaultIcons}>
        <Tabs defaultValue="one">
          <TabList
            aria-label="Example"
            scrollButtons
            slotProps={{ scrollButton: { className: 'custom-scroll', style: { '--consumer-scroll': 'yes' } } }}
          >
            <Tab value="one">One</Tab>
          </TabList>
        </Tabs>
      </ComponentsProvider>,
    );
    await setGeometry(screen.getByRole('tablist'), { total: 300 });
    for (const button of scrollButtons()) {
      expect(button).toHaveAttribute('data-custom-icon-button');
      expect(button).toHaveClass('ps-TabList__scrollButton', 'custom-scroll');
      expect(button.style.getPropertyValue('--consumer-scroll')).toBe('yes');
    }
  });

  it('renders consumer icons in place of the default chevrons', async () => {
    renderScrollable({
      scrollBackIcon: <svg data-testid="back-icon" />,
      scrollForwardIcon: <svg data-testid="forward-icon" />,
    });
    await setGeometry(screen.getByRole('tablist'), { position: 50, total: 300 });
    const [back, forward] = scrollButtons();
    expect(back).toContainElement(screen.getByTestId('back-icon'));
    expect(forward).toContainElement(screen.getByTestId('forward-icon'));
    expect(screen.getByTestId('back-icon').parentElement).toHaveClass('ps-Icon');
  });

  it('defaults to left/right chevrons horizontally and up/down chevrons vertically', async () => {
    const horizontal = renderScrollable();
    await setGeometry(screen.getByRole('tablist'), { position: 50, total: 300 });
    expect(buttonSvgs()).toEqual([svgOf(<ChevronLeftIcon />), svgOf(<ChevronRightIcon />)]);
    horizontal.unmount();

    renderScrollable({}, 'vertical');
    await setGeometry(screen.getByRole('tablist'), { position: 50, total: 300 }, true);
    expect(buttonSvgs()).toEqual([svgOf(<ChevronUpIcon />), svgOf(<ChevronDownIcon />)]);
  });

  it('points horizontal default chevrons in the actual RTL scroll directions', async () => {
    renderScrollable({ style: { direction: 'rtl' } });
    await setGeometry(screen.getByRole('tablist'), { position: -50, total: 300 });
    expect(buttonSvgs()).toEqual([svgOf(<ChevronRightIcon />), svgOf(<ChevronLeftIcon />)]);
  });

  it('updates chevrons and scroll movement when inherited direction changes without scrolling', async () => {
    render(
      <div dir="ltr">
        <Tabs defaultValue={null}>
          <TabList aria-label="Scroll" scrollButtons>
            <Tab value="one">One</Tab>
            <Tab value="two">Two</Tab>
          </TabList>
        </Tabs>
      </div>,
      { wrapper: Wrapper },
    );
    const list = screen.getByRole('tablist');
    const scrollBy = vi.fn();
    Object.defineProperty(list, 'scrollBy', { value: scrollBy, configurable: true });
    await setGeometry(list, { total: 300 });
    expect(buttonSvgs()).toEqual([svgOf(<ChevronLeftIcon />), svgOf(<ChevronRightIcon />)]);

    const ancestor = list.closest('[dir]');
    expect(ancestor).not.toBeNull();
    await act(async () => {
      ancestor?.setAttribute('dir', 'rtl');
    });

    expect(buttonSvgs()).toEqual([svgOf(<ChevronRightIcon />), svgOf(<ChevronLeftIcon />)]);
    await userEvent.click(scrollButtons()[1] as HTMLElement);
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -80 });
  });

  it('updates default icons when the list style direction changes without scrolling', async () => {
    renderScrollable();
    const list = screen.getByRole('tablist');
    await setGeometry(list, { position: 50, total: 300 });
    expect(buttonSvgs()).toEqual([svgOf(<ChevronLeftIcon />), svgOf(<ChevronRightIcon />)]);

    await act(async () => {
      list.style.direction = 'rtl';
    });
    expect(buttonSvgs()).toEqual([svgOf(<ChevronRightIcon />), svgOf(<ChevronLeftIcon />)]);
  });

  it('keeps vertical chevrons and consumer icons unchanged in RTL', async () => {
    const vertical = renderScrollable({ style: { direction: 'rtl' } }, 'vertical');
    await setGeometry(screen.getByRole('tablist'), { position: 50, total: 300 }, true);
    expect(buttonSvgs()).toEqual([svgOf(<ChevronUpIcon />), svgOf(<ChevronDownIcon />)]);
    vertical.unmount();

    renderScrollable({
      style: { direction: 'rtl' },
      scrollBackIcon: <ChevronUpIcon />,
      scrollForwardIcon: <ChevronDownIcon />,
    });
    await setGeometry(screen.getByRole('tablist'), { position: -50, total: 300 });
    expect(buttonSvgs()).toEqual([svgOf(<ChevronUpIcon />), svgOf(<ChevronDownIcon />)]);
  });

  it('does not render or need a provider when scrollButtons is off', async () => {
    render(
      <Tabs defaultValue="one">
        <TabList aria-label="Example">
          <Tab value="one">One</Tab>
        </TabList>
      </Tabs>,
    );
    await setGeometry(screen.getByRole('tablist'), { total: 300 });
    expect(scrollButtons()).toHaveLength(0);
  });
});
