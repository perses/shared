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
import { Checkbox } from '../Checkbox';
import { FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel } from '../FormControl';
import { CloseIcon } from '../Icon';
import { IconButton } from '../IconButton';
import { Select, SelectItem } from '../Select';
import { Switch } from '../Switch';
import { TextField } from '../TextField';
import { Drawer } from './Drawer';
import type { DrawerProps, DrawerSlotProps } from './Drawer';
import { DrawerContent } from './DrawerContent';
import { DrawerHeader } from './DrawerHeader';
import type { DrawerHeaderSlotProps } from './DrawerHeader';

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
<Drawer width="50%" …>

/* Or change the default for every drawer in host CSS */
:root { --perses-drawer-width: 960px; }`;

const customizationCode = `/* Every drawer, in host CSS */
:root {
  --perses-drawer-bg: var(--perses-bg-overlay);
  --perses-drawer-radius: var(--perses-radius-lg);
}

// One drawer: DrawerStyle custom properties, or radius props
<Drawer style={{ '--perses-drawer-bg': 'var(--perses-bg-overlay)' }} roundedLeft="none" …>`;

export const Variants: Story = () => (
  <Stack>
    <p>
      <code>anchor</code> picks the screen edge and is exposed as <code>data-anchor</code> for host CSS. Background,
      corner radius and default width are <code>--perses-drawer-*</code> custom properties (<code>DrawerStyle</code>
      ), settable per drawer or for every drawer in host CSS; radius props override the corners per instance.
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
    <Sample title="Background and corners" code={customizationCode}>
      <Box display="flex" gap="md" flexWrap="wrap">
        <DemoDrawer
          label="Overlay background, large radius"
          title="Customized drawer"
          style={{
            '--perses-drawer-bg': 'var(--perses-bg-overlay)',
            '--perses-drawer-radius': 'var(--perses-radius-lg)',
          }}
        />
        <DemoDrawer label="Square corners" title="Square drawer" roundedLeft="none" />
      </Box>
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

const formCode = `<Drawer open={open} onClose={close} aria-label="Edit panel">
  <DrawerHeader endElement={<Button onClick={close}>Apply</Button>}>Edit panel</DrawerHeader>
  <DrawerContent>
    <FormControl>
      <FormLabel>Name</FormLabel>
      <TextField />
    </FormControl>
    <FormControl>
      <FormLabel>Unit</FormLabel>
      <Select defaultValue="bytes">…</Select>
    </FormControl>
    …
  </DrawerContent>
