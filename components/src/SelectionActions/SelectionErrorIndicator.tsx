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

import { Box, IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import WarningIcon from 'mdi-material-ui/Alert';
import CloseIcon from 'mdi-material-ui/Close';
import { ReactElement } from 'react';
import { SelectionActionError } from './selection-action-model';

export interface SelectionErrorIndicatorProps {
  /**
   * Error information for this item
   */
  error: SelectionActionError;

  /**
   * Callback when user dismisses the error
   */
  onDismiss: (itemId: string) => void;
}

/**
 * Inline error indicator shown when an action fails on an item.
 * Displays a warning icon with tooltip containing error details.
 * User can click to dismiss.
 */
export function SelectionErrorIndicator({ error, onDismiss }: SelectionErrorIndicatorProps): ReactElement {
  const theme = useTheme();

  function handleDismiss(e: React.MouseEvent): void {
    e.stopPropagation(); // Prevent item selection
    onDismiss(error.itemId);
  }

  return (
    <Tooltip
      arrow
      title={
        <Box sx={{ p: 0.5 }}>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
            Action Failed: {error.actionLabel}
          </Typography>
          <Typography variant="body2">{error.errorMessage}</Typography>
          {error.timestamp && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
              {new Date(error.timestamp).toLocaleTimeString()}
            </Typography>
          )}
        </Box>
      }
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          ml: 1,
          px: 0.5,
          py: 0.25,
          borderRadius: 1,
          backgroundColor: theme.palette.error.light + '20', // 20% opacity
          cursor: 'pointer',
        }}
        onClick={handleDismiss}
      >
        <WarningIcon
          sx={{
            color: theme.palette.error.main,
            fontSize: 16,
          }}
        />
        <IconButton
          size="small"
          onClick={handleDismiss}
          sx={{
            p: 0.25,
            '&:hover': {
              backgroundColor: theme.palette.error.light + '40',
            },
          }}
        >
          <CloseIcon sx={{ fontSize: 12, color: theme.palette.error.main }} />
        </IconButton>
      </Box>
    </Tooltip>
  );
}
