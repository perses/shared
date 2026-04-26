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
import { Alert } from './Alert';

describe('Alert', () => {
  it('renders children', () => {
    render(<Alert severity="error">Something went wrong</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('applies the ps-Alert class', () => {
    render(<Alert severity="info">Info message</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('ps-Alert');
  });

  it('sets data-severity attribute', () => {
    render(<Alert severity="warning">Warning</Alert>);
    expect(screen.getByRole('alert')).toHaveAttribute('data-severity', 'warning');
  });

  it('defaults severity to info', () => {
    render(<Alert>Default</Alert>);
    expect(screen.getByRole('alert')).toHaveAttribute('data-severity', 'info');
  });

  it('merges custom className', () => {
    render(<Alert className="custom">Test</Alert>);
    const el = screen.getByRole('alert');
    expect(el).toHaveClass('ps-Alert');
    expect(el).toHaveClass('custom');
  });
});
