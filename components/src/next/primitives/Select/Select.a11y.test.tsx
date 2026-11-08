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

import type { Status } from '../types';
import { Select } from './Select';
import { getRoot, getTrigger, open, renderSelect, units } from './Select.test.utils';

describe('accessibility', () => {
  it('names the trigger from the label with a generated id', () => {
    renderSelect();
    const trigger = getTrigger();
    const label = screen.getByText('Unit');
    expect(trigger.id).not.toBe('');
    expect(label).toHaveAttribute('for', trigger.id);
    expect(trigger).toHaveAccessibleName('Unit');
  });

  it('uses a provided id for both the trigger and the label', () => {
    renderSelect({ id: 'unit-select' });
    expect(getTrigger()).toHaveAttribute('id', 'unit-select');
    expect(screen.getByText('Unit')).toHaveAttribute('for', 'unit-select');
  });

  it('generates distinct ids for multiple selects', () => {
    render(
      <>
        <Select label="First">{units}</Select>
        <Select label="Second">{units}</Select>
      </>,
    );
    expect(getTrigger('First').id).not.toBe(getTrigger('Second').id);
  });

  it('supports aria-label when there is no visible label', () => {
    render(<Select aria-label="Unit">{units}</Select>);
    expect(getTrigger()).toHaveAccessibleName('Unit');
    expect(document.querySelector('.ps-Select__label')).not.toBeInTheDocument();
  });

  it('supports aria-labelledby', () => {
    render(
      <>
        <span id="unit-heading">Unit</span>
        <Select aria-labelledby="unit-heading">{units}</Select>
      </>,
    );
    expect(getTrigger()).toHaveAccessibleName('Unit');
  });

  it('requires an accessible name at the type level', () => {
    // @ts-expect-error -- one of label, aria-label or aria-labelledby is required
    const missingName = <Select placeholder="Search" />;
    const withLabel = <Select label="Unit" />;
    const withAriaLabel = <Select aria-label="Unit" />;
    const withAriaLabelledBy = <Select aria-labelledby="unit-id" />;
    expect([missingName, withLabel, withAriaLabel, withAriaLabelledBy]).toHaveLength(4);
  });

  it('rejects overriding a visible label with aria-label or aria-labelledby at the type level', () => {
    // @ts-expect-error -- aria-label would override the visible label as the accessible name (WCAG 2.5.3)
    const withAriaLabel = <Select label="Unit" aria-label="Different" />;
    // @ts-expect-error -- aria-labelledby would override the visible label as the accessible name (WCAG 2.5.3)
    const withAriaLabelledBy = <Select label="Unit" aria-labelledby="other" />;
    expect([withAriaLabel, withAriaLabelledBy]).toHaveLength(2);
  });

  it('does not include start/end elements or helper text in the accessible name', () => {
    renderSelect({ startElement: <span>$</span>, endElement: <span>%</span>, helperText: 'Hint' });
    expect(getTrigger()).toHaveAccessibleName('Unit');
  });

  it('links helper text through aria-describedby and omits it otherwise', () => {
    const { rerender } = render(
      <Select label="Unit" helperText="Shown to your team">
        {units}
      </Select>,
    );
    expect(getTrigger()).toHaveAccessibleDescription('Shown to your team');
    rerender(<Select label="Unit">{units}</Select>);
    expect(getTrigger()).not.toHaveAttribute('aria-describedby');
  });

  it('sets aria-invalid for the error status only', () => {
    const statuses: Status[] = ['error', 'warning', 'success', 'info'];
    for (const status of statuses) {
      const { unmount } = renderSelect({ status });
      if (status === 'error') {
        expect(getTrigger()).toBeInvalid();
      } else {
        expect(getTrigger()).not.toHaveAttribute('aria-invalid');
      }
      unmount();
    }
  });

  it('exposes required and read-only states', () => {
    renderSelect({ required: true, readOnly: true });
    const trigger = getTrigger();
    expect(trigger).toHaveAttribute('aria-required', 'true');
    expect(trigger).toHaveAttribute('aria-readonly', 'true');
    expect(trigger).toHaveAttribute('data-readonly');
  });

  it('does not open when disabled', async () => {
    renderSelect({ disabled: true });
    const trigger = getTrigger();
    expect(trigger).toHaveAttribute('data-disabled');
    expect(getRoot()).toHaveAttribute('data-disabled');
    await userEvent.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens with the keyboard, moves through options, and selects with Enter', async () => {
    const onValueChange = vi.fn();
    renderSelect({ onValueChange });
    await userEvent.tab();
    expect(getTrigger()).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await screen.findByRole('listbox');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Bytes' })).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Seconds' })).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('seconds');
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    renderSelect();
    await open();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(getTrigger()).toHaveFocus();
  });

  it('selects by typeahead', async () => {
    const onValueChange = vi.fn();
    renderSelect({ onValueChange });
    await open();
    await userEvent.keyboard('s');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Seconds' })).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('seconds');
  });
});
