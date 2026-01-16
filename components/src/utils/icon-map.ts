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

import SendIcon from 'mdi-material-ui/Send';
import DeleteIcon from 'mdi-material-ui/Delete';
import ContentCopyIcon from 'mdi-material-ui/ContentCopy';
import DownloadIcon from 'mdi-material-ui/Download';
import RefreshIcon from 'mdi-material-ui/Refresh';
import PlayIcon from 'mdi-material-ui/Play';
import StopIcon from 'mdi-material-ui/Stop';
import CheckIcon from 'mdi-material-ui/Check';
import CloseIcon from 'mdi-material-ui/Close';
import WarningIcon from 'mdi-material-ui/Alert';
import { ComponentType, createElement, ReactElement } from 'react';
import { SvgIconProps } from '@mui/material';
import { ActionIcon } from '../SelectionActions/selection-action-model';

/**
 * Mapping of action icon names to MUI icon components
 */
export const ACTION_ICON_MAP: Record<ActionIcon, ComponentType<SvgIconProps>> = {
  send: SendIcon,
  delete: DeleteIcon,
  copy: ContentCopyIcon,
  download: DownloadIcon,
  refresh: RefreshIcon,
  play: PlayIcon,
  stop: StopIcon,
  check: CheckIcon,
  close: CloseIcon,
  warning: WarningIcon,
};

/**
 * Options for the icon selector dropdown in editors
 */
export const ACTION_ICON_OPTIONS: Array<{ value: ActionIcon; label: string }> = [
  { value: 'send', label: 'Send' },
  { value: 'delete', label: 'Delete' },
  { value: 'copy', label: 'Copy' },
  { value: 'download', label: 'Download' },
  { value: 'refresh', label: 'Refresh' },
  { value: 'play', label: 'Play' },
  { value: 'stop', label: 'Stop' },
  { value: 'check', label: 'Check' },
  { value: 'close', label: 'Close' },
  { value: 'warning', label: 'Warning' },
];

/**
 * Get the icon component for a given action icon name
 */
export function getActionIcon(iconName: ActionIcon, props?: SvgIconProps): ReactElement {
  const IconComponent = ACTION_ICON_MAP[iconName];
  return createElement(IconComponent, props);
}

/**
 * Get the icon component class for a given action icon name
 */
export function getActionIconComponent(iconName: ActionIcon): ComponentType<SvgIconProps> {
  return ACTION_ICON_MAP[iconName];
}
