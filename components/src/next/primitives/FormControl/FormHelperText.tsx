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
import { forwardRef, useCallback } from 'react';
import type { HTMLAttributes, ReactElement } from 'react';

import type { PersesCSSProperties } from '../../types';
import { useFormControlContext } from '../formControlContext';
import type { SpacingProps } from '../system';
import { applyStyleProps, compileStyleProps, spacingProps } from '../system';
import { TextHelper } from '../TextHelper';
import type { Status } from '../types';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared spacing styles.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the Field styles.
import './formControl.css';

const FORM_HELPER_TEXT_STYLE_PROPS = compileStyleProps([spacingProps]);

export interface FormHelperTextProps extends Omit<HTMLAttributes<HTMLParagraphElement>, 'style'>, SpacingProps {
  style?: PersesCSSProperties;
  /** Visual status; defaults to the surrounding `FormControl` status. */
  status?: Status;
}

/**
 * Supporting text linked to the control of the surrounding `FormControl` through `aria-describedby`.
 *
 * @example
 * <FormControl status="error">
 *   <FormLabel>Name</FormLabel>
 *   <TextField labelledByFormControl />
 *   <FormHelperText>Name is required</FormHelperText>
 * </FormControl>
 */
export const FormHelperText = forwardRef<HTMLParagraphElement, FormHelperTextProps>(function FormHelperText(
  { status: statusProp, className, style, children, ...rest },
  ref,
) {
  const context = useFormControlContext();
  const status = statusProp ?? context.status;
  const {
    className: styleClassName,
    style: computedStyle,
    rest: domProps,
  } = applyStyleProps(rest, FORM_HELPER_TEXT_STYLE_PROPS, style);
  const renderHelper = useCallback<Extract<Field.Description.Props['render'], (...args: never[]) => ReactElement>>(
    (descriptionProps, state): ReactElement => (
      <TextHelper {...descriptionProps} status={status} disabled={state.disabled} />
    ),
    [status],
  );

  return (
    <Field.Description
      {...domProps}
      ref={ref}
      className={clsx('ps-FormHelperText', styleClassName, className)}
      style={computedStyle}
      render={renderHelper}
    >
      {children}
    </Field.Description>
  );
});
