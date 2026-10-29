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
import type { CSSProperties, MouseEvent, ReactElement } from 'react';

import { Sample, Stack } from '../../stories/Sample';
import { Button } from '../Button';
import { Divider } from '../Divider';
import { ContentCopyIcon, EyeIcon, MenuIcon, OpenInNewIcon, PencilIcon, TrashIcon } from '../Icon/icons';
import { IconButton } from '../IconButton';
import { Menu } from './Menu';
import type { MenuAlign, MenuPlacement, MenuProps, MenuSlotProps } from './Menu';
import { MenuCheckboxItem } from './MenuCheckboxItem';
import { MenuItem } from './MenuItem';
import { MenuLinkItem } from './MenuLinkItem';

const row: CSSProperties = {
  display: 'flex',
  gap: 'var(--perses-spacing-lg)',
  flexWrap: 'wrap',
  alignItems: 'center',
};
const placementGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, max-content)',
  gap: 'var(--perses-spacing-lg)',
  padding: 'calc(var(--perses-spacing-xl) * 3) var(--perses-spacing-lg)',
  justifyContent: 'center',
};
const contextArea: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  height: '10rem',
  border: 'var(--perses-border-width-sm) dashed var(--perses-border-default)',
  borderRadius: 'var(--perses-radius-md)',
  userSelect: 'none',
};

const moreTrigger = (
  <IconButton aria-label="More actions" variant="ghost">
    <MenuIcon />
  </IconButton>
);
const buttonTrigger = <Button variant="outline">Actions</Button>;

const basicCode = `<Menu trigger={<Button variant="outline">Actions</Button>}>
  <MenuItem onClick={edit}>Edit</MenuItem>
  <MenuItem onClick={duplicate}>Duplicate</MenuItem>
  <MenuItem onClick={remove}>Delete</MenuItem>
</Menu>`;

export const Basic: Story = () => (
  <Stack>
    <p>
      <code>Menu</code> opens a list of actions from a <code>trigger</code>. It handles focus, arrow-key navigation,
      typeahead, and Escape for you. Items are <code>MenuItem</code>, <code>MenuLinkItem</code>, or{' '}
      <code>MenuCheckboxItem</code>; use <code>Select</code> instead when the user picks a value for a form field. Style
      props on the popup and items behave exactly as documented on <code>Box</code>.
    </p>
    <Sample title="Minimal usage" code={basicCode}>
      <Menu trigger={buttonTrigger}>
        <MenuItem>Edit</MenuItem>
        <MenuItem>Duplicate</MenuItem>
        <MenuItem>Delete</MenuItem>
      </Menu>
    </Sample>
  </Stack>
);
Basic.storyName = 'Basic';

const itemKindsCode = `<Menu trigger={<IconButton aria-label="More actions" variant="ghost"><MenuIcon /></IconButton>}>
  <MenuItem startElement={<PencilIcon />} endElement={<kbd>⌘E</kbd>}>Edit</MenuItem>
  <MenuItem startElement={<ContentCopyIcon />}>Duplicate</MenuItem>
  <MenuLinkItem href="https://perses.dev" target="_blank" startElement={<OpenInNewIcon />}>
    Documentation
  </MenuLinkItem>
  <Divider />
  <MenuCheckboxItem defaultChecked startElement={<EyeIcon />}>Show legend</MenuCheckboxItem>
  <MenuCheckboxItem>Show tooltips</MenuCheckboxItem>
  <Divider />
  <MenuItem startElement={<TrashIcon />}>Delete</MenuItem>
</Menu>`;
const sizesCode = `// size: 'sm' | 'md' (default) — set on each item
<Menu trigger={<Button variant="outline">Compact</Button>}>
  <MenuItem size="sm">Edit</MenuItem>
  <MenuCheckboxItem size="sm">Dense rows</MenuCheckboxItem>
</Menu>`;
const placementsCode = `// placement: 'top' | 'bottom' (default) | 'left' | 'right'
// align: 'start' (default) | 'center' | 'end'
<Menu trigger={<Button variant="outline">Right / center</Button>} placement="right" align="center">
  …
</Menu>`;

