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
import { forwardRef, useImperativeHandle } from 'react';
import { VirtuosoMockContext } from 'react-virtuoso';
import type * as VirtuosoModule from 'react-virtuoso';
import type { VirtuosoHandle, VirtuosoProps } from 'react-virtuoso';

import { Select } from './Select';
import type { SelectItemData, SelectProps } from './Select';
import { fieldText, getTrigger, open } from './Select.test.utils';
import type { SelectValue } from './SelectItem';

const { scrollIntoView, scrollToIndex } = vi.hoisted(() => ({ scrollIntoView: vi.fn(), scrollToIndex: vi.fn() }));

// jsdom has no layout, so Virtuoso cannot scroll the list. Record the scroll requests Select makes instead.
vi.mock('react-virtuoso', async (importOriginal) => {
  const actual = await importOriginal<typeof VirtuosoModule>();
  const Virtuoso = forwardRef<VirtuosoHandle, VirtuosoProps<SelectValue, unknown>>(function Virtuoso(props, ref) {
    useImperativeHandle(ref, () => ({ scrollIntoView, scrollToIndex }) as unknown as VirtuosoHandle);
    return <actual.Virtuoso {...props} />;
  });
  return { ...actual, Virtuoso };
});

const COUNT = 1000;
const METRICS: SelectItemData[] = Array.from({ length: COUNT }, (_, index) => ({
  value: `m${String(index)}`,
  label: `metric_${String(index)}`,
}));
/** Ten 30px rows fit the mocked 300px viewport. */
const MOCK_SIZES = { viewportHeight: 300, itemHeight: 30 };

function renderVirtualized(props: Partial<SelectProps> = {}): ReturnType<typeof render> {
  const merged = { label: 'Unit', searchable: true, virtualized: true, items: METRICS, ...props } as SelectProps;
  return render(
    <VirtuosoMockContext.Provider value={MOCK_SIZES}>
      <Select {...merged} />
    </VirtuosoMockContext.Provider>,
  );
}

const options = (): HTMLElement[] => screen.queryAllByRole('option');

describe('Select virtualized', () => {
  beforeEach(() => {
    scrollIntoView.mockClear();
    scrollToIndex.mockClear();
  });

  it('requires searchable and items at the type level', () => {
    const valid = <Select label="Unit" searchable virtualized items={METRICS} />;
    // @ts-expect-error -- the basic (button) mode cannot be virtualized
    const basic = <Select label="Unit" virtualized items={METRICS} />;
    // @ts-expect-error -- virtualization renders data items, not SelectItem children
    const children = <Select label="Unit" searchable virtualized />;
    // @ts-expect-error -- renderItem renders data items, so it needs items
    const renderItem = <Select label="Unit" renderItem={() => null} />;
    expect([valid, basic, children, renderItem]).toHaveLength(4);
  });
  it('ignores virtualized outside searchable mode', async () => {
    renderVirtualized({ searchable: false, items: METRICS.slice(0, 3) });
    await open();

    expect(options()).toHaveLength(3);
  });
  it('renders only a window of the options, with their position in the full list', async () => {
    renderVirtualized();
    await open();

    const rendered = options();
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.length).toBeLessThan(COUNT);
    expect(rendered[0]).toHaveAccessibleName('metric_0');
    expect(rendered[0]).toHaveAttribute('aria-posinset', '1');
    expect(rendered[0]).toHaveAttribute('aria-setsize', String(COUNT));
  });

  it('filters the full list and updates the set size', async () => {
    renderVirtualized();

    await userEvent.type(getTrigger(), 'metric_99');

    // metric_99 and metric_990 to metric_999.
    await waitFor(() => expect(options()[0]).toHaveAttribute('aria-setsize', '11'));
    expect(options()[0]).toHaveAccessibleName('metric_99');
  });

  it('selects a rendered option', async () => {
    const onValueChange = vi.fn();
    renderVirtualized({ onValueChange });
    await open();

    await userEvent.click(screen.getByRole('option', { name: 'metric_2' }));

    expect(onValueChange).toHaveBeenCalledWith('m2');
    expect(fieldText(getTrigger())).toBe('metric_2');
  });

  it('scrolls an option highlighted by keyboard into view', async () => {
    renderVirtualized();
    await open();

    // From the input, ArrowUp wraps to the last option, which is far outside the rendered window.
    await userEvent.keyboard('{ArrowUp}');

    expect(getTrigger()).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-999$/));
    expect(scrollIntoView).toHaveBeenLastCalledWith({ index: COUNT - 1 });
  });

  it('scrolls the selected option into view on open', async () => {
    renderVirtualized({ defaultValue: 'm500' });
    await open();

    expect(scrollIntoView).toHaveBeenCalledWith({ index: 500 });
  });

  it('scrolls back to the top when the typed text changes', async () => {
    renderVirtualized();
    await open();
    scrollToIndex.mockClear();

    await userEvent.keyboard('m');

    expect(scrollToIndex).toHaveBeenCalledWith(0);
  });

  it('applies slotProps.list and listHeader', async () => {
    renderVirtualized({ listHeader: 'Series', slotProps: { list: { className: 'custom-list' } } });
    await open();

    expect(screen.getByRole('listbox')).toHaveClass('ps-Select__list', 'custom-list');
    expect(document.querySelector('.ps-Select__list-header')).toHaveTextContent('Series');
  });

  it('does not scroll for an option highlighted by the pointer', async () => {
    renderVirtualized();
    await open();
    scrollIntoView.mockClear();

    await userEvent.hover(screen.getByRole('option', { name: 'metric_2' }));

    expect(screen.getByRole('option', { name: 'metric_2' })).toHaveAttribute('data-highlighted');
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('shows emptyText when nothing matches', async () => {
    renderVirtualized();

    await userEvent.type(getTrigger(), 'zzz');

    expect(options()).toHaveLength(0);
    expect(document.querySelector('.ps-Select__empty')).toHaveTextContent('No results');
  });

  it('renders custom content with renderItem', async () => {
    renderVirtualized({ renderItem: (item) => <strong>{item.label} series</strong> });
    await open();

    expect(screen.getByRole('option', { name: 'metric_0 series' })).toBeInTheDocument();
  });

  it('keeps the list open for several picks in multiple mode', async () => {
    const onValueChange = vi.fn();
    renderVirtualized({ multiple: true, chips: true, onValueChange });
    await open();

    // Picked by keyboard: jsdom pointer events lack `isPrimary`, so a click commits twice in Base UI.
    await userEvent.keyboard('{ArrowDown}{Enter}{ArrowDown}{ArrowDown}{Enter}');

    expect(onValueChange).toHaveBeenLastCalledWith(['m0', 'm2']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});
