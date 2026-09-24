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

import { Chip } from './Chip';
import type { ChipColor, ChipSize, ChipVariant } from './Chip';

const colors: ChipColor[] = ['default', 'primary', 'success', 'warning', 'error', 'info'];
const sizes: ChipSize[] = ['small', 'medium'];
const variants: ChipVariant[] = ['filled', 'outlined'];
const chipListStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' };
const chipColumnStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1rem' };

interface RemovableChipProps {
  label: string;
  onDelete: (label: string) => void;
}

function RemovableChip({ label, onDelete }: RemovableChipProps): ReactElement {
  const handleDelete = useCallback(() => onDelete(label), [label, onDelete]);

  return <Chip label={label} onDelete={handleDelete} />;
}

export const AllColors: Story = () => (
  <div style={chipListStyle}>
    {colors.map((color) => (
      <Chip key={color} label={color} color={color} />
    ))}
  </div>
);
AllColors.storyName = 'All colors';

export const VariantsAndSizes: Story = () => (
  <div style={chipColumnStyle}>
    {sizes.map((size) => (
      <div key={size} style={chipListStyle}>
        {variants.map((variant) => (
          <Chip key={variant} label={`${size} ${variant}`} size={size} variant={variant} />
        ))}
      </div>
    ))}
  </div>
);
VariantsAndSizes.storyName = 'Variants and sizes';

export const Removable: Story = () => {
  const [labels, setLabels] = useState(['environment: production', 'region: us-east-1', 'service: api']);
  const removeLabel = useCallback((label: string) => {
    setLabels((current) => current.filter((item) => item !== label));
  }, []);

  return (
    <div style={chipListStyle}>
      {labels.map((label) => (
        <RemovableChip key={label} label={label} onDelete={removeLabel} />
      ))}
    </div>
  );
};
Removable.storyName = 'Removable';
