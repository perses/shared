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
import { Chip, IconButton, Menu, MenuItem } from '@mui/material';
import { InfoTooltip } from '@perses-dev/components';
import { useReplaceVariablesInString, useTimeRange } from '@perses-dev/plugin-system';
import LaunchIcon from 'mdi-material-ui/Launch';
import type { MouseEvent, ReactElement } from 'react';
import { useRef, useState } from 'react';

import { useDashboard, useListProjectDashboards, useVariableDefinitionStates } from '../../context';
import type { DashboardLink } from './dashboard-link';
import { appBasePath, buildTagLinkHref, selectTagLinkTargets } from './tag-links';
import type { TagLinkTarget } from './tag-links';

type TagLinkAppearance = 'chip' | 'button' | 'item';

export function TagLinkMenu({
  link,
  appearance,
}: {
  link: DashboardLink;
  appearance: TagLinkAppearance;
}): ReactElement {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'ready'>('idle');
  const [targets, setTargets] = useState<TagLinkTarget[]>([]);
  const request = useRef(0);
  const { dashboard } = useDashboard();
  const { timeRange } = useTimeRange();
  const variables = useVariableDefinitionStates();
  const listDashboards = useListProjectDashboards();
  const name = useReplaceVariablesInString(link.name) || link.name || 'Dashboards';
  const tooltip = useReplaceVariablesInString(link.tooltip);
  const project = 'project' in dashboard.metadata ? dashboard.metadata.project : '';

  const handleOpen = (event: MouseEvent<HTMLElement>): void => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
    const id = request.current + 1;
    request.current = id;
    setStatus('loading');
    listDashboards(project)
      .then((dashboards) => {
        if (request.current !== id) {
          return;
        }
        setTargets(
          selectTagLinkTargets({
            dashboards,
            tags: link.tags ?? [],
            project,
            currentName: dashboard.metadata.name,
          }),
        );
        setStatus('ready');
      })
      .catch(() => {
        if (request.current !== id) {
          return;
        }
        setTargets([]);
        setStatus('error');
      });
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  const menu = (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleClose}
      onClick={(event) => event.stopPropagation()}
    >
      {status === 'loading' && <MenuItem disabled>Loading…</MenuItem>}
      {status === 'error' && <MenuItem disabled>Could not load dashboards</MenuItem>}
      {status === 'ready' && targets.length === 0 && <MenuItem disabled>No matching dashboards</MenuItem>}
      {status === 'ready' &&
        targets.map((target) => (
          <MenuItem
            key={target.name}
            component="a"
            href={buildTagLinkHref({
              basePath: typeof window === 'undefined' ? '' : appBasePath(window.location.pathname),
              project,
              name: target.name,
              keepTime: link.keepTime === true,
              includeVariables: link.includeVariables === true,
              timeRange,
              variables,
              destinationVariableNames: target.variableNames,
            })}
          >
            {target.label}
          </MenuItem>
        ))}
    </Menu>
  );

  if (appearance === 'item') {
    return (
      <>
        <MenuItem onClick={handleOpen}>{name}</MenuItem>
        {menu}
      </>
    );
  }

  if (appearance === 'button') {
    return (
      <>
        <InfoTooltip description={tooltip || name} enterDelay={100}>
          <IconButton
            aria-label={name}
            size="small"
            onClick={handleOpen}
            sx={(theme) => ({ borderRadius: theme.shape.borderRadius, padding: '4px' })}
          >
            <LaunchIcon fontSize="inherit" sx={{ color: (theme: Theme) => theme.palette.text.secondary }} />
          </IconButton>
        </InfoTooltip>
        {menu}
      </>
    );
  }

  return (
    <>
      <InfoTooltip description={tooltip || name} enterDelay={100}>
        <Chip
          label={name}
          clickable
          size="medium"
          onClick={handleOpen}
          icon={<LaunchIcon color="inherit" fontSize="small" />}
          sx={(theme) => ({ height: theme.spacing(3) })}
        />
      </InfoTooltip>
      {menu}
    </>
  );
}
