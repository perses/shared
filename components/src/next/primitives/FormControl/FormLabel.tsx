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

import { Field } from '@base-ui/react/field';
import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { LabelHTMLAttributes } from 'react';

import type { PersesCSSProperties } from '../../types';
import type { SpacingProps } from '../system';
import { applyStyleProps, compileStyleProps, spacingProps } from '../system';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared spacing styles.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the Field styles.
import './formControl.css';

const FORM_LABEL_STYLE_PROPS = compileStyleProps([spacingProps]);

export interface FormLabelProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, 'style'>, SpacingProps {
  style?: PersesCSSProperties;
}

/**
 * Visible label for the control inside the surrounding `FormControl`. `htmlFor` is filled in automatically for
 * Base UI controls; pass it explicitly for a plain element that is not registered with the field.
 *
 * @example
 * <FormControl>
 *   <FormLabel>Name</FormLabel>
 *   <TextField labelledByFormControl />
 * </FormControl>
 */
export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(function FormLabel(
  { className, style, children, ...rest },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest: domProps,
  } = applyStyleProps(rest, FORM_LABEL_STYLE_PROPS, style);

  return (
    <Field.Label
      {...domProps}
      ref={ref}
      className={clsx('ps-FormLabel', styleClassName, className)}
      style={computedStyle}
    >
      {children}
    </Field.Label>
  );
});
