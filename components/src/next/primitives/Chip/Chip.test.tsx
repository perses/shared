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
import type { CSSProperties, FocusEvent, FormEvent, KeyboardEvent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Chip } from './Chip';

const noop = (): void => {};
const customChipStyle: CSSProperties & { '--chip-label-max-width': string } = {
  marginTop: 4,
  '--chip-label-max-width': '20ch',
};
const editableLabel = (
  <>
    <input aria-label="Variable label" defaultValue="production" />
    <button type="button">Edit label</button>
  </>
);

describe('Chip', () => {
  it('renders the label', () => {
    render(<Chip label="Production" />);
    expect(screen.getByText('Production')).toBeInTheDocument();
  });

  it('applies the ps-Chip class', () => {
    render(<Chip label="Production" />);
    expect(screen.getByText('Production').closest('.ps-Chip')).toBeInTheDocument();
  });

  it('defaults to default color', () => {
    render(<Chip label="Production" />);
    expect(screen.getByText('Production').closest('.ps-Chip')).toHaveAttribute('data-color', 'default');
  });

  it('sets data-color attribute', () => {
    render(<Chip label="Secondary" color="secondary" />);
    expect(screen.getByText('Secondary').closest('.ps-Chip')).toHaveAttribute('data-color', 'secondary');
  });

  it('sets data-status attribute independently of color', () => {
    render(<Chip label="Error" color="secondary" status="error" />);
    const chip = screen.getByText('Error').closest('.ps-Chip');
    expect(chip).toHaveAttribute('data-color', 'secondary');
    expect(chip).toHaveAttribute('data-status', 'error');
  });

  it('defaults to the sm filled variant', () => {
    render(<Chip label="Production" />);
    const chip = screen.getByText('Production').closest('.ps-Chip');
    expect(chip).toHaveAttribute('data-size', 'sm');
    expect(chip).toHaveAttribute('data-variant', 'filled');
  });

  it('sets data-size and data-variant attributes', () => {
    render(<Chip label="Production" size="md" variant="outlined" />);
    const chip = screen.getByText('Production').closest('.ps-Chip');
    expect(chip).toHaveAttribute('data-size', 'md');
    expect(chip).toHaveAttribute('data-variant', 'outlined');
  });

  it.each([
    { mode: 'static', props: {} },
    { mode: 'clickable', props: { onClick: noop } },
    { mode: 'removable', props: { onDelete: noop } },
    { mode: 'link', props: { href: '#docs' } },
    { mode: 'removable link', props: { href: '#docs', onDelete: noop } },
  ])('keeps visual props on the outer container for a $mode Chip', ({ props }) => {
    render(
      <Chip
        {...props}
        label="Production"
        color="secondary"
        status="warning"
        size="md"
        variant="outlined"
        disabled
        className="custom-chip"
        style={customChipStyle}
        textMaxWidth={120}
      />,
    );

    const chip = screen.getByText('Production').closest('.ps-Chip');
    expect(chip).toHaveClass('custom-chip');
    expect(chip).toHaveAttribute('data-color', 'secondary');
    expect(chip).toHaveAttribute('data-status', 'warning');
    expect(chip).toHaveAttribute('data-size', 'md');
    expect(chip).toHaveAttribute('data-variant', 'outlined');
    expect(chip).toHaveAttribute('data-disabled', 'true');
    expect(chip).toHaveStyle({ '--chip-label-max-width': '120px', marginTop: '4px' });
  });

  it('renders an optional leading icon', () => {
    render(<Chip label="Production" icon={<svg data-testid="leading-icon" />} />);
    expect(screen.getByTestId('leading-icon')).toBeInTheDocument();
  });

  it('uses children when label is omitted', () => {
    render(<Chip>Production</Chip>);
    expect(screen.getByText('Production')).toBeInTheDocument();
  });

  it.each([false, true])('supports editing controls inside the label (removable: %s)', async (removable) => {
    const handleDelete = vi.fn();
    render(
      <Chip label={editableLabel} onDelete={removable ? handleDelete : undefined} deleteAriaLabel="Remove variable" />,
    );

    const input = screen.getByRole('textbox', { name: 'Variable label' });
    const editButton = screen.getByRole('button', { name: 'Edit label' });
    expect(input.closest('button, a, [role="button"]')).toBeNull();
    expect(editButton.parentElement?.closest('button, a, [role="button"]')).toBeNull();

    await userEvent.type(input, ' west');
    await userEvent.keyboard('{Enter}{Escape}');
    expect(input).toHaveValue('production west');
    await userEvent.tab();
    expect(editButton).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(handleDelete).not.toHaveBeenCalled();

    if (removable) {
      const removeButton = screen.getByRole('button', { name: 'Remove variable' });
      expect(removeButton.parentElement).toBe(input.closest('.ps-Chip'));
      expect(removeButton.closest('.ps-Chip__label')).toBeNull();
      await userEvent.tab();
      expect(removeButton).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      expect(handleDelete).toHaveBeenCalledTimes(1);
    }
  });

  it('renders a delete button when onDelete is provided', () => {
    render(<Chip label="Removable" onDelete={noop} />);
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('calls onDelete when the delete button is clicked', async () => {
    const handleDelete = vi.fn();
    render(<Chip label="Removable" onDelete={handleDelete} />);
    await userEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it('uses a custom delete icon when provided', () => {
    render(<Chip label="Removable" onDelete={noop} deleteIcon={<svg data-testid="delete-icon" />} />);
    expect(screen.getByTestId('delete-icon')).toBeInTheDocument();
  });

  it('does not propagate delete clicks to a parent', async () => {
    const handleClick = vi.fn();
    const handleDelete = vi.fn();
    render(
      <div role="presentation" onClick={handleClick}>
        <Chip label="Removable" onDelete={handleDelete} />
      </div>,
    );

    await userEvent.click(screen.getByRole('button', { name: /remove/i }));

    expect(handleDelete).toHaveBeenCalledTimes(1);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('rejects providing onClick and onDelete together', () => {
    // @ts-expect-error: Chips accept either onClick or onDelete, but not both.
    const invalidChip = <Chip label="Invalid" onClick={noop} onDelete={noop} />;
    expect(() => renderToStaticMarkup(invalidChip)).toThrow('Chip accepts either onClick or onDelete, but not both.');
  });

  it('renders separate sibling controls when a Chip is a removable link', () => {
    render(<Chip label="Removable" href="/docs" onDelete={noop} />);

    const chip = screen.getByText('Removable').closest('.ps-Chip');
    expect(chip).not.toHaveAttribute('role', 'button');
    const link = screen.getByRole('link', { name: 'Removable' });
    expect(link).toHaveAttribute('href', '/docs');
    expect(link.parentElement).toBe(chip);
    expect(screen.getByRole('button', { name: /remove removable/i }).parentElement).toBe(chip);
  });

  it.each([false, true])('keeps the accessible name and description on the link (removable: %s)', (removable) => {
    render(
      <>
        <span id="filters-description">View the remaining filters</span>
        <Chip
          label="+3"
          href="#filters"
          aria-label="Show three more filters"
          aria-describedby="filters-description"
          onDelete={removable ? noop : undefined}
        />
      </>,
    );

    const link = screen.getByRole('link', { name: 'Show three more filters' });
    expect(link).toHaveAccessibleDescription('View the remaining filters');
    if (removable) {
      expect(screen.getByRole('button', { name: 'Remove +3' })).not.toHaveAttribute('aria-describedby');
    }
  });

  it.each([false, true])('keeps aria-labelledby on the link (removable: %s)', (removable) => {
    render(
      <>
        <span id="filters-label">Show three more filters</span>
        <Chip label="+3" href="#filters" aria-labelledby="filters-label" onDelete={removable ? noop : undefined} />
      </>,
    );

    expect(screen.getByRole('link', { name: 'Show three more filters' })).toHaveAttribute(
      'aria-labelledby',
      'filters-label',
    );
  });

  it('forwards a custom role to the removable link rather than the wrapper', () => {
    render(<Chip label="Documentation" href="#docs" role="menuitem" onDelete={noop} />);

    const action = screen.getByRole('menuitem', { name: 'Documentation' });
    expect(action).toHaveAttribute('href', '#docs');
    expect(action.parentElement).not.toHaveAttribute('role');
    expect(screen.getByRole('button', { name: 'Remove Documentation' }).parentElement).toBe(action.parentElement);
  });

  it('keeps focus and keyboard handlers on the link, separate from the remove button', async () => {
    const ref = createRef<HTMLElement>();
    const handleFocus = vi.fn((event: FocusEvent<HTMLElement>) => event.currentTarget);
    const handleBlur = vi.fn((event: FocusEvent<HTMLElement>) => event.currentTarget);
    const handleKeyDown = vi.fn((event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Enter') event.preventDefault();
      return event.currentTarget;
    });
    const handleKeyUp = vi.fn((event: KeyboardEvent<HTMLElement>) => event.currentTarget);
    const handleDelete = vi.fn();
    render(
      <Chip
        ref={ref}
        id="documentation-link"
        label="Documentation"
        component="a"
        href="#docs"
        className="custom-chip"
        style={customChipStyle}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onDelete={handleDelete}
      />,
    );

    const link = screen.getByRole('link', { name: 'Documentation' });
    expect(ref.current).toBe(link);
    expect(link).toHaveAttribute('id', 'documentation-link');
    expect(link.parentElement).toHaveClass('ps-Chip', 'custom-chip');
    expect(link.parentElement).toHaveStyle({ marginTop: '4px' });

    await userEvent.tab();
    expect(link).toHaveFocus();
    expect(handleFocus).toHaveLastReturnedWith(link);
    await userEvent.keyboard('{Enter}');
    expect(handleKeyDown).toHaveLastReturnedWith(link);
    expect(handleKeyUp).toHaveLastReturnedWith(link);
    expect(handleDelete).not.toHaveBeenCalled();

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Remove Documentation' })).toHaveFocus();
    expect(handleBlur).toHaveLastReturnedWith(link);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    handleKeyDown.mockClear();
    handleKeyUp.mockClear();

    await userEvent.keyboard('{Enter}');
    expect(handleDelete).toHaveBeenCalledTimes(1);
    expect(handleKeyDown).not.toHaveBeenCalled();
    expect(handleKeyUp).not.toHaveBeenCalled();
  });

  it.each(['{Enter}', ' '])('keeps custom clickable elements keyboard-operable with %s', async (key) => {
    const handleClick = vi.fn();
    render(<Chip component="span" label="+3" aria-label="Show three more filters" onClick={handleClick} />);

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Show three more filters' })).toHaveFocus();
    await userEvent.keyboard(key);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not submit a form when selecting or removing a Chip', async () => {
    const handleSubmit = vi.fn((event: FormEvent<HTMLFormElement>): void => event.preventDefault());
    const handleClick = vi.fn();
    const handleDelete = vi.fn();
    const handleLinkDelete = vi.fn();

    render(
      <form onSubmit={handleSubmit}>
        <Chip label="Selectable" onClick={handleClick} />
        <Chip label="Removable" onDelete={handleDelete} />
        <Chip label="Linked" href="/docs" onDelete={handleLinkDelete} />
      </form>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Selectable' }));
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await userEvent.click(screen.getByRole('button', { name: 'Remove Removable' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove Linked' }));

    expect(handleClick).toHaveBeenCalledTimes(3);
    expect(handleDelete).toHaveBeenCalledTimes(1);
    expect(handleLinkDelete).toHaveBeenCalledTimes(1);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('renders clickable Chips as keyboard-operable buttons', async () => {
    const handleClick = vi.fn();
    render(<Chip label="Show all" onClick={handleClick} />);

    const chip = screen.getByRole('button', { name: 'Show all' });
    await userEvent.click(chip);
    await userEvent.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('renders href Chips as links', () => {
    render(<Chip label="Documentation" href="/docs" target="_blank" />);
    expect(screen.getByRole('link', { name: 'Documentation' })).toHaveAttribute('href', '/docs');
    expect(screen.getByRole('link', { name: 'Documentation' })).toHaveAttribute('target', '_blank');
  });

  it.each(['clickable', 'removable'] as const)('prevents interactions on a disabled %s Chip', async (mode) => {
    const handleAction = vi.fn();
    render(
      mode === 'clickable' ? (
        <Chip label="Disabled" disabled onClick={handleAction} />
      ) : (
        <Chip label="Disabled" disabled onDelete={handleAction} />
      ),
    );

    await userEvent.click(screen.getByRole('button'));

    expect(handleAction).not.toHaveBeenCalled();
  });

  it('supports a custom close-button aria label and properties', () => {
    render(
      <Chip
        label="Production"
        onDelete={noop}
        closeBtnAriaLabel="Remove production environment"
        closeBtnProps={{ 'data-testid': 'close-button' }}
      />,
    );

    expect(screen.getByTestId('close-button')).toHaveAccessibleName('Remove production environment');
  });

  it('renders a custom close button without nesting it in another button', async () => {
    const handleDelete = vi.fn();
    render(<Chip label="Production" onDelete={handleDelete} closeBtn={<button type="button">Remove custom</button>} />);

    const closeButton = screen.getByRole('button', { name: /remove production/i });
    expect(closeButton.parentElement).toHaveClass('ps-Chip');
    await userEvent.click(closeButton);
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it.each([
    [120, '120px'],
    [0, '0px'],
    ['12ch', '12ch'],
  ])('sets textMaxWidth %s as the CSS length %s', (textMaxWidth, expected) => {
    render(<Chip label="Production" textMaxWidth={textMaxWidth} style={customChipStyle} />);
    expect(screen.getByText('Production').closest('.ps-Chip')).toHaveStyle({
      '--chip-label-max-width': expected,
      marginTop: '4px',
    });
  });

  it('restores the style-defined width when textMaxWidth is removed', () => {
    const { rerender } = render(<Chip label="Production" textMaxWidth={120} style={customChipStyle} />);

    rerender(<Chip label="Production" style={customChipStyle} />);

    expect(screen.getByText('Production').closest('.ps-Chip')).toHaveStyle({
      '--chip-label-max-width': '20ch',
      marginTop: '4px',
    });
  });

  it('renders no delete button when onDelete is omitted', () => {
    render(<Chip label="Fixed" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('merges additional className', () => {
    render(<Chip label="Production" className="custom" />);
    expect(screen.getByText('Production').closest('.ps-Chip')).toHaveClass('custom');
  });

  it('forwards div attributes', () => {
    render(<Chip label="Production" aria-describedby="chip-description" data-testid="production-chip" />);
    expect(screen.getByTestId('production-chip')).toHaveAttribute('aria-describedby', 'chip-description');
  });
});
