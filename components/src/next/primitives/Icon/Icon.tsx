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
import { forwardRef, HTMLAttributes, ReactNode } from 'react';

import './icon.css';

export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
}

export const Icon = forwardRef<HTMLSpanElement, IconProps>(function Icon({ className, children, ...rest }, ref) {
  return (
    <span ref={ref} aria-hidden="true" {...rest} className={clsx('ps-Icon', className)}>
      {children}
    </span>
  );
});
