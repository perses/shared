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

import { TableCheckbox } from './TableCheckbox';

describe('TableCheckbox', () => {
  it('renders a checkbox input', () => {
    render(<TableCheckbox aria-label="Select row" />);
    expect(screen.getByRole('checkbox', { name: 'Select row' })).toBeInTheDocument();
  });

  it('reflects the checked prop', () => {
    render(<TableCheckbox aria-label="Select row" checked readOnly />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('sets the indeterminate DOM property', () => {
    render(<TableCheckbox aria-label="Select all" indeterminate />);
    expect(screen.getByRole('checkbox')).toHaveProperty('indeterminate', true);
  });

  it('clears the indeterminate DOM property when the prop is removed', () => {
    const { rerender } = render(<TableCheckbox aria-label="Select all" indeterminate />);
    rerender(<TableCheckbox aria-label="Select all" />);
    expect(screen.getByRole('checkbox')).toHaveProperty('indeterminate', false);
  });

  it('calls onChange when toggled', () => {
    const onChange = vi.fn();
    render(<TableCheckbox aria-label="Select row" onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
