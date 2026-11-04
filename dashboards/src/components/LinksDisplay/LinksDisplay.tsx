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

import type { Theme } from '@mui/material';
import { IconButton, Link as LinkComponent, Menu, MenuItem, Chip, capitalize, Stack } from '@mui/material';
import { InfoTooltip, sanitizeUrl } from '@perses-dev/components';
import { useReplaceVariablesInString, useReplaceVariablesInUrl, useTimeRange } from '@perses-dev/plugin-system';
import LaunchIcon from 'mdi-material-ui/Launch';
import type { MouseEvent, ReactElement } from 'react';
import { useId, useState } from 'react';

import { useVariableDefinitionStates } from '../../context';
import type { DashboardLink } from './dashboard-link';
import { isTagLink } from './dashboard-link';
import { appendLinkState } from './tag-links';
import { TagLinkMenu } from './TagLinkMenu';

type LinksVariant = 'dashboard' | 'panel';

interface LinksProps {
  links: DashboardLink[];
  variant: LinksVariant;
}

export function LinksDisplay({ links, variant }: LinksProps): ReactElement | null {
  const buttonId = `${variant}-links-button-${useId()}`;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpened = Boolean(anchorEl);
  const handleOpenMenu = (event: MouseEvent<HTMLButtonElement>): void => {
    // Prevent this from bubbling up to an ancestor OverflowMenu's onClick={handleClose},
    // which would close (and unmount) the overflow before this menu can open.
    // See https://github.com/perses/perses/issues/3654
    event.stopPropagation();
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
    if (isTagLink(links[0])) {
      return <TagLinkMenu link={links[0]} appearance="button" />;
    }
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
          {links.map((link: DashboardLink) =>
            isTagLink(link) ? (
              <TagLinkMenu key={linkKey(link)} link={link} appearance="chip" />
            ) : (
              <LinkChip key={linkKey(link)} link={link} />
            ),
          )}
        </Stack>
      );
    }
  }

  // Default: show dropdown menu for multiple links
  return (
    <>
      <InfoTooltip description={`${links.length} links`} enterDelay={100}>
        <IconButton
          aria-label={`${capitalize(variant)}-links`}
          id={buttonId}
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
        MenuListProps={{
          'aria-labelledby': buttonId,
        }}
      >
        {links.map((link: DashboardLink) =>
          isTagLink(link) ? (
            <TagLinkMenu key={linkKey(link)} link={link} appearance="item" />
          ) : (
            <LinkMenuItem key={linkKey(link)} link={link} />
          ),
        )}
      </Menu>
    </>
  );
}

function linkKey(link: DashboardLink): string {
  if (isTagLink(link)) {
    return `tags:${link.name ?? ''}:${(link.tags ?? []).join(',')}`;
  }
  return link.url ?? link.name ?? '';
}

function LinkChip({ link }: { link: DashboardLink }): ReactElement {
  return (
    <ResolveLink link={link}>
      {(resolved) => (
        <InfoTooltip description={resolved.description} enterDelay={100}>
          <Chip
            label={resolved.name ?? resolved.url}
            component="a"
            href={resolved.href}
            target={resolved.targetBlank ? '_blank' : '_self'}
            rel={resolved.targetBlank ? 'noopener noreferrer' : undefined}
            clickable={resolved.href !== undefined}
            size="medium"
            icon={<LaunchIcon color="inherit" fontSize="small" />}
            sx={(theme) => ({ height: theme.spacing(3) })}
          />
        </InfoTooltip>
      )}
    </ResolveLink>
  );
}

function LinkButton({ link }: { link: DashboardLink }): ReactElement {
  return (
    <ResolveLink link={link}>
      {(resolved) => (
        <InfoTooltip description={resolved.description} enterDelay={100}>
          <IconButton
            component="a"
            aria-label={resolved.name ?? resolved.url}
            size="small"
            href={resolved.href}
            target={resolved.targetBlank ? '_blank' : '_self'}
            rel={resolved.targetBlank ? 'noopener noreferrer' : undefined}
            sx={(theme) => ({ borderRadius: theme.shape.borderRadius, padding: '4px' })}
          >
            <LaunchIcon fontSize="inherit" sx={{ color: (theme: Theme) => theme.palette.text.secondary }} />
          </IconButton>
        </InfoTooltip>
      )}
    </ResolveLink>
  );
}

function LinkMenuItem({ link }: { link: DashboardLink }): ReactElement {
  return (
    <ResolveLink link={link}>
      {(resolved) => (
        <InfoTooltip description={resolved.description} enterDelay={100}>
          <MenuItem
            component={LinkComponent}
            href={resolved.href}
            target={resolved.targetBlank ? '_blank' : '_self'}
            rel={resolved.targetBlank ? 'noopener noreferrer' : undefined}
          >
            {resolved.name ?? resolved.url}
          </MenuItem>
        </InfoTooltip>
      )}
    </ResolveLink>
  );
}

