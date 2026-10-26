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

import { Grid } from './Grid';
import { GridItem } from './GridItem';

const RESPONSIVE_SPACING = { default: 'sm', md: 'xl' } as const;
const RESPONSIVE_SIZE = { default: 12, md: 6 } as const;
const PARTIAL_RESPONSIVE_SIZE = { md: 6, xl: undefined } as const;
const STYLE_OVERRIDE = { '--ps-grid-columns': 6, gap: '99px' } as const;
const ITEM_STYLE_OVERRIDE = { gridColumn: 'span 2' } as const;
const CENTERED = { textAlign: 'center' } as const;
const END = { textAlign: 'end' } as const;
const WIDE_SPAN = { default: 19, md: 9 } as const;
const NARROW_SPAN = { default: 5, md: 3 } as const;

describe('Grid', () => {
  it('renders children in a div with the ps-Grid class', () => {
    render(<Grid data-testid="grid">Content</Grid>);
    const grid = screen.getByTestId('grid');
    expect(grid.tagName).toBe('DIV');
    expect(grid).toHaveClass('ps-Grid');
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('leaves the 12-column default to the stylesheet', () => {
    render(<Grid data-testid="grid">Content</Grid>);
    expect(screen.getByTestId('grid').style.getPropertyValue('--ps-grid-columns')).toBe('');
  });

  it('writes columns to the --ps-grid-columns custom property', () => {
    render(
      <Grid data-testid="grid" columns={24}>
        Content
      </Grid>,
    );
    const grid = screen.getByTestId('grid');
    expect(grid.style.getPropertyValue('--ps-grid-columns')).toBe('24');
    expect(grid).not.toHaveAttribute('columns');
  });

  it('forwards spacing to the gap style prop', () => {
    render(
      <Grid data-testid="grid" spacing="lg">
        Content
      </Grid>,
    );
    const grid = screen.getByTestId('grid');
    expect(grid).toHaveClass('ps-gap');
    expect(grid.style.getPropertyValue('--ps-gap')).toBe('var(--perses-spacing-lg)');
    expect(grid).not.toHaveAttribute('spacing');
  });

  it('writes responsive spacing per breakpoint', () => {
    render(
      <Grid data-testid="grid" spacing={RESPONSIVE_SPACING}>
        Content
      </Grid>,
    );
    const grid = screen.getByTestId('grid');
    expect(grid.style.getPropertyValue('--ps-gap')).toBe('var(--perses-spacing-sm)');
    expect(grid.style.getPropertyValue('--ps-gap-md')).toBe('var(--perses-spacing-xl)');
  });

  it('supports sizing and overflow style props', () => {
    render(
      <Grid data-testid="grid" width="100%" overflow="hidden">
        Content
      </Grid>,
    );
    const grid = screen.getByTestId('grid');
    expect(grid).toHaveClass('ps-width');
    expect(grid.style.getPropertyValue('--ps-width')).toBe('100%');
    expect(grid).toHaveClass('ps-overflow');
    expect(grid.style.getPropertyValue('--ps-overflow')).toBe('hidden');
  });

  it('lets the caller style win and merges className', () => {
    render(
      <Grid data-testid="grid" columns={12} spacing="sm" className="custom" style={STYLE_OVERRIDE}>
        Content
      </Grid>,
    );
    const grid = screen.getByTestId('grid');
    expect(grid.style.getPropertyValue('--ps-grid-columns')).toBe('6');
    expect(grid.style.gap).toBe('99px');
    expect(grid).toHaveClass('ps-Grid');
    expect(grid).toHaveClass('custom');
  });

  it('passes unregistered props to the DOM and forwards the ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Grid ref={ref} data-testid="grid" aria-label="Layout" id="layout">
        Content
      </Grid>,
    );
    const grid = screen.getByTestId('grid');
    expect(grid).toHaveAttribute('aria-label', 'Layout');
    expect(grid).toHaveAttribute('id', 'layout');
    expect(ref.current).toBe(grid);
  });
});

