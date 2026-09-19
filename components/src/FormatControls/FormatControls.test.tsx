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
import { FormatControls } from './FormatControls';

describe('FormatControls', () => {
  const renderFormatControls = (value: FormatOptions, onChange = vi.fn()): void => {
    render(
      <div>
        <FormatControls value={value} onChange={onChange} />
      </div>,
    );
  };

  const getUnitSelector = (): HTMLElement => {
    return screen.getByRole('combobox', { name: 'Unit' });
  };

  const getDecimalPlacesSelector = (): HTMLElement => {
    return screen.getByRole('combobox', { name: 'Decimals' });
  };

  const getShortValuesSwitch = (): HTMLElement => {
    return screen.getByRole('checkbox', { name: 'Short values' });
  };

  const getCustomLabelInput = (): HTMLElement => {
    return screen.getByRole('textbox', { name: 'custom unit label' });
  };

  it('can change the unit by clicking', () => {
    const onChange = vi.fn();
    renderFormatControls({ unit: 'minutes' }, onChange);

    const unitSelector = getUnitSelector();
    userEvent.click(unitSelector);
    const decimalOption = screen.getByRole('option', {
      name: 'Decimal',
    });
    userEvent.click(decimalOption);

    expect(onChange).toHaveBeenCalledWith({
      unit: 'decimal',
    });
  });

  it('can change the unit using a keyboard', () => {
    const onChange = vi.fn();
    renderFormatControls({ unit: 'bytes' }, onChange);

    const unitSelector = getUnitSelector();
    // Tab: Short values → Unit (Custom label present for bytes)
    userEvent.tab();
    userEvent.tab();
    expect(unitSelector).toHaveFocus();

    userEvent.clear(unitSelector);
    userEvent.keyboard('years');
    screen.getByRole('option', {
      name: 'Years',
    });

    userEvent.keyboard('{arrowup}{enter}');

    expect(onChange).toHaveBeenCalledWith({
      unit: 'years',
    });
  });

  it('shows custom label for data-size units (bytes)', () => {
    renderFormatControls({ unit: 'bytes' });
    expect(screen.getByRole('textbox', { name: 'custom unit label' })).toBeInTheDocument();
  });

  it('preserves customLabel when switching to bytes', () => {
    const onChange = vi.fn();
    renderFormatControls({ unit: 'ops/sec', customLabel: 'pnr/mn' }, onChange);

    userEvent.click(getUnitSelector());
    userEvent.click(screen.getByRole('option', { name: 'Bytes (IEC)' }));
    expect(onChange).toHaveBeenCalledWith({
      unit: 'bytes',
      customLabel: 'pnr/mn',
    });
  });

  it('can change the decimal places by clicking', () => {
    const onChange = vi.fn();
    renderFormatControls({ unit: 'decimal', decimalPlaces: 0, shortValues: true }, onChange);

    userEvent.click(getDecimalPlacesSelector());
    const decimalPlacesOption = screen.getByRole('option', {
      name: 'Default',
    });
    userEvent.click(decimalPlacesOption);

    expect(onChange).toHaveBeenCalledWith({
      unit: 'decimal',
      decimalPlaces: undefined,
      shortValues: true,
    });
  });

  it('can change the decimal places using a keyboard', () => {
    const onChange = vi.fn();
    renderFormatControls({ unit: 'percent' }, onChange);

    const decimalPlacesSelector = getDecimalPlacesSelector();
    // Focus Decimals directly (tab order includes Custom label after Unit).
    decimalPlacesSelector.focus();
    expect(decimalPlacesSelector).toHaveFocus();

    userEvent.clear(decimalPlacesSelector);
    userEvent.keyboard('3');
    screen.getByRole('option', {
      name: '3',
    });
    userEvent.keyboard('{arrowup}{enter}');

    expect(onChange).toHaveBeenCalledWith({
      unit: 'percent',
      decimalPlaces: 3,
    });
  });

  it('can set a custom label (spaces allowed in raw onChange)', () => {
    const onChange = vi.fn();
    renderFormatControls({ unit: 'ops/sec' }, onChange);

    const input = getCustomLabelInput();
    // Controlled field + mock onChange does not re-render; fire a full value change.
    fireEvent.change(input, { target: { value: 'pnr / mn' } });
    expect(onChange).toHaveBeenCalledWith({
      unit: 'ops/sec',
      customLabel: 'pnr / mn',
    });
  });

  it('clears customLabel when the field is emptied', () => {
    const onChange = vi.fn();
    renderFormatControls({ unit: 'ops/sec', customLabel: 'pnr/mn' }, onChange);

    const input = getCustomLabelInput();
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith({ unit: 'ops/sec' });
  });

  it('preserves customLabel when changing unit', () => {
    const onChange = vi.fn();
    renderFormatControls({ unit: 'ops/sec', customLabel: 'pnr/mn' }, onChange);

    userEvent.click(getUnitSelector());
    userEvent.click(screen.getByRole('option', { name: 'Decimal' }));
    expect(onChange).toHaveBeenCalledWith({
      unit: 'decimal',
      customLabel: 'pnr/mn',
    });
  });

  it('can change shortValues by clicking', () => {
    const onChange = vi.fn();
    renderFormatControls({ unit: 'decimal', decimalPlaces: 3, shortValues: true }, onChange);

    userEvent.click(getShortValuesSwitch());

    expect(onChange).toHaveBeenCalledWith({
      unit: 'decimal',
      decimalPlaces: 3,
      shortValues: false,
    });
  });

  it('can change shortValues using a keyboard', () => {
    const onChange = vi.fn();
    renderFormatControls({ unit: 'decimal', decimalPlaces: 0 }, onChange);

    userEvent.tab();
    userEvent.keyboard('{space}');

    expect(onChange).toHaveBeenCalledWith({
      unit: 'decimal',
      decimalPlaces: 0,
      shortValues: false,
    });
  });

  describe('with a time unit selected', () => {
    it('does not allow the user to set shortValues', () => {
      renderFormatControls({ unit: 'minutes' });
      expect(getShortValuesSwitch()).toBeDisabled();
    });
  });

  describe('with a percent unit selected', () => {
    it('allows the user to modify the decimal places', () => {
      renderFormatControls({ unit: 'percent' });
      expect(getDecimalPlacesSelector()).toBeEnabled();
    });

    it('does not allow the user to set shortValues', () => {
      renderFormatControls({ unit: 'percent-decimal' });
      expect(getShortValuesSwitch()).toBeDisabled();
    });
  });

  describe('with a decimal unit selected', () => {
    it('allows the user to modify the decimal places', () => {
      renderFormatControls({ unit: 'decimal' });
      expect(getDecimalPlacesSelector()).toBeEnabled();
    });

    it('allows the user to set shortValues', () => {
      renderFormatControls({ unit: 'decimal' });
      expect(getShortValuesSwitch()).toBeEnabled();
    });
  });

  describe('with a bytes unit selected', () => {
    it('allows the user to modify the decimal places', () => {
      renderFormatControls({ unit: 'bytes' });
      expect(getDecimalPlacesSelector()).toBeEnabled();
    });

    it('allows the user to set shortValues', () => {
      renderFormatControls({ unit: 'bytes' });
      expect(getShortValuesSwitch()).toBeEnabled();
    });
  });

  describe('with a currency unit selected', () => {
    it('allows the user to modify the decimal places', () => {
      renderFormatControls({ unit: 'eur' });
      expect(getDecimalPlacesSelector()).toBeEnabled();
    });
  });

  it('should not show an option for disabled units', () => {
    const onChange = vi.fn();
    renderFormatControls({ unit: 'decimal' }, onChange);

    userEvent.click(getUnitSelector());
    const percentShorthandOption = screen.queryByRole('option', {
      name: '%',
    });
    expect(percentShorthandOption).not.toBeInTheDocument();
  });
});
