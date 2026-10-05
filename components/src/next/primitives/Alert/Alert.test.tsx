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
import type { ReactElement, ReactNode, SVGProps } from 'react';

import type { PersesComponents } from '../../contexts/ComponentsContext';
import { ComponentsProvider } from '../../contexts/ComponentsProvider';
import type { ButtonProps } from '../Button/Button';
import { defaultComponents, defaultIcons } from '../defaults';
import { Alert } from './Alert';
import type { AlertProps } from './Alert';

const responsiveSize: AlertProps['size'] = { default: 'md', lg: 'sm' };
const responsiveSizeWithoutDefault: AlertProps['size'] = { xs: 'sm' };
const actionLink = <a href="/docs">Learn more</a>;
const CustomButton = ({ children, ...props }: ButtonProps): ReactElement => (
  <button data-testid="provider-button" {...props}>
    {children}
  </button>
);
const componentsWithCustomButton: PersesComponents = { ...defaultComponents, Button: CustomButton };

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return (
    <ComponentsProvider components={defaultComponents} icons={defaultIcons}>
      {children}
    </ComponentsProvider>
  );
}

describe('Alert', () => {
  it('renders children', () => {
    render(<Alert>Something happened</Alert>, { wrapper: Wrapper });
    expect(screen.getByRole('alert')).toHaveTextContent('Something happened');
  });

  it('applies the ps-Alert class', () => {
    render(<Alert>Test</Alert>, { wrapper: Wrapper });
    expect(screen.getByRole('alert')).toHaveClass('ps-Alert');
  });

  it('defaults to info severity', () => {
    render(<Alert>Test</Alert>, { wrapper: Wrapper });
    expect(screen.getByRole('alert')).toHaveAttribute('data-severity', 'info');
  });

  it('sets data-severity attribute', () => {
    render(<Alert severity="error">Error!</Alert>, { wrapper: Wrapper });
    expect(screen.getByRole('alert')).toHaveAttribute('data-severity', 'error');
  });

  it('merges additional className', () => {
    render(<Alert className="custom">Test</Alert>, { wrapper: Wrapper });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('ps-Alert');
    expect(alert).toHaveClass('custom');
  });

  it('renders all severity levels', () => {
    const severities = ['error', 'warning', 'success', 'info'] as const;

    for (const severity of severities) {
      const { unmount } = render(<Alert severity={severity}>{severity}</Alert>, { wrapper: Wrapper });
      expect(screen.getByRole('alert')).toHaveAttribute('data-severity', severity);
      unmount();
    }
  });

  it('renders no icon when icon prop is omitted', () => {
    render(<Alert severity="info">Test</Alert>, { wrapper: Wrapper });
    const iconContainer = screen.getByRole('alert').querySelector('.ps-Alert__icon');
    expect(iconContainer).not.toBeInTheDocument();
  });

  it('renders the built-in icon matching a severity key passed to icon', () => {
    render(<Alert icon="info">Test</Alert>, { wrapper: Wrapper });
    const iconContainer = screen.getByRole('alert').querySelector('.ps-Alert__icon');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
  });

  it('composes the shared Icon primitive for its icon wrapper', () => {
    render(<Alert icon="info">Test</Alert>, { wrapper: Wrapper });
    const iconContainer = screen.getByRole('alert').querySelector('.ps-Alert__icon');
    expect(iconContainer).toHaveClass('ps-Icon');
  });

  it('resolves the icon key independently of the severity prop', () => {
    render(
      <Alert severity="error" icon="info">
        Test
      </Alert>,
      { wrapper: Wrapper },
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('data-severity', 'error');
    expect(alert.querySelector('.ps-Alert__icon svg')).toBeInTheDocument();
  });

  it('renders a custom icon when icon prop is provided', () => {
    const customIcon = <svg data-testid="custom-icon" />;
    render(<Alert icon={customIcon}>Test</Alert>, { wrapper: Wrapper });
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders no icon when icon is set to null', () => {
    render(<Alert icon={null}>Test</Alert>, { wrapper: Wrapper });
    const iconContainer = screen.getByRole('alert').querySelector('.ps-Alert__icon');
    expect(iconContainer).not.toBeInTheDocument();
  });

  it('renders no icon when icon is set to false or 0', () => {
    const { rerender } = render(<Alert icon={false}>Test</Alert>, { wrapper: Wrapper });
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
      <ComponentsProvider components={defaultComponents} icons={{ ...defaultIcons, Error: CustomErrorIcon }}>
        <Alert severity="error" icon="error">
          Error
        </Alert>
      </ComponentsProvider>,
    );

    expect(screen.getByTestId('provider-error-icon')).toBeInTheDocument();
  });

  it('throws when rendered outside a ComponentsProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Alert>Error</Alert>)).toThrow(
      'No ComponentsContext found. Did you forget a ComponentsProvider?',
    );
    consoleSpy.mockRestore();
  });

  describe('variant', () => {
    it('defaults to soft', () => {
      render(<Alert>Test</Alert>, { wrapper: Wrapper });
      expect(screen.getByRole('alert')).toHaveAttribute('data-variant', 'soft');
    });

    it('sets data-variant for each value', () => {
      for (const variant of ['soft', 'outline', 'plain'] as const) {
        const { unmount } = render(<Alert variant={variant}>Test</Alert>, { wrapper: Wrapper });
        expect(screen.getByRole('alert')).toHaveAttribute('data-variant', variant);
        unmount();
      }
    });
  });

  describe('size', () => {
    it('defaults to md via data-size', () => {
      render(<Alert>Test</Alert>, { wrapper: Wrapper });
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('data-size', 'md');
      expect(alert.className).not.toMatch(/ps-Alert--size-/);
    });

    it('sets data-size for a scalar size', () => {
      render(<Alert size="sm">Test</Alert>, { wrapper: Wrapper });
      expect(screen.getByRole('alert')).toHaveAttribute('data-size', 'sm');
    });

    it('applies responsive size classes instead of data-size for a breakpoint object', () => {
      render(<Alert size={responsiveSize}>Test</Alert>, { wrapper: Wrapper });
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('ps-Alert--size-default-md');
      expect(alert).toHaveClass('ps-Alert--size-lg-sm');
      expect(alert).not.toHaveAttribute('data-size');
    });

    it('falls back to md when a responsive object omits default', () => {
      render(<Alert size={responsiveSizeWithoutDefault}>Test</Alert>, { wrapper: Wrapper });
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('ps-Alert--size-default-md');
      expect(alert).toHaveClass('ps-Alert--size-xs-sm');
    });
  });

  describe('action and onClose', () => {
    it('renders no action container by default', () => {
      render(<Alert>Test</Alert>, { wrapper: Wrapper });
      expect(screen.getByRole('alert').querySelector('.ps-Alert__action')).not.toBeInTheDocument();
    });

    it('renders action content inside the action container', () => {
      render(<Alert action={actionLink}>Test</Alert>, { wrapper: Wrapper });
      const link = screen.getByRole('link', { name: 'Learn more' });
      expect(link.closest('.ps-Alert__action')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders a close button composed from the Button primitive when onClose is provided', () => {
      render(<Alert onClose={vi.fn()}>Test</Alert>, { wrapper: Wrapper });
      const close = screen.getByRole('button', { name: 'Close' });
      expect(close).toHaveClass('ps-Button');
      expect(close).toHaveClass('ps-Alert__close');
      expect(close.closest('.ps-Alert__action')).toBeInTheDocument();
    });

    it('uses the severity as the close button color', () => {
      render(
        <Alert severity="warning" onClose={vi.fn()}>
          Test
        </Alert>,
        { wrapper: Wrapper },
      );
      expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute('data-color', 'warning');
    });

    it('applies a custom closeLabel', () => {
      render(
        <Alert onClose={vi.fn()} closeLabel="Dismiss banner">
          Test
        </Alert>,
        { wrapper: Wrapper },
      );
      expect(screen.getByRole('button', { name: 'Dismiss banner' })).toBeInTheDocument();
    });

    it('calls onClose once when the close button is clicked', async () => {
      const handleClose = vi.fn();
      render(<Alert onClose={handleClose}>Test</Alert>, { wrapper: Wrapper });
      await userEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not propagate the close click to an onClick on the Alert', async () => {
      const handleClose = vi.fn();
      const handleAlertClick = vi.fn();
      render(
        <Alert onClose={handleClose} onClick={handleAlertClick}>
          Test
        </Alert>,
        { wrapper: Wrapper },
      );
      await userEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(handleClose).toHaveBeenCalledTimes(1);
      expect(handleAlertClick).not.toHaveBeenCalled();
    });

    it('renders the close button from the provider Button component', () => {
      render(
        <ComponentsProvider components={componentsWithCustomButton} icons={defaultIcons}>
          <Alert onClose={vi.fn()}>Test</Alert>
        </ComponentsProvider>,
      );
      expect(screen.getByTestId('provider-button')).toHaveAttribute('aria-label', 'Close');
    });

    it('renders action before the close button', () => {
      render(
        <Alert action={actionLink} onClose={vi.fn()}>
          Test
        </Alert>,
        { wrapper: Wrapper },
      );
      const container = screen.getByRole('alert').querySelector('.ps-Alert__action');
      expect(container?.firstElementChild).toBe(screen.getByRole('link'));
      expect(container?.lastElementChild).toBe(screen.getByRole('button'));
    });

    it('renders the built-in close icon inside the close button', () => {
      render(<Alert onClose={vi.fn()}>Test</Alert>, { wrapper: Wrapper });
      expect(screen.getByRole('button', { name: 'Close' }).querySelector('svg')).toBeInTheDocument();
    });
  });
});
