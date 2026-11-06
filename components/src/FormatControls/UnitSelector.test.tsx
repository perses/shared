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

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { FormatOptions } from '../model';
import { UnitSelector } from './UnitSelector';

function renderUnitSelector(value: FormatOptions | undefined = undefined, onChange = vi.fn()): void {
  render(<UnitSelector value={value} onChange={onChange} />);
}

function getCombobox(): HTMLElement {
  return screen.getByRole('combobox');
}

function getClearButton(): HTMLElement {
  return screen.getByRole('button', { name: 'clear unit' });
}

describe('UnitSelector', () => {
  describe('initial display', () => {
    it('shows "Decimal" when no value is provided', () => {
      renderUnitSelector(undefined);
      expect(getCombobox()).toHaveValue('Decimal');
    });

    it('shows the label of the currently selected unit', () => {
      renderUnitSelector({ unit: 'bytes' });
      expect(getCombobox()).toHaveValue('Bytes (IEC)');
    });

    it('shows "Decimal" when value has no unit', () => {
      renderUnitSelector({} as FormatOptions);
      expect(getCombobox()).toHaveValue('Decimal');
    });

    it('shows the saved shorthand even though it is hidden from browsing and search', () => {
      renderUnitSelector({ unit: '%' });
      expect(getCombobox()).toHaveValue('%');

      userEvent.click(getCombobox());
      userEvent.click(screen.getByRole('option', { name: 'Browse Percent units' }));
      expect(screen.queryByRole('option', { name: '%' })).not.toBeInTheDocument();

      userEvent.clear(getCombobox());
      userEvent.keyboard('%');
      expect(screen.getByText('No options')).toBeInTheDocument();
    });
  });

  describe('selecting a unit', () => {
    it('opens a family, goes back, and selects a unit from another family', () => {
      const onChange = vi.fn();
      renderUnitSelector({ unit: 'decimal' }, onChange);

      userEvent.click(getCombobox());
      expect(screen.getByRole('status')).toHaveTextContent('Unit families');
      expect(screen.queryByRole('option', { name: 'Years' })).not.toBeInTheDocument();
      userEvent.click(screen.getByRole('option', { name: 'Browse Time units' }));
      expect(screen.getByRole('status')).toHaveTextContent('Time units');
      expect(screen.getByRole('option', { name: 'Years' })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Percent (0-100)' })).not.toBeInTheDocument();

      userEvent.click(screen.getByRole('option', { name: 'Back to all unit families' }));
      expect(screen.getByRole('status')).toHaveTextContent('Unit families');
      expect(screen.queryByRole('option', { name: 'Years' })).not.toBeInTheDocument();
      userEvent.click(screen.getByRole('option', { name: 'Browse Percent units' }));
      expect(onChange).not.toHaveBeenCalled();

      userEvent.click(screen.getByRole('option', { name: 'Percent (0-100)' }));
      expect(onChange).toHaveBeenCalledExactlyOnceWith({ unit: 'percent' });
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('browses and selects a unit with the keyboard', () => {
      const onChange = vi.fn();
      renderUnitSelector({ unit: 'decimal' }, onChange);

      userEvent.tab();
      userEvent.keyboard('{arrowdown}');
      const time = screen.getByRole('option', { name: 'Browse Time units' });
      expect(getCombobox()).toHaveAttribute('aria-activedescendant', time.id);

      userEvent.keyboard('{enter}');
      expect(getCombobox()).toHaveFocus();
      expect(screen.getByRole('option', { name: 'Years' })).toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();

      userEvent.keyboard('{end}{enter}');
      expect(onChange).toHaveBeenCalledExactlyOnceWith({ unit: 'years' });
    });

    it('highlights the selected unit when its family has the same label', () => {
      renderUnitSelector({ unit: 'decimal' });

      userEvent.tab();
      userEvent.keyboard('{arrowdown}{home}{arrowdown}{arrowdown}{enter}');
      const decimal = screen.getByRole('option', { name: 'Decimal', selected: true });
      expect(getCombobox()).toHaveAttribute('aria-activedescendant', decimal.id);
    });

    it('keeps Enter in the picker even when a search has no matches', () => {
      renderUnitSelector({ unit: 'decimal' });
      const input = getCombobox();

      userEvent.click(input);
      userEvent.keyboard('no matching unit');
      expect(screen.getByText('No options')).toBeInTheDocument();
      expect(fireEvent.keyDown(input, { key: 'Enter' })).toBe(false);

      userEvent.keyboard('{esc}');
      expect(fireEvent.keyDown(input, { key: 'Enter' })).toBe(true);
    });

    it('searches across families and returns to the open family when the query is cleared', () => {
      const onChange = vi.fn();
      renderUnitSelector({ unit: 'decimal' }, onChange);

      userEvent.click(getCombobox());
      userEvent.click(screen.getByRole('option', { name: 'Browse Percent units' }));
      userEvent.clear(getCombobox());
      userEvent.keyboard('years');
      expect(screen.getByRole('option', { name: 'Years' })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Percent (0-100)' })).not.toBeInTheDocument();

      userEvent.clear(getCombobox());
      expect(screen.getByRole('option', { name: 'Percent (0-100)' })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Years' })).not.toBeInTheDocument();

      userEvent.keyboard('years');
      userEvent.click(screen.getByRole('option', { name: 'Years' }));

      expect(onChange).toHaveBeenCalledWith({ unit: 'years' });
    });

    it('restores the selected unit and starts at the root after dismissal', () => {
      renderUnitSelector({ unit: 'bytes' });

      userEvent.click(getCombobox());
      userEvent.click(screen.getByRole('option', { name: 'Browse Percent units' }));
      userEvent.clear(getCombobox());
      userEvent.keyboard('years{esc}');
      expect(getCombobox()).toHaveValue('Bytes (IEC)');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

      userEvent.click(getCombobox());
      expect(screen.getByRole('option', { name: 'Browse Percent units' })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Percent (0-100)' })).not.toBeInTheDocument();
    });

    it('calls onChange with only the unit key, dropping other format fields', () => {
      const onChange = vi.fn();
      render(<UnitSelector value={{ unit: 'decimal', decimalPlaces: 2 }} onChange={onChange} />);

      userEvent.click(getCombobox());
      userEvent.click(screen.getByRole('option', { name: 'Browse Percent units' }));
      userEvent.click(screen.getByRole('option', { name: 'Percent (0-100)' }));

      expect(onChange).toHaveBeenCalledWith({ unit: 'percent' });
    });
  });

  describe('clear button', () => {
    it('renders a clear button', () => {
      renderUnitSelector({ unit: 'bytes' });
      expect(getClearButton()).toBeInTheDocument();
    });

    it('calls onChange with undefined when clear is clicked', () => {
      const onChange = vi.fn();
      render(<UnitSelector value={{ unit: 'bytes' }} onChange={onChange} />);

      userEvent.click(getClearButton());

      expect(onChange).toHaveBeenCalledWith(undefined);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('calls onChange with undefined when clear is clicked with no value set', () => {
      const onChange = vi.fn();
      render(<UnitSelector onChange={onChange} />);

      userEvent.click(getClearButton());

      expect(onChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe('disabled state', () => {
    it('is enabled by default', () => {
      renderUnitSelector({ unit: 'decimal' });
      expect(getCombobox()).toBeEnabled();
    });

    it('disables the combobox when disabled prop is true', () => {
      render(<UnitSelector value={{ unit: 'decimal' }} onChange={vi.fn()} disabled />);
      expect(getCombobox()).toBeDisabled();
    });

    it('disables the clear button when disabled prop is true', () => {
      render(<UnitSelector value={{ unit: 'bytes' }} onChange={vi.fn()} disabled />);
      expect(getClearButton()).toBeDisabled();
    });

    it('dismisses an open search when the picker becomes disabled', () => {
      const onChange = vi.fn();
      const { rerender } = render(<UnitSelector value={{ unit: 'bytes' }} onChange={onChange} />);
      userEvent.click(getCombobox());
      userEvent.keyboard('years');
      expect(screen.getByRole('option', { name: 'Years' })).toBeInTheDocument();

      const consoleError = vi.spyOn(console, 'error');
      try {
        rerender(<UnitSelector value={{ unit: 'bytes' }} onChange={onChange} disabled />);
        expect(getCombobox()).toHaveValue('Bytes (IEC)');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(consoleError).not.toHaveBeenCalled();
      } finally {
        consoleError.mockRestore();
      }

      rerender(<UnitSelector value={{ unit: 'bytes' }} onChange={onChange} />);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
