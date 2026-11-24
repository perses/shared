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
import type { ReactElement, ReactNode } from 'react';

import { Sample, Stack } from '../../stories/Sample';
import { Box } from '../Box';
import { Button } from '../Button';
import { CloseIcon } from '../Icon';
import { IconButton } from '../IconButton';
import { Drawer } from './Drawer';
import type { DrawerProps } from './Drawer';
import { DrawerContent } from './DrawerContent';
import { DrawerHeader } from './DrawerHeader';

function CloseButton({ onClick }: { onClick: () => void }): ReactElement {
  return (
    <IconButton aria-label="Close" variant="ghost" onClick={onClick}>
      <CloseIcon />
    </IconButton>
  );
}

function DemoDrawer({
  label,
  title,
  children,
  ...drawerProps
}: Omit<DrawerProps, 'open' | 'onClose' | 'children' | 'aria-label' | 'aria-labelledby'> & {
  label: string;
  title: string;
  children?: ReactNode;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const close = (): void => setOpen(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Drawer open={open} onClose={close} aria-label={title} {...drawerProps}>
        <DrawerHeader endElement={<CloseButton onClick={close} />}>{title}</DrawerHeader>
        <DrawerContent>
          {children ?? <p>Drawer body. Press Escape or click the backdrop to request close.</p>}
        </DrawerContent>
      </Drawer>
    </>
  );
}

const basicCode = `const [open, setOpen] = useState(false);
const close = () => setOpen(false);

<Button onClick={() => setOpen(true)}>Edit panel</Button>
<Drawer open={open} onClose={close} aria-label="Edit panel">
  <DrawerHeader endElement={<IconButton aria-label="Close" onClick={close}><CloseIcon /></IconButton>}>
    Edit panel
  </DrawerHeader>
  <DrawerContent>…</DrawerContent>
</Drawer>`;

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>Drawer</code> is a modal side panel for editing flows. It is always controlled: Escape, a backdrop click or
      a swipe call <code>onClose</code> and the consumer decides whether to close, so a form can confirm unsaved changes
      first. <code>DrawerHeader</code> renders the title (which also names the dialog) with an optional{' '}
      <code>endElement</code> for actions; <code>DrawerContent</code> is the padded, scrolling body. Sizing props on the
      popup behave exactly as documented on <code>Box</code>.
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
      <Box display="flex" gap="md" flexWrap="wrap">
        <DemoDrawer label="Right (default)" title="Right drawer" />
        <DemoDrawer label="Left" title="Left drawer" anchor="left" />
      </Box>
    </Sample>
    <Sample title='width="50%"' code={widthCode}>
      <DemoDrawer label="Half width" title="Half-width drawer" width="50%" />
    </Sample>
  </Stack>
);

const scrollCode = `<Drawer open={open} onClose={close} aria-label="Edit panel">
  <DrawerHeader …>Edit panel</DrawerHeader>
  <DrawerContent>
    {/* long content scrolls here; the header stays put */}
  </DrawerContent>
</Drawer>`;

const confirmCode = `const [open, setOpen] = useState(false);
const [confirming, setConfirming] = useState(false);
const requestClose = () => setConfirming(true);
const keepEditing = () => setConfirming(false);
const discard = () => { setConfirming(false); setOpen(false); };

<Drawer open={open} onClose={requestClose} aria-label="Edit datasource">
  <DrawerHeader endElement={<IconButton aria-label="Close" onClick={requestClose}>…</IconButton>}>
    Edit datasource
  </DrawerHeader>
  <DrawerContent>
    …
    {confirming && (
      <Box>
        <p>Discard changes?</p>
        <Button onClick={discard}>Discard</Button>
        <Button onClick={keepEditing}>Keep editing</Button>
      </Box>
    )}
  </DrawerContent>
</Drawer>`;

function ConfirmingDrawer(): ReactElement {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const requestClose = (): void => setConfirming(true);
  const keepEditing = (): void => setConfirming(false);
  const discard = (): void => {
    setConfirming(false);
    setOpen(false);
  };
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Edit with unsaved changes
      </Button>
      <Drawer open={open} onClose={requestClose} aria-label="Edit datasource">
        <DrawerHeader endElement={<CloseButton onClick={requestClose} />}>Edit datasource</DrawerHeader>
        <DrawerContent>
          <p>Try Escape or the backdrop: the drawer stays open until you confirm.</p>
          {confirming && (
            <Box
              p="md"
              rounded="md"
              style={{ border: 'var(--perses-border-width-sm) solid var(--perses-border-default)' }}
            >
              <p>Discard changes?</p>
              <Box display="flex" gap="md" flexWrap="wrap">
                <Button variant="solid" color="error" onClick={discard}>
                  Discard
                </Button>
                <Button variant="outline" onClick={keepEditing}>
                  Keep editing
                </Button>
              </Box>
            </Box>
          )}
        </DrawerContent>
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
    <Sample title="Close is a request (inline prompt)" code={confirmCode}>
      <ConfirmingDrawer />
    </Sample>
  </Stack>
);
States.storyName = 'States';
