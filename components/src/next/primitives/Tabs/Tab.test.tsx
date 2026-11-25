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
import type { RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, FormEvent, FormEventHandler } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Tab, TabList, TabPanel, Tabs } from './index';
import type { TabProps } from './index';

const CustomButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function CustomButton(props, ref) {
    return <button ref={ref} {...props} />;
  },
);

const CustomLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }>(
  function CustomLink({ to, children, ...props }, ref) {
    return (
      <a ref={ref} href={to} {...props}>
        {children}
      </a>
    );
  },
);

function renderFormTabs(
  props: Pick<TabProps, 'render' | 'nativeButton' | 'disabled'>,
  onSubmit: FormEventHandler<HTMLFormElement>,
): RenderResult {
  return render(
    <form onSubmit={onSubmit}>
      <Tabs defaultValue="one">
        <TabList aria-label="Example">
          <Tab value="one">One</Tab>
          <Tab value="two" {...props}>
            Two
          </Tab>
        </TabList>
        <TabPanel value="one">Panel one</TabPanel>
        <TabPanel value="two">Panel two</TabPanel>
      </Tabs>
    </form>,
  );
}

const buttonRenderers = [
  { name: 'default button', props: {} },
  { name: 'intrinsic button renderer', props: { render: <button aria-label="Two" /> } },
  { name: 'custom button renderer with nativeButton', props: { render: <CustomButton />, nativeButton: true } },
];

const linkRenderers = [
  { name: 'intrinsic link renderer', props: { render: <a href="#two">Two</a> } },
  { name: 'custom link renderer', props: { render: <CustomLink to="#two" /> } },
];

async function pressKey(key: string): Promise<void> {
  await act(async () => {
    await userEvent.keyboard(key);
  });
}

const keyboardActivations = [
  { name: 'Enter', key: '{Enter}' },
  { name: 'Space', key: ' ' },
];

describe('Tab', () => {
  describe.each(buttonRenderers)('$name', ({ props }) => {
    it('defaults to type="button" and selects on click without submitting the form', async () => {
      const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
      renderFormTabs(props, onSubmit);
      const tab = screen.getByRole('tab', { name: 'Two' });

      await userEvent.click(tab);

      expect(onSubmit).not.toHaveBeenCalled();
      expect(tab.tagName).toBe('BUTTON');
      expect(tab).toHaveAttribute('type', 'button');
      expect(tab).not.toHaveAttribute('nativebutton');
      expect(tab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel two');
    });

    it.each(keyboardActivations)('selects on $name without submitting the form', async ({ key }) => {
      const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
      renderFormTabs(props, onSubmit);
      const firstTab = screen.getByRole('tab', { name: 'One' });
      const secondTab = screen.getByRole('tab', { name: 'Two' });

      await userEvent.click(firstTab);
      expect(firstTab).toHaveFocus();
      await pressKey('{ArrowRight}');
      expect(secondTab).toHaveFocus();
      expect(secondTab).toHaveAttribute('aria-selected', 'false');

      await pressKey(key);

      expect(secondTab).toHaveAttribute('aria-selected', 'true');
      expect(firstTab).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel two');
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe.each(linkRenderers)('$name', ({ props }) => {
    it('keeps link attributes without a button type and selects on click', async () => {
      const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
      renderFormTabs(props, onSubmit);
      const tab = screen.getByRole('tab', { name: 'Two' });

      expect(tab.tagName).toBe('A');
      expect(tab).toHaveAttribute('href', '#two');
      expect(tab).not.toHaveAttribute('type');

      await userEvent.click(tab);

      expect(tab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel two');
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it.each(keyboardActivations)('keeps $name activation without a button type', async ({ key }) => {
      const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
      renderFormTabs(props, onSubmit);
      const tab = screen.getByRole('tab', { name: 'Two' });

      await userEvent.click(screen.getByRole('tab', { name: 'One' }));
      await pressKey('{ArrowRight}');
      expect(tab).toHaveFocus();
      expect(tab).toHaveAttribute('aria-selected', 'false');

      await pressKey(key);

      expect(tab).not.toHaveAttribute('type');
      expect(tab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel two');
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it('keeps disabled tabs arrow-key focusable without allowing activation or form submission', async () => {
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
    renderFormTabs({ disabled: true }, onSubmit);
    const tab = screen.getByRole('tab', { name: 'Two' });

    await userEvent.click(screen.getByRole('tab', { name: 'One' }));
    await pressKey('{ArrowRight}');

    expect(tab).toHaveFocus();
    expect(tab).toHaveAttribute('aria-disabled', 'true');
    expect(tab).toHaveAttribute('data-disabled');

    await pressKey('{Enter} ');
    await userEvent.click(tab);

    expect(tab).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel one');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
