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

import { Sample, Stack } from '../../stories/Sample';
import type { Status } from '../types';
import { Chip } from './Chip';
import type { ChipColor, ChipSize, ChipVariant } from './Chip';

const colors: Array<ChipColor | Status> = ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info'];
const statuses: Status[] = ['success', 'warning', 'error', 'info'];
const sizes: ChipSize[] = ['xs', 'sm'];
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

const sizeGroups: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
};
const variantRows: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};
const row: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
};
const wrapRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
};
const sizeHeading: CSSProperties = { marginBottom: '0.5rem' };
const rowLabel: CSSProperties = { width: '4rem', fontSize: '0.75rem' };
const noop = (): void => {};
const tagIcon = <TagIcon />;
const startElementCode = '<Chip startElement={tagIcon}>region: us-east-1</Chip>';
const truncatedCode = '<Chip maxWidth={120}>a very long label that gets truncated</Chip>';

const basicCode = `<Chip>environment: production</Chip>`;

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>Chip</code> is a compact element that represents an input, attribute, or action. It accepts responsive style
      props and any native <code>div</code> attribute. Those style props behave exactly as documented on{' '}
      <code>Box</code>, except that <code>maxWidth</code> limits the label.
    </p>
    <Sample title="Minimal usage" code={basicCode}>
      <Chip>environment: production</Chip>
    </Sample>
    <Sample title="With a start element" code={startElementCode}>
      <Chip startElement={tagIcon}>region: us-east-1</Chip>
    </Sample>
    <Sample title="Truncated label" code={truncatedCode}>
      <Chip maxWidth={120}>a very long label that gets truncated</Chip>
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

const variantsCode = `<Chip color="secondary" variant="outline" size="sm">Label</Chip>
<Chip status="error">Label</Chip>`;

export const Variants: Story = () => (
  <Stack>
    <Sample title="Colors, statuses, variants and sizes" code={variantsCode}>
      <div style={sizeGroups}>
        {sizes.map((size) => (
          <div key={size}>
            <h4 style={sizeHeading}>{size}</h4>
            <div style={variantRows}>
              {variants.map((variant) => (
                <div key={variant} style={row}>
                  <span style={rowLabel}>{variant}</span>
                  <div style={wrapRow}>
                    {colors.map((color) => (
                      <Chip
                        key={color}
                        size={size}
                        variant={variant}
                        color={isStatus(color) ? undefined : color}
                        status={isStatus(color) ? color : undefined}
                      >
                        {color}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Sample>
  </Stack>
);
Variants.storyName = 'Variants';

const statesCode = `<Chip>Enabled</Chip>
<Chip disabled>Disabled</Chip>
<Chip disabled onClick={…} onClose={…}>Disabled, interactive</Chip>`;

export const States: Story = () => (
  <Stack>
    <p>
      A disabled chip ignores clicks and key presses, is removed from the tab order and is exposed with{' '}
      <code>aria-disabled</code>; its close button is natively disabled.
    </p>
    <Sample title="Disabled" code={statesCode}>
      <div style={wrapRow}>
        <Chip>Enabled</Chip>
        <Chip disabled>Disabled</Chip>
        <Chip disabled onClick={noop} onClose={noop}>
          Disabled, interactive
        </Chip>
      </div>
    </Sample>
  </Stack>
);
States.storyName = 'States';

const removableCode = `<Chip onClose={() => remove(label)}>{label}</Chip>
// closeAriaLabel overrides the default "Remove <label>"
<Chip onClose={…} closeAriaLabel="Remove production environment">production</Chip>`;

interface RemovableChipProps {
  label: string;
  onRemove: (label: string) => void;
}

function RemovableChip({ label, onRemove }: RemovableChipProps): ReactElement {
  const handleClose = useCallback(() => onRemove(label), [label, onRemove]);
  return <Chip onClose={handleClose}>{label}</Chip>;
}

export const Removable: Story = () => {
  const [labels, setLabels] = useState(['production', 'staging', 'development']);
  const remove = useCallback((label: string) => setLabels((prev) => prev.filter((l) => l !== label)), []);

  return (
    <Stack>
      <p>
        The close button is a real <code>button</code> named <code>Remove &lt;label&gt;</code>. Provide{' '}
        <code>closeAriaLabel</code> when the children are not plain text.
      </p>
      <Sample title="Removable chips" code={removableCode}>
        <div style={wrapRow}>
          {labels.map((label) => (
            <RemovableChip key={label} label={label} onRemove={remove} />
          ))}
          {labels.length === 0 && <span>All chips removed — reload the story to reset.</span>}
        </div>
      </Sample>
    </Stack>
  );
};
Removable.storyName = 'Removable';

const clickableCode = `<Chip onClick={() => toggle()}>Selectable</Chip>
// With onClose the label is the button, so the close button is never nested in another button
<Chip onClick={…} onClose={…}>Selectable and removable</Chip>`;

export const Clickable: Story = () => {
  const [selected, setSelected] = useState(false);
  const toggle = useCallback(() => setSelected((value) => !value), []);

  return (
    <Stack>
      <p>
        With <code>onClick</code> the chip is exposed as a button and is operable with <kbd>Enter</kbd> and{' '}
        <kbd>Space</kbd>.
      </p>
      <Sample title="Clickable" code={clickableCode}>
        <div style={wrapRow}>
          <Chip variant={selected ? 'solid' : 'outline'} color="primary" onClick={toggle}>
            {selected ? 'Selected' : 'Not selected'}
          </Chip>
          <Chip onClick={noop} onClose={noop}>
            Selectable and removable
          </Chip>
        </div>
      </Sample>
    </Stack>
  );
};
Clickable.storyName = 'Clickable';
