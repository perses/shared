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

import { CardHeader, CardHeaderProps, Stack, Typography, Tooltip } from '@mui/material';
import { combineSx } from '@perses-dev/components';
import { Link } from '@perses-dev/spec';
import { ItemAction, QueryData, useAllVariableValues, useReplaceVariablesInString } from '@perses-dev/plugin-system';
import { ReactElement, ReactNode, useRef } from 'react';
import { HEADER_ACTIONS_CONTAINER_NAME } from '../../constants';
// LOGZ.IO CHANGE START:: Panel-level time range override badge [APPZ-2474]
import { getPanelTimeOverrideLabel } from '../../context/PanelTimeRangeOverride';
// LOGZ.IO CHANGE END:: Panel-level time range override badge [APPZ-2474]
import { PanelActions, PanelActionsProps } from './PanelActions';
import { PanelOptions } from './Panel';
import { useSelectionItemActions } from './useSelectionItemActions';

type OmittedProps = 'children' | 'action' | 'title' | 'disableTypography';

export interface PanelHeaderProps extends Omit<CardHeaderProps, OmittedProps> {
  id: string;
  title?: string;
  description?: string;
  links?: Link[];
  extra?: ReactNode;
  queryResults: QueryData[];
  viewQueriesHandler?: PanelActionsProps['viewQueriesHandler'];
  readHandlers?: PanelActionsProps['readHandlers'];
  editHandlers?: PanelActionsProps['editHandlers'];
  pluginActions?: ReactNode[];
  itemActionsListConfig?: ItemAction[];
  showIcons: PanelOptions['showIcons'];
  dimension?: { width: number };
  // LOGZ.IO CHANGE START:: Panel-level time range override [APPZ-2474]
  timeFrom?: string;
  timeShift?: string;
  hideTimeOverride?: boolean;
  // LOGZ.IO CHANGE END:: Panel-level time range override [APPZ-2474]
}

export function PanelHeader({
  id,
  title: rawTitle,
  description: rawDescription,
  links,
  queryResults,
  readHandlers,
  editHandlers,
  sx,
  extra,
  pluginActions,
  itemActionsListConfig,
  showIcons,
  viewQueriesHandler,
  dimension,
  // LOGZ.IO CHANGE START:: Panel-level time range override [APPZ-2474]
  timeFrom,
  timeShift,
  hideTimeOverride,
  // LOGZ.IO CHANGE END:: Panel-level time range override [APPZ-2474]
  ...rest
}: PanelHeaderProps): ReactElement {
  const titleElementId = `${id}-title`;
  const descriptionTooltipId = `${id}-description`;

  const title = useReplaceVariablesInString(rawTitle);
  const description = useReplaceVariablesInString(rawDescription);
  const variableState = useAllVariableValues();
  // LOGZ.IO CHANGE START:: Panel-level time range override badge [APPZ-2474]
  const timeOverrideLabel = getPanelTimeOverrideLabel({ timeFrom, timeShift, hideTimeOverride });
  // LOGZ.IO CHANGE END:: Panel-level time range override badge [APPZ-2474]

  const textRef = useRef<HTMLDivElement>(null);

  const isEllipsisActive =
    textRef.current && dimension?.width ? textRef.current.scrollWidth > textRef.current.clientWidth : false;

  const { actionButtons, confirmDialog } = useSelectionItemActions({
    actions: itemActionsListConfig,
    variableState,
    disabledWithEmptySelection: true,
  });

  return (
    <>
      {title ? (
        <CardHeader
          id={id}
          component="header"
          aria-labelledby={titleElementId}
          aria-describedby={descriptionTooltipId}
          disableTypography
          title={
            <Stack direction="row" alignItems="center" height="var(--panel-header-height, 30px)">
              <Tooltip title={title} disableHoverListener={!isEllipsisActive}>
                <Typography
                  id={titleElementId}
                  variant="subtitle1"
                  ref={textRef}
                  sx={{
                    // `minHeight` guarantees that the header has the correct height
                    // when there is no title (i.e. in the preview)
                    lineHeight: '24px',
                    minHeight: '26px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {title}
                </Typography>
              </Tooltip>
              {/* LOGZ.IO CHANGE START:: Panel-level time range override badge [APPZ-2474] */}
              {timeOverrideLabel && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 1, whiteSpace: 'nowrap', flexShrink: 0 }}
                  data-testid="panel-time-override-label"
                >
                  {timeOverrideLabel}
                </Typography>
              )}
              {/* LOGZ.IO CHANGE END:: Panel-level time range override badge [APPZ-2474] */}
              <PanelActions
                title={title}
                description={description}
                descriptionTooltipId={descriptionTooltipId}
                links={links}
                readHandlers={readHandlers}
                editHandlers={editHandlers}
                viewQueriesHandler={viewQueriesHandler}
                extra={extra}
                queryResults={queryResults}
                pluginActions={pluginActions}
                itemActions={actionButtons}
                showIcons={showIcons}
              />
            </Stack>
          }
          sx={combineSx(
            (theme) => ({
              containerType: 'inline-size',
              containerName: HEADER_ACTIONS_CONTAINER_NAME,
              padding: theme.spacing(1),
              borderBottom: `solid 1px ${theme.palette.divider}`,
              '.MuiCardHeader-content': {
                overflow: 'hidden',
              },
            }),
            sx
          )}
          {...rest}
        />
      ) : (
        <Stack
          id={id}
          component="header"
          aria-describedby={descriptionTooltipId}
          sx={combineSx(
            {
              position: 'absolute',
              right: 0,
              top: 0,
              zIndex: 5,
              containerType: 'inline-size',
              containerName: HEADER_ACTIONS_CONTAINER_NAME,
            },
            sx
          )}
          {...rest}
        >
          <PanelActions
            title={title}
            description={description}
            descriptionTooltipId={descriptionTooltipId}
            links={links}
            readHandlers={readHandlers}
            editHandlers={editHandlers}
            viewQueriesHandler={viewQueriesHandler}
            extra={extra}
            queryResults={queryResults}
            pluginActions={pluginActions}
            itemActions={actionButtons}
            showIcons={showIcons}
          />
        </Stack>
      )}
      {confirmDialog}
    </>
  );
}
