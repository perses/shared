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
import { FC, forwardRef, ReactElement, SVGProps } from 'react';

import type { ButtonProps } from '../primitives/Button/Button';
import { ComponentsProvider, useComponents } from './ComponentsProvider';
import type { ComponentsContextValue, PersesComponents } from './ComponentsProvider';
import { DEFAULT_COMPONENTS, DEFAULT_ICONS } from './defaults';

describe('ComponentsProvider', () => {
  it('renders components passed in via props', () => {
    function TestConsumer(): ReactElement {
      const { components } = useComponents();
      return (
        <div>
          <components.Button>Default Button</components.Button>
          <components.Alert>Default Alert</components.Alert>
        </div>
      );
    }

    render(
      <ComponentsProvider components={DEFAULT_COMPONENTS} icons={DEFAULT_ICONS}>
        <TestConsumer />
      </ComponentsProvider>,
    );

    expect(screen.getByText('Default Button')).toBeInTheDocument();
    expect(screen.getByText('Default Alert')).toBeInTheDocument();
  });

  it('supports overriding an individual component by spreading the defaults', () => {
    const CustomButton = forwardRef<HTMLButtonElement, ButtonProps>(function CustomButton({ children }, ref) {
      return (
        <button ref={ref} data-testid="custom-button">
          {children}
        </button>
      );
    });

    function TestConsumer(): ReactElement {
      const { components } = useComponents();
      return (
        <div>
          <components.Button>My Button</components.Button>
          <components.Alert>My Alert</components.Alert>
        </div>
      );
    }

    render(
      <ComponentsProvider components={{ ...DEFAULT_COMPONENTS, Button: CustomButton }} icons={DEFAULT_ICONS}>
        <TestConsumer />
      </ComponentsProvider>,
    );

    expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    expect(screen.getByText('My Alert')).toBeInTheDocument();
  });

  it('throws when useComponents is called outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function BadConsumer(): null {
      useComponents();
      return null;
    }

    expect(() => render(<BadConsumer />)).toThrow('No ComponentsContext found. Did you forget a Provider?');

    consoleSpy.mockRestore();
  });

  it('supports icon overrides independently of component overrides', () => {
    const CustomErrorIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
      <svg data-testid="custom-error" {...props}>
        <circle cx="12" cy="12" r="10" />
      </svg>
    );

    function TestConsumer(): ReactElement {
      const { icons, components } = useComponents();
      return (
        <div>
          <icons.Error data-testid="rendered-error" />
          <components.Button>Still Default</components.Button>
        </div>
      );
    }

    render(
      <ComponentsProvider components={DEFAULT_COMPONENTS} icons={{ ...DEFAULT_ICONS, Error: CustomErrorIcon }}>
        <TestConsumer />
      </ComponentsProvider>,
    );

    expect(screen.getByTestId('rendered-error')).toBeInTheDocument();
    expect(screen.getByText('Still Default')).toBeInTheDocument();
  });

  it('memoizes context value when props are stable', () => {
    const values: ComponentsContextValue[] = [];

    function Collector(): null {
      values.push(useComponents());
      return null;
    }

    const { rerender } = render(
      <ComponentsProvider components={DEFAULT_COMPONENTS} icons={DEFAULT_ICONS}>
        <Collector />
      </ComponentsProvider>,
    );

    rerender(
      <ComponentsProvider components={DEFAULT_COMPONENTS} icons={DEFAULT_ICONS}>
        <Collector />
      </ComponentsProvider>,
    );

    expect(values).toHaveLength(2);
    expect(values[0]).toBe(values[1]);
  });

  it('memoizes context value when override object reference is stable (hoisted)', () => {
    const values: ComponentsContextValue[] = [];

    function Collector(): null {
      values.push(useComponents());
      return null;
    }

    const CustomButton = forwardRef<HTMLButtonElement, ButtonProps>(function CustomButton({ children }, ref) {
      return <button ref={ref}>{children}</button>;
    });

    const overrides = { ...DEFAULT_COMPONENTS, Button: CustomButton };

    const { rerender } = render(
      <ComponentsProvider components={overrides} icons={DEFAULT_ICONS}>
        <Collector />
      </ComponentsProvider>,
    );

    rerender(
      <ComponentsProvider components={overrides} icons={DEFAULT_ICONS}>
        <Collector />
      </ComponentsProvider>,
    );

    expect(values).toHaveLength(2);
    expect(values[0]).toBe(values[1]);
  });

  it('does not automatically merge partial components with defaults', () => {
    const partialComponents = { Button: DEFAULT_COMPONENTS.Button } as PersesComponents;

    function TestConsumer(): ReactElement {
      const { components } = useComponents();
      return <div data-testid="alert-check">{String(components.Alert)}</div>;
    }

    render(
      <ComponentsProvider components={partialComponents} icons={DEFAULT_ICONS}>
        <TestConsumer />
      </ComponentsProvider>,
    );

    expect(screen.getByTestId('alert-check')).toHaveTextContent('undefined');
  });

  it('renders a custom component injected via provider', () => {
    const CustomButton = forwardRef<HTMLButtonElement, ButtonProps>(function CustomButton({ children, ...rest }, ref) {
      return (
        <button ref={ref} {...rest} className="custom-injected">
          Custom: {children}
        </button>
      );
    });

    function App(): ReactElement {
      const { components } = useComponents();
      return <components.Button>Click Me</components.Button>;
    }

    render(
      <ComponentsProvider components={{ ...DEFAULT_COMPONENTS, Button: CustomButton }} icons={DEFAULT_ICONS}>
        <App />
      </ComponentsProvider>,
    );

    const button = screen.getByText('Custom: Click Me');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('custom-injected');
  });

  it('renders icons passed in via props', () => {
    function TestConsumer(): ReactElement {
      const { icons } = useComponents();
      return (
        <div>
          <icons.Error data-testid="error-icon" />
          <icons.Info data-testid="info-icon" />
          <icons.Success data-testid="success-icon" />
          <icons.Warning data-testid="warning-icon" />
        </div>
      );
    }

    render(
      <ComponentsProvider components={DEFAULT_COMPONENTS} icons={DEFAULT_ICONS}>
        <TestConsumer />
      </ComponentsProvider>,
    );

    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    expect(screen.getByTestId('success-icon')).toBeInTheDocument();
    expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
  });
});
