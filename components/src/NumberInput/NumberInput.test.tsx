// LOGZ.IO ADDITION:: General numeric text field that preserves partial input [APPZ-1996]

import { ReactElement, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { INumberInputProps, NumberInput } from './NumberInput';

// Controlled harness mirroring a real parent: stores the committed value and
// feeds it straight back into NumberInput, so resync/echo behaviour is exercised
// exactly as it is in production.
function Harness({
  initial,
  onValue,
  ...props
}: { initial: number | undefined; onValue?: (v: number | undefined) => void } & Omit<
  INumberInputProps,
  'value' | 'onChange'
>): ReactElement {
  const [value, setValue] = useState<number | undefined>(initial);

  return (
    <NumberInput
      {...props}
      label="num"
      value={value}
      onChange={(next) => {
        setValue(next);
        onValue?.(next);
      }}
    />
  );
}

// Harness whose model can only hold a number (like ThresholdsEditor's step.value),
// coercing an empty field back to 0 — the scenario that used to blank itself.
function NumberOnlyHarness({ onValue }: { onValue?: (v: number) => void }): ReactElement {
  const [value, setValue] = useState<number>(0);

  return (
    <NumberInput
      label="num"
      value={value}
      emptyValue={0}
      onChange={(next) => {
        setValue(next ?? 0);
        onValue?.(next ?? 0);
      }}
    />
  );
}

describe('NumberInput', () => {
  it('should preserve a leading-dot decimal while typing ".05" instead of blanking it', async () => {
    const onValue = jest.fn();
    render(<Harness initial={undefined} onValue={onValue} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '.05');

    expect(input).toHaveValue('.05');
    expect(onValue).toHaveBeenLastCalledWith(0.05);
  });

  it('should let the user build "0.02" left to right without the decimal collapsing', async () => {
    const onValue = jest.fn();
    render(<Harness initial={undefined} onValue={onValue} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '0.02');

    expect(input).toHaveValue('0.02');
    expect(onValue).toHaveBeenLastCalledWith(0.02);
  });

  it('should preserve a negative number while typing instead of corrupting the sign', async () => {
    const onValue = jest.fn();
    render(<Harness initial={undefined} onValue={onValue} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '-5');

    expect(input).toHaveValue('-5');
    expect(onValue).toHaveBeenLastCalledWith(-5);
  });

  it('should keep the field empty while clearing and emit undefined', async () => {
    const onValue = jest.fn();
    render(<Harness initial={5} onValue={onValue} />);
    const input = screen.getByRole('textbox');

    await userEvent.clear(input);

    expect(input).toHaveValue('');
    expect(onValue).toHaveBeenLastCalledWith(undefined);
  });

  it('should reject non-numeric characters', async () => {
    const onValue = jest.fn();
    render(<Harness initial={undefined} onValue={onValue} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, 'abc');

    expect(input).toHaveValue('');
    expect(onValue).not.toHaveBeenCalled();
  });

  it('should resync the draft when the external value changes from outside', () => {
    const { rerender } = render(<NumberInput label="num" value={1} onChange={jest.fn()} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('1');

    rerender(<NumberInput label="num" value={42} onChange={jest.fn()} />);
    expect(input).toHaveValue('42');
  });

  it('should clamp the committed value to [min, max] on blur', async () => {
    const onValue = jest.fn();
    render(<Harness initial={undefined} min={1} max={1000} onValue={onValue} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '5000');
    fireEvent.blur(input);

    expect(input).toHaveValue('1000');
    expect(onValue).toHaveBeenLastCalledWith(1000);
  });

  it('should commit emptyValue on blur when the field is left empty', async () => {
    const onValue = jest.fn();
    render(<Harness initial={12} emptyValue={1} onValue={onValue} />);
    const input = screen.getByRole('textbox');

    await userEvent.clear(input);
    fireEvent.blur(input);

    expect(input).toHaveValue('1');
    expect(onValue).toHaveBeenLastCalledWith(1);
  });

  it('should reject a decimal point in integer mode and truncate on blur', async () => {
    const onValue = jest.fn();
    render(<Harness initial={undefined} integer onValue={onValue} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '1.5');

    // The decimal point keystroke is rejected, so only the digits land.
    expect(input).toHaveValue('15');
    expect(onValue).toHaveBeenLastCalledWith(15);
  });

  it('should build a sub-1 decimal in a number-only model that previously blanked the field', async () => {
    const onValue = jest.fn();
    render(<NumberOnlyHarness onValue={onValue} />);
    const input = screen.getByRole('textbox');

    await userEvent.clear(input);
    await userEvent.type(input, '.05');

    expect(input).toHaveValue('.05');
    expect(onValue).toHaveBeenLastCalledWith(0.05);
  });
});
