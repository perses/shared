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

import { Select as BaseSelect } from '@base-ui/react/select';
import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import type { PersesCSSProperties } from '../../types';
import type { SpacingProps } from '../system';
import { applyStyleProps, compileStyleProps, spacingProps } from '../system';

// oxlint-disable-next-line import/no-unassigned-import -- Registers shared spacing utility styles used by style props.
import '../system/spacing.css';
// oxlint-disable-next-line import/no-unassigned-import -- Registers this component's styles.
import './select.css';

const SELECT_GROUP_STYLE_PROPS = compileStyleProps([spacingProps]);

export interface SelectGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'>, SpacingProps {
  style?: PersesCSSProperties;
  /** Heading shown above the group's items and used as the group's accessible name. */
  label: ReactNode;
}

/**
 * Labelled group of `SelectItem`s inside a `Select` (`role="group"`). Spacing style props apply to the group and
 * behave as documented on `Box`.
 */
export const SelectGroup = forwardRef<HTMLDivElement, SelectGroupProps>(function SelectGroup(
  { label, className, style, children, ...props },
  ref,
) {
  const {
    className: styleClassName,
    style: computedStyle,
    rest,
  } = applyStyleProps(props, SELECT_GROUP_STYLE_PROPS, style);

  return (
    <BaseSelect.Group
      {...rest}
      ref={ref}
      className={clsx('ps-SelectGroup', styleClassName, className)}
      style={computedStyle}
    >
      <BaseSelect.GroupLabel className="ps-SelectGroup__label">{label}</BaseSelect.GroupLabel>
      {children}
    </BaseSelect.Group>
  );
});
