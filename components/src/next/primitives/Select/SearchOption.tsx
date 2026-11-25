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

import { Combobox } from '@base-ui/react/combobox';
import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import { hasContent } from '../hasContent';
import { CheckIcon, Icon } from '../Icon';
import type { SelectValue } from './SelectItem';

/** The selected-item check, shared by both engines' option rows. */
export const checkIcon = <CheckIcon />;
export const renderIndicator = <Icon />;

interface SearchOptionProps extends HTMLAttributes<HTMLDivElement> {
  value: SelectValue;
  disabled?: boolean;
  startElement?: ReactNode;
  /** Position in the filtered list. Set by the virtualized list, which mounts only the options in view. */
  index?: number;
}

/** The search engine's option row, shared by `SelectItem` and the virtualized list. Internal: not exported publicly. */
export const SearchOption = forwardRef<HTMLDivElement, SearchOptionProps>(function SearchOption(
  { startElement, className, children, ...props },
  ref,
) {
  return (
    <Combobox.Item {...props} ref={ref} className={clsx('ps-SelectItem', className)}>
      {hasContent(startElement) && <span className="ps-SelectItem__start">{startElement}</span>}
      <span className="ps-SelectItem__text">{children}</span>
      <Combobox.ItemIndicator className="ps-SelectItem__indicator" render={renderIndicator} keepMounted>
        {checkIcon}
      </Combobox.ItemIndicator>
    </Combobox.Item>
  );
});