function ResolveLink({
  link,
  children,
}: {
  link: DashboardLink;
  children: (resolved: ResolvedLink) => ReactElement;
}): ReactElement {
  const keepTime = link.keepTime === true;
  const includeVariables = link.includeVariables === true;
  if (keepTime && includeVariables) {
    return <ResolveLinkTimeAndVariables link={link}>{children}</ResolveLinkTimeAndVariables>;
  }
  if (keepTime) {
    return <ResolveLinkTime link={link}>{children}</ResolveLinkTime>;
  }
  if (includeVariables) {
    return <ResolveLinkVariables link={link}>{children}</ResolveLinkVariables>;
  }
  return <ResolveLinkPlain link={link}>{children}</ResolveLinkPlain>;
}

function ResolveLinkPlain({
  link,
  children,
}: {
  link: DashboardLink;
  children: (resolved: ResolvedLink) => ReactElement;
}): ReactElement {
  return children(usePlainLink(link));
}

function ResolveLinkTime({
  link,
  children,
}: {
  link: DashboardLink;
  children: (resolved: ResolvedLink) => ReactElement;
}): ReactElement {
  return children(useLinkWithTime(link));
}

function ResolveLinkVariables({
  link,
  children,
}: {
  link: DashboardLink;
  children: (resolved: ResolvedLink) => ReactElement;
}): ReactElement {
  return children(useLinkWithVariables(link));
}

function ResolveLinkTimeAndVariables({
  link,
  children,
}: {
  link: DashboardLink;
  children: (resolved: ResolvedLink) => ReactElement;
}): ReactElement {
  return children(useLinkWithTimeAndVariables(link));
}

interface ResolvedLink extends DashboardLink {
  /**
   * URL to use as the href of the link. It is undefined when the URL uses a scheme that is not allowed
   * (e.g. `javascript:`), so the link is rendered but cannot be followed.
   */
  href?: string;
  /**
   * Text displayed when hovering over the link: the tooltip (or the URL) of the link, or an explanation when the link
   * is disabled.
   */
  description: string;
}

function getDisabledLinkDescription(url: string): string {
  return `This link is disabled because its URL uses a scheme that is not allowed: ${url}`;
}

interface InterpolatedLink {
  name: string | undefined;
  tooltip: string | undefined;
  baseUrl: string;
}

function useInterpolatedLink(link: DashboardLink): InterpolatedLink {
  // Name/tooltip: plain string interpolation (unencoded $var).
  const name = useReplaceVariablesInString(link.name);
  const tooltip = useReplaceVariablesInString(link.tooltip);
  // URL: URL-aware interpolation (also expands %24var inside query params).
  const interpolatedUrl = useReplaceVariablesInUrl(link.renderVariables === false ? undefined : link.url);
  const baseUrl = link.renderVariables === false ? (link.url ?? '') : (interpolatedUrl ?? link.url ?? '');
  return { name, tooltip, baseUrl };
}

function usePlainLink(link: DashboardLink): ResolvedLink {
  const interpolated = useInterpolatedLink(link);
  return finishResolvedLink(link, interpolated, interpolated.baseUrl);
}

function useLinkWithTime(link: DashboardLink): ResolvedLink {
  const interpolated = useInterpolatedLink(link);
  const { timeRange } = useTimeRange();
  const url = appendLinkState(interpolated.baseUrl, {
    keepTime: true,
    includeVariables: false,
    timeRange,
  });
  return finishResolvedLink(link, interpolated, url);
}

function useLinkWithVariables(link: DashboardLink): ResolvedLink {
  const interpolated = useInterpolatedLink(link);
  const variables = useVariableDefinitionStates();
  const url = appendLinkState(interpolated.baseUrl, {
    keepTime: false,
    includeVariables: true,
    variables,
  });
  return finishResolvedLink(link, interpolated, url);
}

function useLinkWithTimeAndVariables(link: DashboardLink): ResolvedLink {
  const interpolated = useInterpolatedLink(link);
  const { timeRange } = useTimeRange();
  const variables = useVariableDefinitionStates();
  const url = appendLinkState(interpolated.baseUrl, {
    keepTime: true,
    includeVariables: true,
    timeRange,
    variables,
  });
  return finishResolvedLink(link, interpolated, url);
}

function finishResolvedLink(link: DashboardLink, interpolated: InterpolatedLink, url: string): ResolvedLink {
  // Sanitize after interpolation. Variable values can come from the URL query parameters.
  const resolvedLink =
    link.renderVariables === false
      ? { ...link, url }
      : { ...link, url, name: interpolated.name, tooltip: interpolated.tooltip };
  const href = sanitizeUrl(resolvedLink.url);
  const description =
    href === undefined ? getDisabledLinkDescription(resolvedLink.url) : (resolvedLink.tooltip ?? resolvedLink.url);

  return { ...resolvedLink, href, description };
}
