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
import type { HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

import type { SizingProps } from '../system/sizing';
import { sizingProps } from '../system/sizing';
import type { SpacingProps } from '../system/spacing';
import { spacingProps } from '../system/spacing';
import { applyStyleProps, compileStyleProps } from '../system/styleProps';

import '../system/layout.css';
import '../system/spacing.css';
import './card.css';

export type CardVariant = 'elevated' | 'outlined';

const CARD_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps]);
const CARD_HEADER_STYLE_PROPS = compileStyleProps([spacingProps]);
const CARD_CONTENT_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps]);

export interface CardProps extends HTMLAttributes<HTMLDivElement>, SpacingProps, SizingProps {
  /** Surface treatment: `elevated` (shadow) or `outlined` (border). */
  variant?: CardVariant;
}

/**
 * A surface that stacks `CardHeader` and `CardContent` vertically. Semantics come from the
 * consumer (`role="region"` + `aria-labelledby`); layout comes from style props.
 *
 * @example
 * <Card role="region" aria-labelledby="cpu-title" variant="outlined" height="100%">
 *   <CardHeader endElement={<IconButton aria-label="Menu"><MenuIcon /></IconButton>}>
 *     <Typography id="cpu-title" variant="h4">CPU</Typography>
 *   </CardHeader>
 *   <CardContent role="figure" p={0}>{chart}</CardContent>
 * </Card>
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'elevated', className, style, children, ...props },
  ref,
) {
  const { className: styleClassName, style: computedStyle, rest } = applyStyleProps(props, CARD_STYLE_PROPS, style);

  return (
    <div
      {...rest}
      ref={ref}
      className={clsx('ps-Card', styleClassName, className)}
      style={computedStyle}
      data-variant={variant}
    >
      {children}
    </div>
  );
});

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement>, SpacingProps {
  /** Trailing slot, typically actions; rendered after the title content. */
  endElement?: ReactNode;
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
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(function CardHeader(
  { endElement, className, style, children, ...props },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(props, CARD_HEADER_STYLE_PROPS, style);

  return (
    <div {...rest} ref={ref} className={clsx('ps-CardHeader', styleClassName, className)} style={computedStyle}>
      <div className="ps-CardHeader__content">{children}</div>
      {endElement !== undefined && endElement !== null && <div className="ps-CardHeader__end">{endElement}</div>}
    </div>
  );
});

export interface CardContentProps extends HTMLAttributes<HTMLDivElement>, SpacingProps, SizingProps {}

/**
 * Padded body of a `Card`. Use `p={0}` for edge-to-edge content such as charts.
 *
 * @example
 * <CardContent p={0} height="100%">{chart}</CardContent>
 */
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(function CardContent(
  { className, style, children, ...props },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(props, CARD_CONTENT_STYLE_PROPS, style);

  return (
    <div {...rest} ref={ref} className={clsx('ps-CardContent', styleClassName, className)} style={computedStyle}>
      {children}
    </div>
  );
});
