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

import { Fieldset } from '@base-ui/react/fieldset';
import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { FieldsetHTMLAttributes, ReactNode } from 'react';

import type { PersesCSSProperties } from '../../types';
import { hasContent } from '../hasContent';
import type { DisplayProps, FlexboxProps, Responsive, SizingProps, SpacingProps } from '../system';
import { applyStyleProps, compileStyleProps, displayProps, flexboxProps, sizingProps, spacingProps } from '../system';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared layout styles.
import '../system/layout.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared spacing styles.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the Field styles.
import './formControl.css';

const FORM_GROUP_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, flexboxProps, displayProps]);

export interface FormGroupProps
  extends
    Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'style'>,
    SpacingProps,
    SizingProps,
    Omit<FlexboxProps, 'flexDirection'>,
    DisplayProps {
  style?: PersesCSSProperties;
  /** Group title, rendered as the `<legend>` and used as the group's accessible name. */
  legend?: ReactNode;
  /** Main axis of the group. Defaults to `column`. */
  direction?: Responsive<'row' | 'column'>;
}

/**
 * A `<fieldset>` for related controls such as a column of `FormControlLabel`s or a radio group.
 * `disabled` disables the fieldset and every control wrapped in a nested `FormControl` or `FormControlLabel`.
 *
 * @example
 * <FormGroup legend="Columns" direction="row">
 *   <FormControlLabel label="Name"><Checkbox /></FormControlLabel>
 *   <FormControlLabel label="Value"><Checkbox /></FormControlLabel>
 * </FormGroup>
 */
export const FormGroup = forwardRef<HTMLFieldSetElement, FormGroupProps>(function FormGroup(
  { legend, direction, className, style, children, ...rest },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest: domProps,
  } = applyStyleProps({ ...rest, flexDirection: direction }, FORM_GROUP_STYLE_PROPS, style);

  return (
    <Fieldset.Root
      {...domProps}
      ref={ref}
      className={clsx('ps-FormGroup', styleClassName, className)}
      style={computedStyle}
    >
      {hasContent(legend) && (
        <Fieldset.Legend className="ps-FormGroup__legend" render={<legend />}>
          {legend}
        </Fieldset.Legend>
      )}
      {children}
    </Fieldset.Root>
  );
});
