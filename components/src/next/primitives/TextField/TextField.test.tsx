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

import { TextField } from './TextField';

describe('TextField', () => {
  it('renders an input associated with its label', () => {
    render(<TextField label="Name" />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('applies the ps-TextField class to the root', () => {
    render(<TextField label="Name" data-testid="field" />);
    expect(screen.getByTestId('field')).toHaveClass('ps-TextField');
  });

  it('renders helper text', () => {
    render(<TextField label="Name" helperText="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('sets data-status="error" when status is error', () => {
    render(<TextField label="Name" status="error" data-testid="field" />);
    expect(screen.getByTestId('field')).toHaveAttribute('data-status', 'error');
  });

  it('sets data-status="warning" when status is warning', () => {
    render(<TextField label="Name" status="warning" data-testid="field" />);
    expect(screen.getByTestId('field')).toHaveAttribute('data-status', 'warning');
  });

  it('sets data-status="success" when status is success', () => {
    render(<TextField label="Name" status="success" data-testid="field" />);
    expect(screen.getByTestId('field')).toHaveAttribute('data-status', 'success');
  });

  it('sets data-full-width when fullWidth is true', () => {
    render(<TextField label="Name" fullWidth data-testid="field" />);
    expect(screen.getByTestId('field')).toHaveAttribute('data-full-width');
  });

  it('sets data-size on the root', () => {
    render(<TextField label="Name" size="lg" data-testid="field" />);
    expect(screen.getByTestId('field')).toHaveAttribute('data-size', 'lg');
  });

  it('accepts a value and calls onChange', async () => {
    const handleChange = vi.fn();
    render(<TextField label="Name" value="" onChange={handleChange} />);
    await userEvent.type(screen.getByLabelText('Name'), 'a');
    expect(handleChange).toHaveBeenCalled();
  });

  it('supports disabled state', () => {
    render(<TextField label="Name" disabled />);
    expect(screen.getByLabelText('Name')).toBeDisabled();
  });

  it('forwards a ref to the underlying input', () => {
    const ref = { current: null as HTMLInputElement | HTMLTextAreaElement | null };
    render(<TextField label="Name" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('renders without a label', () => {
    render(<TextField placeholder="Search" />);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('renders a textarea when multiline is true', () => {
    render(<TextField label="Comment" multiline />);
    expect(screen.getByLabelText('Comment').tagName).toBe('TEXTAREA');
  });

  it('sets rows on the textarea when multiline', () => {
    render(<TextField label="Comment" multiline rows={5} />);
    expect(screen.getByLabelText('Comment')).toHaveAttribute('rows', '5');
  });

  it('sets data-multiline on the root when multiline is true', () => {
    render(<TextField label="Comment" multiline data-testid="field" />);
    expect(screen.getByTestId('field')).toHaveAttribute('data-multiline');
  });

  it('forwards a ref to the underlying textarea when multiline', () => {
    const ref = { current: null as HTMLInputElement | HTMLTextAreaElement | null };
    render(<TextField label="Comment" multiline ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('renders startAdornment', () => {
    render(<TextField label="Search" startAdornment={<span data-testid="start-icon" />} />);
    expect(screen.getByTestId('start-icon')).toBeInTheDocument();
  });

  it('renders endAdornment', () => {
    render(<TextField label="Search" endAdornment={<span data-testid="end-icon" />} />);
    expect(screen.getByTestId('end-icon')).toBeInTheDocument();
  });

  it('sets data-readonly on the input when readOnly', () => {
    render(<TextField label="Name" readOnly data-testid="field" />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('readonly');
  });
});
