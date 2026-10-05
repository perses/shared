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
import type { CSSProperties } from 'react';
import { useCallback, useState } from 'react';

import { Button } from '../Button/Button';
import { Alert } from './Alert';
import type { AlertProps, AlertSeverity, AlertVariant } from './Alert';

const severities: AlertSeverity[] = ['error', 'warning', 'success', 'info'];

export const AllSeverities: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    {severities.map((severity) => (
      <Alert key={severity} severity={severity} icon={severity}>
        This is a {severity} alert.
      </Alert>
    ))}
  </div>
);
AllSeverities.storyName = 'All Severities';

export const NoIcon: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    {severities.map((severity) => (
      <Alert key={severity} severity={severity}>
        No icon by default for a {severity} alert.
      </Alert>
    ))}
  </div>
);
NoIcon.storyName = 'No Icon (default)';

const SmileyIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
    <path d="M528 320C528 205.1 434.9 112 320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320zM64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM241.3 383.4C256.3 399 282.4 416 320 416C357.6 416 383.7 399 398.7 383.4C407.9 373.8 423.1 373.5 432.6 382.7C442.1 391.9 442.5 407.1 433.3 416.6C411.2 439.6 373.3 464 320 464C266.7 464 228.8 439.6 206.7 416.6C197.5 407 197.8 391.8 207.4 382.7C217 373.6 232.2 373.8 241.3 383.4zM208 272C208 254.3 222.3 240 240 240C257.7 240 272 254.3 272 272C272 289.7 257.7 304 240 304C222.3 304 208 289.7 208 272zM400 240C417.7 240 432 254.3 432 272C432 289.7 417.7 304 400 304C382.3 304 368 289.7 368 272C368 254.3 382.3 240 400 240z" />
  </svg>
);

export const CustomIcon: Story = () => <Alert icon={SmileyIcon}>This alert uses a custom icon.</Alert>;
CustomIcon.storyName = 'Custom Icon';

export const FalsyIcon: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <Alert icon={0}>icon={'{0}'} renders no icon (not a literal &quot;0&quot;).</Alert>
    <Alert icon={false}>icon={'{false}'} renders no icon.</Alert>
    <Alert icon={null}>icon={'{null}'} renders no icon.</Alert>
    <Alert icon={undefined}>icon={'{undefined}'} (or omitted) renders no icon.</Alert>
  </div>
);
FalsyIcon.storyName = 'Falsy Icon (0 / false / null / undefined)';

const variants: AlertVariant[] = ['soft', 'outline', 'plain'];
const columnStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1rem' };
const headingStyle: CSSProperties = { margin: '0 0 0.5rem', fontSize: '0.875rem' };
const hintStyle: CSSProperties = { fontSize: '0.75rem', margin: 0 };

export const Variants: Story = () => (
  <div style={columnStyle}>
    {variants.map((variant) => (
      <div key={variant}>
        <h3 style={headingStyle}>variant=&quot;{variant}&quot;</h3>
        <div style={columnStyle}>
          {severities.map((severity) => (
            <Alert key={severity} variant={variant} severity={severity} icon={severity}>
              A {severity} alert using the {variant} variant.
            </Alert>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const Sizes: Story = () => (
  <div style={columnStyle}>
    <Alert size="md" icon="info">
      size=&quot;md&quot; (default)
    </Alert>
    <Alert size="sm" icon="info">
      size=&quot;sm&quot; — compact padding and font for dense layouts.
    </Alert>
  </div>
);

const responsiveSize: AlertProps['size'] = { default: 'md', lg: 'sm', xl: 'sm' };

// Story-only styling: tint the alert and show the active breakpoint so the size change is visible.
const responsiveSizeDemoCss = `
  .responsive-alert-demo .ps-Alert { --alert-border: #d97706; --alert-text: #92400e; --alert-icon: #d97706; }
  .responsive-alert-demo .responsive-alert-demo__label::after { content: ' default / xs–md → size md'; }
  @media (min-width: 1200px) {
    .responsive-alert-demo .ps-Alert { --alert-border: #059669; --alert-text: #065f46; --alert-icon: #059669; }
    .responsive-alert-demo .responsive-alert-demo__label::after { content: ' lg / xl → size sm'; }
  }
`;

export const ResponsiveSize: Story = () => (
  <div className="responsive-alert-demo" style={columnStyle}>
    <style>{responsiveSizeDemoCss}</style>
    <p style={hintStyle}>
      This alert uses{' '}
      <code>size=&#123;&#123; default: &apos;md&apos;, lg: &apos;sm&apos;, xl: &apos;sm&apos; &#125;&#125;</code>.
      Resize the browser window to see it change: on viewports narrower than 1200px it renders at size <code>md</code>{' '}
      (shown in orange); at 1200px and wider it renders at size <code>sm</code> (shown in green). The color is
      story-only, to make the switch easy to spot.
    </p>
    <p className="responsive-alert-demo__label" style={hintStyle}>
      Active:
    </p>
    <Alert variant="outline" icon="info" size={responsiveSize}>
      Responsive alert
    </Alert>
  </div>
);
ResponsiveSize.storyName = 'Responsive Size';

export const Closable: Story = () => {
  const [open, setOpen] = useState(true);
  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);
  if (!open) {
    return (
      <Button variant="outline" onClick={show}>
        Show alert again
      </Button>
    );
  }
  return (
    <Alert severity="warning" icon="warning" onClose={hide}>
      This dashboard has unsaved changes.
    </Alert>
  );
};

const noop = (): void => undefined;

const learnMoreLink = (
  <a href="https://perses.dev" target="_blank" rel="noreferrer">
    Learn more
  </a>
);

export const WithAction: Story = () => (
  <div style={columnStyle}>
    <Alert severity="info" icon="info" action={learnMoreLink}>
      A new plugin version is available.
    </Alert>
    <Alert severity="error" icon="error" action={learnMoreLink} onClose={noop}>
      Action content renders before the close button.
    </Alert>
  </div>
);
WithAction.storyName = 'With Action';

export const CompactInline: Story = () => (
  <div style={columnStyle}>
    <p style={hintStyle}>
      Replaces the MUI <code>sx=&#123;&#123; backgroundColor: &apos;transparent&apos;, padding: 0 &#125;&#125;</code>{' '}
      pattern used for read-only notices.
    </p>
    <Alert severity="warning" icon="warning" variant="plain" size="sm">
      Dashboard managed via code only.
    </Alert>
  </div>
);
CompactInline.storyName = 'Compact Inline (plain + sm)';
