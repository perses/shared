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

import { Box, IconButton, Typography } from '@mui/material';
import { InfoTooltip, RepeatGrid } from '@perses-dev/components';
import InformationOutlineIcon from 'mdi-material-ui/InformationOutline';
import { ReactElement, useMemo } from 'react';

export interface RepeatLayoutPreviewProps {
  optionCount: number;
  maxPer: number;
}

const PREVIEW_GAP = 4;

export function RepeatLayoutPreview({ optionCount, maxPer }: RepeatLayoutPreviewProps): ReactElement {
  const repeatItems = useMemo(() => Array.from({ length: optionCount }, (_, i) => i), [optionCount]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Layout preview ({optionCount} panel{optionCount !== 1 ? 's' : ''})
        </Typography>
        <InfoTooltip
          description="Preview of the layout when all available options of the selected variable are selected."
          enterDelay={100}
        >
          <IconButton size="small" sx={(theme) => ({ borderRadius: theme.shape.borderRadius, padding: '2px' })}>
            <InformationOutlineIcon
              aria-hidden={false}
              aria-label="Show layout preview information"
              fontSize="inherit"
              sx={{ color: (theme) => theme.palette.grey[700] }}
            />
          </IconButton>
        </InfoTooltip>
      </Box>
      <Box sx={{ height: 315, overflow: 'auto' }}>
        <RepeatGrid
          repeatItems={repeatItems}
          maxPer={maxPer}
          gap={PREVIEW_GAP}
          renderItem={() => (
            <Box
              sx={{
                width: `100%`,
                height: 150,
                borderRadius: 1,
                bgcolor: 'action.selected',
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
          )}
        />
      </Box>
    </Box>
  );
}