describe('GridItem', () => {
  it('renders children in a div with the ps-GridItem class', () => {
    render(<GridItem data-testid="item">Content</GridItem>);
    const item = screen.getByTestId('item');
    expect(item.tagName).toBe('DIV');
    expect(item).toHaveClass('ps-GridItem');
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('leaves the single-track auto placement to the stylesheet when size is omitted', () => {
    render(<GridItem data-testid="item">Content</GridItem>);
    const item = screen.getByTestId('item');
    expect(item).not.toHaveClass('ps-grid-column');
    expect(item.style.getPropertyValue('--ps-grid-column')).toBe('');
  });

  it('writes size as a column span', () => {
    render(
      <GridItem data-testid="item" size={4}>
        Content
      </GridItem>,
    );
    const item = screen.getByTestId('item');
    expect(item).toHaveClass('ps-grid-column');
    expect(item.style.getPropertyValue('--ps-grid-column')).toBe('span 4');
    expect(item).not.toHaveAttribute('size');
  });

  it('writes responsive size per breakpoint', () => {
    render(
      <GridItem data-testid="item" size={RESPONSIVE_SIZE}>
        Content
      </GridItem>,
    );
    const item = screen.getByTestId('item');
    expect(item.style.getPropertyValue('--ps-grid-column')).toBe('span 12');
    expect(item.style.getPropertyValue('--ps-grid-column-md')).toBe('span 6');
  });

  it('writes only the given breakpoints when the responsive size has no default', () => {
    render(
      <GridItem data-testid="item" size={PARTIAL_RESPONSIVE_SIZE}>
        Content
      </GridItem>,
    );
    const item = screen.getByTestId('item');
    expect(item).toHaveClass('ps-grid-column');
    expect(item.style.getPropertyValue('--ps-grid-column')).toBe('');
    expect(item.style.getPropertyValue('--ps-grid-column-md')).toBe('span 6');
    expect(item.style.getPropertyValue('--ps-grid-column-xl')).toBe('');
  });

  it('supports spacing, sizing and overflow style props', () => {
    render(
      <GridItem data-testid="item" p="md" minWidth={0} overflow="auto">
        Content
      </GridItem>,
    );
    const item = screen.getByTestId('item');
    expect(item.style.getPropertyValue('--ps-p')).toBe('var(--perses-spacing-md)');
    expect(item.style.getPropertyValue('--ps-min-width')).toBe('0px');
    expect(item.style.getPropertyValue('--ps-overflow')).toBe('auto');
  });

  it('lets the caller style win, merges className and forwards the ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <GridItem ref={ref} data-testid="item" size={4} className="custom" style={ITEM_STYLE_OVERRIDE}>
        Content
      </GridItem>,
    );
    const item = screen.getByTestId('item');
    expect(item.style.gridColumn).toBe('span 2');
    expect(item).toHaveClass('ps-GridItem');
    expect(item).toHaveClass('custom');
    expect(ref.current).toBe(item);
  });

  it('does not expose gridColumn as a prop', () => {
    // @ts-expect-error gridColumn is internal; consumers use `size`.
    render(<GridItem gridColumn={4}>Content</GridItem>);
  });
});

describe('Grid migration scenarios', () => {
  it('LayoutEditor: 12 / 4+8 rows with a nested grid inside an item', () => {
    render(
      <Grid spacing="lg" data-testid="outer">
        <GridItem size={12}>Title</GridItem>
        <GridItem size={4}>Label</GridItem>
        <GridItem size={8} data-testid="nested-host">
          <Grid spacing="sm" data-testid="inner">
            <GridItem size={6}>a</GridItem>
            <GridItem size={6}>b</GridItem>
          </Grid>
        </GridItem>
      </Grid>,
    );
    expect(screen.getByTestId('nested-host').style.getPropertyValue('--ps-grid-column')).toBe('span 8');
    expect(screen.getByTestId('inner')).toHaveClass('ps-Grid');
    expect(screen.getByTestId('inner').style.getPropertyValue('--ps-gap')).toBe('var(--perses-spacing-sm)');
  });

  it('HTTPSettingsEditor: 8 / 3 / 1 and 4 / 12 rows', () => {
    render(
      <Grid spacing="lg">
        <GridItem size={8}>Key</GridItem>
        <GridItem size={3}>Value</GridItem>
        <GridItem size={1} data-testid="action">
          x
        </GridItem>
        <GridItem size={4}>Label</GridItem>
        <GridItem size={12}>Input</GridItem>
      </Grid>,
    );
    const action = screen.getByTestId('action');
    expect(action.style.getPropertyValue('--ps-grid-column')).toBe('span 1');
    expect(action.className).not.toMatch(/\bps-p/);
  });

  it('ValueMappingEditor: textAlign moves to style on the item', () => {
    render(
      <Grid spacing="sm">
        <GridItem size={5}>From</GridItem>
        <GridItem size={4}>To</GridItem>
        <GridItem size={1} style={CENTERED} data-testid="centered">
          =
        </GridItem>
        <GridItem size={1} style={END} data-testid="end">
          x
        </GridItem>
      </Grid>,
    );
    expect(screen.getByTestId('centered').style.textAlign).toBe('center');
    expect(screen.getByTestId('end').style.getPropertyValue('--ps-grid-column')).toBe('span 1');
  });

  it('FilterItem: fractional MUI spans become integer spans on a 24-column grid', () => {
    render(
      <Grid columns={24} spacing="sm" data-testid="grid">
        <GridItem size={WIDE_SPAN} data-testid="wide">
          attribute
        </GridItem>
        <GridItem size={NARROW_SPAN}>operator</GridItem>
      </Grid>,
    );
    expect(screen.getByTestId('grid').style.getPropertyValue('--ps-grid-columns')).toBe('24');
    const wide = screen.getByTestId('wide');
    expect(wide.style.getPropertyValue('--ps-grid-column')).toBe('span 19');
    expect(wide.style.getPropertyValue('--ps-grid-column-md')).toBe('span 9');
  });
});
