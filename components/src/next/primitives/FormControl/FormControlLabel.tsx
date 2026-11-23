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
import type { LabelHTMLAttributes, ReactNode } from 'react';

import type { PersesCSSProperties } from '../../types';
import { FormControlContext, useFormControlState } from '../formControlContext';
import { hasContent } from '../hasContent';
import type { SpacingProps } from '../system';
import { applyStyleProps, compileStyleProps, spacingProps } from '../system';

// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers shared spacing styles.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- This import intentionally registers the Field styles.
import './formControl.css';

const FORM_CONTROL_LABEL_STYLE_PROPS = compileStyleProps([spacingProps]);

export type FormControlLabelPlacement = 'start' | 'end';

export interface FormControlLabelProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, 'style'>, SpacingProps {
  style?: PersesCSSProperties;
  /** Visible text for the wrapped control and its accessible name; do not also set `aria-label` on the control. */
  label: ReactNode;
  /** Side of the control the text sits on. Defaults to `end`. */
  labelPlacement?: FormControlLabelPlacement;
  /** Disables the wrapped Base UI control and dims the text. */
  disabled?: boolean;
  /** The single control to label, e.g. `Checkbox`, `Switch` or `Radio`. */
  children: ReactNode;
}

/**
 * Clickable text next to a selection control, wrapping both in one `<label>` so clicking the text toggles the
 * control. Perses controls that require an accessible name opt in with `labelledByFormControl`.
 *
 * @example
 * <FormControlLabel label="Allow header sorting">
 *   <Checkbox labelledByFormControl />
 * </FormControlLabel>
 */
export const FormControlLabel = forwardRef<HTMLLabelElement, FormControlLabelProps>(function FormControlLabel(
  { label, labelPlacement = 'end', disabled: disabledProp, className, style, children, ...rest },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest: domProps,
  } = applyStyleProps(rest, FORM_CONTROL_LABEL_STYLE_PROPS, style);
  const { size, status, invalid, disabled, required } = useFormControlState({ disabled: disabledProp });
  const contextValue = useMemo(
    () => ({ inFormControl: true, size, status, disabled, required }),
    [size, status, disabled, required],
  );

  return (
    <FormControlContext.Provider value={contextValue}>
      <Field.Root
        render={
          // oxlint-disable-next-line jsx-a11y/label-has-associated-control -- Base UI renders the control and text inside this label.
          <label
            {...domProps}
            ref={ref}
            className={clsx('ps-FormControlLabel', styleClassName, className)}
            style={computedStyle}
            data-label-placement={labelPlacement}
          />
        }
        disabled={disabled}
        invalid={invalid}
      >
        {children}
        {hasContent(label) && <span className="ps-FormControlLabel__text">{label}</span>}
      </Field.Root>
    </FormControlContext.Provider>
  );
});
