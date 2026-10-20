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

import clsx from 'clsx';
import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes, MouseEventHandler, ReactElement, ReactNode } from 'react';

import type { DisplayProps, SizingProps, SpacingProps } from '../system';
import {
  applyStyleProps,
  compileStyleProps,
  displayProps,
  lengthTransform,
  sizingProps,
  spacingProps,
} from '../system';
import type { ColorVariant, Size, Status } from '../types';
import { ChipCloseButton } from './ChipCloseButton';
import { useChipAction } from './useChipAction';

import '../system/layout.css';
import '../system/spacing.css';
import './chip.css';

export type ChipSize = Extract<Size, 'xs' | 'sm' | 'md'>;
export type ChipVariant = 'solid' | 'outline';

// `maxWidth` keeps its own meaning (the label's max width), so it is not a style prop here.
const { maxWidth: _labelMaxWidth, ...chipSizingProps } = sizingProps;
const CHIP_STYLE_PROPS = compileStyleProps([spacingProps, chipSizingProps, displayProps]);
const CONTAINER_ARIA_PROPS = new Set(['aria-hidden', 'aria-live', 'aria-atomic', 'aria-relevant', 'aria-busy']);

// Event handlers are typed against `HTMLElement` because, with `onClick` and `onClose` combined, the action (and so
// `event.currentTarget`) is the label span rather than the root div.
interface ChipBaseProps
  extends Omit<HTMLAttributes<HTMLElement>, 'color'>, SpacingProps, Omit<SizingProps, 'maxWidth'>, DisplayProps {
  /**
   * Palette of the chip; `default` is the neutral default. Status values are visual only; convey state through
   * the label too.
   */
  color?: ColorVariant | Status;
  size?: ChipSize;
  variant?: ChipVariant;
  disabled?: boolean;
  startElement?: ReactNode;
  closeIcon?: ReactElement;
  /** Accessible name of the close button. Defaults to `Remove <children>` for text children, otherwise `Remove`. */
  closeAriaLabel?: string;
  /** Renders a close button. Clicks on it do not reach `onClick`. */
  onClose?: MouseEventHandler<HTMLButtonElement>;
  /** Maximum width of the label; longer text is truncated with an ellipsis. */
  maxWidth?: CSSProperties['maxWidth'];
  style?: ChipStyle;
}

/**
 * Visible `children` give the chip its accessible name. A chip without children (for example, `startElement` only)
 * must provide `aria-label` instead so it is never exposed as an unnamed element or button.
 */
type ChipAccessibleName =
  | { children: ReactNode; 'aria-label'?: string }
  | { children?: undefined; 'aria-label': string };

export type ChipProps = ChipBaseProps & ChipAccessibleName;

export interface ChipStyle extends CSSProperties {
  /** Border line style; defaults to `solid`. */
  '--perses-chip-border-style'?: CSSProperties['borderStyle'];
  /** CSS border width; defaults to `var(--perses-border-width-sm)`. */
  '--perses-chip-border-width'?: string;
  '--perses-chip-label-max-width'?: string;
  /** Per-step height override; falls back to the shared control-size scale. */
  '--perses-chip-size-xs'?: string;
  '--perses-chip-size-sm'?: string;
}

function withLabelMaxWidth(style: ChipStyle | undefined, maxWidth: CSSProperties['maxWidth']): ChipStyle | undefined {
  if (maxWidth === undefined) return style;
  return { ...style, '--perses-chip-label-max-width': lengthTransform(maxWidth) };
}

interface ChipAriaProps {
  rootProps: Record<string, unknown>;
  actionAriaProps: Record<string, unknown>;
}

function splitChipAriaProps(domProps: Record<string, unknown>, actionOnLabel: boolean): ChipAriaProps {
  const actionAriaProps: Record<string, unknown> = {};
  if (!actionOnLabel) return { rootProps: domProps, actionAriaProps };

  const rootProps: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(domProps)) {
    if (name.startsWith('aria-') && !CONTAINER_ARIA_PROPS.has(name)) {
      actionAriaProps[name] = value;
    } else {
      rootProps[name] = value;
    }
  }
  return { rootProps, actionAriaProps };
}

/**
 * A compact element that represents an input, attribute, or action.
 *
 * Spacing, sizing (except `maxWidth`, which limits the label) and display props behave as documented on `Box`.
 *
 * `children` is the normal case and names the chip; an icon-only chip (no children) requires `aria-label`.
 *
 * Override `--perses-chip-border-style` and `--perses-chip-border-width` on the chip or an ancestor to customize its
 * border. The `solid` variant keeps its border transparent; use `outline` for the palette's border color.
 *
 * With `onClick`, the chip is exposed as a button. When `onClose` is also set, only the label acts as the button so
 * the close button is never nested inside another interactive element. Action ARIA attributes and `tabIndex` follow
 * the action; visibility and live-region ARIA attributes stay on the container.
 *
 * @example
 * ```tsx
 * <Chip startElement={<TagIcon />} onClose={() => removeFilter(id)}>
 *   region: us-east-1
 * </Chip>
 * ```
 */
export const Chip = forwardRef<HTMLDivElement, ChipProps>(function Chip(
  {
    children,
    color = 'default',
    size = 'xs',
    variant = 'solid',
    startElement,
    closeIcon,
    closeAriaLabel,
    onClose,
    disabled = false,
    onClick,
    onKeyDown,
    role,
    tabIndex,
    maxWidth,
    style,
    className,
    ...props
  },
  ref,
): ReactElement {
  const {
    className: styleClassName,
    style: computedStyle,
    rest: domProps,
  } = applyStyleProps(props, CHIP_STYLE_PROPS, style);
  const resolvedStyle = withLabelMaxWidth(computedStyle, maxWidth);

  const interactive = Boolean(onClick);
  const actionOnLabel = interactive && Boolean(onClose);
  const { rootProps, actionAriaProps } = splitChipAriaProps(domProps, actionOnLabel);
  const { labelRef, actionProps, handleKeyDown } = useChipAction({
    actionOnLabel,
    disabled,
    onClick,
    onKeyDown,
    tabIndex,
  });

  // With a close button, only the label is the action; the root retains the consumer's role without a tab stop.
  const rootActionProps = actionOnLabel ? { role, tabIndex: undefined } : (actionProps ?? { role, tabIndex });
  const labelActionProps = actionOnLabel ? { ...actionAriaProps, ...actionProps } : undefined;

  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- The container delegates keyboard events to its action and close button without becoming another control.
    <div
      {...rootProps}
      {...rootActionProps}
      onKeyDown={handleKeyDown}
      ref={ref}
      className={clsx('ps-Chip', styleClassName, className)}
      style={resolvedStyle}
      data-color={color}
      data-size={size}
      data-variant={variant}
      data-clickable={interactive || undefined}
      data-disabled={disabled || undefined}
    >
      {startElement && <span className="ps-Chip__start">{startElement}</span>}
      <span ref={labelRef} className="ps-Chip__label" {...labelActionProps}>
        {children}
      </span>
      {onClose && (
        <ChipCloseButton closeIcon={closeIcon} closeAriaLabel={closeAriaLabel} disabled={disabled} onClose={onClose}>
          {children}
        </ChipCloseButton>
      )}
    </div>
  );
});
