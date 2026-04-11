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

import { PersesShortcutDef } from '../types';
import {
  TIME_ZOOM_OUT_EVENT,
  TIME_SHIFT_BACK_EVENT,
  TIME_SHIFT_FORWARD_EVENT,
  TIME_MAKE_ABSOLUTE_EVENT,
  TIME_COPY_EVENT,
} from '../events';

export const TIME_ZOOM_OUT_SHORTCUT: PersesShortcutDef = {
  id: 'time-zoom-out',
  sequence: ['T', 'Z'],
  name: 'Zoom Out',
  description: 'Zoom out time range (2x)',
  category: 'time-range',
  scope: 'dashboard',
};

export const TIME_SHIFT_BACK_SHORTCUT: PersesShortcutDef = {
  id: 'time-shift-back',
  sequence: ['T', 'ArrowLeft'],
  name: 'Shift Back',
  description: 'Shift time range backward',
  category: 'time-range',
  scope: 'dashboard',
};

export const TIME_SHIFT_FORWARD_SHORTCUT: PersesShortcutDef = {
  id: 'time-shift-forward',
  sequence: ['T', 'ArrowRight'],
  name: 'Shift Forward',
  description: 'Shift time range forward',
  category: 'time-range',
  scope: 'dashboard',
};

export const TIME_MAKE_ABSOLUTE_SHORTCUT: PersesShortcutDef = {
  id: 'time-make-absolute',
  sequence: ['T', 'A'],
  name: 'Make Absolute',
  description: 'Convert time range to absolute',
  category: 'time-range',
  scope: 'dashboard',
};

export const TIME_COPY_SHORTCUT: PersesShortcutDef = {
  id: 'time-copy',
  sequence: ['T', 'C'],
  name: 'Copy Time Range',
  description: 'Copy time range to clipboard',
  category: 'time-range',
  scope: 'dashboard',
};

export const TIME_RANGE_SHORTCUTS: PersesShortcutDef[] = [
  TIME_ZOOM_OUT_SHORTCUT,
  TIME_SHIFT_BACK_SHORTCUT,
  TIME_SHIFT_FORWARD_SHORTCUT,
  TIME_MAKE_ABSOLUTE_SHORTCUT,
  TIME_COPY_SHORTCUT,
];

export const TIME_RANGE_SHORTCUT_EVENTS = {
  [TIME_ZOOM_OUT_SHORTCUT.id]: TIME_ZOOM_OUT_EVENT,
  [TIME_SHIFT_BACK_SHORTCUT.id]: TIME_SHIFT_BACK_EVENT,
  [TIME_SHIFT_FORWARD_SHORTCUT.id]: TIME_SHIFT_FORWARD_EVENT,
  [TIME_MAKE_ABSOLUTE_SHORTCUT.id]: TIME_MAKE_ABSOLUTE_EVENT,
  [TIME_COPY_SHORTCUT.id]: TIME_COPY_EVENT,
} as const;
