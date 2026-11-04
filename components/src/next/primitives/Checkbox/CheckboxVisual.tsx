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
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactElement } from 'react';

// oxlint-disable-next-line import/no-unassigned-import -- Shared by the standalone control and decorative menu indicator.
import './checkbox.css';

interface CheckboxVisualProps extends HTMLAttributes<HTMLSpanElement> {
  decorative?: boolean;
}

// Private presentation shared by controls that own their own semantics, focus, and checked state.
export const CheckboxVisual = forwardRef<HTMLSpanElement, CheckboxVisualProps>(function CheckboxVisual(
  { decorative = false, className, ...props },
  ref,
) {
  return (
    <span
      {...props}
      ref={ref}
      className={clsx('ps-Checkbox', className)}
      data-decorative={decorative ? '' : undefined}
    />
  );
});

export function CheckboxMark(): ReactElement {
  return <span className="ps-Checkbox__mark" aria-hidden="true" />;
}
