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

import type { Story } from '@ladle/react';
import { useCallback, useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';

import type { Status } from '../types';
import { Chip } from './Chip';
import type { ChipColor, ChipSize, ChipVariant } from './Chip';

const colors: Array<ChipColor | Status> = ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info'];
const statuses: Status[] = ['success', 'warning', 'error', 'info'];
const sizes: ChipSize[] = ['sm', 'md'];
const variants: ChipVariant[] = ['solid', 'outline'];

function isStatus(value: ChipColor | Status): value is Status {
  return (statuses as Array<ChipColor | Status>).includes(value);
}

function TagIcon(): ReactElement {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
      <path
        d="M2.5 2.5H8l5.5 5.5-5.5 5.5-5.5-5.5V2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="5.25" cy="5.25" r="0.75" fill="currentColor" />
    </svg>
  );
}
const columnStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2rem' };
const variantColumnStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const rowStyle: CSSProperties = { display: 'flex', gap: '0.5rem', alignItems: 'center' };
const wrapRowStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' };
const sizeHeadingStyle: CSSProperties = { marginBottom: '0.5rem' };
const variantLabelStyle: CSSProperties = { width: '4rem', fontSize: '0.75rem' };
const tagIcon = <TagIcon />;
const noop = (): void => {};

export const AllVariantsAndColors: Story = () => (
  <div style={columnStyle}>
    {sizes.map((size) => (
      <div key={size}>
        <h3 style={sizeHeadingStyle}>Size: {size}</h3>
        <div style={variantColumnStyle}>
          {variants.map((variant) => (
            <div key={variant} style={rowStyle}>
              <span style={variantLabelStyle}>{variant}</span>
              {colors.map((color) => (
                <Chip
                  key={color}
                  variant={variant}
                  size={size}
                  color={isStatus(color) ? undefined : color}
                  status={isStatus(color) ? color : undefined}
                >
                  {color}
                </Chip>
              ))}
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);
AllVariantsAndColors.storyName = 'All Variants & Colors';

export const Disabled: Story = () => (
  <div style={wrapRowStyle}>
    <Chip disabled>Filled disabled</Chip>
    <Chip variant="outline" disabled>
      Outlined disabled
    </Chip>
    <Chip disabled onClose={noop}>
      Removable disabled
    </Chip>
  </div>
);

interface RemovableChipProps {
  label: string;
  onClose: (label: string) => void;
}

function RemovableChip({ label, onClose }: RemovableChipProps): ReactElement {
  const handleClose = useCallback(() => onClose(label), [label, onClose]);

  return (
    <Chip startElement={tagIcon} onClose={handleClose}>
      {label}
    </Chip>
  );
}

export const Removable: Story = () => {
  const [labels, setLabels] = useState(['environment: production', 'region: us-east-1', 'service: api']);
  const removeLabel = useCallback((label: string) => {
    setLabels((current) => current.filter((item) => item !== label));
  }, []);

  return (
    <div style={wrapRowStyle}>
      {labels.map((label) => (
        <RemovableChip key={label} label={label} onClose={removeLabel} />
      ))}
    </div>
  );
};
Removable.storyName = 'Removable';
