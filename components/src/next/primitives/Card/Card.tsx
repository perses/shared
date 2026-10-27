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

import { clsx } from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';
import { createElement, forwardRef } from 'react';

import type { PersesCSSProperties, SlotStyleProps } from '../../types';
import { applyStyleProps, compileStyleProps, sizingProps, spacingProps } from '../system';
import type { SizingProps, SpacingProps } from '../system';

// oxlint-disable-next-line import/no-unassigned-import -- Registers shared layout utility styles used by style props.
import '../system/layout.css';
// oxlint-disable-next-line import/no-unassigned-import -- Registers shared spacing utility styles used by style props.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- Registers this component's styles.
import './card.css';

export type CardVariant = 'elevated' | 'outlined';
/** Elements a `Card` may render as; all share `HTMLAttributes<HTMLElement>`. */
export type CardElement = 'div' | 'section' | 'article';
/** Elements a `CardHeader` may render as. */
export type CardHeaderElement = 'div' | 'header';
/** Elements a `CardContent` may render as. */
export type CardContentElement = 'div' | 'figure';

const CARD_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps]);
const CARD_HEADER_STYLE_PROPS = compileStyleProps([spacingProps]);
const CARD_CONTENT_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps]);

export interface CardProps extends HTMLAttributes<HTMLElement>, SpacingProps, SizingProps {
  /** Surface treatment: `elevated` (shadow) or `outlined` (border). */
  variant?: CardVariant;
  /** Semantic element to render; defaults to `div`. Use `section` for labelled regions. */
  as?: CardElement;
  style?: PersesCSSProperties;
}

/**
 * A surface that stacks `CardHeader` and `CardContent` vertically. Pick the semantic element with
 * `as`; layout comes from style props.
 *
 * @example
 * <Card as="section" aria-labelledby="cpu-title" variant="outlined" height="100%">
 *   <CardHeader as="header" endElement={<IconButton aria-label="Menu"><MenuIcon /></IconButton>}>
 *     <Typography id="cpu-title" variant="h4">CPU</Typography>
 *   </CardHeader>
 *   <CardContent as="figure" p="0">{chart}</CardContent>
 * </Card>
 */
export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { as = 'div', variant = 'elevated', className, style, children, ...props },
  ref,
) {
  const { className: styleClassName, style: computedStyle, rest } = applyStyleProps(props, CARD_STYLE_PROPS, style);

  return createElement(
    as,
    {
      ...rest,
      ref,
      className: clsx('ps-Card', styleClassName, className),
      style: computedStyle,
      'data-variant': variant,
    },
    children,
  );
});

export interface CardHeaderSlotProps {
  /** Wrapper around the title `children`; grows to fill the row. */
  content?: SlotStyleProps;
  /** Wrapper around `endElement`; rendered only when `endElement` resolves to visible content. */
  end?: SlotStyleProps;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLElement>, SpacingProps {
  /** Trailing slot, typically actions; rendered after the title content. */
  endElement?: ReactNode;
  /** Semantic element to render; defaults to `div`. */
  as?: CardHeaderElement;
  style?: PersesCSSProperties;
  /** Styling-only overrides for internal parts; does not replace content, behavior, or accessibility attributes. */
  slotProps?: CardHeaderSlotProps;
}

/**
 * Title row of a `Card`. `children` is the title content (compose `Typography`);
 * `endElement` is the single trailing slot for actions.
 *
 * @example
 * <CardHeader endElement={<Button size="small">Edit</Button>}>
 *   <Typography variant="h4">Variables</Typography>
 * </CardHeader>
 */
export const CardHeader = forwardRef<HTMLElement, CardHeaderProps>(function CardHeader(
  { as = 'div', endElement, className, style, slotProps, children, ...props },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(props, CARD_HEADER_STYLE_PROPS, style);
  const hasEndElement = endElement !== undefined && endElement !== null && typeof endElement !== 'boolean';

  return createElement(
    as,
    { ...rest, ref, className: clsx('ps-CardHeader', styleClassName, className), style: computedStyle },
    createElement(
      'div',
      { className: clsx('ps-CardHeader__content', slotProps?.content?.className), style: slotProps?.content?.style },
      children,
    ),
    hasEndElement &&
      createElement(
        'div',
        { className: clsx('ps-CardHeader__end', slotProps?.end?.className), style: slotProps?.end?.style },
        endElement,
      ),
  );
});

export interface CardContentProps extends HTMLAttributes<HTMLElement>, SpacingProps, SizingProps {
  /** Semantic element to render; defaults to `div`. Use `figure` for charts. */
  as?: CardContentElement;
  style?: PersesCSSProperties;
}

/**
 * Padded body of a `Card`. Use `p="0"` for edge-to-edge content such as charts.
 *
 * @example
 * <CardContent as="figure" p="0" height="100%">{chart}</CardContent>
 */
export const CardContent = forwardRef<HTMLElement, CardContentProps>(function CardContent(
  { as = 'div', className, style, children, ...props },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(props, CARD_CONTENT_STYLE_PROPS, style);

  return createElement(
    as,
    { ...rest, ref, className: clsx('ps-CardContent', styleClassName, className), style: computedStyle },
    children,
  );
});
