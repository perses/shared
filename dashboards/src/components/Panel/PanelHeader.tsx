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

import type { CardHeaderProps } from '@mui/material';
import { Box, CardHeader, Stack, Tooltip, Typography } from '@mui/material';
import { combineSx, replaceVariablesForDisplay } from '@perses-dev/components';
import type { ItemAction, QueryData } from '@perses-dev/plugin-system';
import { useAllVariableValues, useReplaceVariablesInString } from '@perses-dev/plugin-system';
import type { Link } from '@perses-dev/spec';
import type { ReactElement, ReactNode } from 'react';
import { useRef } from 'react';

import { HEADER_ACTIONS_CONTAINER_NAME } from '../../constants/styles';
import type { PanelOptions } from './Panel';
import type { PanelActionsProps } from './PanelActions';
import { PanelActions } from './PanelActions';
import { useSelectionItemActions } from './useSelectionItemActions';

type OmittedProps = 'children' | 'action' | 'title' | 'disableTypography';

export interface PanelHeaderProps extends Omit<CardHeaderProps, OmittedProps> {
  id: string;
  title?: string;
  description?: string;
  hideHeader?: boolean;
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
  informationTooltip?: string;
}

export function PanelHeader({
  id,
  title: rawTitle,
  description: rawDescription,
  hideHeader,
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
  informationTooltip,
  ...rest
}: PanelHeaderProps): ReactElement {
  const titleElementId = `${id}-title`;
  const descriptionTooltipId = `${id}-description`;

  const variableState = useAllVariableValues();
  const title = rawTitle ? replaceVariablesForDisplay(rawTitle, variableState) : undefined;
  const description = useReplaceVariablesInString(rawDescription);

  const textRef = useRef<HTMLDivElement>(null);

  const isEllipsisActive =
    textRef.current && dimension?.width ? textRef.current.scrollWidth > textRef.current.clientWidth : false;

  const { actionButtons, confirmDialog } = useSelectionItemActions({
    actions: itemActionsListConfig,
    variableState,
    disabledWithEmptySelection: true,
  });

  // `hideHeader` is an explicit override on top of the implicit empty-title rule:
  // true always collapses to the icon-only overlay, false always keeps the full header,
  // and leaving it unset preserves today's behavior of deriving visibility from the title.
  const isHidden = hideHeader === true || (hideHeader === undefined && !title);

  return (
    <>
      {!isHidden ? (
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
                    minWidth: 0,
                    flexShrink: 1,
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
              <Box sx={{ ml: 'auto', pl: 1, flexShrink: 0 }}>
                <PanelActions
                  title={title}
                  description={description}
                  descriptionTooltipId={descriptionTooltipId}
                  informationTooltip={informationTooltip}
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
              </Box>
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
            sx,
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
            sx,
          )}
          {...rest}
        >
          <PanelActions
            title={title}
            description={description}
            descriptionTooltipId={descriptionTooltipId}
            informationTooltip={informationTooltip}
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
