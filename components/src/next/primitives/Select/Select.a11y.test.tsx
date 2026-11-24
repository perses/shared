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

import { Select } from './Select';
import { getRoot, getTrigger, open, renderSelect, units } from './Select.test.utils';

describe('accessibility', () => {
  it('names the trigger from the label with a generated id', () => {
    renderSelect();
    const trigger = getTrigger();
    const label = screen.getByText('Unit');
    expect(trigger.id).not.toBe('');
    expect(label.id).not.toBe('');
    expect(trigger).toHaveAttribute('aria-labelledby', label.id);
    expect(trigger).toHaveAccessibleName('Unit');
  });

  it('uses a provided id for the trigger and keeps the label linked', () => {
    renderSelect({ id: 'unit-select' });
    const trigger = getTrigger();
    expect(trigger).toHaveAttribute('id', 'unit-select');
    expect(trigger).toHaveAttribute('aria-labelledby', screen.getByText('Unit').id);
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

  it('supports aria-labelledby', () => {
    render(
      <>
        <span id="unit-heading">Unit</span>
        <Select aria-labelledby="unit-heading">{units}</Select>
      </>,
    );
    expect(getTrigger()).toHaveAccessibleName('Unit');
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
