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
import { createRef } from 'react';
import type { CSSProperties, FormEvent, KeyboardEvent } from 'react';

import { Chip } from './Chip';
import type { ChipColor, ChipSize, ChipStyle, ChipVariant } from './Chip';

const noop = (): void => {};
const preventDefault = (event: KeyboardEvent): void => event.preventDefault();
const customChipStyle: ChipStyle = {
  marginTop: 4,
  '--perses-chip-label-max-width': '20ch',
};
const chipSizeOverride: ChipStyle = { '--perses-chip-size-sm': '40px' };
const chipBorderOverride: ChipStyle = {
  '--perses-chip-border-style': 'dashed',
  '--perses-chip-border-width': 'var(--perses-border-width-md)',
};
const responsiveWidth = { default: 100, md: 200 };
const responsiveDisplay = { default: 'flex', md: 'inline-flex' } as const;
const widthOverride: CSSProperties & { '--ps-width': string } = { '--ps-width': '50px' };
const startElement = <svg data-testid="start-element" />;
const closeIcon = <svg data-testid="close-icon" />;
const filterInput = <input aria-label="Filter value" />;

describe('Chip', () => {
  it('renders its children', () => {
    render(<Chip>Production</Chip>);
    expect(screen.getByText('Production')).toBeInTheDocument();
  });

  it('applies the ps-Chip class', () => {
    render(<Chip>Production</Chip>);
    expect(screen.getByText('Production').closest('.ps-Chip')).toBeInTheDocument();
  });

  it('defaults to default color', () => {
    render(<Chip>Production</Chip>);
    expect(screen.getByText('Production').closest('.ps-Chip')).toHaveAttribute('data-color', 'default');
  });

  it('sets data-color attribute', () => {
    render(<Chip color="secondary">Secondary</Chip>);
    expect(screen.getByText('Secondary').closest('.ps-Chip')).toHaveAttribute('data-color', 'secondary');
  });

  it('accepts status palettes through color', () => {
    render(<Chip color="error">Error</Chip>);
    expect(screen.getByText('Error').closest('.ps-Chip')).toHaveAttribute('data-color', 'error');
  });

  it('defaults to the xs solid variant', () => {
    render(<Chip>Production</Chip>);
    const chip = screen.getByText('Production').closest('.ps-Chip');
    expect(chip).toHaveAttribute('data-size', 'xs');
    expect(chip).toHaveAttribute('data-variant', 'solid');
  });

  it('sets data-size and data-variant attributes', () => {
    render(
      <Chip size="sm" variant="outline">
        Production
      </Chip>,
    );
    const chip = screen.getByText('Production').closest('.ps-Chip');
    expect(chip).toHaveAttribute('data-size', 'sm');
    expect(chip).toHaveAttribute('data-variant', 'outline');
  });

  it('renders an optional start element', () => {
    render(<Chip startElement={startElement}>Production</Chip>);
    expect(screen.getByTestId('start-element')).toBeInTheDocument();
  });

  it('supports interactive elements inside children', async () => {
    const handleClose = vi.fn();
    render(
      <Chip onClose={handleClose} closeAriaLabel="Remove variable">
        <input aria-label="Variable label" defaultValue="production" />
        <button type="button">Edit label</button>
      </Chip>,
    );

    const input = screen.getByRole('textbox', { name: 'Variable label' });
    const editButton = screen.getByRole('button', { name: 'Edit label' });

    await userEvent.type(input, ' west');
    expect(input).toHaveValue('production west');
    await userEvent.tab();
    expect(editButton).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(handleClose).not.toHaveBeenCalled();

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Remove variable' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders a close button when onClose is provided', () => {
    render(<Chip onClose={noop}>Removable</Chip>);
    expect(screen.getByRole('button', { name: 'Remove Removable' })).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const handleClose = vi.fn();
    render(<Chip onClose={handleClose}>Removable</Chip>);
    await userEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('uses a custom close icon when provided', () => {
    render(
      <Chip onClose={noop} closeIcon={closeIcon}>
        Removable
      </Chip>,
    );
    expect(screen.getByTestId('close-icon')).toBeInTheDocument();
  });

  it('supports a custom close aria label', () => {
    render(
      <Chip onClose={noop} closeAriaLabel="Remove production environment">
        Production
      </Chip>,
    );
    expect(screen.getByRole('button', { name: 'Remove production environment' })).toBeInTheDocument();
  });

  it('does not propagate close-button clicks to a parent', async () => {
    const handleClick = vi.fn();
    const handleClose = vi.fn();
    render(
      <div role="presentation" onClick={handleClick}>
        <Chip onClose={handleClose}>Removable</Chip>
      </div>,
    );

    await userEvent.click(screen.getByRole('button', { name: /remove/i }));

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('supports onClick and onClose together', async () => {
    const handleClick = vi.fn();
    const handleClose = vi.fn();
    render(
      <Chip onClick={handleClick} onClose={handleClose}>
        Selectable
      </Chip>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Selectable' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Remove Selectable' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('keeps keyboard activation of the close button separate from onClick', async () => {
    const handleClick = vi.fn();
    const handleClose = vi.fn();
    render(
      <Chip onClick={handleClick} onClose={handleClose}>
        Selectable
      </Chip>,
    );

    screen.getByRole('button', { name: 'Remove Selectable' }).focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    expect(handleClose).toHaveBeenCalledTimes(2);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders clickable Chips as keyboard-operable buttons', async () => {
    const handleClick = vi.fn();
    render(<Chip onClick={handleClick}>Show all</Chip>);

    const chip = screen.getByRole('button', { name: 'Show all' });
    await userEvent.click(chip);
    chip.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    expect(handleClick).toHaveBeenCalledTimes(3);
  });

  it('does not submit a form when selecting or removing a Chip', async () => {
    const handleSubmit = vi.fn((event: FormEvent<HTMLFormElement>): void => event.preventDefault());
    const handleClick = vi.fn();
    const handleClose = vi.fn();

    render(
      <form onSubmit={handleSubmit}>
        <Chip onClick={handleClick}>Selectable</Chip>
        <Chip onClose={handleClose}>Removable</Chip>
      </form>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Selectable' }));
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await userEvent.click(screen.getByRole('button', { name: 'Remove Removable' }));

    expect(handleClick).toHaveBeenCalledTimes(3);
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it.each(['clickable', 'removable'] as const)('prevents interactions on a disabled %s Chip', async (mode) => {
    const handleAction = vi.fn();
    render(
      mode === 'clickable' ? (
        <Chip disabled onClick={handleAction}>
          Disabled
        </Chip>
      ) : (
        <Chip disabled onClose={handleAction}>
          Disabled
        </Chip>
      ),
    );

    await userEvent.click(screen.getByRole('button'));

    expect(handleAction).not.toHaveBeenCalled();
  });

  it('keeps visual props on the container and forwards the ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Chip
        ref={ref}
        color="warning"
        size="sm"
        variant="outline"
        disabled
        className="custom-chip"
        style={customChipStyle}
        maxWidth={120}
        onClose={noop}
      >
        Production
      </Chip>,
    );

    const chip = screen.getByText('Production').closest('.ps-Chip');
    expect(ref.current).toBe(chip);
    expect(chip).toHaveClass('custom-chip');
    expect(chip).toHaveAttribute('data-color', 'warning');
    expect(chip).toHaveAttribute('data-size', 'sm');
    expect(chip).toHaveAttribute('data-variant', 'outline');
    expect(chip).toHaveAttribute('data-disabled', 'true');
    expect(chip).toHaveStyle({
      '--perses-chip-label-max-width': '120px',
      marginTop: '4px',
    });
  });

  it.each([
    [120, '120px'],
    [0, '0px'],
    ['12ch', '12ch'],
  ])('sets maxWidth %s as the CSS length %s', (maxWidth, expected) => {
    render(
      <Chip maxWidth={maxWidth} style={customChipStyle}>
        Production
      </Chip>,
    );
    expect(screen.getByText('Production').closest('.ps-Chip')).toHaveStyle({
      '--perses-chip-label-max-width': expected,
      marginTop: '4px',
    });
  });

  it('restores the style-defined width when maxWidth is removed', () => {
    const { rerender } = render(
      <Chip maxWidth={120} style={customChipStyle}>
        Production
      </Chip>,
    );

    rerender(<Chip style={customChipStyle}>Production</Chip>);

    expect(screen.getByText('Production').closest('.ps-Chip')).toHaveStyle({
      '--perses-chip-label-max-width': '20ch',
      marginTop: '4px',
    });
  });

  it('renders no close button when onClose is omitted', () => {
    render(<Chip>Fixed</Chip>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('merges additional className', () => {
    render(<Chip className="custom">Production</Chip>);
    expect(screen.getByText('Production').closest('.ps-Chip')).toHaveClass('custom');
  });

  it('forwards div attributes', () => {
    render(
      <Chip aria-describedby="chip-description" data-testid="production-chip">
        Production
      </Chip>,
    );
    expect(screen.getByTestId('production-chip')).toHaveAttribute('aria-describedby', 'chip-description');
  });

  describe('style props', () => {
    it('maps spacing, sizing and display props to classes and variables', () => {
      const { container } = render(
        <Chip p="md" width={responsiveWidth} display={responsiveDisplay}>
          Production
        </Chip>,
      );
      const chip = container.querySelector<HTMLElement>('.ps-Chip');
      expect(chip).toHaveClass('ps-p', 'ps-width', 'ps-display');
      expect(chip?.style.getPropertyValue('--ps-width')).toBe('100px');
      expect(chip?.style.getPropertyValue('--ps-width-md')).toBe('200px');
      expect(chip?.style.getPropertyValue('--ps-display')).toBe('flex');
    });

    it('lets the style prop override computed variables', () => {
      render(
        <Chip width={100} style={widthOverride}>
          Production
        </Chip>,
      );
      expect(screen.getByText('Production').closest('.ps-Chip')).toHaveStyle({
        '--ps-width': '50px',
      });
    });

    it('keeps maxWidth as the label limit rather than a style prop', () => {
      const { container } = render(<Chip maxWidth={120}>Production</Chip>);
      const chip = container.querySelector<HTMLElement>('.ps-Chip');
      expect(chip).not.toHaveClass('ps-max-width');
      expect(chip?.style.getPropertyValue('--perses-chip-label-max-width')).toBe('120px');
    });

    it('applies a per-size override custom property to the chip', () => {
      const { container } = render(
        <Chip size="sm" style={chipSizeOverride}>
          Tag
        </Chip>,
      );
      const chip = container.querySelector<HTMLElement>('.ps-Chip');
      expect(chip?.style.getPropertyValue('--perses-chip-size-sm')).toBe('40px');
    });

    it.each(['solid', 'outline'] as const)('applies typed border tokens to the %s chip container', (variant) => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Chip ref={ref} variant={variant} style={chipBorderOverride} maxWidth={120} onClick={noop} onClose={noop}>
          Production
        </Chip>,
      );
      expect(ref.current).toHaveStyle({
        '--perses-chip-border-style': 'dashed',
        '--perses-chip-border-width': 'var(--perses-border-width-md)',
        '--perses-chip-label-max-width': '120px',
      });
    });

    it('does not leak style props to the DOM', () => {
      render(<Chip m="sm">Production</Chip>);
      expect(screen.getByText('Production').closest('.ps-Chip')).not.toHaveAttribute('m');
    });
  });

  describe('combinations', () => {
    const colors: ChipColor[] = ['default', 'primary', 'secondary', 'error', 'warning', 'success', 'info'];
    const sizes: ChipSize[] = ['xs', 'sm'];
    const variants: ChipVariant[] = ['solid', 'outline'];

    it.each(
      colors.flatMap((color) => sizes.flatMap((size) => variants.map((variant) => [color, size, variant] as const))),
    )('renders color=%s size=%s variant=%s', (color, size, variant) => {
      render(
        <Chip color={color} size={size} variant={variant}>
          Chip
        </Chip>,
      );
      const chip = screen.getByText('Chip').closest('.ps-Chip');
      expect(chip).toHaveAttribute('data-color', color);
      expect(chip).toHaveAttribute('data-size', size);
      expect(chip).toHaveAttribute('data-variant', variant);
    });

    it.each([
      [false, false],
      [true, false],
      [false, true],
      [true, true],
    ])('renders with disabled=%s and onClick=%s', (disabled, clickable) => {
      render(
        <Chip disabled={disabled} onClick={clickable ? noop : undefined} onClose={noop}>
          Chip
        </Chip>,
      );
      const chip = screen.getByText('Chip').closest('.ps-Chip');
      if (disabled) expect(chip).toHaveAttribute('data-disabled', 'true');
      else expect(chip).not.toHaveAttribute('data-disabled');
      expect(screen.getByRole('button', { name: 'Remove Chip' })).toHaveProperty('disabled', disabled);
    });
  });

  describe('accessibility', () => {
    it('is not exposed as a button or focusable when static', () => {
      render(<Chip>Static</Chip>);
      const chip = screen.getByText('Static').closest('.ps-Chip');
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(chip).not.toHaveAttribute('tabindex');
      expect(chip).not.toHaveAttribute('aria-disabled');
    });

    it('names the close button from text or number children', () => {
      render(
        <>
          <Chip onClose={noop}>Text</Chip>
          <Chip onClose={noop}>{42}</Chip>
        </>,
      );
      expect(screen.getByRole('button', { name: 'Remove Text' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove 42' })).toBeInTheDocument();
    });

    it('falls back to "Remove" for non-text children and honours closeAriaLabel', () => {
      render(
        <>
          <Chip onClose={noop}>
            <svg aria-label="Online" />
          </Chip>
          <Chip onClose={noop} closeAriaLabel="Delete filter">
            <svg aria-label="Online" />
          </Chip>
        </>,
      );
      expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete filter' })).toBeInTheDocument();
    });

    it('hides the default close icon from assistive technology', () => {
      render(<Chip onClose={noop}>Tag</Chip>);
      expect(screen.getByRole('button', { name: 'Remove Tag' }).querySelector('svg')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    });

    it('makes a clickable chip focusable via Tab', async () => {
      render(<Chip onClick={noop}>Pick</Chip>);
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'Pick' })).toHaveFocus();
    });

    it('does not nest the close button inside a button when onClick and onClose are combined', () => {
      render(
        <Chip onClick={noop} onClose={noop}>
          Both
        </Chip>,
      );
      const action = screen.getByRole('button', { name: 'Both' });
      const close = screen.getByRole('button', { name: 'Remove Both' });
      expect(action).not.toContainElement(close);
      expect(close.closest('[role="button"]')).toBeNull();
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('tabs through the action then the close button and activates each with the keyboard', async () => {
      const handleClick = vi.fn();
      const handleClose = vi.fn();
      render(
        <Chip onClick={handleClick} onClose={handleClose}>
          Both
        </Chip>,
      );
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'Both' })).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'Remove Both' })).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      expect(handleClose).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it.each([
      [false, 0],
      [true, 2],
    ] as const)(
      'does not synthesize chip clicks from nested-control keys in %s removable mode',
      async (removable, keyDownCalls) => {
        const handleClick = vi.fn();
        const handleKeyDown = vi.fn();
        render(
          <Chip
            onClick={handleClick}
            onClose={removable ? noop : undefined}
            onKeyDown={handleKeyDown}
            startElement={filterInput}
          >
            Pick
          </Chip>,
        );

        screen.getByRole('textbox', { name: 'Filter value' }).focus();
        await userEvent.keyboard('{Enter} ');

        expect(handleClick).not.toHaveBeenCalled();
        expect(handleKeyDown).toHaveBeenCalledTimes(keyDownCalls);
      },
    );

    it.each([false, true])(
      'moves action semantics and keyboard activation when removable changes from %s',
      async (removable) => {
        const ref = createRef<HTMLDivElement>();
        const handleClick = vi.fn();
        const { rerender } = render(
          <Chip
            ref={ref}
            role="note"
            tabIndex={-1}
            aria-label="Environment filter"
            aria-live="polite"
            onClick={handleClick}
            onClose={removable ? noop : undefined}
          >
            Production
          </Chip>,
        );
        const firstAction = screen.getByRole('button', { name: 'Environment filter' });
        expect(firstAction === ref.current).toBe(!removable);
        firstAction.focus();
        await userEvent.keyboard('{Enter}');
        expect(handleClick).toHaveBeenCalledTimes(1);

        rerender(
          <Chip
            ref={ref}
            role="note"
            tabIndex={-1}
            aria-label="Environment filter"
            aria-live="polite"
            onClick={handleClick}
            onClose={removable ? undefined : noop}
          >
            Production
          </Chip>,
        );

        const action = screen.getByRole('button', { name: 'Environment filter' });
        expect(action === ref.current).toBe(removable);
        expect(action).toHaveAttribute('tabindex', '-1');
        expect(ref.current).toHaveAttribute('aria-live', 'polite');
        if (!removable) {
          expect(ref.current).toHaveAttribute('role', 'note');
          expect(ref.current).not.toHaveAttribute('tabindex');
          expect(ref.current).not.toHaveAttribute('aria-label');
        }
        action.focus();
        await userEvent.keyboard(' ');
        expect(handleClick).toHaveBeenCalledTimes(2);
      },
    );

    it('removes action semantics and activation when onClick is removed', async () => {
      const handleClick = vi.fn();
      const handleKeyDown = vi.fn();
      const { rerender } = render(
        <Chip onClick={handleClick} onClose={noop}>
          Pick
        </Chip>,
      );

      rerender(
        <Chip role="note" tabIndex={0} onKeyDown={handleKeyDown} onClose={noop}>
          Pick
        </Chip>,
      );

      const chip = screen.getByRole('note');
      expect(screen.queryByRole('button', { name: 'Pick' })).not.toBeInTheDocument();
      expect(chip).toHaveAttribute('tabindex', '0');
      chip.focus();
      await userEvent.keyboard('{Enter} ');
      expect(handleClick).not.toHaveBeenCalled();
      expect(handleKeyDown).toHaveBeenCalledTimes(2);
    });

    it('does not activate on other keys', async () => {
      const handleClick = vi.fn();
      render(<Chip onClick={handleClick}>Pick</Chip>);
      await userEvent.tab();
      await userEvent.keyboard('a{Escape}{Tab}');
      expect(handleClick).not.toHaveBeenCalled();
    });

    it.each([
      [false, '{Enter}'],
      [false, ' '],
      [true, '{Enter}'],
      [true, ' '],
    ] as const)('lets onKeyDown cancel %s removable mode activation with %s', async (removable, key) => {
      const handleClick = vi.fn();
      const handleKeyDown = vi.fn(preventDefault);
      render(
        <Chip onClick={handleClick} onClose={removable ? noop : undefined} onKeyDown={handleKeyDown}>
          Pick
        </Chip>,
      );
      await userEvent.tab();
      await userEvent.keyboard(key);
      expect(handleClick).not.toHaveBeenCalled();
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });

    it('calls onKeyDown once for each action and close-button key press', async () => {
      const handleClick = vi.fn();
      const handleClose = vi.fn();
      const handleKeyDown = vi.fn();
      render(
        <Chip onClick={handleClick} onClose={handleClose} onKeyDown={handleKeyDown}>
          Pick
        </Chip>,
      );
      screen.getByRole('button', { name: 'Pick' }).focus();
      await userEvent.keyboard('{Enter}');
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);

      screen.getByRole('button', { name: 'Remove Pick' }).focus();
      await userEvent.keyboard('{Enter}');
      expect(handleKeyDown).toHaveBeenCalledTimes(2);
      expect(handleClose).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('exposes a disabled clickable chip as aria-disabled and removes it from the tab order', async () => {
      const handleClick = vi.fn();
      render(
        <Chip disabled onClick={handleClick}>
          Off
        </Chip>,
      );
      const chip = screen.getByRole('button', { name: 'Off' });
      expect(chip).toHaveAttribute('aria-disabled', 'true');
      expect(chip).toHaveAttribute('tabindex', '-1');
      await userEvent.tab();
      expect(chip).not.toHaveFocus();
      chip.focus();
      await userEvent.keyboard('{Enter} ');
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('disables the close button natively and keeps the action aria-disabled when combined', () => {
      render(
        <Chip disabled onClick={noop} onClose={noop}>
          Off
        </Chip>,
      );
      expect(screen.getByRole('button', { name: 'Off' })).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByRole('button', { name: 'Remove Off' })).toBeDisabled();
    });

    it('forwards aria attributes and a custom role to the root', () => {
      render(
        <Chip role="note" aria-label="Environment" aria-describedby="hint">
          Prod
        </Chip>,
      );
      const chip = screen.getByRole('note', { name: 'Environment' });
      expect(chip).toHaveAttribute('aria-describedby', 'hint');
    });

    it('respects an explicit tabIndex on a static chip', () => {
      render(<Chip tabIndex={0}>Static</Chip>);
      expect(screen.getByText('Static').closest('.ps-Chip')).toHaveAttribute('tabindex', '0');
    });

    it('conveys a status color in the data attribute and keeps the text label as the accessible content', () => {
      render(<Chip color="error">Failed</Chip>);
      expect(screen.getByText('Failed')).toBeVisible();
    });

    it('names an icon-only clickable chip from aria-label', () => {
      render(<Chip startElement={startElement} aria-label="Filter by tag" onClick={noop} />);
      const chip = screen.getByRole('button', { name: 'Filter by tag' });
      expect(chip).toHaveClass('ps-Chip');
      expect(chip).toContainElement(screen.getByTestId('start-element'));
    });

    it('names an icon-only clickable and removable action from aria-label', () => {
      render(<Chip startElement={startElement} aria-label="Filter by tag" onClick={noop} onClose={noop} />);
      expect(screen.getByRole('button', { name: 'Filter by tag' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    });

    it('exposes action naming, description and state while keeping container attributes on the root', () => {
      render(
        <>
          <span id="chip-name">Environment filter</span>
          <span id="chip-hint">Show production dashboards</span>
          <Chip
            id="environment-chip"
            data-testid="environment-chip"

            aria-labelledby="chip-name"
            aria-describedby="chip-hint"
            aria-pressed
            aria-expanded
            aria-controls="filter-options"
            aria-haspopup="listbox"
            onClick={noop}
            onClose={noop}
          >
            Production
          </Chip>
        </>,
      );

      const action = screen.getByRole('button', { name: 'Environment filter', pressed: true, expanded: true });
      expect(action).toHaveAccessibleDescription('Show production dashboards');
      expect(action).toHaveAttribute('aria-controls', 'filter-options');
      expect(action).toHaveAttribute('aria-haspopup', 'listbox');
      const container = screen.getByTestId('environment-chip');
      expect(container).toHaveAttribute('id', 'environment-chip');
      expect(container).not.toHaveAttribute('role');
      expect(container).not.toHaveAttribute('aria-labelledby');
      expect(container).not.toHaveAttribute('aria-pressed');
    });

    it('keeps aria-hidden on the container so both actions remain hidden', () => {
      render(
        <Chip aria-hidden onClick={noop} onClose={noop}>
          Hidden
        </Chip>,
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getAllByRole('button', { hidden: true })).toHaveLength(2);
    });

    it.each([0, -1])('applies explicit tabIndex=%s only to the combined-mode action', async (tabIndex) => {
      render(
        <Chip tabIndex={tabIndex} onClick={noop} onClose={noop}>
          Pick
        </Chip>,
      );
      const action = screen.getByRole('button', { name: 'Pick' });
      const close = screen.getByRole('button', { name: 'Remove Pick' });
      expect(action).toHaveAttribute('tabindex', String(tabIndex));
      expect(action.closest('.ps-Chip')).not.toHaveAttribute('tabindex');
      await userEvent.tab();
      expect(tabIndex === 0 ? action : close).toHaveFocus();
      if (tabIndex === 0) {
        await userEvent.tab();
        expect(close).toHaveFocus();
      }
    });

    it('requires aria-label when there are no children', () => {
      // @ts-expect-error -- an icon-only chip without aria-label would be an unnamed element
      render(<Chip startElement={startElement} onClick={noop} />);
      expect(screen.getByTestId('start-element')).toBeInTheDocument();
    });
  });
});
