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
    render(<Alert>Something happened</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Something happened');
  });

  it('applies the ps-Alert class', () => {
    render(<Alert>Test</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('ps-Alert');
  });

  it('defaults to info severity', () => {
    render(<Alert>Test</Alert>);
    expect(screen.getByRole('alert')).toHaveAttribute('data-severity', 'info');
  });

  it('sets data-severity attribute', () => {
    render(<Alert severity="error">Error!</Alert>);
    expect(screen.getByRole('alert')).toHaveAttribute('data-severity', 'error');
  });

  it('merges additional className', () => {
    render(<Alert className="custom">Test</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('ps-Alert');
    expect(alert).toHaveClass('custom');
  });

  it('renders all severity levels', () => {
    const severities = ['error', 'warning', 'success', 'info'] as const;
    const { unmount } = render(<Alert severity="error">Test</Alert>);
    unmount();

    for (const severity of severities) {
      const { unmount: cleanup } = render(<Alert severity={severity}>{severity}</Alert>);
      expect(screen.getByRole('alert')).toHaveAttribute('data-severity', severity);
      cleanup();
    }
  });
});
