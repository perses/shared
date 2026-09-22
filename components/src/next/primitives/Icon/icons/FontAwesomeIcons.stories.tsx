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
import type { ComponentType, SVGProps } from 'react';

import { IconButton } from '../../IconButton/IconButton';
import * as Icons from './FontAwesomeIcons';

const icons = Object.entries(Icons) as Array<[string, ComponentType<SVGProps<SVGSVGElement>>]>;
const galleryStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(9rem, 1fr))',
  gap: '1rem',
};
const itemStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem' };
const iconStyle = { fontSize: '1.25rem' };
const labelStyle = { fontSize: '0.75rem' };

export const Gallery: Story = () => (
  <div style={galleryStyle}>
    {icons.map(([name, Icon]) => (
      <div key={name} style={itemStyle}>
        <IconButton aria-label={name} title={name}>
          <Icon style={iconStyle} />
        </IconButton>
        <span style={labelStyle}>{name}</span>
      </div>
    ))}
  </div>
);
Gallery.storyName = 'Font Awesome Icon Gallery';
