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
import { forwardRef, useMemo } from 'react';
import type { HTMLAttributes } from 'react';

import type { PersesCSSProperties } from '../../types';
import { FormControlContext } from '../formControlContext';
import type { DisplayProps, FlexboxProps, SizingProps, SpacingProps } from '../system';
import { applyStyleProps, compileStyleProps, displayProps, flexboxProps, sizingProps, spacingProps } from '../system';
import type { Size, Status } from '../types';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared layout styles.
import '../system/layout.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared spacing styles.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the Field styles.
import './formControl.css';

const FORM_CONTROL_STYLE_PROPS = compileStyleProps([spacingProps, sizingProps, flexboxProps, displayProps]);

export interface FormControlProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'style'>, SpacingProps, SizingProps, FlexboxProps, DisplayProps {
  style?: PersesCSSProperties;
  /** Scales the nested `FormLabel`/`FormHelperText`; nested controls keep their own `size`. Defaults to `md`. */
  size?: Size;
  /** Disables every nested Base UI control and dims the label. */
  disabled?: boolean;
  /** Shows the required indicator on the nested `FormLabel`. Set `required` on the control itself for validation. */
  required?: boolean;
  /** Visual status. `error` also marks the nested control `aria-invalid`. */
  status?: Status;
}

/**
 * Groups one control with its `FormLabel` and `FormHelperText` and wires the accessible name and description
 * between them. Controls opt in with `labelledByFormControl` and then inherit `size`, `disabled`, `required` and
 * `status` from the wrapper.
 *
 * @example
 * <FormControl required status="error">
 *   <FormLabel>Name</FormLabel>
 *   <TextField labelledByFormControl />
 *   <FormHelperText>Name is required</FormHelperText>
 * </FormControl>
 */
export const FormControl = forwardRef<HTMLDivElement, FormControlProps>(function FormControl(
  { size = 'md', disabled, required, status, className, style, children, ...rest },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest: domProps,
  } = applyStyleProps(rest, FORM_CONTROL_STYLE_PROPS, style);
  const contextValue = useMemo(
    () => ({ inFormControl: true, size, disabled, required, status }),
    [size, disabled, required, status],
  );
  const invalid = status === 'error';

  return (
    <FormControlContext.Provider value={contextValue}>
      <Field.Root
        {...domProps}
        ref={ref}
        className={clsx('ps-FormControl', styleClassName, className)}
        style={computedStyle}
        disabled={disabled}
        invalid={invalid}
        data-size={size}
        data-status={status}
        data-required={required || undefined}
      >
        {children}
      </Field.Root>
    </FormControlContext.Provider>
  );
});
