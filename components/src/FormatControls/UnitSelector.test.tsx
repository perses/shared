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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FormatOptions } from '../model';
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
  });

  describe('selecting a unit', () => {
    it('calls onChange with the selected unit when clicking an option', () => {
      const onChange = vi.fn();
      render(<UnitSelector value={{ unit: 'decimal' }} onChange={onChange} />);

      userEvent.click(getCombobox());
      userEvent.click(screen.getByRole('option', { name: 'Percent (0-100)' }));

      expect(onChange).toHaveBeenCalledWith({ unit: 'percent' });
    });

    it('calls onChange with the typed and selected unit', () => {
      const onChange = vi.fn();
      render(<UnitSelector value={{ unit: 'decimal' }} onChange={onChange} />);

      userEvent.click(getCombobox());
      userEvent.keyboard('years');
      userEvent.click(screen.getByRole('option', { name: 'Years' }));

      expect(onChange).toHaveBeenCalledWith({ unit: 'years' });
    });

    it('calls onChange with only the unit key, dropping other format fields', () => {
      const onChange = vi.fn();
      render(<UnitSelector value={{ unit: 'decimal', decimalPlaces: 2 }} onChange={onChange} />);

      userEvent.click(getCombobox());
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
  });
});
