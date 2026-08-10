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

import {
  Box,
  ClickAwayListener,
  IconButton,
  Link as LinkComponent,
  Menu,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Theme,
  Chip,
  capitalize,
  Stack,
} from '@mui/material';
import LaunchIcon from 'mdi-material-ui/Launch';
import { Link } from '@perses-dev/spec';
import { MouseEvent, ReactElement, useId, useState } from 'react';
import { InfoTooltip } from '@perses-dev/components';
import { useReplaceVariablesInString } from '@perses-dev/plugin-system';

type LinksVariant = 'dashboard' | 'panel';

interface LinksProps {
  links: Link[];
  variant: LinksVariant;
}

export function LinksDisplay({ links, variant }: LinksProps): ReactElement | null {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpened = Boolean(anchorEl);
  const handleOpenMenu = (event: MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  if (links.length === 0) {
    return null;
  }

  // Panel variant: single link shows as icon button
  if (variant === 'panel' && links.length === 1 && links[0]) {
    return <LinkButton link={links[0]} />;
  }

  // Dashboard variant: 1-3 links show as chips
  // Max character limit for the name and url to prevent overflow
  // in the dashboard title area, but if either the name or url is too long,
  // we will fall back to showing the links in a dropdown menu
  if (variant === 'dashboard' && links.length <= 3) {
    const canRenderAsChips = links.every((link) => {
      if (link.name) {
        return link.name.length < 30;
      }

      if (link.url) {
        return link.url.length < 70;
      }

      return false;
    });

    if (canRenderAsChips) {
      return (
        <Stack direction="row" spacing={1}>
          {links.map((link: Link) => (
            <LinkChip key={link.url} link={link} />
          ))}
        </Stack>
      );
    }
  }

  if (variant === 'panel') {
    return <PanelLinksDropdown links={links} />;
  }

  // Dashboard variant: show dropdown menu for multiple links
  const menuButtonId = `${variant}-links-button`;

  return (
    <Box sx={{ display: 'inline-flex' }}>
      <InfoTooltip description={`${links.length} links`} enterDelay={100}>
        <IconButton
          aria-label={`${capitalize(variant)}-links`}
          id={menuButtonId}
          size="small"
          onClick={handleOpenMenu}
          sx={(theme) => ({ borderRadius: theme.shape.borderRadius, padding: '4px' })}
        >
          <LaunchIcon
            aria-describedby="links-icon"
            fontSize="inherit"
            sx={{ color: (theme: Theme) => theme.palette.text.secondary }}
          />
        </IconButton>
      </InfoTooltip>

      <Menu
        anchorEl={anchorEl}
        open={isMenuOpened}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        MenuListProps={{
          'aria-labelledby': menuButtonId,
        }}
      >
        {links.map((link: Link) => (
          <LinkMenuItem key={link.url} link={link} />
        ))}
      </Menu>
    </Box>
  );
}

function PanelLinksDropdown({ links }: { links: Link[] }): ReactElement {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const open = Boolean(anchorEl);

  const handleToggle = (event: MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'inline-flex', background: (theme) => theme.palette.background.default }}>
      <InfoTooltip description={`${links.length} links`} enterDelay={100}>
        <IconButton
          aria-label="Panel-links"
          aria-describedby={open ? menuId : undefined}
          size="small"
          onClick={handleToggle}
          sx={(theme) => ({ borderRadius: theme.shape.borderRadius, padding: '4px' })}
        >
          <LaunchIcon fontSize="inherit" sx={{ color: (theme: Theme) => theme.palette.text.secondary }} />
        </IconButton>
      </InfoTooltip>
      <Popper
        id={menuId}
        open={open}
        anchorEl={anchorEl}
        placement="bottom-end"
        // react-grid-layout applies CSS transforms to panels; fixed positioning keeps the menu
        // anchored to the link icon instead of using incorrect offset coordinates.
        popperOptions={{ strategy: 'fixed' }}
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 4],
            },
          },
        ]}
        sx={{ zIndex: (theme) => theme.zIndex.modal }}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper elevation={8}>
            <MenuList autoFocusItem={open}>
              {links.map((link: Link) => (
                <LinkMenuItem key={link.url} link={link} onNavigate={handleClose} />
              ))}
            </MenuList>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}

function LinkChip({ link }: { link: Link }): ReactElement {
  const { url, name, tooltip, targetBlank } = useLink(link);

  return (
    <InfoTooltip description={tooltip ?? url} enterDelay={100}>
      <Chip
        label={name ?? url}
        component="a"
        href={url}
        target={targetBlank ? '_blank' : '_self'}
        clickable
        size="medium"
        icon={<LaunchIcon color="inherit" fontSize="small" />}
        sx={(theme) => ({ height: theme.spacing(3) })}
      />
    </InfoTooltip>
  );
}

function LinkButton({ link }: { link: Link }): ReactElement {
  const { url, name, tooltip, targetBlank } = useLink(link);

  return (
    <InfoTooltip description={tooltip ?? url} enterDelay={100}>
      <IconButton
        aria-label={name ?? url}
        size="small"
        href={url}
        target={targetBlank ? '_blank' : '_self'}
        sx={(theme) => ({ borderRadius: theme.shape.borderRadius, padding: '4px' })}
      >
        <LaunchIcon fontSize="inherit" sx={{ color: (theme: Theme) => theme.palette.text.secondary }} />
      </IconButton>
    </InfoTooltip>
  );
}

function LinkMenuItem({ link, onNavigate }: { link: Link; onNavigate?: () => void }): ReactElement {
  const { url, name, tooltip, targetBlank } = useLink(link);

  return (
    <InfoTooltip description={tooltip ?? url} enterDelay={100}>
      <MenuItem component={LinkComponent} href={url} target={targetBlank ? '_blank' : '_self'} onClick={onNavigate}>
        {name ?? url}
      </MenuItem>
    </InfoTooltip>
  );
}

function useLink(link: Link): Link {
  const url = useReplaceVariablesInString(link.url) ?? link.url;
  const name = useReplaceVariablesInString(link.name);
  const tooltip = useReplaceVariablesInString(link.tooltip);

  if (link.renderVariables === false) {
    return link;
  }

  return { ...link, url, name, tooltip };
}
