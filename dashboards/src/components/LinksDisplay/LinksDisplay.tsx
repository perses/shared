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

import { IconButton, Link as LinkComponent, Menu, MenuItem, Theme, Chip } from '@mui/material';
import LaunchIcon from 'mdi-material-ui/Launch';
import { Link } from '@perses-dev/core';
import { MouseEvent, ReactElement, useState } from 'react';
import { InfoTooltip } from '@perses-dev/components';
import { useReplaceVariablesInString } from '@perses-dev/plugin-system';

type LinksVariant = 'dashboard' | 'panel';

interface LinksProps {
  links: Link[];
  variant: LinksVariant;
}

export function LinksDisplay({ links, variant }: LinksProps): ReactElement|null {
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
  if (variant === 'dashboard' && links.length <= 3) {
    return (
      <>
        {links.map((link: Link) => (
          <LinkChip key={link.url} link={link} />
        ))}
      </>
    );
  }

  // Default: show dropdown menu for multiple links
  return (
    <>
      <InfoTooltip description={`${links.length} links`} enterDelay={100}>
        <IconButton
          aria-label={variant === 'dashboard' ? 'Dashboard links' : 'Panel links'}
          size="small"
          onClick={handleOpenMenu}
          sx={(theme) => ({ borderRadius: theme.shape.borderRadius, padding: '4px' })}
        >
          <LaunchIcon
            aria-describedby="links-icon"
            fontSize="inherit"
            sx={{ color: (theme) => theme.palette.text.secondary }}
          />
        </IconButton>
      </InfoTooltip>

      <Menu
        anchorEl={anchorEl}
        open={isMenuOpened}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': variant === 'dashboard' ? 'dashboard-links' : 'panel-links',
        }}
      >
        {links.map((link: Link) => (
          <LinkMenuItem key={link.url} link={link} />
        ))}
      </Menu>
    </>
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
        size="small"
        icon={<LaunchIcon fontSize="small" />}
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

function LinkMenuItem({ link }: { link: Link }): ReactElement {
  const { url, name, tooltip, targetBlank } = useLink(link);

  return (
    <InfoTooltip description={tooltip ?? url} enterDelay={100}>
      <MenuItem component={LinkComponent} href={url} target={targetBlank ? '_blank' : '_self'}>
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
