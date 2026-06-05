// LOGZ.IO ADDITION:: regression for range From/To clobbering partial decimals [APPZ-1996]

import { ReactElement, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValueMapping } from '@perses-dev/core';
import { ChartsProvider } from '../context/ChartsProvider';
import { testChartsTheme } from '../test-utils';
import { ValueMappingEditor } from './ValueMappingEditor';

// Controlled harness: stores the mapping and feeds it back, mirroring the real
// ValueMappingsEditor so the NumberInput resync/echo path is exercised.
function Harness({
  initial,
  onMapping,
}: {
  initial: ValueMapping;
  onMapping?: (mapping: ValueMapping) => void;
}): ReactElement {
  const [mapping, setMapping] = useState<ValueMapping>(initial);

  return (
    <ChartsProvider chartsTheme={testChartsTheme}>
      <ValueMappingEditor
        mapping={mapping}
        onChange={(next) => {
          setMapping(next);
          onMapping?.(next);
        }}
        onDelete={jest.fn()}
      />
    </ChartsProvider>
  );
}

const rangeMapping = {
  kind: 'Range',
  spec: { from: undefined, to: undefined, result: { value: '' } },
} as unknown as ValueMapping;

describe('ValueMappingEditor', () => {
  it('should let the user type a fractional "From" bound like "0.02" without it collapsing', async () => {
    const onMapping = jest.fn();
    render(<Harness initial={rangeMapping} onMapping={onMapping} />);

    const fromInput = screen.getByRole('textbox', { name: 'From' });
    userEvent.type(fromInput, '0.02');

    expect(fromInput).toHaveValue('0.02');
    expect(onMapping).toHaveBeenLastCalledWith(
      expect.objectContaining({ spec: expect.objectContaining({ from: 0.02 }) })
    );
  });

  it('should let the user type a leading-dot "To" bound like ".5" without rendering NaN', async () => {
    const onMapping = jest.fn();
    render(<Harness initial={rangeMapping} onMapping={onMapping} />);

    const toInput = screen.getByRole('textbox', { name: 'To' });
    userEvent.type(toInput, '.5');

    expect(toInput).toHaveValue('.5');
    expect(toInput).not.toHaveValue('NaN');
    expect(onMapping).toHaveBeenLastCalledWith(expect.objectContaining({ spec: expect.objectContaining({ to: 0.5 }) }));
  });
});
