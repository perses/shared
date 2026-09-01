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
import { forwardRef, ReactElement } from 'react';

import type { ButtonProps } from '../primitives';
import { defaultComponents, defaultIcons } from '../primitives/defaults';
import { PatternFlyV6Alert, Pf6AlertDemo } from '../stories/pf6/PatternFlyV6Alert';
import { ComponentsProvider, useComponents } from './ComponentsProvider';

const SIZE_PADDING: Record<string, string> = { sm: '4px 8px', lg: '12px 24px', md: '8px 16px' };

const CustomButton = forwardRef<HTMLButtonElement, ButtonProps>(function CustomButton(
  { children, variant = 'solid', size = 'md', loading, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
      style={{
        padding: SIZE_PADDING[size] ?? '8px 16px',
        borderRadius: '4px',
        border: variant === 'outline' ? '2px solid currentColor' : '1px solid transparent',
        background: variant === 'solid' ? '#1e3a5f' : 'transparent',
        color: variant === 'solid' ? '#fff' : '#1e3a5f',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'monospace',
        fontSize: '0.875rem',
      }}
    >
      {loading ? 'Loading…' : children}
    </button>
  );
});

function CustomButtonDemo(): ReactElement {
  const { components } = useComponents();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0 }}>Custom Button (via ComponentsProvider)</h3>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
        A minimal custom Button injected through ComponentsProvider, replacing the default.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <components.Button variant="solid" color="primary">
          Solid
        </components.Button>
        <components.Button variant="outline" color="primary">
          Outline
        </components.Button>
        <components.Button variant="ghost" color="primary">
          Ghost
        </components.Button>
        <components.Button variant="solid" color="primary" disabled>
          Disabled
        </components.Button>
      </div>
    </div>
  );
}

export const CustomButtonInjection: Story = () => (
  <ComponentsProvider components={{ ...defaultComponents, Button: CustomButton }} icons={defaultIcons}>
    <CustomButtonDemo />
  </ComponentsProvider>
);
CustomButtonInjection.storyName = 'Button customization';

export const PatternFlyAlertInjection: Story = () => (
  <ComponentsProvider components={{ ...defaultComponents, Alert: PatternFlyV6Alert }} icons={defaultIcons}>
    <Pf6AlertDemo />
  </ComponentsProvider>
);
PatternFlyAlertInjection.storyName = 'Alert customization';
