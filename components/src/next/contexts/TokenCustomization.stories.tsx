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
import type { CSSProperties, ReactElement } from 'react';

import { ComponentsProvider, useComponents } from './ComponentsProvider';
import { defaultComponents, defaultIcons } from '../primitives/defaults';

function TokenDemo(): ReactElement {
  const {
    components: { Button },
  } = useComponents();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0 }}>Token Customization</h3>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
        Same default Button, different look — achieved by overriding CSS custom properties on a wrapper element.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Button variant="solid" color="primary">
          Solid
        </Button>
        <Button variant="outline" color="primary">
          Outline
        </Button>
        <Button variant="ghost" color="primary">
          Ghost
        </Button>
      </div>
    </div>
  );
}

export const TokenCustomization: Story = () => (
  <ComponentsProvider components={defaultComponents} icons={defaultIcons}>
    <div
      style={
        {
          '--perses-status-solid-primary': '#7c3aed',
          '--perses-status-bg-primary-hover': 'rgba(124, 58, 237, 0.15)',
          '--perses-status-border-primary': '#7c3aed',
          '--perses-status-bg-primary': 'rgba(124, 58, 237, 0.08)',
          '--perses-radius-md': '4px',
        } as CSSProperties
      }
    >
      <TokenDemo />
    </div>
  </ComponentsProvider>
);
TokenCustomization.storyName = 'Token Customization';
