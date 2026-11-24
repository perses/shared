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
import { useState } from 'react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

import { Sample, Stack } from '../../stories/Sample';
import { Box } from '../Box';
import { Button } from '../Button';
import { CloseIcon } from '../Icon/icons';
import { IconButton } from '../IconButton';
import { Drawer } from './Drawer';
import type { DrawerProps } from './Drawer';

const row: CSSProperties = { display: 'flex', gap: 'var(--perses-spacing-md)', flexWrap: 'wrap' };

/** Consumers own the header: the drawer only provides the panel. */
function EditorHeader({ title, onClose }: { title: string; onClose: () => void }): ReactElement {
  return (
    <Box
      display="flex"
      p="md"
      style={{
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: 'var(--perses-border-width-sm) solid var(--perses-border-default)',
      }}
    >
      <strong>{title}</strong>
      <IconButton aria-label="Close" variant="ghost" onClick={onClose}>
        <CloseIcon />
      </IconButton>
    </Box>
  );
}

function DemoDrawer({
  label,
  title,
  children,
  ...drawerProps
}: Omit<DrawerProps, 'open' | 'onOpenChange' | 'children'> & {
  label: string;
  title: string;
  children?: ReactNode;
}): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Drawer open={open} onOpenChange={setOpen} aria-label={title} {...drawerProps}>
        <EditorHeader title={title} onClose={() => setOpen(false)} />
        <Box p="md" style={{ flex: 1, overflowY: 'auto' }}>
          {children ?? <p>Drawer body. Press Escape or click the backdrop to request close.</p>}
        </Box>
      </Drawer>
    </>
  );
}

const basicCode = `const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Edit panel</Button>
<Drawer open={open} onOpenChange={setOpen} aria-label="Edit panel">
  <EditorHeader title="Edit panel" onClose={() => setOpen(false)} />
  <Box p="md" style={{ flex: 1, overflowY: 'auto' }}>…</Box>
</Drawer>`;

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>Drawer</code> is a modal side panel for editing flows. It is always controlled: Escape, a backdrop click or
      a swipe call <code>onOpenChange(false)</code> and the consumer decides whether to close, so a form can confirm
      unsaved changes first. The popup is a full-height flex column; give the scrolling region{' '}
      <code>flex: 1; overflow-y: auto</code>. Style props on the popup behave exactly as documented on <code>Box</code>.
    </p>
    <Sample title="Minimal usage" code={basicCode}>
      <DemoDrawer label="Edit panel" title="Edit panel" />
    </Sample>
  </Stack>
);

const anchorsCode = `<Drawer anchor="right" …>  // default
<Drawer anchor="left" …>`;

const widthCode = `// Default width is 1080px, clamped to the viewport.
<Drawer width="50%" …>`;

export const Variants: Story = () => (
  <Stack>
    <p>
      <code>anchor</code> picks the screen edge and is exposed as <code>data-anchor</code> for host CSS.
    </p>
    <Sample title="Anchors" code={anchorsCode}>
      <div style={row}>
        <DemoDrawer label="Right (default)" title="Right drawer" />
        <DemoDrawer label="Left" title="Left drawer" anchor="left" />
      </div>
    </Sample>
    <Sample title="Width" code={widthCode}>
      <DemoDrawer label="Half width" title="Half-width drawer" width="50%" />
    </Sample>
  </Stack>
);

const scrollCode = `<Drawer open={open} onOpenChange={setOpen}>
  <EditorHeader … />
  <Box p="md" style={{ flex: 1, overflowY: 'auto' }}>
    {/* long content scrolls here; the header stays put */}
  </Box>
</Drawer>`;

const confirmCode = `const [open, setOpen] = useState(false);
const [confirming, setConfirming] = useState(false);

<Drawer open={open} onOpenChange={() => setConfirming(true)}>
  …
  {confirming && <ConfirmDialog onDiscard={() => setOpen(false)} onKeep={() => setConfirming(false)} />}
</Drawer>`;

function ConfirmingDrawer(): ReactElement {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const close = (): void => {
    setConfirming(false);
    setOpen(false);
  };
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Edit with unsaved changes
      </Button>
      <Drawer open={open} onOpenChange={() => setConfirming(true)} aria-label="Edit datasource">
        <EditorHeader title="Edit datasource" onClose={() => setConfirming(true)} />
        <Box p="md" style={{ flex: 1, overflowY: 'auto' }}>
          <p>Try Escape or the backdrop: the drawer stays open until you confirm.</p>
          {confirming && (
            <Box
              p="md"
              role="alertdialog"
              aria-label="Discard changes?"
              style={{
                border: 'var(--perses-border-width-sm) solid var(--perses-border-default)',
                borderRadius: 'var(--perses-radius-md)',
              }}
            >
              <p>Discard changes?</p>
              <div style={row}>
                <Button variant="solid" color="error" onClick={close}>
                  Discard
                </Button>
                <Button variant="outline" onClick={() => setConfirming(false)}>
                  Keep editing
                </Button>
              </div>
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  );
}

export const States: Story = () => (
  <Stack>
    <p>
      The popup carries <code>data-open</code>, <code>data-starting-style</code> and <code>data-ending-style</code>{' '}
      during transitions. <code>onExited</code> fires once the close transition has finished.
    </p>
    <Sample title="Scrollable body" code={scrollCode}>
      <DemoDrawer label="Long content" title="Long content">
        {Array.from({ length: 40 }, (_, i) => (
          <p key={i}>Paragraph {i + 1}</p>
        ))}
      </DemoDrawer>
    </Sample>
    <Sample title="Close is a request" code={confirmCode}>
      <ConfirmingDrawer />
    </Sample>
  </Stack>
);
States.storyName = 'States';
