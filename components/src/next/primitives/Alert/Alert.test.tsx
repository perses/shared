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
import { ReactElement, SVGProps } from 'react';

import { ComponentsProvider } from '../../contexts/ComponentsProvider';
import { Button, ErrorIcon, InfoIcon, SuccessIcon, WarningIcon } from '../index';
import { Alert } from './Alert';

const components = { Button, Alert };
const icons = { Error: ErrorIcon, Info: InfoIcon, Success: SuccessIcon, Warning: WarningIcon };

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

  it('renders no icon when icon prop is omitted', () => {
    render(<Alert severity="info">Test</Alert>);
    const iconContainer = screen.getByRole('alert').querySelector('.ps-Alert__icon');
    expect(iconContainer).not.toBeInTheDocument();
  });

  it('renders the built-in icon matching a severity key passed to icon', () => {
    render(<Alert icon="info">Test</Alert>);
    const iconContainer = screen.getByRole('alert').querySelector('.ps-Alert__icon');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
  });

  it('composes the shared Icon primitive for its icon wrapper', () => {
    render(<Alert icon="info">Test</Alert>);
    const iconContainer = screen.getByRole('alert').querySelector('.ps-Alert__icon');
    expect(iconContainer).toHaveClass('ps-Icon');
  });

  it('resolves the icon key independently of the severity prop', () => {
    render(
      <Alert severity="error" icon="info">
        Test
      </Alert>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('data-severity', 'error');
    expect(alert.querySelector('.ps-Alert__icon svg')).toBeInTheDocument();
  });

  it('renders a custom icon when icon prop is provided', () => {
    const customIcon = <svg data-testid="custom-icon" />;
    render(<Alert icon={customIcon}>Test</Alert>);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders no icon when icon is set to null', () => {
    render(<Alert icon={null}>Test</Alert>);
    const iconContainer = screen.getByRole('alert').querySelector('.ps-Alert__icon');
    expect(iconContainer).not.toBeInTheDocument();
  });

  it('renders no icon when icon is set to false or 0', () => {
    const { rerender } = render(<Alert icon={false}>Test</Alert>);
    expect(screen.getByRole('alert').querySelector('.ps-Alert__icon')).not.toBeInTheDocument();

    rerender(<Alert icon={0}>Test</Alert>);
    expect(screen.getByRole('alert').querySelector('.ps-Alert__icon')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).not.toHaveTextContent('0');
  });

  it('uses provider icons when inside a ComponentsProvider', () => {
    const CustomErrorIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
      <svg data-testid="provider-error-icon" {...props} />
    );

    render(
      <ComponentsProvider components={components} icons={{ ...icons, Error: CustomErrorIcon }}>
        <Alert severity="error" icon="error">
          Error
        </Alert>
      </ComponentsProvider>,
    );

    expect(screen.getByTestId('provider-error-icon')).toBeInTheDocument();
  });

  it('falls back to default icons when outside a ComponentsProvider', () => {
    render(
      <Alert severity="error" icon="error">
        Error
      </Alert>,
    );
    const iconContainer = screen.getByRole('alert').querySelector('.ps-Alert__icon');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
  });
});
