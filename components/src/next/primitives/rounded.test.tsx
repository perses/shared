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

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { ComponentsProvider } from '../contexts/ComponentsProvider';
import { Alert } from './Alert';
import { Button } from './Button';
import { Card, CardContent, CardHeader } from './Card';
import { Chip } from './Chip';
import { defaultComponents, defaultIcons } from './defaults';
import { IconButton } from './IconButton';
import { Stack } from './Stack';
import { Text } from './Text';
import { TextHelper } from './TextHelper';
import { Tooltip } from './Tooltip';

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return (
    <ComponentsProvider components={defaultComponents} icons={defaultIcons}>
      {children}
    </ComponentsProvider>
  );
}

const RADIUS_PROPS = {
  rounded: { default: 'md', md: 12, xl: 'var(--app-radius)' },
  roundedTop: 'lg',
  roundedRight: 6,
  roundedBottom: 'calc(1rem + 2px)',
  roundedLeft: '25%',
  roundedTopLeft: 0,
  roundedTopRight: 'full',
  roundedBottomLeft: '1rem',
  roundedBottomRight: { sm: 'none', lg: 4 },
};
const CONSUMER_PROPS = {
  ...RADIUS_PROPS,
  'aria-label': 'Rounded primitive',
  'data-consumer': 'rounded',
  className: 'consumer-class',
  style: { borderRadius: 3, color: 'red' },
};
const TOOLTIP_STYLE_OVERRIDE = { '--ps-rounded': '2rem', borderRadius: 5 };
const CONSUMERS = [
  { name: 'Alert', element: <Alert {...CONSUMER_PROPS}>Content</Alert> },
  { name: 'Button', element: <Button {...CONSUMER_PROPS}>Content</Button> },
  { name: 'Card', element: <Card {...CONSUMER_PROPS}>Content</Card> },
  { name: 'CardHeader', element: <CardHeader {...CONSUMER_PROPS}>Content</CardHeader> },
  { name: 'CardContent', element: <CardContent {...CONSUMER_PROPS}>Content</CardContent> },
  { name: 'Chip', element: <Chip {...CONSUMER_PROPS}>Content</Chip> },
  { name: 'IconButton', element: <IconButton {...CONSUMER_PROPS}>Content</IconButton> },
  { name: 'Stack', element: <Stack {...CONSUMER_PROPS}>Content</Stack> },
  { name: 'Text', element: <Text {...CONSUMER_PROPS}>Content</Text> },
  { name: 'TextHelper', element: <TextHelper {...CONSUMER_PROPS}>Content</TextHelper> },
];

function expectRoundedStyles(element: HTMLElement): void {
  expect(element).toHaveClass(
    'ps-rounded',
    'ps-rounded-md',
    'ps-rounded-xl',
    'ps-rounded-top',
    'ps-rounded-right',
    'ps-rounded-bottom',
    'ps-rounded-left',
    'ps-rounded-top-left',
    'ps-rounded-top-right',
    'ps-rounded-bottom-left',
    'ps-rounded-bottom-right-sm',
    'ps-rounded-bottom-right-lg',
    'consumer-class',
  );
  expect(element).toHaveStyle({
    '--ps-rounded': 'var(--perses-radius-md)',
    '--ps-rounded-md': '12px',
    '--ps-rounded-xl': 'var(--app-radius)',
    '--ps-rounded-top': 'var(--perses-radius-lg)',
    '--ps-rounded-right': '6px',
    '--ps-rounded-bottom': 'calc(1rem + 2px)',
    '--ps-rounded-left': '25%',
    '--ps-rounded-top-left': '0px',
    '--ps-rounded-top-right': 'var(--perses-radius-full)',
    '--ps-rounded-bottom-left': '1rem',
    '--ps-rounded-bottom-right-sm': 'var(--perses-radius-none)',
    '--ps-rounded-bottom-right-lg': '4px',
    borderRadius: '3px',
    color: 'rgb(255, 0, 0)',
  });
  expect(element).toHaveAttribute('data-consumer', 'rounded');
}

function expectConsumedRadiusProps(element: HTMLElement): void {
  for (const prop of Object.keys(RADIUS_PROPS)) {
    expect(element).not.toHaveAttribute(prop);
  }
}

describe('rounded primitive props', () => {
  it.each(CONSUMERS)('$name serializes radius props on its styled root', ({ element }) => {
    render(element, { wrapper: Wrapper });
    expectRoundedStyles(screen.getByLabelText('Rounded primitive'));
  });

  it.each(CONSUMERS)('$name consumes radius props instead of forwarding DOM attributes', ({ element }) => {
    render(element, { wrapper: Wrapper });
    expectConsumedRadiusProps(screen.getByLabelText('Rounded primitive'));
  });

  it('styles only the Tooltip popup and preserves its forwarded props and accessible description', async () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Tooltip {...CONSUMER_PROPS} ref={ref} id="rounded-tooltip" title="Rounded help" delay={0}>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    await userEvent.hover(trigger);
    const popup = await screen.findByRole('tooltip');

    expectRoundedStyles(popup);
    expectConsumedRadiusProps(popup);
    expect(popup).toHaveClass('ps-Tooltip');
    expect(popup).toHaveAttribute('id', 'rounded-tooltip');
    expect(ref.current).toBe(popup);
    expect(trigger).toHaveAccessibleDescription('Rounded help');
    expect(trigger).not.toHaveClass('ps-rounded', 'consumer-class');
    expect(trigger).not.toHaveAttribute('data-consumer');
    expect(trigger.style.getPropertyValue('--ps-rounded')).toBe('');
    expect(popup.parentElement).toHaveClass('ps-Tooltip__positioner');
    expect(popup.parentElement).not.toHaveClass('ps-rounded', 'consumer-class');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  it('preserves Tooltip inline custom-property overrides when compiling radius props', async () => {
    render(
      <Tooltip {...RADIUS_PROPS} title="Custom radius" style={TOOLTIP_STYLE_OVERRIDE} delay={0}>
        <button type="button">Focus me</button>
      </Tooltip>,
    );
    await userEvent.tab();
    const popup = await screen.findByRole('tooltip');
    expect(popup).toHaveClass('ps-rounded', 'ps-rounded-md');
    expect(popup).toHaveStyle({ '--ps-rounded': '2rem', '--ps-rounded-md': '12px', borderRadius: '5px' });
    expect(screen.getByRole('button', { name: 'Focus me' })).toHaveFocus();
  });
});