const placements: MenuPlacement[] = ['top', 'bottom', 'left', 'right'];
const aligns: MenuAlign[] = ['start', 'center', 'end'];

function PlacementMenu({ placement, align }: Pick<MenuProps, 'placement' | 'align'>): ReactElement {
  return (
    <Menu trigger={<Button variant="outline">{`${placement} / ${align}`}</Button>} placement={placement} align={align}>
      <MenuItem>First</MenuItem>
      <MenuItem>Second</MenuItem>
      <MenuItem>Third</MenuItem>
    </Menu>
  );
}

export const Variants: Story = () => (
  <Stack>
    <Sample title="Item kinds" code={itemKindsCode}>
      <Menu trigger={moreTrigger}>
        <MenuItem startElement={<PencilIcon />} endElement={<kbd>⌘E</kbd>}>
          Edit
        </MenuItem>
        <MenuItem startElement={<ContentCopyIcon />}>Duplicate</MenuItem>
        <MenuLinkItem href="https://perses.dev" target="_blank" startElement={<OpenInNewIcon />}>
          Documentation
        </MenuLinkItem>
        <Divider />
        <MenuCheckboxItem defaultChecked startElement={<EyeIcon />}>
          Show legend
        </MenuCheckboxItem>
        <MenuCheckboxItem>Show tooltips</MenuCheckboxItem>
        <Divider />
        <MenuItem startElement={<TrashIcon />}>Delete</MenuItem>
      </Menu>
    </Sample>

    <Sample title="Sizes" code={sizesCode}>
      <div style={row}>
        <Menu trigger={<Button variant="outline">Default</Button>}>
          <MenuItem>Edit</MenuItem>
          <MenuCheckboxItem>Dense rows</MenuCheckboxItem>
        </Menu>
        <Menu trigger={<Button variant="outline">Compact</Button>}>
          <MenuItem size="sm">Edit</MenuItem>
          <MenuCheckboxItem size="sm">Dense rows</MenuCheckboxItem>
        </Menu>
      </div>
    </Sample>

    <Sample title="Placement and alignment" code={placementsCode}>
      <div style={placementGrid}>
        {aligns.map((align) =>
          placements.map((placement) => (
            <PlacementMenu key={`${placement}-${align}`} placement={placement} align={align} />
          )),
        )}
      </div>
    </Sample>
  </Stack>
);
Variants.storyName = 'Variants';

const statesCode = `<Menu trigger={<Button variant="outline">States</Button>}>
  <MenuItem selected>Selected</MenuItem>
  <MenuItem disabled>Disabled</MenuItem>
  <MenuCheckboxItem checked disabled>Checked and disabled</MenuCheckboxItem>
  <MenuItem closeOnClick={false}>Stays open</MenuItem>
</Menu>`;
const controlledCode = `const [open, setOpen] = useState(false);

<Menu trigger={<Button variant="outline">Controlled</Button>} open={open} onOpenChange={setOpen}>
  <MenuItem>Edit</MenuItem>
</Menu>
<Button variant="ghost" onClick={() => setOpen(true)}>Open from outside</Button>`;

function ControlledMenu(): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <div style={row}>
      <Menu trigger={<Button variant="outline">Controlled</Button>} open={open} onOpenChange={setOpen}>
        <MenuItem>Edit</MenuItem>
        <MenuItem>Duplicate</MenuItem>
      </Menu>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Open from outside
      </Button>
      <span>{open ? 'open' : 'closed'}</span>
    </div>
  );
}