</Drawer>`;

function FormDrawer(): ReactElement {
  const [open, setOpen] = useState(false);
  const [closeRequests, setCloseRequests] = useState(0);
  const close = (): void => setOpen(false);
  const requestClose = (): void => {
    setCloseRequests((count) => count + 1);
    close();
  };
  return (
    <Box display="flex" gap="md" alignItems="center" flexWrap="wrap">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Edit panel form
      </Button>
      <span>
        Close requests (Escape, backdrop, swipe): <strong>{closeRequests}</strong>
      </span>
      <Drawer open={open} onClose={requestClose} aria-label="Edit panel">
        <DrawerHeader
          endElement={
            <>
              <Button size="sm" variant="solid" onClick={close}>
                Apply
              </Button>
              <CloseButton onClick={close} />
            </>
          }
        >
          Edit panel
        </DrawerHeader>
        <DrawerContent>
          <Box display="flex" flexDirection="column" gap="lg">
            <p>
              Drag across this paragraph to select it, type and select text in the fields, open the select and pick an
              option, and toggle the checkboxes. None of these should move the drawer or count as a close request.
              Dragging the header is the only mouse swipe that should move the drawer.
            </p>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <TextField defaultValue="CPU usage by instance" />
              <FormHelperText>Displayed as the panel title</FormHelperText>
            </FormControl>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <TextField
                multiline
                rows={4}
                defaultValue="Average CPU usage per instance over the selected time range. Select part of this text with the mouse."
              />
            </FormControl>
            <FormControl>
              <FormLabel>Unit</FormLabel>
              <Select defaultValue="percent">
                <SelectItem value="percent">Percent</SelectItem>
                <SelectItem value="bytes">Bytes</SelectItem>
                <SelectItem value="seconds">Seconds</SelectItem>
                <SelectItem value="decimal">Decimal</SelectItem>
              </Select>
              <FormHelperText>The options popup renders outside the drawer</FormHelperText>
            </FormControl>
            <FormGroup legend="Legend values" direction="row">
              <Checkbox label="Min" />
              <Checkbox label="Max" defaultChecked />
              <Checkbox label="Mean" />
            </FormGroup>
            <FormControlLabel label="Show legend">
              <Switch defaultChecked />
            </FormControlLabel>
          </Box>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}

export const Form: Story = () => (
  <Stack>
    <p>
      A drawer is usually an editing surface. Interacting with fields, popups and text inside <code>DrawerContent</code>{' '}
      does not request close; the counter shows every <code>onClose</code> call.
    </p>
    <Sample title="Form inside a drawer" code={formCode}>
      <FormDrawer />
    </Sample>
  </Stack>
);
Form.storyName = 'Form';

const headerSlots: DrawerHeaderSlotProps = {
  title: { style: { fontWeight: 'var(--perses-font-weight-bold)' } },
  end: { style: { gap: 'var(--perses-spacing-xs)' } },
};
const drawerSlots: DrawerSlotProps = {
  backdrop: { style: { backgroundColor: 'rgba(255, 0, 0, 0.3)' } },
  viewport: { style: { top: '48px' } },
};
const slotStylingCode = `const drawerSlots: DrawerSlotProps = {
  backdrop: { style: { backgroundColor: 'rgba(255, 0, 0, 0.3)' } },
  viewport: { style: { top: '48px' } }, // e.g. keep a 48px app bar uncovered
};
const headerSlots: DrawerHeaderSlotProps = {
  title: { style: { fontWeight: 'var(--perses-font-weight-bold)' } },
  end: { style: { gap: 'var(--perses-spacing-xs)' } },
};

<Drawer open={open} onClose={close} aria-label="Edit panel" slotProps={drawerSlots}>
  <DrawerHeader endElement={<>…actions</>} slotProps={headerSlots}>
    Edit panel
  </DrawerHeader>
  <DrawerContent>…</DrawerContent>
</Drawer>`;

function SlotsDrawer(): ReactElement {
  const [open, setOpen] = useState(false);
  const close = (): void => setOpen(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Styled slots
      </Button>
      <Drawer open={open} onClose={close} aria-label="Edit panel" slotProps={drawerSlots}>
        <DrawerHeader
          slotProps={headerSlots}
          endElement={
            <>
              <Button size="sm" variant="solid" onClick={close}>
                Apply
              </Button>
              <CloseButton onClick={close} />
            </>
          }
        >
          Edit panel
        </DrawerHeader>
        <DrawerContent>
          <p>
            The scrim is red, the drawer starts 48px below the top of the window, the title is bold and the actions sit
            closer together.
          </p>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export const Slots: Story = () => (
  <Stack>
    <p>
      Use <code>slotProps</code> on <code>Drawer</code> and <code>DrawerHeader</code> to style their internal parts with{' '}
      <code>className</code> or <code>style</code>, without changing structure or behavior.
    </p>
    <div>
      <h3>Drawer slots</h3>
      <ul>
        <li>
          <code>backdrop</code> — Scrim behind the popup.
        </li>
        <li>
          <code>viewport</code> — Fixed full-screen layer that positions the popup and owns <code>z-index</code>.
        </li>
      </ul>
      <h3>DrawerHeader slots</h3>
      <ul>
        <li>
          <code>title</code> — The <code>&lt;h2&gt;</code> title that also names the dialog.
        </li>
        <li>
          <code>end</code> — Wrapper around <code>endElement</code>, when one is rendered.
        </li>
      </ul>
    </div>
    <Sample title="Styling slots" code={slotStylingCode}>
      <SlotsDrawer />
    </Sample>
  </Stack>
);
Slots.storyName = 'Slots';
