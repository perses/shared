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
import type { VariableStateMap } from '@perses-dev/plugin-system';
import { useReplaceVariablesInString, useTimeRange } from '@perses-dev/plugin-system';
import type { TimeRangeValue } from '@perses-dev/spec';
import { useQuery } from '@tanstack/react-query';
import LaunchIcon from 'mdi-material-ui/Launch';
import type { MouseEvent, ReactElement } from 'react';
import { useState } from 'react';

import { useDashboard, useListProjectDashboards, useVariableDefinitionStates } from '../../context';
import type { DashboardLink } from './dashboard-link';
import type { TagLinkTarget } from './tag-links';
import { appBasePath, buildTagLinkHref, selectTagLinkTargets } from './tag-links';

type TagLinkAppearance = 'chip' | 'button' | 'item';

export function TagLinkMenu({
  link,
  appearance,
}: {
  link: DashboardLink;
  appearance: TagLinkAppearance;
}): ReactElement {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { dashboard } = useDashboard();
  const name = useReplaceVariablesInString(link.name) || link.name || 'Dashboards';
  const tooltip = useReplaceVariablesInString(link.tooltip);
  const project = 'project' in dashboard.metadata ? dashboard.metadata.project : '';

  const handleOpen = (event: MouseEvent<HTMLElement>): void => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  const popup = anchorEl && (
    <TagLinkMenuPopup
      anchorEl={anchorEl}
      link={link}
      project={project}
      currentName={dashboard.metadata.name}
      onClose={handleClose}
    />
  );

  if (appearance === 'item') {
    return (
      <>
        <MenuItem onClick={handleOpen}>{name}</MenuItem>
        {popup}
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
        {popup}
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
      {popup}
    </>
  );
}

interface TagLinkMenuPopupProps {
  anchorEl: HTMLElement;
  link: DashboardLink;
  project: string;
  currentName: string;
  onClose: () => void;
}

function TagLinkMenuPopup(props: TagLinkMenuPopupProps): ReactElement {
  const keepTime = props.link.keepTime === true;
  const includeVariables = props.link.includeVariables === true;
  if (keepTime && includeVariables) {
    return <TagLinkMenuPopupTimeAndVariables {...props} />;
  }
  if (keepTime) {
    return <TagLinkMenuPopupTime {...props} />;
  }
  if (includeVariables) {
    return <TagLinkMenuPopupVariables {...props} />;
  }
  return <TagLinkMenuFrame {...props} />;
}

function TagLinkMenuPopupTimeAndVariables(props: TagLinkMenuPopupProps): ReactElement {
  const { timeRange } = useTimeRange();
  const variables = useVariableDefinitionStates();
  return <TagLinkMenuFrame {...props} timeRange={timeRange} variables={variables} />;
}

function TagLinkMenuPopupTime(props: TagLinkMenuPopupProps): ReactElement {
  const { timeRange } = useTimeRange();
  return <TagLinkMenuFrame {...props} timeRange={timeRange} />;
}

function TagLinkMenuPopupVariables(props: TagLinkMenuPopupProps): ReactElement {
  const variables = useVariableDefinitionStates();
  return <TagLinkMenuFrame {...props} variables={variables} />;
}

function TagLinkMenuFrame({
  anchorEl,
  link,
  project,
  currentName,
  onClose,
  timeRange,
  variables,
}: TagLinkMenuPopupProps & {
  timeRange?: TimeRangeValue;
  variables?: VariableStateMap;
}): ReactElement {
  const listDashboards = useListProjectDashboards();
  const query = useQuery({
    queryKey: ['tag-link-dashboards', project],
    queryFn: () => listDashboards(project),
    enabled: project !== '',
  });
  const basePath = typeof window === 'undefined' ? '' : appBasePath(window.location.pathname);
  const targets =
    query.data === undefined
      ? []
      : selectTagLinkTargets({
          dashboards: query.data,
          tags: link.tags ?? [],
          project,
          currentName,
        });
  const items = tagLinkMenuItems({
    project,
    pending: query.isPending,
    failed: query.isError,
    targets,
    basePath,
    keepTime: link.keepTime === true && timeRange !== undefined,
    includeVariables: link.includeVariables === true && variables !== undefined,
    timeRange,
    variables,
  });

  return (
    <Menu anchorEl={anchorEl} open onClose={onClose} onClick={(event) => event.stopPropagation()}>
      {items}
    </Menu>
  );
}

function tagLinkMenuItems(input: {
  project: string;
  pending: boolean;
  failed: boolean;
  targets: TagLinkTarget[];
  basePath: string;
  keepTime: boolean;
  includeVariables: boolean;
  timeRange?: TimeRangeValue;
  variables?: VariableStateMap;
}): ReactElement[] {
  if (input.project === '' || (!input.pending && !input.failed && input.targets.length === 0)) {
    return [
      <MenuItem key="empty" disabled>
        No matching dashboards
      </MenuItem>,
    ];
  }
  if (input.pending) {
    return [
      <MenuItem key="loading" disabled>
        Loading…
      </MenuItem>,
    ];
  }
  if (input.failed) {
    return [
      <MenuItem key="error" disabled>
        Could not load dashboards
      </MenuItem>,
    ];
  }
  return input.targets.map((target) => (
    <MenuItem
      key={target.name}
      component="a"
      href={buildTagLinkHref({
        basePath: input.basePath,
        project: input.project,
        name: target.name,
        keepTime: input.keepTime,
        includeVariables: input.includeVariables,
        timeRange: input.timeRange,
        variables: input.variables,
        destinationVariableNames: target.variableNames,
      })}
    >
      {target.label}
    </MenuItem>
  ));
}
