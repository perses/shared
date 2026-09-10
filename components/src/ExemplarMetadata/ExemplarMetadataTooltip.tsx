// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Box, Divider, Portal, Stack, Typography } from '@mui/material';
import type { Exemplar, Labels } from '@perses-dev/spec';
import Pin from 'mdi-material-ui/Pin';
import PinOutline from 'mdi-material-ui/PinOutline';
import type { ReactElement } from 'react';
import useResizeObserver from 'use-resize-observer';

import { useTimeZone } from '../context/TimeZoneProvider';
import type { FormatOptions } from '../model/units';
import { formatValue } from '../model/units';
import {
  assembleTransform,
  getTooltipStyles,
  PIN_TOOLTIP_HELP_TEXT,
  TOOLTIP_BG_COLOR_FALLBACK,
  TOOLTIP_MAX_WIDTH,
  UNPIN_TOOLTIP_HELP_TEXT,
  useMousePosition,
} from '../TimeSeriesTooltip';
import type { CursorCoordinates } from '../TimeSeriesTooltip/tooltip-model';

export interface ExemplarMetadataTooltipProps {
  exemplar: Exemplar;
  seriesLabels?: Labels;
  /**
   * Id of the element the tooltip should be portaled into (e.g. the dashboard element).
   */
  containerId?: string;
  format?: FormatOptions;
  /**
   * Position where the tooltip has been pinned, or null when it follows the mouse.
   */
  pinnedPos: CursorCoordinates | null;
  enablePinning?: boolean;
  onUnpinClick?: () => void;
}

/**
 * Tooltip showing an exemplar's metadata (series labels, exemplar labels, value and timestamp).
 * Follows the mouse while hovering an exemplar marker and can be pinned in place, the same way
 * the annotation tooltip works.
 */
export function ExemplarMetadataTooltip({
  exemplar,
  seriesLabels,
  containerId,
  format,
  pinnedPos,
  enablePinning = true,
  onUnpinClick,
}: ExemplarMetadataTooltipProps): ReactElement | null {
  const { formatWithUserTimeZone } = useTimeZone();
  const mousePos = useMousePosition();
  const { height, width, ref: tooltipRef } = useResizeObserver<HTMLDivElement>();

  const isPinned = pinnedPos !== null;
  if (!isPinned && mousePos === null) return null;

  const containerElement = containerId ? document.querySelector(containerId) : undefined;
  const maxHeight = containerElement ? containerElement.getBoundingClientRect().height : undefined;
  const transform = assembleTransform(mousePos, pinnedPos, height ?? 0, width ?? 0, containerElement);

  const { labels, value, timestamp } = exemplar;
  const formattedValue = formatValue(value, format);
  const date = new Date(timestamp);
  const formattedDate = formatWithUserTimeZone(date, 'MMM dd, yyyy - ');
  const formattedTime = formatWithUserTimeZone(date, 'HH:mm:ss');

  return (
    <Portal container={containerElement}>
      <Box ref={tooltipRef} sx={(theme) => getTooltipStyles(theme, pinnedPos, maxHeight)} style={{ transform }}>
        <Stack spacing={0.5}>
          <Box
            sx={(theme) => ({
              width: '100%',
              maxWidth: TOOLTIP_MAX_WIDTH,
              padding: theme.spacing(1.5, 2, 0.5, 2),
              backgroundColor: theme.palette.designSystem?.grey[800] ?? TOOLTIP_BG_COLOR_FALLBACK,
              position: 'sticky',
              top: 0,
              left: 0,
            })}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', paddingBottom: 0.5, width: '100%' }}>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={(theme) => ({
                    color: theme.palette.common.white,
                  })}
                >
                  {formattedDate}
                </Typography>
                <Typography variant="caption">
                  <strong>{formattedTime}</strong>
                </Typography>
              </Box>
              {enablePinning && (
                <Stack direction="row" alignItems="center" sx={{ marginLeft: 1, flexShrink: 0 }}>
                  <Typography sx={{ marginRight: 0.5, fontSize: 11, verticalAlign: 'middle' }}>
                    {isPinned ? UNPIN_TOOLTIP_HELP_TEXT : PIN_TOOLTIP_HELP_TEXT}
                  </Typography>
                  {isPinned ? (
                    <Pin
                      onClick={() => {
                        if (onUnpinClick !== undefined) onUnpinClick();
                      }}
                      sx={{ fontSize: 16, cursor: 'pointer' }}
                    />
                  ) : (
                    <PinOutline sx={{ fontSize: 16 }} />
                  )}
                </Stack>
              )}
            </Box>
            <Divider sx={(theme) => ({ width: '100%', borderColor: theme.palette.grey['500'] })} />
          </Box>
          <Box sx={(theme) => ({ padding: theme.spacing(0.5, 2, 1.5, 2) })}>
            {seriesLabels && (
              <>
                <LabelGrid title="Series labels" labels={seriesLabels} />
                <Divider />
              </>
            )}
            <LabelGrid title="Exemplar labels" labels={labels} />
            <Divider />
            <Box>
              <Typography variant="overline" component="div">
                Value
              </Typography>
              <Typography fontWeight={700}>{formattedValue}</Typography>
            </Box>
          </Box>
        </Stack>
      </Box>
    </Portal>
  );
}

function LabelGrid({ title, labels }: { title: string; labels: Labels }): ReactElement | null {
  const entries = Object.entries(labels);
  if (entries.length === 0) return null;
  return (
    <Box>
      <Typography variant="overline" component="div">
        {title}
      </Typography>
      <Stack spacing={0.25}>
        {entries.map(([labelName, labelValue]) => (
          <Box key={labelName} sx={{ display: 'flex', gap: '4px' }}>
            <Typography sx={{ wordBreak: 'break-all' }}>{labelName}:</Typography>
            <Typography fontWeight={700} sx={{ wordBreak: 'break-all' }}>
              {labelValue}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
