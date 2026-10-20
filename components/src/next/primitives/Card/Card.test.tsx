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
import { createRef } from 'react';

import { Card, CardContent, CardHeader } from './Card';

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Card is not polymorphic (§3b); consumers pass role for semantics */

const RESPONSIVE_PADDING = { default: 'sm', md: 'xl' } as const;
const STYLE_OVERRIDE = { padding: '99px' };
const MENU_BUTTON = <button type="button">Menu</button>;
const ACTIONS_BUTTON = <button type="button">Actions</button>;

describe('Card', () => {
  it('renders children with the ps-Card class', () => {
    render(<Card data-testid="card">Body</Card>);
    const el = screen.getByTestId('card');
    expect(el).toHaveClass('ps-Card');
    expect(el).toHaveTextContent('Body');
  });

  it('defaults to the elevated variant', () => {
    render(<Card data-testid="card">Body</Card>);
    expect(screen.getByTestId('card')).toHaveAttribute('data-variant', 'elevated');
  });

  it('sets data-variant for outlined', () => {
    render(
      <Card data-testid="card" variant="outlined">
        Body
      </Card>,
    );
    expect(screen.getByTestId('card')).toHaveAttribute('data-variant', 'outlined');
  });

  it('merges className, forwards ref and rest props', () => {
    const ref = createRef<HTMLDivElement>();
    const onMouseEnter = vi.fn();
    render(
      <Card ref={ref} className="custom" id="panel-1" role="region" aria-label="CPU" onMouseEnter={onMouseEnter}>
        Body
      </Card>,
    );
    const el = screen.getByRole('region', { name: 'CPU' });
    expect(ref.current).toBe(el);
    expect(el).toHaveClass('ps-Card', 'custom');
    expect(el).toHaveAttribute('id', 'panel-1');
  });

  it('does not apply inline token styles by default', () => {
    render(<Card data-testid="card">Body</Card>);
    expect(screen.getByTestId('card')).not.toHaveAttribute('style');
  });

  describe('style props', () => {
    it('applies a spacing token through its design-token custom property', () => {
      render(
        <Card data-testid="card" p="md">
          Body
        </Card>,
      );
      const el = screen.getByTestId('card');
      expect(el).toHaveClass('ps-p');
      expect(el).toHaveStyle({ '--ps-p': 'var(--perses-spacing-md)' });
    });

    it('creates responsive spacing variables', () => {
      render(
        <Card data-testid="card" p={RESPONSIVE_PADDING}>
          Body
        </Card>,
      );
      const el = screen.getByTestId('card');
      expect(el).toHaveStyle({ '--ps-p': 'var(--perses-spacing-sm)', '--ps-p-md': 'var(--perses-spacing-xl)' });
    });

    it('treats numeric sizing as pixels and passes strings through', () => {
      render(
        <Card data-testid="card" width={130} height="100%">
          Body
        </Card>,
      );
      const el = screen.getByTestId('card');
      expect(el).toHaveClass('ps-width', 'ps-height');
      expect(el).toHaveStyle({ '--ps-width': '130px', '--ps-height': '100%' });
    });

    it('lets the style prop override a style prop and keeps the component class', () => {
      render(
        <Card data-testid="card" p="md" style={STYLE_OVERRIDE}>
          Body
        </Card>,
      );
      const el = screen.getByTestId('card');
      expect(el).toHaveClass('ps-Card', 'ps-p');
      expect(el).toHaveStyle({ padding: '99px' });
    });

    it('does not forward style props to the DOM element', () => {
      render(
        <Card data-testid="card" p="md" width={100}>
          Body
        </Card>,
      );
      const el = screen.getByTestId('card');
      expect(el).not.toHaveAttribute('p');
      expect(el).not.toHaveAttribute('width');
    });

    it('does not expose display as a style prop', () => {
      // @ts-expect-error display is owned by card.css, not the style engine
      render(<Card display="grid">Body</Card>);
    });
  });
});