export const States: Story = () => (
  <Stack>
    <p>
      Item state is exposed as <code>data-highlighted</code>, <code>data-selected</code>, <code>data-disabled</code>,
      and <code>data-checked</code> for host CSS. The popup carries <code>data-open</code>/<code>data-closed</code> and{' '}
      <code>data-side</code>/<code>data-align</code>.
    </p>
    <Sample title="Item states" code={statesCode}>
      <Menu trigger={<Button variant="outline">States</Button>}>
        <MenuItem selected>Selected</MenuItem>
        <MenuItem disabled>Disabled</MenuItem>
        <MenuCheckboxItem checked disabled>
          Checked and disabled
        </MenuCheckboxItem>
        <MenuItem closeOnClick={false}>Stays open</MenuItem>
      </Menu>
    </Sample>

    <Sample title="Controlled open state" code={controlledCode}>
      <ControlledMenu />
    </Sample>
  </Stack>
);
States.storyName = 'States';

const contextMenuCode = `const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

function handleContextMenu(event: MouseEvent): void {
  event.preventDefault();
  setAnchor({ x: event.clientX, y: event.clientY });
}

// No trigger: position the popup at the pointer with a virtual element
<div onContextMenu={handleContextMenu}>Right-click here</div>
<Menu
  open={anchor !== null}
  onOpenChange={(open) => !open && setAnchor(null)}
  anchor={anchor && { getBoundingClientRect: () => DOMRect.fromRect({ x: anchor.x, y: anchor.y }) }}
  offset={0}
>
  <MenuItem>Zoom in</MenuItem>
  <MenuItem>Reset zoom</MenuItem>
</Menu>`;

function ContextMenuDemo(): ReactElement {
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  function handleContextMenu(event: MouseEvent): void {
    event.preventDefault();
    setAnchor({ x: event.clientX, y: event.clientY });
  }

  return (
    <>
      <div style={contextArea} onContextMenu={handleContextMenu}>
        Right-click here
      </div>
      <Menu
        open={anchor !== null}
        onOpenChange={(open) => !open && setAnchor(null)}
        anchor={anchor && { getBoundingClientRect: () => DOMRect.fromRect({ x: anchor.x, y: anchor.y }) }}
        offset={0}
      >
        <MenuItem>Zoom in</MenuItem>
        <MenuItem>Zoom out</MenuItem>
        <Divider />
        <MenuItem>Reset zoom</MenuItem>
      </Menu>
    </>
  );
}

export const ContextMenu: Story = () => (
  <Stack>
    <p>
      Omit <code>trigger</code> and pass <code>anchor</code> to open a menu at any element or point — for example a
      right-click on a chart. A virtual element is any object with <code>getBoundingClientRect()</code>.
    </p>
    <Sample title="Context menu at the pointer" code={contextMenuCode}>
      <ContextMenuDemo />
    </Sample>
  </Stack>
);
ContextMenu.storyName = 'Context menu';

const positionerSlots: MenuSlotProps = {
  positioner: { className: 'above-everything', style: { zIndex: 2000 } },
};
const slotStylingCode = `const positionerSlots: MenuSlotProps = {
  positioner: { className: 'above-everything', style: { zIndex: 2000 } },
};

// The popup itself is the root: style it with className, style, or style props
<Menu trigger={<Button variant="outline">Styled</Button>} slotProps={positionerSlots} minWidth="15rem" p="sm" rounded="lg">
  <MenuItem>Edit</MenuItem>
</Menu>`;

export const Slots: Story = () => (
  <Stack>
    <p>
      Use <code>slotProps</code> to style internal parts with <code>className</code> or <code>style</code>, without
      changing structure or behavior. The popup is the component root, so <code>className</code>, <code>style</code>,
      and style props go directly on <code>Menu</code>.
    </p>
    <div>
      <h3>Available slots</h3>
      <ul>
        <li>
          <code>positioner</code> — Positioning wrapper around the popup; owns <code>z-index</code>.
        </li>
      </ul>
    </div>
    <Sample title="Styling slots" code={slotStylingCode}>
      <Menu
        trigger={<Button variant="outline">Styled</Button>}
        slotProps={positionerSlots}
        minWidth="15rem"
        p="sm"
        rounded="lg"
      >
        <MenuItem>Edit</MenuItem>
        <MenuItem>Duplicate</MenuItem>
      </Menu>
    </Sample>
  </Stack>
);
Slots.storyName = 'Slots';