describe('CardHeader', () => {
  it('renders children inside the content slot with the ps-CardHeader class', () => {
    render(<CardHeader data-testid="header">Title</CardHeader>);
    const el = screen.getByTestId('header');
    expect(el).toHaveClass('ps-CardHeader');
    expect(el.querySelector('.ps-CardHeader__content')).toHaveTextContent('Title');
  });

  it('renders endElement after the content slot', () => {
    render(
      <CardHeader data-testid="header" endElement={MENU_BUTTON}>
        Title
      </CardHeader>,
    );
    const el = screen.getByTestId('header');
    const content = el.querySelector('.ps-CardHeader__content');
    const end = el.querySelector('.ps-CardHeader__end');
    expect(end).toContainElement(screen.getByRole('button', { name: 'Menu' }));
    expect(content?.compareDocumentPosition(end as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('omits the end slot when endElement is not provided', () => {
    render(<CardHeader data-testid="header">Title</CardHeader>);
    expect(screen.getByTestId('header').querySelector('.ps-CardHeader__end')).toBeNull();
  });

  it('merges className, forwards ref, id and aria attributes', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <CardHeader ref={ref} className="custom" id="hdr" aria-labelledby="title-id">
        Title
      </CardHeader>,
    );
    const el = document.getElementById('hdr');
    expect(ref.current).toBe(el);
    expect(el).toHaveClass('ps-CardHeader', 'custom');
    expect(el).toHaveAttribute('aria-labelledby', 'title-id');
  });

  it('applies spacing style props and does not leak them', () => {
    render(
      <CardHeader data-testid="header" px="lg">
        Title
      </CardHeader>,
    );
    const el = screen.getByTestId('header');
    expect(el).toHaveClass('ps-px');
    expect(el).toHaveStyle({ '--ps-px': 'var(--perses-spacing-lg)' });
    expect(el).not.toHaveAttribute('px');
  });
});

describe('CardContent', () => {
  it('renders children with the ps-CardContent class', () => {
    render(<CardContent data-testid="content">Body</CardContent>);
    const el = screen.getByTestId('content');
    expect(el).toHaveClass('ps-CardContent');
    expect(el).toHaveTextContent('Body');
  });

  it('merges className, forwards ref and role', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <CardContent ref={ref} className="custom" role="figure" aria-label="Chart">
        Body
      </CardContent>,
    );
    const el = screen.getByRole('figure', { name: 'Chart' });
    expect(ref.current).toBe(el);
    expect(el).toHaveClass('ps-CardContent', 'custom');
  });

  it('applies spacing and sizing style props and does not leak them', () => {
    render(
      <CardContent data-testid="content" p="0" height="100%">
        Body
      </CardContent>,
    );
    const el = screen.getByTestId('content');
    expect(el).toHaveClass('ps-p', 'ps-height');
    expect(el).toHaveStyle({ '--ps-p': 'var(--perses-spacing-0)', '--ps-height': '100%' });
    expect(el).not.toHaveAttribute('p');
  });
});

describe('Card composition', () => {
  it('renders a Panel-style card with header, end slot and content in order', () => {
    render(
      <Card role="region" aria-labelledby="t">
        <CardHeader endElement={ACTIONS_BUTTON}>
          <span id="t">CPU usage</span>
        </CardHeader>
        <CardContent role="figure">chart</CardContent>
      </Card>,
    );
    const region = screen.getByRole('region', { name: 'CPU usage' });
    const header = region.querySelector('.ps-CardHeader');
    const content = region.querySelector('.ps-CardContent');
    expect(header).not.toBeNull();
    expect(content).not.toBeNull();
    expect(header?.compareDocumentPosition(content as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByRole('button', { name: 'Actions' })).toBeInTheDocument();
    expect(screen.getByRole('figure')).toHaveTextContent('chart');
  });
});
